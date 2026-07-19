import 'server-only'
import { createClient } from '@/lib/supabase/server'
import { getActivePartner, partnerSharedProductIds } from '@/lib/partners/context'
import type { ProductDetail, ProductSummary, ProductVariantPublic } from './models'

interface RawVariant {
  id: string
  sku: string
  name: string | null
  color: string | null
  size: string | null
  price_cents: number
  compare_at_price_cents: number | null
  active: boolean
}

interface RawImage {
  storage_path: string
  alt_text: string
  is_primary: boolean
  sort_order: number
}

interface RawProduct {
  id: string
  name: string
  slug: string
  short_description: string | null
  description: string | null
  seo_title: string | null
  seo_description: string | null
  partner_id: string | null
  brands: { name: string } | null
  product_variants: RawVariant[]
  product_images: RawImage[]
}

function toSummary(p: RawProduct): ProductSummary {
  const active = p.product_variants.filter((v) => v.active)
  const prices = active.map((v) => v.price_cents)
  const primary = p.product_images.find((i) => i.is_primary) ?? p.product_images[0]
  return {
    id: p.id,
    name: p.name,
    slug: p.slug,
    shortDescription: p.short_description,
    brandName: p.brands?.name ?? null,
    priceFromCents: prices.length ? Math.min(...prices) : 0,
    compareAtCents: active[0]?.compare_at_price_cents ?? null,
    imagePath: primary?.storage_path ?? null,
    imageAlt: primary?.alt_text ?? p.name,
  }
}

const PRODUCT_SELECT =
  'id, name, slug, short_description, description, seo_title, seo_description, partner_id, brands(name), product_variants(id, sku, name, color, size, price_cents, compare_at_price_cents, active), product_images(storage_path, alt_text, is_primary, sort_order)'

/**
 * Regra de visibilidade por vitrine:
 *  - Loja principal (sem parceiro): só produtos SEM dono (partner_id null).
 *  - Vitrine de parceiro: exclusivos dele (partner_id = parceiro) OU compartilhados habilitados.
 */
async function visibleToRequest(p: { id: string; partner_id: string | null }): Promise<boolean> {
  const partner = await getActivePartner()
  if (!partner) return p.partner_id === null
  if (p.partner_id === partner.id) return true
  if (p.partner_id !== null) return false
  const shared = await partnerSharedProductIds(partner.id)
  return shared.includes(p.id)
}

/** Search active products via the FTS/trigram RPC, then hydrate details. */
export async function searchProducts(query: string, limit = 24, offset = 0): Promise<ProductSummary[]> {
  const supabase = createClient()
  const { data, error } = await supabase.rpc('search_products', {
    q: query,
    limit_count: limit,
    offset_count: offset,
  })
  if (error || !data) return []
  const ids = (data as Array<{ id: string }>).map((r) => r.id)
  if (ids.length === 0) return []

  const { data: full } = await supabase.from('products').select(PRODUCT_SELECT).in('id', ids)
  const rows = (full ?? []) as unknown as RawProduct[]
  // Filtra pela vitrine (parceiro ou loja principal).
  const visible: RawProduct[] = []
  for (const r of rows) {
    if (await visibleToRequest(r)) visible.push(r)
  }
  // Preserve RPC ranking order.
  const byId = new Map(visible.map((r) => [r.id, r]))
  return ids.map((id) => byId.get(id)).filter((r): r is RawProduct => Boolean(r)).map(toSummary)
}

/** List active products (default catalog view), scoped to the current storefront. */
export async function listActiveProducts(limit = 24): Promise<ProductSummary[]> {
  const supabase = createClient()
  const partner = await getActivePartner()

  let query = supabase.from('products').select(PRODUCT_SELECT).eq('status', 'active')
  if (partner) {
    const shared = await partnerSharedProductIds(partner.id)
    const orParts = [`partner_id.eq.${partner.id}`]
    if (shared.length > 0) orParts.push(`id.in.(${shared.join(',')})`)
    query = query.or(orParts.join(','))
  } else {
    query = query.is('partner_id', null)
  }

  const { data } = await query.order('published_at', { ascending: false }).limit(limit)
  const rows = (data ?? []) as unknown as RawProduct[]
  return rows.map(toSummary)
}

export async function getProductBySlug(slug: string): Promise<ProductDetail | null> {
  const supabase = createClient()
  const { data } = await supabase
    .from('products')
    .select(PRODUCT_SELECT)
    .eq('slug', slug)
    .eq('status', 'active')
    .maybeSingle()
  if (!data) return null
  const p = data as unknown as RawProduct
  // Não vaza produto de outra vitrine: só mostra se pertence à loja atual.
  if (!(await visibleToRequest(p))) return null

  const variants: ProductVariantPublic[] = p.product_variants
    .filter((v) => v.active)
    .map((v) => ({
      id: v.id,
      sku: v.sku,
      name: v.name,
      color: v.color,
      size: v.size,
      priceCents: v.price_cents,
      compareAtCents: v.compare_at_price_cents,
    }))

  const summary = toSummary(p)
  return {
    ...summary,
    description: p.description,
    seoTitle: p.seo_title,
    seoDescription: p.seo_description,
    variants,
    images: p.product_images
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((i) => ({ path: i.storage_path, alt: i.alt_text, isPrimary: i.is_primary })),
  }
}
