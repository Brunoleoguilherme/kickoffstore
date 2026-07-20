'use client'

import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@clubedaestampa/types'
import { clientEnv } from '@clubedaestampa/validation'

/** Browser Supabase client (anon key only — never service role). */
export function createClient() {
  const url = clientEnv.NEXT_PUBLIC_SUPABASE_URL
  const anon = clientEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !anon) {
    throw new Error('Supabase não configurado. Defina NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY.')
  }
  return createBrowserClient<Database>(url, anon)
}
