import { z } from 'zod'
import { centsSchema, eanSchema, skuSchema, slugSchema } from './primitives'

export const productStatusSchema = z.enum(['draft', 'active', 'archived'])
export const genderSchema = z.enum(['male', 'female', 'unisex', 'kids'])

export const sportSchema = z.object({
  name: z.string().min(1).max(120),
  slug: slugSchema,
  active: z.boolean().default(true),
  sortOrder: z.number().int().default(0),
})

export const categorySchema = z.object({
  name: z.string().min(1).max(160),
  slug: slugSchema,
  parentId: z.string().uuid().nullable().optional(),
  description: z.string().max(2000).optional(),
  active: z.boolean().default(true),
  sortOrder: z.number().int().default(0),
})

export const brandSchema = z.object({
  name: z.string().min(1).max(160),
  slug: slugSchema,
  active: z.boolean().default(true),
})

export const productVariantSchema = z.object({
  sku: skuSchema,
  ean: eanSchema.nullable().optional(),
  name: z.string().max(160).optional(),
  color: z.string().max(80).optional(),
  size: z.string().max(40).optional(),
  costCents: centsSchema.default(0),
  priceCents: centsSchema,
  compareAtPriceCents: centsSchema.nullable().optional(),
  weightGrams: z.number().int().nonnegative().default(0),
  lengthCm: z.number().nonnegative().default(0),
  widthCm: z.number().nonnegative().default(0),
  heightCm: z.number().nonnegative().default(0),
  ncm: z.string().max(10).optional(),
  cest: z.string().max(10).optional(),
  fiscalOrigin: z.string().max(2).optional(),
  active: z.boolean().default(true),
})

export const productSchema = z.object({
  name: z.string().min(1).max(200),
  slug: slugSchema,
  brandId: z.string().uuid().nullable().optional(),
  primaryCategoryId: z.string().uuid().nullable().optional(),
  sportId: z.string().uuid().nullable().optional(),
  shortDescription: z.string().max(400).optional(),
  description: z.string().max(20000).optional(),
  status: productStatusSchema.default('draft'),
  gender: genderSchema.optional(),
  seoTitle: z.string().max(200).optional(),
  seoDescription: z.string().max(400).optional(),
  variants: z.array(productVariantSchema).min(1, 'Cadastre ao menos uma variação'),
})

/** Fields required before a product may be published (docs/07-operacao.md). */
export const publishProductSchema = productSchema.extend({
  status: z.literal('active'),
  variants: z
    .array(productVariantSchema.extend({ priceCents: centsSchema.positive('Preço deve ser maior que zero') }))
    .min(1),
})

export type ProductInput = z.infer<typeof productSchema>
export type ProductVariantInput = z.infer<typeof productVariantSchema>

/** One row of the catalog CSV import. */
export const catalogCsvRowSchema = z.object({
  product_name: z.string().min(1),
  product_slug: slugSchema,
  sku: skuSchema,
  ean: z.string().optional(),
  color: z.string().optional(),
  size: z.string().optional(),
  price_cents: z.coerce.number().int().nonnegative(),
  cost_cents: z.coerce.number().int().nonnegative().default(0),
  ncm: z.string().optional(),
})

export type CatalogCsvRow = z.infer<typeof catalogCsvRowSchema>
