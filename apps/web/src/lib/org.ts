import 'server-only'
import { createAdminClient } from '@/lib/supabase/admin'

let cached: string | null = null

/** Resolve the default organization id (single-tenant MVP). */
export async function getDefaultOrganizationId(): Promise<string | null> {
  if (cached) return cached
  const admin = createAdminClient()
  const { data } = await admin
    .from('organizations')
    .select('id')
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle()
  cached = (data as { id: string } | null)?.id ?? null
  return cached
}
