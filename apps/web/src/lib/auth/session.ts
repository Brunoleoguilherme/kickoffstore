import 'server-only'
import { redirect } from 'next/navigation'
import type { User } from '@supabase/supabase-js'
import type { PermissionCode } from '@kickoffstore/types'
import { createClient } from '@/lib/supabase/server'

/** Returns the current user or null. */
export async function getUser(): Promise<User | null> {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  return user
}

/** Requires an authenticated user; redirects to /entrar otherwise. */
export async function requireUser(redirectTo = '/entrar'): Promise<User> {
  const user = await getUser()
  if (!user) redirect(redirectTo)
  return user
}

/**
 * Returns the set of permission codes granted to the current user.
 * Authorization is resolved in the DATABASE, never trusting the UI (CLAUDE.md).
 */
export async function getUserPermissions(): Promise<Set<string>> {
  const supabase = createClient()
  const { data, error } = await supabase.rpc('current_user_permissions')
  if (error || !data) return new Set()
  const codes = (data as Array<{ code: string }>).map((r) => r.code)
  return new Set(codes)
}

export async function hasPermission(code: PermissionCode): Promise<boolean> {
  const perms = await getUserPermissions()
  return perms.has(code)
}

/**
 * Requires a specific permission. Redirects unauthenticated users to login and
 * throws a 403-style error for authenticated-but-unauthorized users.
 */
export async function requirePermission(code: PermissionCode): Promise<User> {
  const user = await requireUser()
  const ok = await hasPermission(code)
  if (!ok) {
    throw new Error(`FORBIDDEN: permissão "${code}" necessária.`)
  }
  return user
}

/** True if the user holds any staff permission (used to gate /admin). */
export async function isStaff(): Promise<boolean> {
  const perms = await getUserPermissions()
  return perms.size > 0
}
