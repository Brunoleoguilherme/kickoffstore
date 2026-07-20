// ════════════════════════════════════════════════════════════════
//  Clube da Estampa — Cliente Cora (Pix via Integração Direta, mTLS)
//  Portado do projeto BFWC. A Cora autentica com certificado +
//  private key (mutual TLS). Usamos o módulo nativo `https` do Node.
//
//  Variáveis de ambiente necessárias:
//    CORA_ENV            = "stage" | "production"   (default: stage)
//    CORA_CLIENT_ID      = seu client_id da Cora
//    CORA_CERT_BASE64    = conteúdo do certificate.pem em base64
//    CORA_KEY_BASE64     = conteúdo da private-key.key em base64
// ════════════════════════════════════════════════════════════════
import https from 'https'
import { randomUUID } from 'crypto'

function bases(): { api: string } {
  const env = (process.env.CORA_ENV || 'stage').toLowerCase()
  return env === 'production'
    ? { api: 'matls-clients.api.cora.com.br' }
    : { api: 'matls-clients.api.stage.cora.com.br' }
}

function credentials(): { clientId: string; cert: string; key: string } {
  const clientId = process.env.CORA_CLIENT_ID
  const certB64 = process.env.CORA_CERT_BASE64
  const keyB64 = process.env.CORA_KEY_BASE64
  if (!clientId || !certB64 || !keyB64) {
    throw new Error(
      'Credenciais Cora ausentes (CORA_CLIENT_ID / CORA_CERT_BASE64 / CORA_KEY_BASE64)',
    )
  }
  return {
    clientId,
    cert: Buffer.from(certB64, 'base64').toString('utf8'),
    key: Buffer.from(keyB64, 'base64').toString('utf8'),
  }
}

interface MtlsResponse {
  status: number
  json: Record<string, unknown> | null
  raw: string
}

interface MtlsRequestOptions {
  hostname: string
  path: string
  method?: string
  headers?: Record<string, string | number>
  body?: string | null
}

/** Faz uma requisição HTTPS com mTLS (cert+key do cliente). */
function mtlsRequest({
  hostname,
  path,
  method = 'GET',
  headers = {},
  body = null,
}: MtlsRequestOptions): Promise<MtlsResponse> {
  const { cert, key } = credentials()
  return new Promise((resolve, reject) => {
    const req = https.request(
      { hostname, path, method, headers, cert, key, port: 443 },
      (res) => {
        let data = ''
        res.on('data', (c) => (data += c))
        res.on('end', () => {
          let json: Record<string, unknown> | null = null
          try {
            json = data ? (JSON.parse(data) as Record<string, unknown>) : null
          } catch {
            /* não-JSON */
          }
          resolve({ status: res.statusCode ?? 0, json, raw: data })
        })
      },
    )
    req.on('error', reject)
    if (body) req.write(body)
    req.end()
  })
}

// Cache simples do token em memória (válido por ~24h)
let _tokenCache: { token: string | null; expiresAt: number } = { token: null, expiresAt: 0 }

/** Obtém (ou reutiliza) um access token via client_credentials + mTLS. */
export async function getCoraToken(): Promise<string> {
  const now = Date.now()
  if (_tokenCache.token && now < _tokenCache.expiresAt - 60_000) {
    return _tokenCache.token
  }
  const { api } = bases()
  const { clientId } = credentials()
  const form = `grant_type=client_credentials&client_id=${encodeURIComponent(clientId)}`

  const res = await mtlsRequest({
    hostname: api,
    path: '/token',
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Content-Length': Buffer.byteLength(form),
    },
    body: form,
  })

  const accessToken = res.json?.access_token as string | undefined
  if (res.status !== 200 || !accessToken) {
    throw new Error(`Falha ao autenticar na Cora (${res.status}): ${res.raw?.slice(0, 200)}`)
  }
  const expiresIn = (res.json?.expires_in as number | undefined) ?? 86400
  _tokenCache = { token: accessToken, expiresAt: now + expiresIn * 1000 }
  return accessToken
}

export interface CoraCustomer {
  name: string
  email: string
  document: { identity: string; type: 'CPF' | 'CNPJ' }
}

export interface CreatePixChargeInput {
  /** id do recurso no seu sistema (ex: `${orderId}`) */
  code: string
  customer: CoraCustomer
  /** valor total em centavos */
  amountCents: number
  /** descrição do serviço */
  serviceName: string
  /** 'YYYY-MM-DD' */
  dueDate: string
}

export interface PixCharge {
  id: string
  status: string
  emv: string
  qrcodeUrl: string
  raw: Record<string, unknown>
}

/** Cria uma cobrança Pix (QR Code) na Cora. */
export async function createPixCharge({
  code,
  customer,
  amountCents,
  serviceName,
  dueDate,
}: CreatePixChargeInput): Promise<PixCharge> {
  const token = await getCoraToken()
  const { api } = bases()

  const payload = JSON.stringify({
    code,
    customer,
    services: [{ name: serviceName, amount: amountCents }],
    payment_terms: { due_date: dueDate },
    payment_forms: ['PIX'],
  })

  const res = await mtlsRequest({
    hostname: api,
    path: '/v2/invoices',
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      'Idempotency-Key': randomUUID(),
      'Content-Length': Buffer.byteLength(payload),
    },
    body: payload,
  })

  const id = res.json?.id as string | undefined
  if (res.status >= 300 || !id) {
    throw new Error(`Falha ao criar cobrança Pix na Cora (${res.status}): ${res.raw?.slice(0, 300)}`)
  }
  const pix = (res.json?.pix as { emv?: string; qrcode?: string } | undefined) ?? {}
  return {
    id,
    status: (res.json?.status as string | undefined) ?? 'pending',
    emv: pix.emv ?? '',
    qrcodeUrl: pix.qrcode ?? '',
    raw: res.json ?? {},
  }
}

export interface CoraEndpoint {
  id: string
  url: string
  resource: string
  trigger: string
  active?: boolean
  [key: string]: unknown
}

/** Registra um endpoint de webhook na Cora. */
export async function registerEndpoint({
  url,
  resource = 'invoice',
  trigger = 'paid',
}: {
  url: string
  resource?: string
  trigger?: string
}): Promise<CoraEndpoint> {
  const token = await getCoraToken()
  const { api } = bases()
  const payload = JSON.stringify({ url, resource, trigger })
  const res = await mtlsRequest({
    hostname: api,
    path: '/endpoints',
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      'Idempotency-Key': randomUUID(),
      'Content-Length': Buffer.byteLength(payload),
    },
    body: payload,
  })
  const id = res.json?.id as string | undefined
  if (res.status >= 300 || !id) {
    throw new Error(`Falha ao registrar webhook na Cora (${res.status}): ${res.raw?.slice(0, 300)}`)
  }
  return res.json as unknown as CoraEndpoint
}

/** Consulta os detalhes de uma cobrança/invoice na Cora (para confirmar pagamento). */
export async function getInvoice(invoiceId: string): Promise<Record<string, unknown>> {
  const token = await getCoraToken()
  const { api } = bases()
  const res = await mtlsRequest({
    hostname: api,
    path: `/v2/invoices/${encodeURIComponent(invoiceId)}`,
    method: 'GET',
    headers: { Authorization: `Bearer ${token}` },
  })
  if (res.status >= 300 || !res.json) {
    throw new Error(`Falha ao consultar invoice Cora (${res.status})`)
  }
  return res.json
}
