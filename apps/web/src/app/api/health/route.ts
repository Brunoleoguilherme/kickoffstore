import { NextResponse } from 'next/server'
import { isSupabaseConfigured } from '@clubedaestampa/validation'

export const dynamic = 'force-dynamic'

/** Liveness/readiness probe. Never leaks secrets — only booleans. */
export function GET() {
  return NextResponse.json({
    data: {
      status: 'ok',
      service: 'clubedaestampa-web',
      supabaseConfigured: isSupabaseConfigured(),
      timestamp: new Date().toISOString(),
    },
    error: null,
    meta: { requestId: crypto.randomUUID() },
  })
}
