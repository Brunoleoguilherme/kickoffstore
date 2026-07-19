'use server'

import type { Json } from '@kickoffstore/types'
import { createAdminClient } from '@/lib/supabase/admin'
import { getDefaultOrganizationId } from '@/lib/org'
import { getActivePartner } from '@/lib/partners/context'
import { validateCoupon, type CouponRow } from './coupons'
import { isMelhorEnvioConfigured, calculateShipping } from '@kickoffstore/integrations'

export interface CheckoutLineInput {
  variantId: string
  quantity: number
}

export interface CheckoutPayer {
  name: string
  email: string
  document: string
}

export interface CheckoutAddress {
  zip: string
  street: string
  number: string
  complement?: string
  district?: string
  city: string
  state: string
}

export interface CheckoutShippingSnapshot {
  serviceId: number
  name: string
  company: string
  deliveryDays: number
}

export interface CheckoutShipping {
  /** Valor do frete em centavos (revalidado no servidor). */
  cents: number
  snapshot: CheckoutShippingSnapshot | null
}

export interface CreateOrderResult {
  ok: boolean
  orderId?: string
  totalCents?: number
  message?: string
}

interface VariantRow {
  id: string
  sku: string
  color: string | null
  size: string | null
  price_cents: number
  active: boolean
  weight_grams: number | null
  width_cm: number | null
  height_cm: number | null
  length_cm: number | null
  products: { name: string } | { name: string }[] | null
}

function onlyDigits(v: string): string {
  return String(v ?? '').replace(/\D/g, '')
}

function productName(row: VariantRow): string {
  const p = row.products
  if (Array.isArray(p)) return p[0]?.name ?? 'Produto'
  return p?.name ?? 'Produto'
}

function variantLabel(row: VariantRow): string | null {
  const label = [row.color, row.size].filter(Boolean).join(' · ')
  return label || null
}

/**
 * Cria um pedido a partir do carrinho. Os preços NUNCA vêm do cliente:
 * são relidos do banco (product_variants) para evitar adulteração.
 * Usa o service role (código servidor confiável) — RLS é ignorada de forma controlada.
 */
export async function createOrderFromCart(
  lines: CheckoutLineInput[],
  payer: CheckoutPayer,
  address: CheckoutAddress,
  shipping?: CheckoutShipping,
  couponCode?: string,
): Promise<CreateOrderResult> {
  try {
    const clean = (lines ?? []).filter((l) => l && l.variantId && l.quantity > 0)
    if (clean.length === 0) {
      return { ok: false, message: 'Carrinho vazio.' }
    }
    if (!payer?.name?.trim() || !payer?.email?.trim()) {
      return { ok: false, message: 'Informe nome e e-mail.' }
    }
    const doc = onlyDigits(payer.document)
    if (doc.length !== 11 && doc.length !== 14) {
      return { ok: false, message: 'Informe um CPF ou CNPJ válido.' }
    }
    if (!address?.zip?.trim() || !address?.street?.trim() || !address?.city?.trim() || !address?.state?.trim()) {
      return { ok: false, message: 'Preencha o endereço de entrega (CEP, rua, cidade e UF).' }
    }

    const orgId = await getDefaultOrganizationId()
    if (!orgId) return { ok: false, message: 'Organização não configurada.' }

    const admin = createAdminClient()
    const variantIds = Array.from(new Set(clean.map((l) => l.variantId)))
    const { data, error } = await admin
      .from('product_variants')
      .select(
        'id, sku, color, size, price_cents, active, weight_grams, width_cm, height_cm, length_cm, products(name)',
      )
      .in('id', variantIds)

    if (error) return { ok: false, message: 'Falha ao validar os produtos.' }
    const rows = (data ?? []) as unknown as VariantRow[]
    const byId = new Map(rows.map((r) => [r.id, r]))

    // Monta os itens com preços do banco.
    const items = clean.map((l) => {
      const v = byId.get(l.variantId)
      if (!v || !v.active) return null
      const unit = v.price_cents
      const qty = Math.min(Math.max(Math.trunc(l.quantity), 1), 99)
      return {
        variant_id: v.id,
        sku: v.sku,
        product_name: productName(v),
        variant_name: variantLabel(v),
        quantity: qty,
        unit_price_cents: unit,
        discount_cents: 0,
        tax_cents: 0,
        total_cents: unit * qty,
      }
    })

    if (items.some((i) => i === null)) {
      return { ok: false, message: 'Um ou mais produtos não estão mais disponíveis. Revise o carrinho.' }
    }
    const validItems = items.filter((i): i is NonNullable<(typeof items)[number]> => i !== null)

    const subtotal = validItems.reduce((n, i) => n + i.total_cents, 0)
    if (subtotal <= 0) return { ok: false, message: 'Pedido sem valor a cobrar.' }

    // Trava de estoque: impede vender mais do que há em saldo (anti-oversell).
    // Regra: se a variação tem saldo cadastrado, exige disponível >= quantidade.
    // Variação sem NENHUM registro de saldo é tratada como "não rastreada" e passa
    // (quando o Bling virar a fonte da verdade, inventory_balances é sincronizado dele).
    const { data: balData } = await admin
      .from('inventory_balances')
      .select('variant_id, on_hand, reserved')
      .in(
        'variant_id',
        validItems.map((i) => i.variant_id),
      )
    const availableByVariant = new Map<string, number>()
    for (const b of (balData ?? []) as Array<{
      variant_id: string
      on_hand: number | null
      reserved: number | null
    }>) {
      const prev = availableByVariant.get(b.variant_id) ?? 0
      const free = Math.max(0, Number(b.on_hand ?? 0) - Number(b.reserved ?? 0))
      availableByVariant.set(b.variant_id, prev + free)
    }
    const insufficient = validItems.filter(
      (i) => availableByVariant.has(i.variant_id) && i.quantity > (availableByVariant.get(i.variant_id) ?? 0),
    )
    if (insufficient.length > 0) {
      const names = insufficient
        .map((i) => `${i.product_name}${i.variant_name ? ` (${i.variant_name})` : ''}`)
        .join(', ')
      return {
        ok: false,
        message: `Estoque insuficiente para: ${names}. Ajuste as quantidades no carrinho.`,
      }
    }

    const shippingAddress = {
      zip: onlyDigits(address.zip),
      street: address.street.trim(),
      number: address.number?.trim() || 's/n',
      complement: address.complement?.trim() || null,
      district: address.district?.trim() || null,
      city: address.city.trim(),
      state: address.state.trim().toUpperCase().slice(0, 2),
      country: 'BR',
    }
    const customerSnapshot = {
      name: payer.name.trim(),
      email: payer.email.trim().toLowerCase(),
      document: doc,
    }
    const orderNumber = `KS-${Date.now().toString(36).toUpperCase()}`

    // Frete: NUNCA confia no valor vindo do cliente. Se o cliente escolheu um
    // serviço, recotamos no servidor e casamos pelo id do serviço; usamos o
    // preço recém-cotado. Se a recotação falhar, o pedido segue com frete 0.
    let shippingCents = 0
    let shippingSnapshot: CheckoutShippingSnapshot | null = null
    if (shipping?.snapshot && isMelhorEnvioConfigured()) {
      try {
        const products = validItems.map((i) => {
          const v = byId.get(i.variant_id)
          return {
            id: i.variant_id,
            width: Number(v?.width_cm ?? 0),
            height: Number(v?.height_cm ?? 0),
            length: Number(v?.length_cm ?? 0),
            weight: Number(v?.weight_grams ?? 0) / 1000,
            insuranceValue: Number(v?.price_cents ?? 0) / 100,
            quantity: i.quantity,
          }
        })
        const quotes = await calculateShipping({ toPostalCode: shippingAddress.zip, products })
        const match = quotes.find((q) => q.serviceId === shipping.snapshot?.serviceId)
        if (match) {
          shippingCents = match.priceCents
          shippingSnapshot = {
            serviceId: match.serviceId,
            name: match.name,
            company: match.company,
            deliveryDays: match.deliveryDays,
          }
        }
      } catch (err) {
        console.error('re-quote shipping error', err)
      }
    }
    // Vitrine de origem: se o checkout roda num subdomínio de parceiro, marca o pedido.
    const activePartner = await getActivePartner()

    // Cupom de desconto: revalida no servidor (nunca confia no valor do cliente).
    let discountCents = 0
    let couponSnapshot: {
      code: string
      discount_type: string
      discount_value: number
      discount_cents: number
    } | null = null
    let couponToIncrement: { id: string; nextCount: number } | null = null
    const couponCodeNorm = (couponCode ?? '').trim().toUpperCase()
    if (couponCodeNorm) {
      const { data: cData } = await admin
        .from('coupons')
        .select(
          'id, code, discount_type, discount_value, active, min_order_cents, max_uses, used_count, starts_at, expires_at, partner_id',
        )
        .eq('organization_id', orgId)
        .eq('code', couponCodeNorm)
        .maybeSingle()
      const coupon = cData as unknown as CouponRow | null
      const v = validateCoupon(coupon, subtotal, activePartner?.id ?? null, new Date().toISOString())
      if (v.ok && coupon) {
        discountCents = v.discountCents ?? 0
        couponSnapshot = {
          code: coupon.code,
          discount_type: coupon.discount_type,
          discount_value: coupon.discount_value,
          discount_cents: discountCents,
        }
        couponToIncrement = { id: coupon.id, nextCount: Number(coupon.used_count ?? 0) + 1 }
      }
      // Cupom inválido é ignorado silenciosamente (a prévia no checkout já barra).
    }

    const total = Math.max(0, subtotal - discountCents) + shippingCents

    const { data: orderRow, error: orderErr } = await admin
      .from('orders')
      .insert({
        organization_id: orgId,
        order_number: orderNumber,
        channel: 'web',
        status: 'awaiting_payment',
        currency: 'BRL',
        subtotal_cents: subtotal,
        discount_cents: discountCents,
        shipping_cents: shippingCents,
        tax_cents: 0,
        total_cents: total,
        shipping_address: shippingAddress,
        shipping_method_snapshot: shippingSnapshot as unknown as Json,
        customer_snapshot: customerSnapshot,
        coupon_snapshot: couponSnapshot as unknown as Json,
        partner_id: activePartner?.id ?? null,
      })
      .select('id')
      .single()

    if (orderErr || !orderRow) {
      return { ok: false, message: 'Não foi possível criar o pedido.' }
    }
    const orderId = (orderRow as { id: string }).id

    const { error: itemsErr } = await admin
      .from('order_items')
      .insert(validItems.map((i) => ({ ...i, order_id: orderId })))

    if (itemsErr) {
      return { ok: false, message: 'Pedido criado, mas houve falha ao registrar os itens.' }
    }

    await admin.from('order_status_history').insert({
      order_id: orderId,
      from_status: null,
      to_status: 'awaiting_payment',
      reason: 'Pedido criado no checkout',
    })

    // Contabiliza o uso do cupom (best-effort).
    if (couponToIncrement) {
      await admin
        .from('coupons')
        .update({ used_count: couponToIncrement.nextCount, updated_at: new Date().toISOString() })
        .eq('id', couponToIncrement.id)
    }

    return { ok: true, orderId, totalCents: total }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erro ao criar o pedido.'
    return { ok: false, message }
  }
}
