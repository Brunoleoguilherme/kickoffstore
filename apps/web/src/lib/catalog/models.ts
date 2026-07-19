import type { Cents } from '@kickoffstore/types'

/** Public-facing product summary (no cost, no supplier data). */
export interface ProductSummary {
  id: string
  name: string
  slug: string
  shortDescription: string | null
  brandName: string | null
  priceFromCents: Cents
  compareAtCents: Cents | null
  imagePath: string | null
  imageAlt: string | null
}

export interface ProductVariantPublic {
  id: string
  sku: string
  name: string | null
  color: string | null
  size: string | null
  priceCents: Cents
  compareAtCents: Cents | null
}

export interface ProductDetail extends Omit<ProductSummary, 'priceFromCents'> {
  description: string | null
  seoTitle: string | null
  seoDescription: string | null
  variants: ProductVariantPublic[]
  images: Array<{ path: string; alt: string; isPrimary: boolean }>
}
