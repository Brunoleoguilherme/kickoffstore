import 'server-only'
import { createAdminClient } from '@/lib/supabase/admin'
import { getDefaultOrganizationId } from '@/lib/org'
import { fulfillPaidOrder } from './fulfillment'

/**
 * Camada compartilhada pelos webhooks/rotas de pagamento.
 * Opera sobre as tabelas `orders`, `payments` e `order_status_history`
 * (schema 0001). Toda escrita passa pelo service role (RLS ignorada de
 * forma controlada, apenas em código servidor confiável).
 */

export interface PayableOrder {
  id: string
  organization_id: string
  status: string
  currency: string
  total_cents: number
  paid_at: string | null
  customer_snapshot: {
    name?: string
    full_name?: string
    email?: string
    document?: string
    tax_id?: string
    cpf?: string
    cnpj?: string
  } | null
}

/** Carrega um pedido que pode receber pagamento (existe e ainda não foi pago). */
export async function loadPayableOrder(orderId: string): Promise<PayableOrder | null> {
  const admin = createAdminClient()
  const { data, error } = await admin
    .from('orders')
    .select('id, organization_id, status, currency, total_cents, paid_at, customer_snapshot')
    .eq('id', orderId)
    .maybeSingle()
  if (error || !data) return null
  return data as unknown as PayableOrder
}

/** Nome/e-mail/documento do pagador, a partir do snapshot do pedido + overrides do request. */
export function resolvePayer(
  order: PayableOrder,
  overrides?: { name?: string; email?: string; document?: string },
): { name: string; email: string; taxId?: string } {
  const snap = order.customer_snapshot ?? {}
  return {
    name: overrides?.name || snap.name || snap.full_name || 'Cliente',
    email: overrides?.email || snap.email || '',
    taxId: overrides?.document || snap.document || snap.tax_id || snap.cpf || snap.cnpj || undefined,
  }
}

interface RecordPaymentInput {
  order: PayableOrder
  provider: string
  method: 'pix' | 'credit_card' | 'debit_card' | 'boleto' | 'store_credit' | 'other'
  amountCents: number
  externalId: string
  idempotencyKey: string
  providerMetadata?: Record<string, string>
  expiresAt?: string | null
}

/** Registra (upsert por idempotency_key) uma cobrança pendente para o pedido. */
export async function recordPayment(input: RecordPaymentInput): Promise<void> {
  const admin = createAdminClient()
  await admin.from('payments').upsert(
    {
      organization_id: input.order.organization_id,
      order_id: input.order.id,
      provider: input.provider,
      method: input.method,
      status: 'pending',
      amount_cents: input.amountCents,
      external_id: input.externalId,
      idempotency_key: input.idempotencyKey,
      provider_metadata: input.providerMetadata ?? null,
      expires_at: input.expiresAt ?? null,
    },
    { onConflict: 'idempotency_key' },
  )
}

/**
 * Confirma o pagamento: marca o payment como aprovado e o pedido como pago.
 * Idempotente — se o pedido já está `paid`, não faz nada.
 */
export async function confirmPaymentByExternalId(
  provider: string,
  externalId: string,
  paidAmountCents: number,
): Promise<void> {
  const admin = createAdminClient()

  const { data: payment } = await admin
    .from('payments')
    .select('id, order_id, status')
    .eq('provider', provider)
    .eq('external_id', externalId)
    .maybeSingle()

  const pay = payment as unknown as { id: string; order_id: string; status: string } | null
  if (!pay) return
  if (pay.status === 'approved') return // idempotência

  await admin
    .from('payments')
    .update({ status: 'approved', approved_at: new Date().toISOString() })
    .eq('id', pay.id)

  await markOrderPaid(pay.order_id, provider)
  void paidAmountCents
}

/** Transiciona o pedido para `paid` (uma única vez) e grava o histórico. */
export async function markOrderPaid(orderId: string, provider: string): Promise<void> {
  const admin = createAdminClient()
  const { data } = await admin
    .from('orders')
    .select('id, status')
    .eq('id', orderId)
    .maybeSingle()
  const order = data as unknown as { id: string; status: string } | null
  if (!order) return
  if (order.status === 'paid') return

  const now = new Date().toISOString()
  await admin.from('orders').update({ status: 'paid', paid_at: now }).eq('id', orderId)
  await admin.from('order_status_history').insert({
    order_id: orderId,
    from_status: order.status,
    to_status: 'paid',
    reason: `Pagamento confirmado (${provider})`,
  })

  // Pós-pagamento (uma única vez): baixa de estoque + e-mail de confirmação.
  await fulfillPaidOrder(orderId)
}

/** Garante que temos a organização default (single-tenant) — usada em validações. */
export async function requireDefaultOrg(): Promise<string> {
  const org = await getDefaultOrganizationId()
  if (!org) throw new Error('Organização default não encontrada.')
  return org
}
