import type {
  CreateCheckoutInput,
  CreateCheckoutResult,
  PaymentProvider,
  PaymentSnapshot,
  RefundInput,
  RefundResult,
  WebhookVerificationInput,
} from '@kickoffstore/types'
import { IntegrationNotConfiguredError } from './errors'
import { createPixCharge, getInvoice } from './cora'

export interface CoraConfig {
  clientId?: string
  certBase64?: string
  keyBase64?: string
  env?: string
  /** Dias até o vencimento da cobrança Pix (default 1). */
  dueInDays?: number
}

/** Classifica um documento em CPF/CNPJ (mesma regra do BFWC). */
export function classifyDocument(
  raw: string | undefined,
): { identity: string; type: 'CPF' | 'CNPJ' } | null {
  const digits = String(raw ?? '').replace(/\D/g, '')
  if (digits.length === 11) return { identity: digits, type: 'CPF' }
  if (digits.length === 14) return { identity: digits, type: 'CNPJ' }
  return null
}

/** Data 'YYYY-MM-DD' com N dias a partir de hoje (UTC). */
function dueDatePlus(days: number): string {
  const d = new Date(Date.now() + days * 24 * 60 * 60 * 1000)
  return d.toISOString().slice(0, 10)
}

/**
 * Adaptador Cora (Pix) por trás do contrato `PaymentProvider`.
 * A lógica de baixo nível (mTLS) vive em `./cora` (cópia fiel do BFWC).
 */
export class CoraPaymentProvider implements PaymentProvider {
  private readonly dueInDays: number

  constructor(config: CoraConfig) {
    if (!config.clientId || !config.certBase64 || !config.keyBase64) {
      throw new IntegrationNotConfiguredError('Cora', [
        'CORA_CLIENT_ID',
        'CORA_CERT_BASE64',
        'CORA_KEY_BASE64',
      ])
    }
    this.dueInDays = config.dueInDays ?? 1
  }

  async createCheckout(input: CreateCheckoutInput): Promise<CreateCheckoutResult> {
    const doc = classifyDocument(input.payer.taxId)
    if (!doc) {
      throw new Error('Informe um CPF ou CNPJ válido para gerar o Pix.')
    }
    const charge = await createPixCharge({
      code: input.orderId,
      customer: { name: input.payer.name, email: input.payer.email, document: doc },
      amountCents: input.amountCents,
      serviceName: input.description,
      dueDate: dueDatePlus(this.dueInDays),
    })
    return {
      externalId: charge.id,
      status: 'pending',
      pixQrCode: charge.emv,
      redirectUrl: charge.qrcodeUrl || undefined,
      raw: charge.raw,
    }
  }

  async getPayment(externalId: string): Promise<PaymentSnapshot> {
    const invoice = await getInvoice(externalId)
    const status = invoice?.status as string | undefined
    const totalPaid = invoice?.total_paid as number | undefined
    const totalAmount = invoice?.total_amount as number | undefined
    const isPaid =
      status === 'PAID' ||
      (typeof totalPaid === 'number' &&
        typeof totalAmount === 'number' &&
        totalAmount > 0 &&
        totalPaid >= totalAmount)
    return {
      externalId,
      status: isPaid ? 'approved' : 'pending',
      amountCents: totalAmount ?? 0,
      paidAmountCents: totalPaid ?? 0,
      raw: invoice,
    }
  }

  refund(_input: RefundInput): Promise<RefundResult> {
    return Promise.reject(new Error('Cora.refund será implementado numa fase futura.'))
  }

  verifyWebhook(input: WebhookVerificationInput): Promise<boolean> {
    // A Cora não assina o corpo: envia o evento nos headers e confirmamos
    // consultando a invoice na API (feito na rota do webhook).
    const eventType = input.headers['webhook-event-type'] ?? ''
    const resourceId = input.headers['webhook-resource-id'] ?? ''
    return Promise.resolve(eventType.includes('paid') && Boolean(resourceId))
  }
}
