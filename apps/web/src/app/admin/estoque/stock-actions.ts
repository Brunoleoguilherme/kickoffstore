'use server'

import { revalidatePath } from 'next/cache'
import { requirePermission } from '@/lib/auth/session'
import { createAdminClient } from '@/lib/supabase/admin'
import { getDefaultOrganizationId } from '@/lib/org'

export interface StockActionState {
  ok?: boolean
  error?: string
}

/**
 * Ajusta o saldo de uma variação para um valor absoluto (no depósito padrão)
 * e registra a movimentação de estoque (auditoria).
 * Requer permissão inventory.adjust.
 */
export async function setStockAction(
  _prev: StockActionState,
  formData: FormData,
): Promise<StockActionState> {
  try {
    await requirePermission('inventory.adjust')

    const variantId = String(formData.get('variantId') ?? '').trim()
    const rawQty = Number(formData.get('onHand'))
    const reason = String(formData.get('reason') ?? '').trim() || 'Ajuste manual'
    if (!variantId) return { error: 'Variação inválida.' }
    if (!Number.isFinite(rawQty) || rawQty < 0 || rawQty > 1_000_000) {
      return { error: 'Quantidade inválida.' }
    }
    const newOnHand = Math.trunc(rawQty)

    const orgId = await getDefaultOrganizationId()
    if (!orgId) return { error: 'Organização não configurada.' }

    const admin = createAdminClient()

    // Depósito padrão (primeiro ativo).
    const { data: wh } = await admin
      .from('warehouses')
      .select('id')
      .eq('organization_id', orgId)
      .eq('active', true)
      .order('created_at', { ascending: true })
      .limit(1)
      .maybeSingle()
    const warehouseId = (wh as { id: string } | null)?.id
    if (!warehouseId) return { error: 'Nenhum depósito ativo cadastrado.' }

    // Saldo atual (on_hand + reserved) para calcular a diferença e respeitar
    // a regra do banco: reserved <= on_hand.
    const { data: balRow } = await admin
      .from('inventory_balances')
      .select('on_hand, reserved')
      .eq('warehouse_id', warehouseId)
      .eq('variant_id', variantId)
      .maybeSingle()
    const bal = balRow as { on_hand: number; reserved: number } | null
    const oldOnHand = Number(bal?.on_hand ?? 0)
    const reserved = Number(bal?.reserved ?? 0)
    if (newOnHand < reserved) {
      return { error: `Saldo não pode ser menor que o reservado (${reserved}).` }
    }
    const delta = newOnHand - oldOnHand

    const { error: upsertErr } = await admin.from('inventory_balances').upsert(
      {
        warehouse_id: warehouseId,
        variant_id: variantId,
        on_hand: newOnHand,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'warehouse_id,variant_id' },
    )
    if (upsertErr) return { error: 'Falha ao salvar o saldo.' }

    // Registra a movimentação (quantity sempre > 0; tipo conforme o sentido).
    if (delta !== 0) {
      await admin.from('inventory_movements').insert({
        organization_id: orgId,
        warehouse_id: warehouseId,
        variant_id: variantId,
        movement_type: delta > 0 ? 'adjustment_in' : 'adjustment_out',
        quantity: Math.abs(delta),
        reference_type: 'manual',
        reason,
      })
    }

    // Limite de alerta de estoque baixo (opcional). Vazio = não altera; 0 = desativa.
    const rawThreshold = formData.get('threshold')
    if (rawThreshold !== null && String(rawThreshold).trim() !== '') {
      const t = Number(rawThreshold)
      if (Number.isFinite(t) && t >= 0 && t <= 1_000_000) {
        const value = Math.trunc(t) === 0 ? null : Math.trunc(t)
        // low_stock_threshold é coluna nova; cast pontual até regenerar os tipos.
        await admin
          .from('product_variants')
          .update({ low_stock_threshold: value } as never)
          .eq('id', variantId)
      }
    }

    revalidatePath('/admin/estoque')
    return { ok: true }
  } catch (err) {
    const error = err instanceof Error ? err.message : 'Erro ao ajustar estoque.'
    return { error }
  }
}
