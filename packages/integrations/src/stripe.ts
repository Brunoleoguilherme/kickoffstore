// ════════════════════════════════════════════════════════════════
//  Kickoffstore — Cliente Stripe (REST API via fetch, sem SDK)
//  Portado do projeto BFWC. Mantém zero dependências: usa apenas
//  `fetch` (nativo no runtime Node do Next) e o módulo `crypto`.
//
//  Variáveis de ambiente:
//    STRIPE_SECRET_KEY            = sk_live_... | sk_test_...
//    STRIPE_WEBHOOK_SECRET        = whsec_...
//    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY = pk_...  (apenas front-end)
// ════════════════════════════════════════════════════════════════
import { createHmac, timingSafeEqual } from 'crypto'

const STRIPE_API = 'https://api.stripe.com/v1'

/** Valor primitivo aceito num formulário Stripe. */
type FormPrimitive = string | number | boolean
/** Estrutura arbitrária (aninhada) aceita por `encodeForm`. */
export type StripeParams = {
  [key: string]: FormPrimitive | StripeParams | Array<FormPrimitive | StripeParams> | undefined | null
}

function secretKey(): string {
  const k = process.env.STRIPE_SECRET_KEY
  if (!k) throw new Error('STRIPE_SECRET_KEY ausente no ambiente')
  return k
}

/**
 * Codifica um objeto (com aninhamento) no formato form-urlencoded que a Stripe espera.
 * Ex: { line_items: [{ price_data: { currency: 'brl' } }] }
 *   → line_items[0][price_data][currency]=brl
 */
export function encodeForm(obj: StripeParams, prefix = '', out: string[] = []): string[] {
  for (const [key, value] of Object.entries(obj)) {
    if (value === undefined || value === null) continue
    const k = prefix ? `${prefix}[${key}]` : key
    if (Array.isArray(value)) {
      value.forEach((item, i) => {
        if (item !== null && typeof item === 'object') {
          encodeForm(item as StripeParams, `${k}[${i}]`, out)
        } else {
          out.push(`${encodeURIComponent(`${k}[${i}]`)}=${encodeURIComponent(String(item))}`)
        }
      })
    } else if (typeof value === 'object') {
      encodeForm(value, k, out)
    } else {
      out.push(`${encodeURIComponent(k)}=${encodeURIComponent(String(value))}`)
    }
  }
  return out
}

async function stripeRequest<T = Record<string, unknown>>(path: string, params: StripeParams): Promise<T> {
  const res = await fetch(`${STRIPE_API}${path}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${secretKey()}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: encodeForm(params).join('&'),
  })
  const data = (await res.json()) as { error?: { message?: string } } & T
  if (!res.ok) {
    const msg = data?.error?.message ?? `Stripe API error (${res.status})`
    throw new Error(msg)
  }
  return data
}

async function stripeGet<T = Record<string, unknown>>(path: string): Promise<T> {
  const res = await fetch(`${STRIPE_API}${path}`, {
    method: 'GET',
    headers: { Authorization: `Bearer ${secretKey()}` },
  })
  const data = (await res.json()) as { error?: { message?: string } } & T
  if (!res.ok) {
    const msg = data?.error?.message ?? `Stripe API error (${res.status})`
    throw new Error(msg)
  }
  return data
}

export interface StripeCheckoutSession {
  id: string
  url: string | null
  payment_status?: string
  payment_intent?: string | null
  amount_total?: number | null
  customer_email?: string | null
  client_reference_id?: string | null
  metadata?: Record<string, string>
  [key: string]: unknown
}

/** Cria uma Checkout Session hospedada (cartão de crédito). */
export function createCheckoutSession(params: StripeParams): Promise<StripeCheckoutSession> {
  return stripeRequest<StripeCheckoutSession>('/checkout/sessions', params)
}

/** Consulta uma Checkout Session (para confirmar status do pagamento). */
export function retrieveCheckoutSession(id: string): Promise<StripeCheckoutSession> {
  return stripeGet<StripeCheckoutSession>(`/checkout/sessions/${encodeURIComponent(id)}`)
}

export interface StripeRefund {
  id: string
  status?: string
  amount?: number
  [key: string]: unknown
}

/** Cria um estorno (refund) para um PaymentIntent. amountCents opcional = estorno total. */
export function createRefund(paymentIntent: string, amountCents?: number): Promise<StripeRefund> {
  const params: StripeParams = { payment_intent: paymentIntent }
  if (typeof amountCents === 'number' && amountCents > 0) params.amount = amountCents
  return stripeRequest<StripeRefund>('/refunds', params)
}

/**
 * Estorna um pagamento a partir do id da Checkout Session:
 * busca a sessão, extrai o payment_intent e cria o refund.
 */
export async function refundCheckoutSession(
  sessionId: string,
  amountCents?: number,
): Promise<StripeRefund> {
  const session = await retrieveCheckoutSession(sessionId)
  const pi = session.payment_intent
  if (!pi || typeof pi !== 'string') {
    throw new Error('Sessão sem payment_intent — não é possível estornar automaticamente.')
  }
  return createRefund(pi, amountCents)
}

export interface StripeEvent {
  id: string
  type: string
  data: { object: Record<string, unknown> }
  [key: string]: unknown
}

/**
 * Verifica a assinatura de um webhook da Stripe (mesmo algoritmo do BFWC).
 * @param payload      corpo bruto (string) da requisição
 * @param sigHeader    valor do header `stripe-signature`
 * @param secret       o webhook signing secret (whsec_...)
 * @param toleranceSec janela de tolerância (default 5 min)
 * @returns o evento JSON, se válido. Lança erro caso contrário.
 */
export function constructWebhookEvent(
  payload: string,
  sigHeader: string | null,
  secret: string | undefined,
  toleranceSec = 300,
): StripeEvent {
  if (!sigHeader) throw new Error('Header stripe-signature ausente')
  if (!secret) throw new Error('STRIPE_WEBHOOK_SECRET ausente no ambiente')

  const parts = Object.fromEntries(
    sigHeader.split(',').map((p) => p.split('=').map((s) => s.trim())),
  ) as Record<string, string>
  const timestamp = parts.t
  const signature = parts.v1
  if (!timestamp || !signature) throw new Error('Assinatura malformada')

  const expected = createHmac('sha256', secret)
    .update(`${timestamp}.${payload}`, 'utf8')
    .digest('hex')

  const a = Buffer.from(expected, 'hex')
  const b = Buffer.from(signature, 'hex')
  if (a.length !== b.length || !timingSafeEqual(a, b)) {
    throw new Error('Assinatura do webhook inválida')
  }

  const ageSec = Math.floor(Date.now() / 1000) - Number(timestamp)
  if (Math.abs(ageSec) > toleranceSec) {
    throw new Error('Timestamp do webhook fora da janela de tolerância')
  }

  return JSON.parse(payload) as StripeEvent
}
