// ════════════════════════════════════════════════════════════════
//  Kickoffstore — Cliente Melhor Envio (cálculo de frete)
//  REST API v2 via fetch, sem SDK. Zero dependências extras.
//
//  Variáveis de ambiente:
//    MELHOR_ENVIO_TOKEN     = token Bearer (OAuth) da conta.
//    MELHOR_ENVIO_FROM_CEP  = CEP de origem (de onde os pedidos saem).
//    MELHOR_ENVIO_SANDBOX   = "true" para usar o ambiente de testes.
//    MELHOR_ENVIO_USER_AGENT= (opcional) "Kickoffstore (contato@dominio)".
//
//  Sem MELHOR_ENVIO_TOKEN + MELHOR_ENVIO_FROM_CEP, `isMelhorEnvioConfigured()`
//  retorna false e o checkout segue sem cálculo de frete (comportamento atual).
// ════════════════════════════════════════════════════════════════

const SANDBOX_BASE = 'https://sandbox.melhorenvio.com.br'
const PROD_BASE = 'https://melhorenvio.com.br'

/** Dimensões mínimas (cm) e peso mínimo (kg) aceitos pelos Correios. */
const MIN_WIDTH_CM = 11
const MIN_HEIGHT_CM = 2
const MIN_LENGTH_CM = 16
const MIN_WEIGHT_KG = 0.1

export interface MelhorEnvioProduct {
  /** Identificador do item (id da variação). */
  id: string
  width: number
  height: number
  length: number
  /** Peso em quilos. */
  weight: number
  /** Valor segurado, em reais (preço do item). */
  insuranceValue: number
  quantity: number
}

export interface ShippingQuote {
  /** Id do serviço no Melhor Envio (usado depois para gerar a etiqueta). */
  serviceId: number
  name: string
  company: string
  /** Preço final em centavos. */
  priceCents: number
  /** Prazo estimado de entrega, em dias úteis. */
  deliveryDays: number
}

export function isMelhorEnvioConfigured(): boolean {
  return Boolean(process.env.MELHOR_ENVIO_TOKEN && process.env.MELHOR_ENVIO_FROM_CEP)
}

function baseUrl(): string {
  return process.env.MELHOR_ENVIO_SANDBOX === 'true' ? SANDBOX_BASE : PROD_BASE
}

function onlyDigits(s: string): string {
  return (s ?? '').replace(/\D/g, '')
}

/** Ajusta cada produto para respeitar os mínimos dos Correios. */
function normalizeProduct(p: MelhorEnvioProduct): MelhorEnvioProduct {
  return {
    id: p.id,
    width: Math.max(MIN_WIDTH_CM, Number(p.width) || 0),
    height: Math.max(MIN_HEIGHT_CM, Number(p.height) || 0),
    length: Math.max(MIN_LENGTH_CM, Number(p.length) || 0),
    weight: Math.max(MIN_WEIGHT_KG, Number(p.weight) || 0),
    insuranceValue: Math.max(0, Number(p.insuranceValue) || 0),
    quantity: Math.max(1, Math.floor(Number(p.quantity) || 1)),
  }
}

interface RawQuote {
  id?: number
  name?: string
  price?: string | number
  custom_price?: string | number
  delivery_time?: number
  custom_delivery_time?: number
  company?: { name?: string } | string
  error?: string
}

/**
 * Cota o frete para um destino a partir da lista de produtos do carrinho.
 * Retorna apenas os serviços válidos (sem `error`), ordenados por preço.
 * Lança erro se a integração não estiver configurada ou a API falhar.
 */
export async function calculateShipping(params: {
  toPostalCode: string
  products: MelhorEnvioProduct[]
}): Promise<ShippingQuote[]> {
  const token = process.env.MELHOR_ENVIO_TOKEN
  const fromCep = process.env.MELHOR_ENVIO_FROM_CEP
  if (!token || !fromCep) {
    throw new Error('Melhor Envio não configurado (MELHOR_ENVIO_TOKEN / MELHOR_ENVIO_FROM_CEP).')
  }
  const to = onlyDigits(params.toPostalCode)
  if (to.length !== 8) throw new Error('CEP de destino inválido.')
  if (params.products.length === 0) throw new Error('Carrinho vazio.')

  const userAgent =
    process.env.MELHOR_ENVIO_USER_AGENT ?? 'Kickoffstore (contato@kickoffstore.com.br)'

  const body = {
    from: { postal_code: onlyDigits(fromCep) },
    to: { postal_code: to },
    products: params.products.map(normalizeProduct).map((p) => ({
      id: p.id,
      width: p.width,
      height: p.height,
      length: p.length,
      weight: p.weight,
      insurance_value: p.insuranceValue,
      quantity: p.quantity,
    })),
  }

  const res = await fetch(`${baseUrl()}/api/v2/me/shipment/calculate`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
      'User-Agent': userAgent,
    },
    body: JSON.stringify(body),
    cache: 'no-store',
  })

  const data = (await res.json()) as RawQuote[] | { message?: string; error?: string }

  if (!res.ok || !Array.isArray(data)) {
    const msg =
      (!Array.isArray(data) && (data.message || data.error)) ||
      `Falha ao cotar frete (HTTP ${res.status}).`
    throw new Error(String(msg))
  }

  return data
    .filter((q) => !q.error && q.id != null && (q.price ?? q.custom_price) != null)
    .map((q) => {
      const priceReais = Number(q.custom_price ?? q.price ?? 0)
      const company = typeof q.company === 'string' ? q.company : (q.company?.name ?? '')
      return {
        serviceId: Number(q.id),
        name: String(q.name ?? ''),
        company,
        priceCents: Math.round(priceReais * 100),
        deliveryDays: Number(q.custom_delivery_time ?? q.delivery_time ?? 0),
      }
    })
    .sort((a, b) => a.priceCents - b.priceCents)
}

// ════════════════════════════════════════════════════════════════
//  Compra de frete + etiqueta (carrinho → checkout → gerar → imprimir)
//  ATENÇÃO: `checkout` debita o SALDO da conta Melhor Envio (gasta dinheiro).
//  Só deve ser chamado por ação explícita do administrador.
//
//  Remetente (from) vem do ambiente — MELHOR_ENVIO_FROM_*:
//    _NAME _PHONE _EMAIL _DOCUMENT(CPF) _COMPANY_DOCUMENT(CNPJ)
//    _STATE_REGISTER(IE) _ADDRESS _NUMBER _COMPLEMENT _DISTRICT
//    _CITY _STATE_ABBR(UF) _CEP
// ════════════════════════════════════════════════════════════════

export interface LabelRecipient {
  name: string
  email: string
  phone?: string
  document: string
  address: string
  complement?: string
  number: string
  district?: string
  city: string
  stateAbbr: string
  postalCode: string
}

export interface LabelProduct {
  name: string
  quantity: number
  /** Valor unitário em reais. */
  unitaryValue: number
}

export interface LabelVolume {
  height: number
  width: number
  length: number
  /** Peso em quilos. */
  weight: number
}

export interface BoughtLabel {
  melhorEnvioId: string
  trackingCode: string
  labelUrl: string
}

function senderFromEnv(): Record<string, string> {
  const e = process.env
  const req: Record<string, string | undefined> = {
    name: e.MELHOR_ENVIO_FROM_NAME,
    phone: e.MELHOR_ENVIO_FROM_PHONE,
    email: e.MELHOR_ENVIO_FROM_EMAIL,
    address: e.MELHOR_ENVIO_FROM_ADDRESS,
    number: e.MELHOR_ENVIO_FROM_NUMBER,
    city: e.MELHOR_ENVIO_FROM_CITY,
    state_abbr: e.MELHOR_ENVIO_FROM_STATE_ABBR,
    postal_code: e.MELHOR_ENVIO_FROM_CEP,
  }
  const missing = Object.entries(req)
    .filter(([, v]) => !v)
    .map(([k]) => `MELHOR_ENVIO_FROM_${k.toUpperCase()}`)
  if (missing.length > 0) {
    throw new Error(`Remetente incompleto no ambiente: faltando ${missing.join(', ')}.`)
  }
  return {
    name: req.name!,
    phone: req.phone!,
    email: req.email!,
    document: e.MELHOR_ENVIO_FROM_DOCUMENT ?? '',
    company_document: e.MELHOR_ENVIO_FROM_COMPANY_DOCUMENT ?? '',
    state_register: e.MELHOR_ENVIO_FROM_STATE_REGISTER ?? '',
    address: req.address!,
    complement: e.MELHOR_ENVIO_FROM_COMPLEMENT ?? '',
    number: req.number!,
    district: e.MELHOR_ENVIO_FROM_DISTRICT ?? '',
    city: req.city!,
    state_abbr: req.state_abbr!,
    postal_code: onlyDigits(req.postal_code!),
  }
}

async function mePost(path: string, token: string, ua: string, body: unknown): Promise<unknown> {
  const res = await fetch(`${baseUrl()}${path}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
      'User-Agent': ua,
    },
    body: JSON.stringify(body),
    cache: 'no-store',
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    const d = data as { message?: string; error?: string }
    throw new Error(String(d.message || d.error || `Falha em ${path} (HTTP ${res.status}).`))
  }
  return data
}

/**
 * Compra o frete e gera a etiqueta de um pedido. Executa, em sequência:
 * carrinho → compra (debita saldo) → gera → imprime (link público) → rastreio.
 * Retorna o id do frete no Melhor Envio, o código de rastreio e a URL da etiqueta.
 */
export async function buyLabel(params: {
  serviceId: number
  recipient: LabelRecipient
  products: LabelProduct[]
  volumes: LabelVolume[]
  /** Valor segurado total, em reais. */
  insuranceValue: number
  /** Chave da NF-e (opcional). */
  invoiceKey?: string
}): Promise<BoughtLabel> {
  const token = process.env.MELHOR_ENVIO_TOKEN
  if (!token) throw new Error('Melhor Envio não configurado (MELHOR_ENVIO_TOKEN).')
  const ua = process.env.MELHOR_ENVIO_USER_AGENT ?? 'Kickoffstore (contato@kickoffstore.com.br)'
  const from = senderFromEnv()
  const r = params.recipient

  const cart = (await mePost('/api/v2/me/cart', token, ua, {
    service: params.serviceId,
    from,
    to: {
      name: r.name,
      email: r.email,
      phone: r.phone || undefined,
      document: onlyDigits(r.document),
      address: r.address,
      complement: r.complement || undefined,
      number: r.number,
      district: r.district || undefined,
      city: r.city,
      state_abbr: r.stateAbbr,
      postal_code: onlyDigits(r.postalCode),
      country_id: 'BR',
    },
    products: params.products.map((p) => ({
      name: p.name,
      quantity: String(Math.max(1, Math.floor(p.quantity))),
      unitary_value: Number(p.unitaryValue).toFixed(2),
    })),
    volumes: params.volumes.map((v) => ({
      height: Math.max(MIN_HEIGHT_CM, Number(v.height) || 0),
      width: Math.max(MIN_WIDTH_CM, Number(v.width) || 0),
      length: Math.max(MIN_LENGTH_CM, Number(v.length) || 0),
      weight: Math.max(MIN_WEIGHT_KG, Number(v.weight) || 0),
    })),
    options: {
      insurance_value: Math.max(0, Number(params.insuranceValue) || 0),
      receipt: false,
      own_hand: false,
      ...(params.invoiceKey ? { invoice: { key: params.invoiceKey } } : {}),
    },
  })) as { id?: string }

  const meId = cart.id
  if (!meId) throw new Error('Melhor Envio não retornou o id do frete.')

  await mePost('/api/v2/me/shipment/checkout', token, ua, { orders: [meId] })
  await mePost('/api/v2/me/shipment/generate', token, ua, { orders: [meId] })
  const printed = (await mePost('/api/v2/me/shipment/print', token, ua, {
    mode: 'public',
    orders: [meId],
  })) as { url?: string }

  let trackingCode = ''
  try {
    const tr = (await mePost('/api/v2/me/shipment/tracking', token, ua, {
      orders: [meId],
    })) as Record<string, { tracking?: string }>
    trackingCode = tr?.[meId]?.tracking ?? ''
  } catch {
    // o rastreio pode não estar disponível imediatamente após a geração
  }

  return { melhorEnvioId: meId, trackingCode, labelUrl: printed.url ?? '' }
}
