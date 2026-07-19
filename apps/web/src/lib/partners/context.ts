import 'server-only'
import { headers } from 'next/headers'
import { cache } from 'react'
import { createClient } from '@/lib/supabase/server'

export interface ActivePartner {
  id: string
  name: string
  slug: string
  logoUrl: string | null
  bannerUrl: string | null
  primaryColor: string | null
  accentColor: string | null
  tagline: string | null
  instagram: string | null
  facebook: string | null
  youtube: string | null
}

const ROOT_DOMAIN = 'kickoffstore.com.br'
const RESERVED = new Set(['www', 'admin', 'app', 'api', 'loja'])

/** Extrai o slug do parceiro a partir do host (subdomínio). Null = loja principal. */
export function partnerSlugFromHost(hostRaw: string | null): string | null {
  if (!hostRaw) return null
  const host = (hostRaw.split(':')[0] ?? '').trim().toLowerCase()
  let sub: string | null = null
  if (host.endsWith('.' + ROOT_DOMAIN)) {
    sub = host.slice(0, host.length - (ROOT_DOMAIN.length + 1))
  } else if (host.endsWith('.localhost')) {
    sub = host.slice(0, host.length - '.localhost'.length)
  } else {
    return null // domínio raiz, vercel.app, previews → loja principal
  }
  const label = (sub ?? '').split('.')[0]
  if (!label || RESERVED.has(label)) return null
  return label
}

/** Parceiro ativo da requisição atual (pelo subdomínio). Cacheado por request. */
export const getActivePartner = cache(async (): Promise<ActivePartner | null> => {
  const h = headers()
  const slug = partnerSlugFromHost(h.get('x-forwarded-host') ?? h.get('host'))
  if (!slug) return null

  const supabase = createClient()
  const { data } = await supabase
    .from('partners')
    .select(
      'id, name, slug, logo_url, banner_url, primary_color, accent_color, tagline, instagram_url, facebook_url, youtube_url',
    )
    .eq('slug', slug)
    .eq('active', true)
    .maybeSingle()
  if (!data) return null
  const p = data as unknown as {
    id: string
    name: string
    slug: string
    logo_url: string | null
    banner_url: string | null
    primary_color: string | null
    accent_color: string | null
    tagline: string | null
    instagram_url: string | null
    facebook_url: string | null
    youtube_url: string | null
  }
  return {
    id: p.id,
    name: p.name,
    slug: p.slug,
    logoUrl: p.logo_url,
    bannerUrl: p.banner_url,
    primaryColor: p.primary_color,
    accentColor: p.accent_color,
    tagline: p.tagline,
    instagram: p.instagram_url,
    facebook: p.facebook_url,
    youtube: p.youtube_url,
  }
})

/** Ids de produtos compartilhados habilitados para um parceiro (cacheado por request). */
export const partnerSharedProductIds = cache(async (partnerId: string): Promise<string[]> => {
  const supabase = createClient()
  const { data } = await supabase
    .from('partner_products')
    .select('product_id')
    .eq('partner_id', partnerId)
  return ((data ?? []) as unknown as Array<{ product_id: string }>).map((r) => r.product_id)
})
