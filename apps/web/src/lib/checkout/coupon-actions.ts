'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { getDefaultOrganizationId } from '@/lib/org'
import { getActivePartner } from '@/lib/partners/context'
import { validateCoupon, type CouponRow } from './coupons'

export interface ApplyCouponResult {
  ok: boolean
  message?: string
  code?: string
  discountCents?: number
}

/** Valida um cupom para o subtotal atual e retorna o desconto (prévia no checkout). */
export async function applyCouponAction(
  code: string,
  subtotalCents: number,
): Promise<ApplyCouponResult> {
  const normalized = String(code ?? '').trim().toUpperCase()
  if (!normalized) return { ok: false, message: 'Informe um código de cupom.' }
  if (!subtotalCents || subtotalCents <= 0) return { ok: false, message: 'Carrinho vazio.' }

  const orgId = await getDefaultOrganizationId()
  if (!orgId) return { ok: false, message: 'Organização não encontrada.' }

  const admin = createAdminClient()
  const { data } = await admin
    .from('coupons')
    .select(
      'id, code, discount_type, discount_value, active, min_order_cents, max_uses, used_count, starts_at, expires_at, partner_id',
    )
    .eq('organization_id', orgId)
    .eq('code', normalized)
    .maybeSingle()
  const coupon = data as unknown as CouponRow | null

  const partner = await getActivePartner()
  const result = validateCoupon(coupon, subtotalCents, partner?.id ?? null, new Date().toISOString())
  if (!result.ok) return { ok: false, message: result.reason ?? 'Cupom inválido.' }

  return { ok: true, code: normalized, discountCents: result.discountCents ?? 0 }
}
