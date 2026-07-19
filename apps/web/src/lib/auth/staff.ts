'use server'

import { revalidatePath } from 'next/cache'
import { staffInviteSchema, clientEnv } from '@kickoffstore/validation'
import { createAdminClient } from '@/lib/supabase/admin'
import { requirePermission, getUser } from '@/lib/auth/session'
import { writeAuditLog } from '@/lib/auth/audit'
import type { ActionState } from '@/lib/auth/actions'

/**
 * Invite a staff member and assign a system role. Requires users.manage.
 * Staff join by invite only (never open sign-up) — see docs/05-seguranca-lgpd.md.
 */
export async function inviteStaffAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  try {
    await requirePermission('users.manage')
  } catch {
    return { error: 'Você não tem permissão para convidar usuários.' }
  }

  const parsed = staffInviteSchema.safeParse({
    email: formData.get('email'),
    fullName: formData.get('fullName'),
    roleCode: formData.get('roleCode'),
  })
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Dados inválidos' }

  const admin = createAdminClient()
  const actor = await getUser()

  const { data: invited, error: inviteError } = await admin.auth.admin.inviteUserByEmail(
    parsed.data.email,
    {
      data: { full_name: parsed.data.fullName },
      redirectTo: `${clientEnv.NEXT_PUBLIC_APP_URL}/redefinir-senha`,
    },
  )
  if (inviteError || !invited?.user) {
    return { error: 'Não foi possível enviar o convite. Verifique o e-mail.' }
  }

  const { data: role } = await admin
    .from('roles')
    .select('id')
    .eq('code', parsed.data.roleCode)
    .eq('is_system', true)
    .maybeSingle()

  if (!role) return { error: 'Perfil (role) inválido.' }

  const { error: roleError } = await admin
    .from('user_roles')
    .insert({ user_id: invited.user.id, role_id: (role as { id: string }).id })
  if (roleError) return { error: 'Convite enviado, mas houve falha ao atribuir o perfil.' }

  await writeAuditLog({
    actorUserId: actor?.id ?? null,
    action: 'staff.invite',
    entityType: 'user',
    entityId: invited.user.id,
    after: { email: parsed.data.email, roleCode: parsed.data.roleCode },
  })

  revalidatePath('/admin/usuarios')
  return { success: `Convite enviado para ${parsed.data.email}.` }
}
