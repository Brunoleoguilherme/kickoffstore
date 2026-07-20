import 'server-only'
import { formatBRL } from '@clubedaestampa/ui'

export interface CouponRow {
  id: string
  code: string
  discount_type: 'percent' | 'fixed'
  discount_value: number
  active: boolean
  min_order_cents: number
  max_uses: number | null
  used_count: number
  starts_at: string | null
  expires_at: string | null
  partner_id: string | null
}

export interface CouponValidation {
  ok: boolean
  reason?: string
  discountCents?: number
}

/**
 * Valida um cupom para um subtotal e uma vitrine (parceiro). Puro: não toca no
 * banco. Retorna o desconto em centavos (limitado ao subtotal) quando válido.
 */
export function validateCoupon(
  c: CouponRow | null,
  subtotalCents: number,
  partnerId: string | null,
  nowIso: string,
): CouponValidation {
  if (!c) return { ok: false, reason: 'Cupom não encontrado.' }
  if (!c.active) return { ok: false, reason: 'Cupom inativo.' }

  const now = new Date(nowIso).getTime()
  if (c.starts_at && now < new Date(c.starts_at).getTime()) {
    return { ok: false, reason: 'Cupom ainda não está válido.' }
  }
  if (c.expires_at && now > new Date(c.expires_at).getTime()) {
    return { ok: false, reason: 'Cupom expirado.' }
  }
  if (subtotalCents < c.min_order_cents) {
    return { ok: false, reason: `Pedido mínimo de ${formatBRL(c.min_order_cents)} para este cupom.` }
  }
  if (c.max_uses != null && c.used_count >= c.max_uses) {
    return { ok: false, reason: 'Cupom esgotado.' }
  }
  if (c.partner_id && c.partner_id !== partnerId) {
    return { ok: false, reason: 'Este cupom não é válido nesta loja.' }
  }

  let discount =
    c.discount_type === 'percent'
      ? Math.round((subtotalCents * c.discount_value) / 100)
      : c.discount_value
  discount = Math.max(0, Math.min(discount, subtotalCents))
  return { ok: true, discountCents: discount }
}
