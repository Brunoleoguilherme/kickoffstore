'use server'

import { revalidatePath } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/admin'
import { getDefaultOrganizationId } from '@/lib/org'
import { requirePermission } from '@/lib/auth/session'
import type { ActionState } from '@/lib/auth/actions'

function toNumber(v: FormDataEntryValue | null): number {
  return Number(String(v ?? '').replace(',', '.').trim())
}

export async function createCouponAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  try {
    await requirePermission('catalog.write')
  } catch {
    return { error: 'Sem permissão.' }
  }

  const code = String(formData.get('code') ?? '')
    .trim()
    .toUpperCase()
  if (!/^[A-Z0-9][A-Z0-9_-]{1,29}$/.test(code)) {
    return { error: 'Código inválido (2 a 30 caracteres: letras, números, - e _).' }
  }

  const discountType = formData.get('discountType') === 'fixed' ? 'fixed' : 'percent'
  const rawValue = toNumber(formData.get('discountValue'))
  if (!Number.isFinite(rawValue) || rawValue <= 0) return { error: 'Informe um valor de desconto.' }

  let discountValue: number
  if (discountType === 'percent') {
    discountValue = Math.round(rawValue)
    if (discountValue < 1 || discountValue > 100) return { error: 'Percentual deve ser de 1 a 100.' }
  } else {
    discountValue = Math.round(rawValue * 100) // reais → centavos
    if (discountValue <= 0) return { error: 'Valor fixo inválido.' }
  }

  const minRaw = toNumber(formData.get('minOrder'))
  const minOrderCents = Number.isFinite(minRaw) && minRaw > 0 ? Math.round(minRaw * 100) : 0

  const maxUsesRaw = String(formData.get('maxUses') ?? '').trim()
  const maxUses = maxUsesRaw ? Math.max(1, Math.round(Number(maxUsesRaw))) : null

  const expiresRaw = String(formData.get('expiresAt') ?? '').trim()
  let expiresAt: string | null = null
  if (expiresRaw) {
    const d = new Date(expiresRaw)
    if (!Number.isNaN(d.getTime())) expiresAt = d.toISOString()
  }

  const partnerId = String(formData.get('partnerId') ?? '').trim() || null

  const orgId = await getDefaultOrganizationId()
  if (!orgId) return { error: 'Organização não encontrada.' }

  const admin = createAdminClient()
  const { error } = await admin.from('coupons').insert({
    organization_id: orgId,
    code,
    discount_type: discountType,
    discount_value: discountValue,
    min_order_cents: minOrderCents,
    max_uses: maxUses,
    expires_at: expiresAt,
    partner_id: partnerId,
    active: true,
  })
  if (error) return { error: 'Falha ao criar cupom (código já existe?).' }

  revalidatePath('/admin/cupons')
  return { success: `Cupom ${code} criado.` }
}

export async function setCouponActiveAction(couponId: string, active: boolean): Promise<void> {
  await requirePermission('catalog.write')
  if (!couponId) return
  const admin = createAdminClient()
  await admin
    .from('coupons')
    .update({ active, updated_at: new Date().toISOString() })
    .eq('id', couponId)
  revalidatePath('/admin/cupons')
}

export async function deleteCouponAction(couponId: string): Promise<void> {
  await requirePermission('catalog.write')
  if (!couponId) return
  const admin = createAdminClient()
  await admin.from('coupons').delete().eq('id', couponId)
  revalidatePath('/admin/cupons')
}
