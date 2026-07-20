import { NextResponse } from 'next/server'
import { registerEndpoint } from '@clubedaestampa/integrations'
import { isCoraConfigured, clientEnv } from '@clubedaestampa/validation'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * Registra (uma vez) o endpoint de webhook do Pix (Cora) apontando para
 * /api/payments/pix/webhook. Protegido por token = WEBHOOK_INTERNAL_SECRET.
 *
 * Uso após o deploy:
 *   GET https://SEU_DOMINIO/api/admin/cora/register-webhook?token=SEU_WEBHOOK_INTERNAL_SECRET
 */
export async function GET(req: Request) {
  const token = new URL(req.url).searchParams.get('token')
  const secret = process.env.WEBHOOK_INTERNAL_SECRET
  if (!secret || token !== secret) {
    return NextResponse.json({ ok: false, message: 'Não autorizado.' }, { status: 401 })
  }
  if (!isCoraConfigured()) {
    return NextResponse.json(
      { ok: false, message: 'Credenciais da Cora ausentes no ambiente.' },
      { status: 400 },
    )
  }

  const base = (process.env.NEXT_PUBLIC_APP_URL || clientEnv.NEXT_PUBLIC_APP_URL).replace(/\/$/, '')
  const url = `${base}/api/payments/pix/webhook`
  try {
    const endpoint = await registerEndpoint({ url, resource: 'invoice', trigger: 'paid' })
    return NextResponse.json({ ok: true, url, endpoint })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Falha ao registrar o webhook na Cora.'
    return NextResponse.json({ ok: false, message }, { status: 500 })
  }
}
