import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import type { Database } from '@kickoffstore/types'
import { clientEnv } from '@kickoffstore/validation'

/** Refreshes the Supabase session cookie on each request (SSR requirement). */
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request })

  const url = clientEnv.NEXT_PUBLIC_SUPABASE_URL
  const anon = clientEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !anon) return response // Supabase not configured yet; skip.

  const supabase = createServerClient<Database>(url, anon, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet) {
        for (const { name, value } of cookiesToSet) request.cookies.set(name, value)
        response = NextResponse.next({ request })
        for (const { name, value, options } of cookiesToSet) response.cookies.set(name, value, options)
      },
    },
  })

  await supabase.auth.getUser()
  return response
}
