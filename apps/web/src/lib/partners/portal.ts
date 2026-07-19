import 'server-only'
import { redirect } from 'next/navigation'
import { getUser } from '@/lib/auth/session'
import { createAdminClient } from '@/lib/supabase/admin'

export interface PartnerOwnerContext {
  userId: string
  partnerId: string
}

/** Contexto do dono de parceiro logado (ou null). */
export async function getCurrentPartnerOwner(): Promise<PartnerOwnerContext | null> {
  const user = await getUser()
  if (!user) return null
  const admin = createAdminClient()
  const { data } = await admin
    .from('partner_users')
    .select('partner_id')
    .eq('user_id', user.id)
    .limit(1)
    .maybeSingle()
  const partnerId = (data as { partner_id: string } | null)?.partner_id
  if (!partnerId) return null
  return { userId: user.id, partnerId }
}

/** Exige um dono de parceiro logado; senão manda para o login do portal. */
export async function requirePartnerOwner(): Promise<PartnerOwnerContext> {
  const ctx = await getCurrentPartnerOwner()
  if (!ctx) redirect('/parceiro/login')
  return ctx
}
