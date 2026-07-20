'use server'

import { revalidatePath } from 'next/cache'
import { categorySchema, brandSchema } from '@clubedaestampa/validation'
import { createAdminClient } from '@/lib/supabase/admin'
import { requirePermission, getUser } from '@/lib/auth/session'
import { getDefaultOrganizationId } from '@/lib/org'
import { writeAuditLog } from '@/lib/auth/audit'
import type { ActionState } from '@/lib/auth/actions'

/** Create a category (admin, catalog.write). */
export async function createCategoryAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  try {
    await requirePermission('catalog.write')
  } catch {
    return { error: 'Sem permissão para editar o catálogo.' }
  }

  const parsed = categorySchema.safeParse({
    name: formData.get('name'),
    slug: formData.get('slug'),
    description: formData.get('description') || undefined,
    sortOrder: Number(formData.get('sortOrder') ?? 0),
  })
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Dados inválidos' }

  const orgId = await getDefaultOrganizationId()
  if (!orgId) return { error: 'Nenhuma organização encontrada.' }

  const admin = createAdminClient()
  const c = parsed.data
  const { data, error } = await admin
    .from('categories')
    .insert({
      organization_id: orgId,
      name: c.name,
      slug: c.slug,
      description: c.description ?? null,
      sort_order: c.sortOrder,
      active: c.active,
    })
    .select('id')
    .single()
  if (error || !data) return { error: 'Falha ao criar categoria (slug já existe?).' }

  const actor = await getUser()
  await writeAuditLog({
    organizationId: orgId,
    actorUserId: actor?.id ?? null,
    action: 'catalog.category.create',
    entityType: 'category',
    entityId: (data as { id: string }).id,
    after: { name: c.name, slug: c.slug },
  })

  revalidatePath('/admin/categorias')
  return { success: `Categoria “${c.name}” criada.` }
}

/** Create a brand (admin, catalog.write). */
export async function createBrandAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  try {
    await requirePermission('catalog.write')
  } catch {
    return { error: 'Sem permissão para editar o catálogo.' }
  }

  const parsed = brandSchema.safeParse({
    name: formData.get('name'),
    slug: formData.get('slug'),
  })
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Dados inválidos' }

  const orgId = await getDefaultOrganizationId()
  if (!orgId) return { error: 'Nenhuma organização encontrada.' }

  const admin = createAdminClient()
  const b = parsed.data
  const { data, error } = await admin
    .from('brands')
    .insert({ organization_id: orgId, name: b.name, slug: b.slug, active: b.active })
    .select('id')
    .single()
  if (error || !data) return { error: 'Falha ao criar marca (slug já existe?).' }

  const actor = await getUser()
  await writeAuditLog({
    organizationId: orgId,
    actorUserId: actor?.id ?? null,
    action: 'catalog.brand.create',
    entityType: 'brand',
    entityId: (data as { id: string }).id,
    after: { name: b.name, slug: b.slug },
  })

  revalidatePath('/admin/marcas')
  return { success: `Marca “${b.name}” criada.` }
}
