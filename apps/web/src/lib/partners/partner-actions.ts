'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { clientEnv } from '@kickoffstore/validation'
import { createAdminClient } from '@/lib/supabase/admin'
import { getDefaultOrganizationId } from '@/lib/org'
import { requirePermission, getUser } from '@/lib/auth/session'
import { writeAuditLog } from '@/lib/auth/audit'
import type { ActionState } from '@/lib/auth/actions'

export interface OwnerActionState {
  error?: string
  success?: string
  /** Link para o parceiro definir a senha (o admin repassa). */
  inviteLink?: string
}

const slugSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(2, 'Slug muito curto.')
  .max(40, 'Slug muito longo.')
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Use apenas letras minúsculas, números e hífens (ex.: bhwolves).')

const optionalColor = z
  .string()
  .trim()
  .regex(/^#[0-9a-fA-F]{6}$/, 'Cor deve ser hex, ex.: #1e40af.')
  .optional()
  .or(z.literal('').transform(() => undefined))

const optionalUrl = z
  .string()
  .trim()
  .url('URL inválida (use https://...).')
  .optional()
  .or(z.literal('').transform(() => undefined))

const partnerSchema = z.object({
  name: z.string().trim().min(1, 'Informe o nome.').max(120),
  slug: slugSchema,
  primaryColor: optionalColor,
  accentColor: optionalColor,
  contactEmail: z
    .string()
    .trim()
    .email('E-mail inválido.')
    .optional()
    .or(z.literal('').transform(() => undefined)),
  instagram: optionalUrl,
  facebook: optionalUrl,
  youtube: optionalUrl,
})

function parsePartner(formData: FormData) {
  return partnerSchema.safeParse({
    name: formData.get('name'),
    slug: formData.get('slug'),
    primaryColor: formData.get('primaryColor') ?? '',
    accentColor: formData.get('accentColor') ?? '',
    contactEmail: formData.get('contactEmail') ?? '',
    instagram: formData.get('instagram') ?? '',
    facebook: formData.get('facebook') ?? '',
    youtube: formData.get('youtube') ?? '',
  })
}

const LOGO_BUCKET = 'partner-assets'
const ALLOWED_LOGO = ['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml']

/** Sobe um arquivo de um parceiro (logo/banner) para o bucket público. */
async function uploadPartnerAsset(
  admin: ReturnType<typeof createAdminClient>,
  partnerId: string,
  file: File,
  prefix: 'logo' | 'banner',
): Promise<string | null> {
  const maxBytes = prefix === 'banner' ? 6 * 1024 * 1024 : 4 * 1024 * 1024
  if (!ALLOWED_LOGO.includes(file.type) || file.size > maxBytes) return null
  const ext =
    file.type === 'image/svg+xml' ? 'svg' : (file.type.split('/')[1]?.replace('jpeg', 'jpg') ?? 'png')
  const path = `${partnerId}/${prefix}-${crypto.randomUUID()}.${ext}`
  const bytes = await file.arrayBuffer()
  const { error } = await admin.storage
    .from(LOGO_BUCKET)
    .upload(path, bytes, { contentType: file.type, upsert: true })
  if (error) return null
  return admin.storage.from(LOGO_BUCKET).getPublicUrl(path).data.publicUrl
}

export async function createPartnerAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  try {
    await requirePermission('catalog.write')
  } catch {
    return { error: 'Sem permissão.' }
  }
  const parsed = parsePartner(formData)
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Dados inválidos.' }
  const orgId = await getDefaultOrganizationId()
  if (!orgId) return { error: 'Organização não encontrada.' }

  const admin = createAdminClient()
  const p = parsed.data
  const { data, error } = await admin
    .from('partners')
    .insert({
      organization_id: orgId,
      name: p.name,
      slug: p.slug,
      primary_color: p.primaryColor ?? null,
      accent_color: p.accentColor ?? null,
      contact_email: p.contactEmail ?? null,
      instagram_url: p.instagram ?? null,
      facebook_url: p.facebook ?? null,
      youtube_url: p.youtube ?? null,
    })
    .select('id')
    .single()
  if (error || !data) return { error: 'Falha ao criar parceiro (slug já existe?).' }

  const partnerId = (data as { id: string }).id
  const logo = formData.get('logo')
  if (logo instanceof File && logo.size > 0) {
    const url = await uploadPartnerAsset(admin, partnerId, logo, 'logo')
    if (url) await admin.from('partners').update({ logo_url: url }).eq('id', partnerId)
  }
  const banner = formData.get('banner')
  if (banner instanceof File && banner.size > 0) {
    const url = await uploadPartnerAsset(admin, partnerId, banner, 'banner')
    if (url) await admin.from('partners').update({ banner_url: url }).eq('id', partnerId)
  }

  const actor = await getUser()
  await writeAuditLog({
    organizationId: orgId,
    actorUserId: actor?.id ?? null,
    action: 'partners.create',
    entityType: 'partner',
    entityId: (data as { id: string }).id,
    after: { name: p.name, slug: p.slug },
  })

  revalidatePath('/admin/parceiros')
  return { success: `Parceiro “${p.name}” criado.` }
}

export async function updatePartnerAction(
  partnerId: string,
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  try {
    await requirePermission('catalog.write')
  } catch {
    return { error: 'Sem permissão.' }
  }
  if (!partnerId) return { error: 'Parceiro inválido.' }
  const parsed = parsePartner(formData)
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Dados inválidos.' }
  const active = formData.get('active') === 'on'

  const admin = createAdminClient()
  const p = parsed.data
  const { error } = await admin
    .from('partners')
    .update({
      name: p.name,
      slug: p.slug,
      active,
      primary_color: p.primaryColor ?? null,
      accent_color: p.accentColor ?? null,
      contact_email: p.contactEmail ?? null,
      instagram_url: p.instagram ?? null,
      facebook_url: p.facebook ?? null,
      youtube_url: p.youtube ?? null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', partnerId)
  if (error) return { error: 'Falha ao salvar (slug já existe?).' }

  // Novos arquivos (opcionais): se não enviar, mantém os atuais.
  const logo = formData.get('logo')
  if (logo instanceof File && logo.size > 0) {
    const url = await uploadPartnerAsset(admin, partnerId, logo, 'logo')
    if (url) await admin.from('partners').update({ logo_url: url }).eq('id', partnerId)
  }
  const banner = formData.get('banner')
  if (banner instanceof File && banner.size > 0) {
    const url = await uploadPartnerAsset(admin, partnerId, banner, 'banner')
    if (url) await admin.from('partners').update({ banner_url: url }).eq('id', partnerId)
  }

  revalidatePath('/admin/parceiros')
  revalidatePath(`/admin/parceiros/${partnerId}`)
  return { success: 'Parceiro atualizado.' }
}

/** Habilita/desabilita um produto COMPARTILHADO na vitrine de um parceiro. */
export async function toggleSharedProductAction(
  partnerId: string,
  productId: string,
  enabled: boolean,
): Promise<void> {
  await requirePermission('catalog.write')
  if (!partnerId || !productId) return
  const admin = createAdminClient()
  if (enabled) {
    await admin
      .from('partner_products')
      .upsert({ partner_id: partnerId, product_id: productId }, { onConflict: 'partner_id,product_id' })
  } else {
    await admin
      .from('partner_products')
      .delete()
      .eq('partner_id', partnerId)
      .eq('product_id', productId)
  }
  revalidatePath(`/admin/parceiros/${partnerId}`)
}

/** Marca/desmarca um produto numa seção (Destaque/Mais vendido) da vitrine deste parceiro. */
export async function setProductPlacementAction(
  partnerId: string,
  productId: string,
  section: 'destaques' | 'mais_vendidos',
  on: boolean,
): Promise<void> {
  await requirePermission('catalog.write')
  if (!partnerId || !productId) return
  const admin = createAdminClient()
  await admin
    .from('product_placements')
    .delete()
    .eq('product_id', productId)
    .eq('partner_id', partnerId)
    .eq('section', section)
  if (on) {
    // Herda a posição que o produto já tem nesta loja (para as seções ficarem coerentes).
    const { data: existing } = await admin
      .from('product_placements')
      .select('position')
      .eq('product_id', productId)
      .eq('partner_id', partnerId)
      .limit(1)
      .maybeSingle()
    const position = (existing as { position: number } | null)?.position ?? 0
    await admin
      .from('product_placements')
      .insert({ product_id: productId, partner_id: partnerId, section, position })
  }
  revalidatePath(`/admin/parceiros/${partnerId}`)
}

/** Define a posição (ordem) de um produto na vitrine deste parceiro. Menor = primeiro. */
export async function setPlacementPositionAction(
  partnerId: string,
  productId: string,
  position: number,
): Promise<void> {
  await requirePermission('catalog.write')
  if (!partnerId || !productId) return
  const admin = createAdminClient()
  await admin
    .from('product_placements')
    .update({ position: Math.max(0, Math.trunc(Number(position) || 0)) })
    .eq('product_id', productId)
    .eq('partner_id', partnerId)
  revalidatePath(`/admin/parceiros/${partnerId}`)
}

/** Marca ou desmarca TODOS os produtos compartilhados de uma vez. */
export async function setAllSharedProductsAction(
  partnerId: string,
  productIds: string[],
  enabled: boolean,
): Promise<void> {
  await requirePermission('catalog.write')
  if (!partnerId || productIds.length === 0) return
  const admin = createAdminClient()
  if (enabled) {
    await admin.from('partner_products').upsert(
      productIds.map((product_id) => ({ partner_id: partnerId, product_id })),
      { onConflict: 'partner_id,product_id' },
    )
  } else {
    await admin
      .from('partner_products')
      .delete()
      .eq('partner_id', partnerId)
      .in('product_id', productIds)
  }
  revalidatePath(`/admin/parceiros/${partnerId}`)
}

/**
 * Vincula (ou cria) o usuário DONO de um parceiro pelo e-mail e gera um link
 * para ele definir a senha. O admin repassa o link ao parceiro. Não envia e-mail
 * automaticamente (não depende de SMTP): retorna o link para copiar.
 */
export async function setPartnerOwnerAction(
  partnerId: string,
  _prev: OwnerActionState,
  formData: FormData,
): Promise<OwnerActionState> {
  try {
    await requirePermission('catalog.write')
  } catch {
    return { error: 'Sem permissão.' }
  }
  if (!partnerId) return { error: 'Parceiro inválido.' }
  const email = String(formData.get('email') ?? '')
    .trim()
    .toLowerCase()
  const parsed = z.string().email().safeParse(email)
  if (!parsed.success) return { error: 'Informe um e-mail válido.' }

  const admin = createAdminClient()

  // Garante que o usuário existe (sem senha; define depois via link).
  await admin.auth.admin.createUser({ email, email_confirm: true }).catch(() => undefined)

  const redirectTo = `${clientEnv.NEXT_PUBLIC_APP_URL.replace(/\/$/, '')}/redefinir-senha`
  const { data: linkData, error: linkErr } = await admin.auth.admin.generateLink({
    type: 'recovery',
    email,
    options: { redirectTo },
  })
  const userId = linkData?.user?.id
  const actionLink = linkData?.properties?.action_link
  if (linkErr || !userId) {
    return { error: 'Não foi possível localizar/criar o usuário deste e-mail.' }
  }

  const { error: linkRowErr } = await admin
    .from('partner_users')
    .upsert(
      { user_id: userId, partner_id: partnerId, role: 'owner' },
      { onConflict: 'user_id,partner_id' },
    )
  if (linkRowErr) return { error: 'Falha ao vincular o dono ao parceiro.' }

  revalidatePath(`/admin/parceiros/${partnerId}`)
  return {
    success: `Dono vinculado: ${email}.`,
    inviteLink: actionLink ?? undefined,
  }
}

/** Marca/desmarca um produto como EXCLUSIVO de um parceiro (products.partner_id). */
export async function setExclusiveProductAction(
  partnerId: string,
  productId: string,
  exclusive: boolean,
): Promise<void> {
  await requirePermission('catalog.write')
  if (!productId) return
  const admin = createAdminClient()
  await admin
    .from('products')
    .update({ partner_id: exclusive ? partnerId : null })
    .eq('id', productId)
  revalidatePath(`/admin/parceiros/${partnerId}`)
  revalidatePath('/admin/produtos')
}
