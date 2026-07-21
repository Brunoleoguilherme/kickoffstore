import 'server-only'
import { sendEmail } from '@clubedaestampa/integrations'
import {
  isResendConfigured,
  resendFromEmail,
  orderNotificationEmails,
  clientEnv,
} from '@clubedaestampa/validation'
import { formatBRL } from '@clubedaestampa/ui'
import { createAdminClient } from '@/lib/supabase/admin'
import { productImageUrl } from '@/lib/catalog/image'

type Admin = ReturnType<typeof createAdminClient>

interface OrderRow {
  id: string
  organization_id: string
  order_number: string
  total_cents: number
  customer_snapshot: { name?: string; email?: string } | null
  partner_id: string | null
}

/** Marca usada nos e-mails: Clube da Estampa (loja principal) ou o parceiro white-label. */
interface Brand {
  name: string
  logoUrl: string | null
  /** Cor primária da loja (barra do topo e cabeçalho). */
  primary: string
  /** Cor de destaque (botões, total, links). */
  accent: string
  /** URL base da loja (subdomínio do parceiro ou domínio principal). */
  storeUrl: string
  isPartner: boolean
}

interface OrderItemRow {
  variant_id: string | null
  product_name: string
  variant_name: string | null
  quantity: number
  total_cents: number
}

/**
 * Executado uma única vez, quando um pedido passa para `paid`:
 *  1) baixa de estoque (inventory_balances + ledger inventory_movements)
 *  2) e-mail de confirmação ao cliente (Resend)
 * Tudo best-effort: qualquer falha é logada mas NUNCA quebra o webhook.
 */
export async function fulfillPaidOrder(orderId: string): Promise<void> {
  try {
    const admin = createAdminClient()
    const { data: orderData } = await admin
      .from('orders')
      .select('id, organization_id, order_number, total_cents, customer_snapshot, partner_id')
      .eq('id', orderId)
      .maybeSingle()
    const order = orderData as unknown as OrderRow | null
    if (!order) return

    const { data: itemsData } = await admin
      .from('order_items')
      .select('variant_id, product_name, variant_name, quantity, total_cents')
      .eq('order_id', orderId)
    const items = (itemsData ?? []) as unknown as OrderItemRow[]

    await commitStock(admin, order.organization_id, orderId, items)
    await sendPaidEmail(admin, order, items)
    await sendAdminNotification(admin, order, items)
  } catch (err) {
    console.error('fulfillPaidOrder error', err)
  }
}

interface LowStockCrossing {
  productName: string
  variantName: string | null
  available: number
  threshold: number
}

/** Baixa o estoque de cada item no primeiro depósito ativo da organização. */
async function commitStock(
  admin: Admin,
  organizationId: string,
  orderId: string,
  items: OrderItemRow[],
): Promise<void> {
  try {
    const { data: wh } = await admin
      .from('warehouses')
      .select('id')
      .eq('organization_id', organizationId)
      .eq('active', true)
      .order('created_at', { ascending: true })
      .limit(1)
      .maybeSingle()
    const warehouseId = (wh as { id: string } | null)?.id
    if (!warehouseId) return // sem depósito configurado → pula a baixa

    // Limites de alerta configurados por variação (low_stock_threshold > 0).
    const variantIds = items.map((i) => i.variant_id).filter((v): v is string => Boolean(v))
    const thresholds = new Map<string, number>()
    if (variantIds.length > 0) {
      const { data: vs } = await admin.from('product_variants').select('*').in('id', variantIds)
      for (const v of (vs ?? []) as unknown as Array<{
        id: string
        low_stock_threshold: number | null
      }>) {
        if (v.low_stock_threshold && v.low_stock_threshold > 0) {
          thresholds.set(v.id, v.low_stock_threshold)
        }
      }
    }

    const crossings: LowStockCrossing[] = []

    for (const it of items) {
      if (!it.variant_id) continue
      const { data: balData } = await admin
        .from('inventory_balances')
        .select('on_hand, reserved')
        .eq('warehouse_id', warehouseId)
        .eq('variant_id', it.variant_id)
        .maybeSingle()
      const bal = balData as { on_hand: number; reserved: number } | null
      if (!bal) continue // sem saldo cadastrado para esse variante → pula

      const newOnHand = Math.max(0, Number(bal.on_hand) - it.quantity)
      const newReserved = Math.min(Number(bal.reserved), newOnHand) // respeita reserved <= on_hand

      await admin
        .from('inventory_balances')
        .update({ on_hand: newOnHand, reserved: newReserved, updated_at: new Date().toISOString() })
        .eq('warehouse_id', warehouseId)
        .eq('variant_id', it.variant_id)

      await admin.from('inventory_movements').insert({
        organization_id: organizationId,
        warehouse_id: warehouseId,
        variant_id: it.variant_id,
        movement_type: 'sale',
        quantity: it.quantity,
        reference_type: 'order',
        reference_id: orderId,
        reason: 'Baixa por pagamento confirmado',
      })

      // Alerta de estoque baixo: dispara só quando ESTA venda cruza o limite
      // (estava acima, ficou igual/abaixo) — evita e-mail repetido.
      const threshold = thresholds.get(it.variant_id)
      if (threshold !== undefined) {
        const prevAvailable = Math.max(0, Number(bal.on_hand) - Number(bal.reserved))
        const newAvailable = Math.max(0, newOnHand - newReserved)
        if (prevAvailable > threshold && newAvailable <= threshold) {
          crossings.push({
            productName: it.product_name,
            variantName: it.variant_name,
            available: newAvailable,
            threshold,
          })
        }
      }
    }

    if (crossings.length > 0) await sendLowStockAlert(crossings)
  } catch (err) {
    console.error('commitStock error', err)
  }
}

/** E-mail de alerta de estoque baixo para a equipe/loja (best-effort). */
async function sendLowStockAlert(crossings: LowStockCrossing[]): Promise<void> {
  if (!isResendConfigured()) return
  const recipients = orderNotificationEmails()
  if (recipients.length === 0) return

  try {
    const rows = crossings
      .map(
        (c) =>
          `<tr><td style="padding:6px 0;color:#111">${escapeHtml(c.productName)}${
            c.variantName ? ` <span style="color:#666">(${escapeHtml(c.variantName)})</span>` : ''
          }</td><td style="padding:6px 0;text-align:right;color:#b91c1c;font-weight:700">${c.available} un.</td><td style="padding:6px 0;text-align:right;color:#666">limite ${c.threshold}</td></tr>`,
      )
      .join('')

    const html = `
      <div style="font-family:Arial,Helvetica,sans-serif;max-width:560px;margin:0 auto;color:#111">
        <h1 style="font-size:20px;margin:0 0 4px">⚠️ Estoque baixo</h1>
        <p style="margin:0 0 12px;color:#555">${
          crossings.length === 1 ? '1 item atingiu' : `${crossings.length} itens atingiram`
        } o nível mínimo de estoque. Considere repor.</p>
        <table style="width:100%;border-collapse:collapse;margin:12px 0">${rows}</table>
        <p style="margin:8px 0 0;color:#888;font-size:13px">Ajuste o saldo no painel administrativo, em Estoque.</p>
      </div>`

    await sendEmail({
      to: recipients,
      from: resendFromEmail(),
      subject: `⚠️ Estoque baixo — ${crossings.length} ${crossings.length === 1 ? 'item' : 'itens'} para repor`,
      html,
    })
  } catch (err) {
    console.error('sendLowStockAlert error', err)
  }
}

/** E-mail de confirmação de pagamento (best-effort). */
async function sendPaidEmail(admin: Admin, order: OrderRow, items: OrderItemRow[]): Promise<void> {
  if (!isResendConfigured()) return
  const email = order.customer_snapshot?.email
  if (!email) return

  try {
    const brand = await brandForOrder(admin, order.partner_id)
    const name = order.customer_snapshot?.name ?? 'cliente'
    // Conta/pedidos unificada na loja principal (cliente pode comprar em várias lojas).
    const accountUrl = clientEnv.NEXT_PUBLIC_APP_URL.replace(/\/$/, '')
    const orderUrl = `${accountUrl}/conta/pedidos/${order.id}`
    const btnText = textOn(brand.accent)
    const images = await imagesForItems(admin, items)
    const rows = itemRows(items, images)

    const html = emailShell(
      `<h1 style="margin:0 0 6px;font-size:24px;color:#3ba55d">Pagamento confirmado! ✅</h1>
       <p style="margin:0 0 20px;color:#cfcfcf;font-size:15px;line-height:1.5">Olá, <strong style="color:#fff">${escapeHtml(name)}</strong>. Recebemos o pagamento do seu pedido <strong style="color:${brand.accent}">${escapeHtml(order.order_number)}</strong> e já começamos a preparar tudo. 🧡</p>
       <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;border-collapse:collapse">${rows}</table>
       <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;margin-top:4px">
         <tr><td style="padding:14px 0;color:#9a9a9a;text-transform:uppercase;font-size:12px;letter-spacing:1px">Total</td><td style="padding:14px 0;text-align:right;font-size:22px;font-weight:800;color:${brand.accent}">${formatBRL(order.total_cents)}</td></tr>
       </table>
       <table role="presentation" cellpadding="0" cellspacing="0" style="margin:16px 0 6px"><tr><td style="border-radius:10px;background:${brand.accent}">
         <a href="${orderUrl}" style="display:inline-block;padding:15px 32px;color:${btnText};text-decoration:none;font-weight:800;font-size:15px">Acompanhar meu pedido →</a>
       </td></tr></table>
       <p style="margin:14px 0 0;color:#9a9a9a;font-size:13px">Ou veja tudo na sua conta em <a href="${accountUrl}/conta/pedidos" style="color:${brand.accent};text-decoration:none;font-weight:600">Meus pedidos</a>. Obrigado por comprar na ${escapeHtml(brand.name)}! 🏆</p>`,
      brand,
      `Pagamento do pedido ${order.order_number} confirmado — ${formatBRL(order.total_cents)}`,
    )

    await sendEmail({
      to: email,
      from: fromForBrand(brand),
      subject: `Pedido ${order.order_number} confirmado — ${brand.name}`,
      html,
    })
  } catch (err) {
    console.error('sendPaidEmail error', err)
  }
}

/** Notificação de novo pedido pago para a equipe/loja (best-effort). */
async function sendAdminNotification(admin: Admin, order: OrderRow, items: OrderItemRow[]): Promise<void> {
  if (!isResendConfigured()) return
  const recipients = orderNotificationEmails()
  if (recipients.length === 0) return

  try {
    const kb = clubeBrand()
    const orderBrand = await brandForOrder(admin, order.partner_id)
    const storeLabel = orderBrand.isPartner ? orderBrand.name : 'Loja principal'
    const customerName = order.customer_snapshot?.name ?? '—'
    const customerEmail = order.customer_snapshot?.email ?? '—'
    const adminUrl = `${kb.storeUrl}/admin/pedidos/${order.id}`
    const images = await imagesForItems(admin, items)
    const rows = itemRows(items, images)

    const html = emailShell(
      `<h1 style="margin:0 0 6px;font-size:22px;color:#fff">🛒 Novo pedido pago</h1>
       <p style="margin:0 0 4px;color:#cfcfcf">Pedido <strong style="color:${kb.accent}">${escapeHtml(order.order_number)}</strong> · <span style="color:#3ba55d;font-weight:700">pago</span></p>
       <p style="margin:0 0 4px;color:#cfcfcf;font-size:14px"><strong style="color:#fff">Loja:</strong> ${escapeHtml(storeLabel)}</p>
       <p style="margin:0 0 16px;color:#cfcfcf;font-size:14px"><strong style="color:#fff">Cliente:</strong> ${escapeHtml(customerName)} · ${escapeHtml(customerEmail)}</p>
       <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;border-collapse:collapse">${rows}</table>
       <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;margin-top:4px">
         <tr><td style="padding:14px 0;color:#9a9a9a;text-transform:uppercase;font-size:12px;letter-spacing:1px">Total</td><td style="padding:14px 0;text-align:right;font-size:20px;font-weight:800;color:${kb.accent}">${formatBRL(order.total_cents)}</td></tr>
       </table>
       <table role="presentation" cellpadding="0" cellspacing="0" style="margin:16px 0 6px"><tr><td style="border-radius:10px;background:${kb.accent}">
         <a href="${adminUrl}" style="display:inline-block;padding:14px 28px;color:${textOn(kb.accent)};text-decoration:none;font-weight:800;font-size:15px">Ver pedido no painel →</a>
       </td></tr></table>
       <p style="margin:12px 0 0;color:#8a8a8a;font-size:12px">Notificação interna da equipe Clube da Estampa.</p>`,
      kb,
      `Novo pedido pago ${order.order_number} — ${formatBRL(order.total_cents)}`,
    )

    await sendEmail({
      to: recipients,
      from: resendFromEmail(),
      subject: `🛒 Novo pedido pago ${order.order_number} — ${formatBRL(order.total_cents)}${
        orderBrand.isPartner ? ` (${orderBrand.name})` : ''
      }`,
      html,
    })
  } catch (err) {
    console.error('sendAdminNotification error', err)
  }
}

/**
 * Devolve ao estoque as unidades de um pedido (cancelamento/reembolso/devolução).
 * Só age se o pedido foi PAGO (o estoque foi baixado) e ainda não foi restituído.
 * Idempotente: não restitui duas vezes (checa movimentos 'return' do pedido).
 */
export async function restockOrder(orderId: string): Promise<void> {
  try {
    const admin = createAdminClient()
    const { data: od } = await admin
      .from('orders')
      .select('organization_id, paid_at')
      .eq('id', orderId)
      .maybeSingle()
    const order = od as { organization_id: string; paid_at: string | null } | null
    if (!order || !order.paid_at) return // nunca foi pago → estoque não foi baixado

    // Já restituído antes? (evita devolver em dobro)
    const { data: prev } = await admin
      .from('inventory_movements')
      .select('id')
      .eq('reference_type', 'order')
      .eq('reference_id', orderId)
      .eq('movement_type', 'return')
      .limit(1)
      .maybeSingle()
    if (prev) return

    const { data: wh } = await admin
      .from('warehouses')
      .select('id')
      .eq('organization_id', order.organization_id)
      .eq('active', true)
      .order('created_at', { ascending: true })
      .limit(1)
      .maybeSingle()
    const warehouseId = (wh as { id: string } | null)?.id
    if (!warehouseId) return

    const { data: itemsData } = await admin
      .from('order_items')
      .select('variant_id, quantity')
      .eq('order_id', orderId)
    const items = (itemsData ?? []) as unknown as Array<{
      variant_id: string | null
      quantity: number
    }>

    for (const it of items) {
      if (!it.variant_id) continue
      const { data: balData } = await admin
        .from('inventory_balances')
        .select('on_hand')
        .eq('warehouse_id', warehouseId)
        .eq('variant_id', it.variant_id)
        .maybeSingle()
      const bal = balData as { on_hand: number } | null
      if (!bal) continue // sem saldo cadastrado → não houve baixa → nada a devolver

      const newOnHand = Number(bal.on_hand) + Number(it.quantity)
      await admin
        .from('inventory_balances')
        .update({ on_hand: newOnHand, updated_at: new Date().toISOString() })
        .eq('warehouse_id', warehouseId)
        .eq('variant_id', it.variant_id)

      await admin.from('inventory_movements').insert({
        organization_id: order.organization_id,
        warehouse_id: warehouseId,
        variant_id: it.variant_id,
        movement_type: 'return',
        quantity: Number(it.quantity),
        reference_type: 'order',
        reference_id: orderId,
        reason: 'Devolução ao estoque (cancelamento/reembolso)',
      })
    }
  } catch (err) {
    console.error('restockOrder error', err)
  }
}

/** Marca da loja principal (Clube da Estampa). */
function clubeBrand(): Brand {
  return {
    name: 'Clube da Estampa',
    logoUrl: null,
    primary: '#c89a2b',
    accent: '#c89a2b',
    storeUrl: clientEnv.NEXT_PUBLIC_APP_URL.replace(/\/$/, ''),
    isPartner: false,
  }
}

/** Resolve a marca do e-mail a partir do parceiro do pedido (ou Clube da Estampa). */
async function brandForOrder(admin: Admin, partnerId: string | null): Promise<Brand> {
  const fallback = clubeBrand()
  if (!partnerId) return fallback
  try {
    const { data } = await admin
      .from('partners')
      .select('name, slug, logo_url, primary_color, accent_color')
      .eq('id', partnerId)
      .maybeSingle()
    const p = data as {
      name: string
      slug: string
      logo_url: string | null
      primary_color: string | null
      accent_color: string | null
    } | null
    if (!p) return fallback
    return {
      name: p.name,
      logoUrl: p.logo_url,
      primary: p.primary_color || p.accent_color || fallback.primary,
      accent: p.accent_color || p.primary_color || fallback.accent,
      storeUrl: `https://${p.slug}.kickoffstore.com.br`,
      isPartner: true,
    }
  } catch {
    return fallback
  }
}

/** Cor de texto legível (preto/branco) sobre uma cor de fundo hex. */
function textOn(hex: string): string {
  const h = hex.replace('#', '')
  if (h.length < 6) return '#111111'
  const r = parseInt(h.slice(0, 2), 16)
  const g = parseInt(h.slice(2, 4), 16)
  const b = parseInt(h.slice(4, 6), 16)
  const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255
  return lum > 0.6 ? '#111111' : '#ffffff'
}

/**
 * Remetente do e-mail com o NOME da loja de origem (o endereço continua o mesmo,
 * ex.: "BH Wolves <no-reply@kickoffstore.com.br>"). Mantém o domínio verificado
 * no Resend; só o nome de exibição muda por parceiro.
 */
function fromForBrand(brand: Brand): string {
  const base = resendFromEmail() // "Nome <email>" ou só "email"
  const m = base.match(/<([^>]+)>/)
  const addr = (m?.[1] ?? base).trim()
  const safe = brand.name.replace(/["<>\r\n]/g, '').trim() || 'Clube da Estampa'
  const display = safe.includes(',') ? `"${safe}"` : safe
  return `${display} <${addr}>`
}

/**
 * Resolve a miniatura (URL pública) de cada item do pedido.
 * Caminho: order_item.variant_id → product_variants.product_id → product_images.
 * Preferência: imagem da própria variação › imagem primária › menor sort_order.
 * Best-effort: qualquer falha devolve o mapa que tiver (itens ficam sem miniatura).
 */
async function imagesForItems(
  admin: Admin,
  items: OrderItemRow[],
): Promise<Map<string, string | null>> {
  const out = new Map<string, string | null>()
  const variantIds = items.map((i) => i.variant_id).filter((v): v is string => Boolean(v))
  if (variantIds.length === 0) return out
  try {
    const { data: vars } = await admin
      .from('product_variants')
      .select('id, product_id')
      .in('id', variantIds)
    const variantToProduct = new Map<string, string>()
    for (const v of (vars ?? []) as unknown as Array<{ id: string; product_id: string }>) {
      variantToProduct.set(v.id, v.product_id)
    }
    const productIds = [...new Set([...variantToProduct.values()])]
    if (productIds.length === 0) return out

    const { data: imgs } = await admin
      .from('product_images')
      .select('product_id, variant_id, storage_path, is_primary, sort_order')
      .in('product_id', productIds)
    const images = (imgs ?? []) as unknown as Array<{
      product_id: string
      variant_id: string | null
      storage_path: string
      is_primary: boolean
      sort_order: number
    }>

    for (const variantId of variantIds) {
      const productId = variantToProduct.get(variantId)
      if (!productId) {
        out.set(variantId, null)
        continue
      }
      const candidates = images
        .filter((im) => im.product_id === productId)
        .sort((a, b) => {
          const av = a.variant_id === variantId ? 0 : 1
          const bv = b.variant_id === variantId ? 0 : 1
          if (av !== bv) return av - bv
          if (a.is_primary !== b.is_primary) return a.is_primary ? -1 : 1
          return a.sort_order - b.sort_order
        })
      const top = candidates[0]
      out.set(variantId, top ? productImageUrl(top.storage_path) : null)
    }
  } catch (err) {
    console.error('imagesForItems error', err)
  }
  return out
}

/** Linhas dos itens do pedido, com miniatura à esquerda (fallback neutro sem imagem). */
function itemRows(items: OrderItemRow[], images: Map<string, string | null>): string {
  return items
    .map((i) => {
      const img = i.variant_id ? (images.get(i.variant_id) ?? null) : null
      const thumb = img
        ? `<img src="${img}" width="48" height="48" alt="" style="display:block;width:48px;height:48px;border-radius:8px;object-fit:cover;border:1px solid rgba(255,255,255,0.10)" />`
        : `<div style="width:48px;height:48px;border-radius:8px;background:#1c1c1c;border:1px solid rgba(255,255,255,0.08)"></div>`
      return `<tr>
        <td style="padding:10px 0;border-bottom:1px solid rgba(255,255,255,0.06)">
          <table role="presentation" cellpadding="0" cellspacing="0"><tr>
            <td style="width:48px;padding-right:12px;vertical-align:middle">${thumb}</td>
            <td style="vertical-align:middle;color:#e4e4e4;font-size:14px">${i.quantity}× ${escapeHtml(i.product_name)}${
              i.variant_name ? ` <span style="color:#8f8f8f">(${escapeHtml(i.variant_name)})</span>` : ''
            }</td>
          </tr></table>
        </td>
        <td style="padding:10px 0;border-bottom:1px solid rgba(255,255,255,0.06);text-align:right;color:#e4e4e4;font-size:14px;white-space:nowrap;vertical-align:middle">${formatBRL(i.total_cents)}</td>
      </tr>`
    })
    .join('')
}

function emailShell(inner: string, brand: Brand, preheader = ''): string {
  const year = new Date().getFullYear()
  // A conta/pedidos do cliente é unificada na loja principal (ele pode comprar
  // na principal e em vários parceiros), então "Meus pedidos" aponta para lá.
  const accountUrl = clientEnv.NEXT_PUBLIC_APP_URL.replace(/\/$/, '')
  // Parceiro com logo: logo grande (quase encostando na faixa) + nome ao lado.
  const logo =
    brand.isPartner && brand.logoUrl
      ? `<table role="presentation" cellpadding="0" cellspacing="0"><tr>
           <td style="padding-right:16px;vertical-align:middle"><img src="${brand.logoUrl}" alt="${escapeHtml(brand.name)}" height="64" style="height:64px;max-height:64px;width:auto;max-width:180px;display:block" /></td>
           <td style="vertical-align:middle"><span style="font-size:26px;font-weight:800;color:#ffffff;letter-spacing:0.5px">${escapeHtml(brand.name)}</span></td>
         </tr></table>`
      : brand.logoUrl
        ? `<img src="${brand.logoUrl}" alt="${escapeHtml(brand.name)}" style="height:38px;max-width:220px;display:block" />`
        : brand.isPartner
          ? `<span style="font-size:22px;font-weight:800;color:#ffffff;letter-spacing:1px">${escapeHtml(brand.name)}</span>`
          : `<span style="font-size:22px;font-weight:800;color:#ffffff;letter-spacing:1px">CLUBE DA <span style="color:${brand.accent}">ESTAMPA</span></span>`
  const powered = brand.isPartner ? ' · powered by Clube da Estampa' : ''
  // Cabeçalho na cor primária da loja (só parceiros; a principal mantém o fundo escuro).
  // Parceiro usa padding vertical menor pra logo grande quase encostar nas bordas.
  const headerBg = brand.isPartner ? `background:${brand.primary};` : ''
  const headerPad = brand.isPartner ? '12px 28px' : '24px 28px'
  return `
    <div style="background:#050505;margin:0;padding:24px 12px;font-family:Arial,Helvetica,sans-serif">
      ${
        preheader
          ? `<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:#050505">${escapeHtml(preheader)}</div>`
          : ''
      }
      <div style="max-width:600px;margin:0 auto;background:#111111;border:1px solid rgba(255,255,255,0.08);border-radius:16px;overflow:hidden">
        <div style="height:4px;background:${brand.primary}"></div>
        <div style="${headerBg}padding:${headerPad};border-bottom:1px solid rgba(255,255,255,0.08)">${logo}</div>
        <div style="padding:28px">${inner}</div>
        <div style="padding:20px 28px;border-top:1px solid rgba(255,255,255,0.08);background:#0b0b0b">
          <p style="margin:0 0 8px;color:#8a8a8a;font-size:12px">🔒 Pagamento seguro · Pix, cartão e boleto · Entrega para todo o Brasil</p>
          <p style="margin:0 0 10px">
            <a href="${brand.storeUrl}" style="color:${brand.accent};text-decoration:none;font-size:12px;font-weight:600">Ir para a loja</a>
            <span style="color:#3a3a3a"> · </span>
            <a href="${accountUrl}/conta/pedidos" style="color:${brand.accent};text-decoration:none;font-size:12px;font-weight:600">Meus pedidos</a>
          </p>
          <p style="margin:0;color:#5a5a5a;font-size:11px">© ${year} ${escapeHtml(brand.name)}. Todos os direitos reservados.${powered}</p>
        </div>
      </div>
    </div>`
}

/** E-mail "pedido enviado" com código de rastreio (best-effort). */
export async function notifyOrderShipped(orderId: string): Promise<void> {
  if (!isResendConfigured()) return
  try {
    const admin = createAdminClient()
    const { data: od } = await admin
      .from('orders')
      .select('order_number, customer_snapshot, partner_id')
      .eq('id', orderId)
      .maybeSingle()
    const order = od as unknown as {
      order_number: string
      customer_snapshot: { name?: string; email?: string } | null
      partner_id: string | null
    } | null
    const email = order?.customer_snapshot?.email
    if (!order || !email) return

    const brand = await brandForOrder(admin, order.partner_id)
    const { data: sh } = await admin
      .from('shipments')
      .select('tracking_code, provider, service_name')
      .eq('order_id', orderId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()
    const ship = sh as {
      tracking_code: string | null
      provider: string | null
      service_name: string | null
    } | null
    const tracking = ship?.tracking_code ?? null
    const carrier = ship?.service_name ?? ship?.provider ?? 'Correios'
    const name = order.customer_snapshot?.name ?? 'cliente'

    const trackingBlock = tracking
      ? `<p style="margin:16px 0 6px;color:#cfcfcf">Transportadora: <strong style="color:#fff">${escapeHtml(carrier)}</strong></p>
         <p style="margin:0 0 14px;color:#cfcfcf">Código de rastreio: <strong style="color:${brand.accent};font-size:18px;letter-spacing:1px">${escapeHtml(tracking)}</strong></p>
         <a href="https://rastreamento.correios.com.br/app/index.php" style="display:inline-block;background:${brand.accent};color:${textOn(brand.accent)};text-decoration:none;padding:11px 20px;border-radius:8px;font-weight:800">Rastrear pedido</a>
         <p style="margin:12px 0 0;color:#9a9a9a;font-size:12px">Cole o código acima na página dos Correios para acompanhar a entrega.</p>`
      : `<p style="margin:16px 0;color:#cfcfcf">Seu pedido foi despachado. Em breve o código de rastreio estará disponível na sua conta.</p>`

    const html = emailShell(
      `<h1 style="margin:0 0 8px;font-size:22px;color:#fff">Seu pedido foi enviado 🚚</h1>
       <p style="margin:0 0 8px;color:#cfcfcf">Olá, <strong style="color:#fff">${escapeHtml(name)}</strong>. O pedido <strong style="color:${brand.accent}">${escapeHtml(order.order_number)}</strong> saiu para entrega.</p>
       ${trackingBlock}`,
      brand,
      `Pedido ${order.order_number} a caminho`,
    )

    await sendEmail({
      to: email,
      from: fromForBrand(brand),
      subject: `Pedido ${order.order_number} enviado — ${brand.name}`,
      html,
    })
  } catch (err) {
    console.error('notifyOrderShipped error', err)
  }
}

/** E-mail "pedido entregue" + marca a entrega no shipment (best-effort). */
export async function notifyOrderDelivered(orderId: string): Promise<void> {
  try {
    const admin = createAdminClient()
    const now = new Date().toISOString()
    await admin
      .from('shipments')
      .update({ status: 'delivered', delivered_at: now, updated_at: now })
      .eq('order_id', orderId)

    if (!isResendConfigured()) return
    const { data: od } = await admin
      .from('orders')
      .select('order_number, customer_snapshot, partner_id')
      .eq('id', orderId)
      .maybeSingle()
    const order = od as unknown as {
      order_number: string
      customer_snapshot: { name?: string; email?: string } | null
      partner_id: string | null
    } | null
    const email = order?.customer_snapshot?.email
    if (!order || !email) return
    const brand = await brandForOrder(admin, order.partner_id)
    const name = order.customer_snapshot?.name ?? 'cliente'

    const html = emailShell(
      `<h1 style="margin:0 0 8px;font-size:22px;color:#3ba55d">Pedido entregue 🎉</h1>
       <p style="margin:0 0 8px;color:#cfcfcf">Olá, <strong style="color:#fff">${escapeHtml(name)}</strong>. O pedido <strong style="color:${brand.accent}">${escapeHtml(order.order_number)}</strong> foi entregue.</p>
       <p style="margin:12px 0 0;color:#9a9a9a;font-size:13px">Esperamos que você aproveite. Qualquer coisa, é só responder este e-mail. Obrigado por comprar na ${escapeHtml(brand.name)}!</p>`,
      brand,
      `Pedido ${order.order_number} entregue`,
    )

    await sendEmail({
      to: email,
      from: fromForBrand(brand),
      subject: `Pedido ${order.order_number} entregue — ${brand.name}`,
      html,
    })
  } catch (err) {
    console.error('notifyOrderDelivered error', err)
  }
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}
