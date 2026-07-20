'use server'

import { revalidatePath } from 'next/cache'
import { productSchema, publishProductSchema, catalogCsvRowSchema } from '@clubedaestampa/validation'
import { createAdminClient } from '@/lib/supabase/admin'
import { requirePermission, getUser } from '@/lib/auth/session'
import { getDefaultOrganizationId } from '@/lib/org'
import { writeAuditLog } from '@/lib/auth/audit'
import type { ActionState } from '@/lib/auth/actions'

/** Create a product with a single initial variant (admin, catalog.write). */
export async function createProductAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  try {
    await requirePermission('catalog.write')
  } catch {
    return { error: 'Sem permissão para editar o catálogo.' }
  }

  const status = String(formData.get('status') ?? 'draft')
  const input = {
    name: formData.get('name'),
    slug: formData.get('slug'),
    shortDescription: formData.get('shortDescription') || undefined,
    description: formData.get('description') || undefined,
    status,
    variants: [
      {
        sku: formData.get('sku'),
        priceCents: Number(formData.get('priceCents') ?? 0),
        costCents: Number(formData.get('costCents') ?? 0),
        color: formData.get('color') || undefined,
        size: formData.get('size') || undefined,
      },
    ],
  }

  const schema = status === 'active' ? publishProductSchema : productSchema
  const parsed = schema.safeParse(input)
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Dados inválidos' }

  const orgId = await getDefaultOrganizationId()
  if (!orgId) return { error: 'Nenhuma organização encontrada. Rode o seed do Supabase.' }

  const admin = createAdminClient()
  const p = parsed.data
  const { data: product, error: prodErr } = await admin
    .from('products')
    .insert({
      organization_id: orgId,
      name: p.name,
      slug: p.slug,
      short_description: p.shortDescription ?? null,
      description: p.description ?? null,
      status: p.status,
      published_at: p.status === 'active' ? new Date().toISOString() : null,
    })
    .select('id')
    .single()

  if (prodErr || !product) {
    return { error: 'Falha ao criar produto (slug já existe?).' }
  }

  const productId = (product as { id: string }).id
  const v = p.variants[0]!
  const { error: varErr } = await admin.from('product_variants').insert({
    product_id: productId,
    sku: v.sku,
    price_cents: v.priceCents,
    cost_cents: v.costCents ?? 0,
    color: v.color ?? null,
    size: v.size ?? null,
  })
  if (varErr) return { error: 'Produto criado, mas houve erro ao criar a variação (SKU duplicado?).' }

  const actor = await getUser()
  await writeAuditLog({
    organizationId: orgId,
    actorUserId: actor?.id ?? null,
    action: 'catalog.product.create',
    entityType: 'product',
    entityId: productId,
    after: { name: p.name, slug: p.slug, status: p.status },
  })

  revalidatePath('/admin/produtos')
  return { success: `Produto “${p.name}” criado.` }
}

interface CsvResult extends ActionState {
  imported?: number
  rowErrors?: Array<{ line: number; message: string }>
}

/** Minimal CSV parser (no quoted-comma support). Header row required. */
function parseCsv(text: string): Record<string, string>[] {
  const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0)
  if (lines.length < 2) return []
  const headers = lines[0]!.split(',').map((h) => h.trim())
  return lines.slice(1).map((line) => {
    const cells = line.split(',')
    const row: Record<string, string> = {}
    headers.forEach((h, i) => {
      row[h] = (cells[i] ?? '').trim()
    })
    return row
  })
}

/**
 * Import products from a CSV string. Validates each row with Zod, then inserts.
 * NOTE: uses a naive parser; swap for papaparse once deps are installed.
 */
export async function importCatalogCsvAction(_prev: CsvResult, formData: FormData): Promise<CsvResult> {
  try {
    await requirePermission('catalog.write')
  } catch {
    return { error: 'Sem permissão para importar catálogo.' }
  }

  const raw = String(formData.get('csv') ?? '')
  const rows = parseCsv(raw)
  if (rows.length === 0) return { error: 'CSV vazio ou sem linhas de dados.' }

  const orgId = await getDefaultOrganizationId()
  if (!orgId) return { error: 'Nenhuma organização encontrada.' }

  const admin = createAdminClient()
  const rowErrors: Array<{ line: number; message: string }> = []
  let imported = 0

  for (let i = 0; i < rows.length; i++) {
    const parsed = catalogCsvRowSchema.safeParse(rows[i])
    if (!parsed.success) {
      rowErrors.push({ line: i + 2, message: parsed.error.issues[0]?.message ?? 'linha inválida' })
      continue
    }
    const r = parsed.data
    // Upsert product by slug.
    const { data: existing } = await admin
      .from('products')
      .select('id')
      .eq('organization_id', orgId)
      .eq('slug', r.product_slug)
      .maybeSingle()

    let productId = (existing as { id: string } | null)?.id
    if (!productId) {
      const { data: created, error } = await admin
        .from('products')
        .insert({ organization_id: orgId, name: r.product_name, slug: r.product_slug, status: 'draft' })
        .select('id')
        .single()
      if (error || !created) {
        rowErrors.push({ line: i + 2, message: 'falha ao criar produto' })
        continue
      }
      productId = (created as { id: string }).id
    }

    const { error: vErr } = await admin.from('product_variants').insert({
      product_id: productId,
      sku: r.sku,
      ean: r.ean || null,
      color: r.color || null,
      size: r.size || null,
      price_cents: r.price_cents,
      cost_cents: r.cost_cents,
      ncm: r.ncm || null,
    })
    if (vErr) {
      rowErrors.push({ line: i + 2, message: `SKU ${r.sku}: duplicado ou inválido` })
      continue
    }
    imported++
  }

  revalidatePath('/admin/produtos')
  return {
    success: `${imported} variação(ões) importada(s). ${rowErrors.length} erro(s).`,
    imported,
    rowErrors,
  }
}
