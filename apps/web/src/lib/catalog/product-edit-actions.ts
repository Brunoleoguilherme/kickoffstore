'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'
import { productStatusSchema } from '@kickoffstore/validation'
import { createAdminClient } from '@/lib/supabase/admin'
import { requirePermission, getUser } from '@/lib/auth/session'
import { writeAuditLog } from '@/lib/auth/audit'
import type { ActionState } from '@/lib/auth/actions'

const BUCKET = 'product-images'
const MAX_BYTES = 8 * 1024 * 1024
const ALLOWED = ['image/jpeg', 'image/png', 'image/webp', 'image/avif']

/** Aceita um UUID ou string vazia (→ null). */
const optionalId = z
  .string()
  .uuid()
  .optional()
  .or(z.literal('').transform(() => undefined))

const SECTIONS = ['destaques', 'mais_vendidos'] as const

const updateSchema = z.object({
  name: z.string().min(1).max(200),
  shortDescription: z.string().max(400).optional(),
  description: z.string().max(20000).optional(),
  status: productStatusSchema,
  categoryId: optionalId,
  brandId: optionalId,
  sportId: optionalId,
  showInMain: z.boolean().default(false),
  sections: z.array(z.enum(SECTIONS)).default([]),
  partners: z.array(z.string().uuid()).default([]),
})

/** Update a product's basic fields (admin, catalog.write). */
export async function updateProductAction(
  productId: string,
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  try {
    await requirePermission('catalog.write')
  } catch {
    return { error: 'Sem permissão para editar o catálogo.' }
  }

  const parsed = updateSchema.safeParse({
    name: formData.get('name'),
    shortDescription: formData.get('shortDescription') || undefined,
    description: formData.get('description') || undefined,
    status: formData.get('status'),
    categoryId: formData.get('categoryId') ?? '',
    brandId: formData.get('brandId') ?? '',
    sportId: formData.get('sportId') ?? '',
    showInMain: formData.get('showInMain') === '1',
    sections: formData.getAll('sections').map(String),
    partners: formData.getAll('partners').map(String),
  })
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Dados inválidos' }

  const admin = createAdminClient()
  const p = parsed.data
  const { error } = await admin
    .from('products')
    .update({
      name: p.name,
      short_description: p.shortDescription ?? null,
      description: p.description ?? null,
      status: p.status,
      primary_category_id: p.categoryId ?? null,
      brand_id: p.brandId ?? null,
      sport_id: p.sportId ?? null,
      show_in_main: p.showInMain,
      home_sections: p.sections,
      published_at: p.status === 'active' ? new Date().toISOString() : null,
    })
    .eq('id', productId)
  if (error) return { error: 'Falha ao atualizar o produto.' }

  // Sincroniza em quais lojas de parceiro o produto aparece.
  await admin.from('partner_products').delete().eq('product_id', productId)
  if (p.partners.length > 0) {
    await admin
      .from('partner_products')
      .insert(p.partners.map((partnerId) => ({ partner_id: partnerId, product_id: productId })))
  }

  // Seções da LOJA PRINCIPAL (placements com partner_id null). As seções por
  // parceiro são geridas na tela do parceiro.
  await admin.from('product_placements').delete().eq('product_id', productId).is('partner_id', null)
  if (p.sections.length > 0) {
    await admin
      .from('product_placements')
      .insert(p.sections.map((section) => ({ product_id: productId, partner_id: null, section })))
  }

  const actor = await getUser()
  await writeAuditLog({
    actorUserId: actor?.id ?? null,
    action: 'catalog.product.update',
    entityType: 'product',
    entityId: productId,
    after: { name: p.name, status: p.status },
  })

  revalidatePath(`/admin/produtos/${productId}/editar`)
  revalidatePath('/admin/produtos')
  revalidatePath('/produtos')
  revalidatePath('/')
  return { success: 'Produto atualizado.' }
}

const dimsSchema = z.object({
  weightGrams: z.coerce.number().min(0).max(1_000_000),
  widthCm: z.coerce.number().min(0).max(1000),
  heightCm: z.coerce.number().min(0).max(1000),
  lengthCm: z.coerce.number().min(0).max(1000),
})

/**
 * Salva peso e dimensões (cm) de UMA variação. Usado para alimentar o
 * cálculo de frete (Melhor Envio). Requer catalog.write.
 */
export async function updateVariantDimensionsAction(
  variantId: string,
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  try {
    await requirePermission('catalog.write')
  } catch {
    return { error: 'Sem permissão para editar o catálogo.' }
  }
  if (!variantId) return { error: 'Variação inválida.' }

  const parsed = dimsSchema.safeParse({
    weightGrams: formData.get('weightGrams') ?? 0,
    widthCm: formData.get('widthCm') ?? 0,
    heightCm: formData.get('heightCm') ?? 0,
    lengthCm: formData.get('lengthCm') ?? 0,
  })
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Dados inválidos.' }
  const d = parsed.data

  const admin = createAdminClient()
  const { error } = await admin
    .from('product_variants')
    .update({
      weight_grams: Math.round(d.weightGrams),
      width_cm: d.widthCm,
      height_cm: d.heightCm,
      length_cm: d.lengthCm,
    })
    .eq('id', variantId)
  if (error) return { error: 'Falha ao salvar as medidas.' }

  const { data: v } = await admin
    .from('product_variants')
    .select('product_id')
    .eq('id', variantId)
    .maybeSingle()
  const productId = (v as { product_id: string } | null)?.product_id
  if (productId) revalidatePath(`/admin/produtos/${productId}/editar`)
  return { success: 'Medidas salvas.' }
}

/** Quickly change publication status (Publicar / Despublicar). */
export async function setProductStatusAction(
  productId: string,
  status: 'draft' | 'active' | 'archived',
): Promise<void> {
  await requirePermission('catalog.write')
  const admin = createAdminClient()
  await admin
    .from('products')
    .update({
      status,
      published_at: status === 'active' ? new Date().toISOString() : null,
    })
    .eq('id', productId)

  const actor = await getUser()
  await writeAuditLog({
    actorUserId: actor?.id ?? null,
    action: `catalog.product.status.${status}`,
    entityType: 'product',
    entityId: productId,
    after: { status },
  })

  revalidatePath(`/admin/produtos/${productId}/editar`)
  revalidatePath('/admin/produtos')
  revalidatePath('/produtos')
}

/**
 * Delete a product. If it has sales history (order items), it is ARCHIVED
 * instead of physically deleted (CLAUDE.md: pedidos/histórico não são apagados).
 * Redirects to the product list afterwards.
 */
export async function deleteProductAction(productId: string): Promise<void> {
  await requirePermission('catalog.write')
  const admin = createAdminClient()
  const actor = await getUser()

  const { data: vars } = await admin.from('product_variants').select('id').eq('product_id', productId)
  const variantIds = ((vars ?? []) as Array<{ id: string }>).map((v) => v.id)

  let hasSales = false
  if (variantIds.length > 0) {
    const { count } = await admin
      .from('order_items')
      .select('id', { count: 'exact', head: true })
      .in('variant_id', variantIds)
    hasSales = (count ?? 0) > 0
  }

  if (hasSales) {
    await admin.from('products').update({ status: 'archived', published_at: null }).eq('id', productId)
    await writeAuditLog({
      actorUserId: actor?.id ?? null,
      action: 'catalog.product.archive',
      entityType: 'product',
      entityId: productId,
      after: { reason: 'has_sales_history' },
    })
  } else {
    const { data: imgs } = await admin
      .from('product_images')
      .select('storage_path')
      .eq('product_id', productId)
    const paths = ((imgs ?? []) as Array<{ storage_path: string }>)
      .map((i) => i.storage_path)
      .filter((p) => !p.startsWith('http'))
    if (paths.length > 0) await admin.storage.from(BUCKET).remove(paths)

    await admin.from('products').delete().eq('id', productId)
    await writeAuditLog({
      actorUserId: actor?.id ?? null,
      action: 'catalog.product.delete',
      entityType: 'product',
      entityId: productId,
    })
  }

  revalidatePath('/admin/produtos')
  revalidatePath('/produtos')
  redirect('/admin/produtos')
}

/** Upload a real product image to Storage and link it (admin, catalog.write). */
export async function uploadProductImageAction(
  productId: string,
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  try {
    await requirePermission('catalog.write')
  } catch {
    return { error: 'Sem permissão para editar o catálogo.' }
  }

  const file = formData.get('file')
  if (!(file instanceof File) || file.size === 0) return { error: 'Selecione uma imagem.' }
  if (!ALLOWED.includes(file.type)) return { error: 'Formato inválido (use JPG, PNG, WEBP ou AVIF).' }
  if (file.size > MAX_BYTES) return { error: 'Imagem muito grande (máx. 8 MB).' }

  const altText = String(formData.get('altText') || '').trim()
  const admin = createAdminClient()

  const ext = file.type.split('/')[1]?.replace('jpeg', 'jpg') ?? 'jpg'
  const objectPath = `${productId}/${crypto.randomUUID()}.${ext}`
  const bytes = await file.arrayBuffer()

  const { error: upErr } = await admin.storage
    .from(BUCKET)
    .upload(objectPath, bytes, { contentType: file.type, upsert: false })
  if (upErr) return { error: 'Falha ao enviar a imagem para o Storage.' }

  const { count } = await admin
    .from('product_images')
    .select('id', { count: 'exact', head: true })
    .eq('product_id', productId)
    .eq('is_primary', true)

  const { error: rowErr } = await admin.from('product_images').insert({
    product_id: productId,
    storage_path: objectPath,
    alt_text: altText || 'Imagem do produto',
    is_primary: (count ?? 0) === 0,
    sort_order: 0,
  })
  if (rowErr) return { error: 'Imagem enviada, mas falhou ao vincular ao produto.' }

  revalidatePath(`/admin/produtos/${productId}/editar`)
  revalidatePath('/produtos')
  return { success: 'Imagem enviada com sucesso.' }
}

/** Delete a product image (Storage object if applicable + row). */
export async function deleteProductImageAction(imageId: string): Promise<void> {
  await requirePermission('catalog.write')
  const admin = createAdminClient()
  const { data } = await admin
    .from('product_images')
    .select('id, product_id, storage_path')
    .eq('id', imageId)
    .maybeSingle()
  const img = data as { id: string; product_id: string; storage_path: string } | null
  if (!img) return

  if (!img.storage_path.startsWith('http')) {
    await admin.storage.from(BUCKET).remove([img.storage_path])
  }
  await admin.from('product_images').delete().eq('id', imageId)

  revalidatePath(`/admin/produtos/${img.product_id}/editar`)
  revalidatePath('/produtos')
}

/** Set an image as the product's primary image. */
export async function setPrimaryImageAction(imageId: string): Promise<void> {
  await requirePermission('catalog.write')
  const admin = createAdminClient()
  const { data } = await admin
    .from('product_images')
    .select('id, product_id')
    .eq('id', imageId)
    .maybeSingle()
  const img = data as { id: string; product_id: string } | null
  if (!img) return

  await admin.from('product_images').update({ is_primary: false }).eq('product_id', img.product_id)
  await admin.from('product_images').update({ is_primary: true }).eq('id', imageId)

  revalidatePath(`/admin/produtos/${img.product_id}/editar`)
  revalidatePath('/produtos')
}
