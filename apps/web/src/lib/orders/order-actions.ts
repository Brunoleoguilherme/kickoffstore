'use server'

import { revalidatePath } from 'next/cache'
import { canTransitionOrder, type OrderStatus, type PermissionCode } from '@clubedaestampa/types'
import { refundCheckoutSession } from '@clubedaestampa/integrations'
import { requirePermission } from '@/lib/auth/session'
import { createAdminClient } from '@/lib/supabase/admin'
import { notifyOrderShipped, notifyOrderDelivered, restockOrder } from '@/lib/payments/fulfillment'

export interface OrderActionState {
  ok?: boolean
  error?: string
}

const CANCEL_STATUSES = new Set<string>(['cancel_requested', 'cancelled'])
const RESTOCK_STATUSES = new Set<string>(['cancelled', 'refunded', 'returned'])

/**
 * Estorna o pagamento do pedido. Cartão (Stripe) estorna de verdade via API.
 * Pix/Cora ou sem pagamento: retorna null (marca reembolsado, mas estorno é manual).
 * Retorna mensagem de erro se o estorno no Stripe falhar (aí o status NÃO muda).
 */
async function refundOrderPayment(orderId: string): Promise<string | null> {
  const admin = createAdminClient()
  const { data } = await admin
    .from('payments')
    .select('provider, external_id')
    .eq('order_id', orderId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()
  const payment = data as { provider: string; external_id: string | null } | null
  if (!payment) return null
  if (payment.provider === 'stripe' && payment.external_id) {
    try {
      await refundCheckoutSession(payment.external_id)
      return null
    } catch (err) {
      return `Falha ao estornar no Stripe: ${
        err instanceof Error ? err.message : 'erro'
      }. Status não alterado.`
    }
  }
  return null // Pix/Cora: estorno manual pelo painel do provedor
}

/**
 * Altera o status de um pedido respeitando as transições permitidas
 * (ORDER_TRANSITIONS) e registrando o histórico. Cancelamento exige
 * permissão específica (orders.cancel); demais transições, orders.manage.
 */
export async function changeOrderStatusAction(
  _prev: OrderActionState,
  formData: FormData,
): Promise<OrderActionState> {
  try {
    const orderId = String(formData.get('orderId') ?? '').trim()
    const toStatus = String(formData.get('toStatus') ?? '').trim() as OrderStatus
    const reason = String(formData.get('reason') ?? '').trim()
    if (!orderId || !toStatus) return { error: 'Dados inválidos.' }

    let perm: PermissionCode = 'orders.manage'
    if (toStatus === 'refunded') perm = 'refunds.approve'
    else if (CANCEL_STATUSES.has(toStatus)) perm = 'orders.cancel'
    await requirePermission(perm)

    const admin = createAdminClient()
    const { data } = await admin.from('orders').select('id, status').eq('id', orderId).maybeSingle()
    const order = data as { id: string; status: OrderStatus } | null
    if (!order) return { error: 'Pedido não encontrado.' }
    if (order.status === toStatus) return { error: 'O pedido já está nesse status.' }
    if (!canTransitionOrder(order.status, toStatus)) {
      return { error: `Transição não permitida: ${order.status} → ${toStatus}.` }
    }

    // Reembolso: estorna de verdade ANTES de mudar o status (se falhar, não muda).
    if (toStatus === 'refunded') {
      const refundErr = await refundOrderPayment(orderId)
      if (refundErr) return { error: refundErr }
    }

    const patch: Record<string, unknown> = { status: toStatus }
    if (toStatus === 'cancelled') patch.cancelled_at = new Date().toISOString()

    const { error: updErr } = await admin
      .from('orders')
      .update(patch as never)
      .eq('id', orderId)
    if (updErr) return { error: 'Falha ao atualizar o pedido.' }

    await admin.from('order_status_history').insert({
      order_id: orderId,
      from_status: order.status,
      to_status: toStatus,
      reason: reason || 'Alteração manual no admin',
    })

    // Notificações ao cliente nas etapas de logística (best-effort, não bloqueia).
    if (toStatus === 'shipped') await notifyOrderShipped(orderId)
    else if (toStatus === 'delivered') await notifyOrderDelivered(orderId)

    // Devolve o estoque em cancelamento/reembolso/devolução (idempotente).
    if (RESTOCK_STATUSES.has(toStatus)) await restockOrder(orderId)

    revalidatePath(`/admin/pedidos/${orderId}`)
    revalidatePath('/admin/pedidos')
    return { ok: true }
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Erro ao alterar status.' }
  }
}
