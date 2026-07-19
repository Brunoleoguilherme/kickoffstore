import 'server-only'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@kickoffstore/types'
import { getServerEnv } from '@kickoffstore/validation'

/**
 * Service-role client. BYPASSES RLS — use only in trusted server code
 * (webhooks, cron, privileged admin actions). NEVER import from client code.
 */
export function createAdminClient() {
  const env = getServerEnv()
  return createSupabaseClient<Database>(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}
