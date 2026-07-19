import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'
import type { Database } from '@kickoffstore/types'
import { clientEnv } from '@kickoffstore/validation'

/**
 * Server Supabase client bound to the request cookies. Uses the anon key and
 * respects RLS as the logged-in user. Call inside Server Components / Actions.
 *
 * Usa apenas as chaves PÚBLICAS (URL + anon) — o storefront público não deve
 * depender do segredo SUPABASE_SERVICE_ROLE_KEY (esse só é exigido pelo
 * cliente admin/service role em createAdminClient).
 */
export function createClient() {
  const url = clientEnv.NEXT_PUBLIC_SUPABASE_URL
  const anon = clientEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !anon) {
    throw new Error(
      'Supabase não configurado. Defina NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY.',
    )
  }
  const cookieStore = cookies()

  return createServerClient<Database>(
    url,
    anon,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            for (const { name, value, options } of cookiesToSet) {
              cookieStore.set(name, value, options)
            }
          } catch {
            // Called from a Server Component where cookies are read-only.
            // Session refresh is handled by middleware instead.
          }
        },
      },
    },
  )
}
