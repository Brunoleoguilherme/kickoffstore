'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requirePartnerOwner } from '@/lib/partners/portal'
import type { ActionState } from '@/lib/auth/actions'

const LOGO_BUCKET = 'partner-assets'
const MAX_LOGO_BYTES = 4 * 1024 * 1024
const ALLOWED_LOGO = ['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml']

/** Login do portal do parceiro (separado do admin/staff). */
export async function partnerSignInAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const email = String(formData.get('email') ?? '').trim().toLowerCase()
  const password = String(formData.get('password') ?? '')
  if (!email || !password) return { error: 'Informe e-mail e senha.' }

  const supabase = createClient()
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  if (error || !data.user) return { error: 'E-mail ou senha inválidos.' }

  const admin = createAdminClient()
  const { data: link } = await admin
    .from('partner_users')
    .select('partner_id')
    .eq('user_id', data.user.id)
    .limit(1)
    .maybeSingle()
  if (!link) {
    await supabase.auth.signOut()
    return { error: 'Esta conta não está vinculada a nenhuma loja de parceiro.' }
  }

  revalidatePath('/', 'layout')
  redirect('/parceiro/painel')
}

export async function partnerSignOutAction(): Promise<void> {
  const supabase = createClient()
  await supabase.auth.signOut()
  revalidatePath('/', 'layout')
  redirect('/parceiro/login')
}

const customizeSchema = z.object({
  name: z.string().trim().min(1, 'Informe o nome da loja.').max(120),
  tagline: z.string().trim().max(160).optional().or(z.literal('').transform(() => undefined)),
  primaryColor: z
    .string()
    .trim()
    .regex(/^#[0-9a-fA-F]{6}$/, 'Cor primária deve ser hex (ex.: #1e40af).')
    .optional()
    .or(z.literal('').transform(() => undefined)),
  accentColor: z
    .string()
    .trim()
    .regex(/^#[0-9a-fA-F]{6}$/, 'Cor de destaque deve ser hex (ex.: #f59e0b).')
    .optional()
    .or(z.literal('').transform(() => undefined)),
  contactEmail: z
    .string()
    .trim()
    .email('E-mail inválido.')
    .optional()
    .or(z.literal('').transform(() => undefined)),
  instagram: z.string().trim().url().optional().or(z.literal('').transform(() => undefined)),
  facebook: z.string().trim().url().optional().or(z.literal('').transform(() => undefined)),
  youtube: z.string().trim().url().optional().or(z.literal('').transform(() => undefined)),
})

/** O próprio parceiro atualiza a personalização da loja dele. */
export async function updateOwnPartnerAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const ctx = await requirePartnerOwner()
  const parsed = customizeSchema.safeParse({
    name: formData.get('name'),
    tagline: formData.get('tagline') ?? '',
    primaryColor: formData.get('primaryColor') ?? '',
    accentColor: formData.get('accentColor') ?? '',
    contactEmail: formData.get('contactEmail') ?? '',
    instagram: formData.get('instagram') ?? '',
    facebook: formData.get('facebook') ?? '',
    youtube: formData.get('youtube') ?? '',
  })
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Dados inválidos.' }
  const p = parsed.data

  const admin = createAdminClient()
  const { error } = await admin
    .from('partners')
    .update({
      name: p.name,
      tagline: p.tagline ?? null,
      primary_color: p.primaryColor ?? null,
      accent_color: p.accentColor ?? null,
      contact_email: p.contactEmail ?? null,
      instagram_url: p.instagram ?? null,
      facebook_url: p.facebook ?? null,
      youtube_url: p.youtube ?? null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', ctx.partnerId)
  if (error) return { error: 'Falha ao salvar as alterações.' }

  revalidatePath('/parceiro/painel')
  return { success: 'Loja atualizada com sucesso.' }
}

/** Upload do logo da loja pelo próprio parceiro (bucket público). */
export async function uploadPartnerLogoAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const ctx = await requirePartnerOwner()
  const file = formData.get('logo')
  if (!(file instanceof File) || file.size === 0) return { error: 'Selecione um arquivo de logo.' }
  if (!ALLOWED_LOGO.includes(file.type)) {
    return { error: 'Formato inválido (use PNG, JPG, WEBP ou SVG).' }
  }
  if (file.size > MAX_LOGO_BYTES) return { error: 'Logo muito grande (máx. 4 MB).' }

  const admin = createAdminClient()
  const ext =
    file.type === 'image/svg+xml'
      ? 'svg'
      : (file.type.split('/')[1]?.replace('jpeg', 'jpg') ?? 'png')
  const objectPath = `${ctx.partnerId}/logo-${crypto.randomUUID()}.${ext}`
  const bytes = await file.arrayBuffer()

  const { error: upErr } = await admin.storage
    .from(LOGO_BUCKET)
    .upload(objectPath, bytes, { contentType: file.type, upsert: true })
  if (upErr) return { error: 'Falha ao enviar o logo.' }

  const publicUrl = admin.storage.from(LOGO_BUCKET).getPublicUrl(objectPath).data.publicUrl
  const { error: rowErr } = await admin
    .from('partners')
    .update({ logo_url: publicUrl, updated_at: new Date().toISOString() })
    .eq('id', ctx.partnerId)
  if (rowErr) return { error: 'Logo enviado, mas falhou ao salvar no perfil.' }

  revalidatePath('/parceiro/painel')
  return { success: 'Logo atualizado.' }
}

/** Upload do banner (hero) da loja pelo próprio parceiro. */
export async function uploadPartnerBannerAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const ctx = await requirePartnerOwner()
  const file = formData.get('banner')
  if (!(file instanceof File) || file.size === 0) return { error: 'Selecione uma imagem de banner.' }
  if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) {
    return { error: 'Formato inválido (use PNG, JPG ou WEBP).' }
  }
  if (file.size > 6 * 1024 * 1024) return { error: 'Banner muito grande (máx. 6 MB).' }

  const admin = createAdminClient()
  const ext = file.type.split('/')[1]?.replace('jpeg', 'jpg') ?? 'jpg'
  const objectPath = `${ctx.partnerId}/banner-${crypto.randomUUID()}.${ext}`
  const bytes = await file.arrayBuffer()

  const { error: upErr } = await admin.storage
    .from(LOGO_BUCKET)
    .upload(objectPath, bytes, { contentType: file.type, upsert: true })
  if (upErr) return { error: 'Falha ao enviar o banner.' }

  const publicUrl = admin.storage.from(LOGO_BUCKET).getPublicUrl(objectPath).data.publicUrl
  const { error: rowErr } = await admin
    .from('partners')
    .update({ banner_url: publicUrl, updated_at: new Date().toISOString() })
    .eq('id', ctx.partnerId)
  if (rowErr) return { error: 'Banner enviado, mas falhou ao salvar no perfil.' }

  revalidatePath('/parceiro/painel')
  return { success: 'Banner atualizado.' }
}
