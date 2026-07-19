/**
 * Eventos de e-commerce disparados no cliente para GA4 (gtag) e Meta Pixel (fbq).
 * Seguros: se o pixel/GA não estiver carregado (env não configurada), viram no-op.
 * Nomes seguem o padrão de cada plataforma (GA4 snake_case / Meta CamelCase).
 */

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void
    fbq?: (...args: unknown[]) => void
    dataLayer?: unknown[]
  }
}

type Params = Record<string, unknown>

function ga(name: string, params: Params): void {
  if (typeof window !== 'undefined' && typeof window.gtag === 'function') {
    window.gtag('event', name, params)
  }
}

function fb(name: string, params: Params): void {
  if (typeof window !== 'undefined' && typeof window.fbq === 'function') {
    window.fbq('track', name, params)
  }
}

export function trackViewItem(p: { id: string; name: string; priceCents: number }): void {
  const value = p.priceCents / 100
  ga('view_item', {
    currency: 'BRL',
    value,
    items: [{ item_id: p.id, item_name: p.name, price: value }],
  })
  fb('ViewContent', {
    content_ids: [p.id],
    content_name: p.name,
    content_type: 'product',
    value,
    currency: 'BRL',
  })
}

export function trackAddToCart(p: {
  id: string
  name: string
  priceCents: number
  quantity: number
}): void {
  const value = (p.priceCents * p.quantity) / 100
  ga('add_to_cart', {
    currency: 'BRL',
    value,
    items: [{ item_id: p.id, item_name: p.name, price: p.priceCents / 100, quantity: p.quantity }],
  })
  fb('AddToCart', {
    content_ids: [p.id],
    content_name: p.name,
    content_type: 'product',
    value,
    currency: 'BRL',
  })
}

export function trackBeginCheckout(p: { valueCents: number }): void {
  const value = p.valueCents / 100
  ga('begin_checkout', { currency: 'BRL', value })
  fb('InitiateCheckout', { value, currency: 'BRL' })
}

export function trackPurchase(p: { orderId: string; valueCents: number }): void {
  const value = p.valueCents / 100
  ga('purchase', { transaction_id: p.orderId, currency: 'BRL', value })
  fb('Purchase', { value, currency: 'BRL' })
}
