import type {
  CreateCheckoutInput,
  CreateCheckoutResult,
  PaymentProvider,
  PaymentSnapshot,
  RefundInput,
  RefundResult,
  WebhookVerificationInput,
} from '@clubedaestampa/types'
import { IntegrationNotConfiguredError } from './errors'

export interface MercadoPagoConfig {
  accessToken?: string
  webhookSecret?: string
  baseUrl?: string
}

/**
 * Structural adapter for Mercado Pago. Real HTTP calls are implemented in
 * Fase 6 against the official docs. Every method fails loudly if the access
 * token is missing, so no flow is silently mocked.
 */
export class MercadoPagoPaymentProvider implements PaymentProvider {
  private readonly token: string
  private readonly webhookSecret?: string
  private readonly baseUrl: string

  constructor(config: MercadoPagoConfig) {
    if (!config.accessToken) {
      throw new IntegrationNotConfiguredError('Mercado Pago', ['MERCADO_PAGO_ACCESS_TOKEN'])
    }
    this.token = config.accessToken
    this.webhookSecret = config.webhookSecret
    this.baseUrl = config.baseUrl ?? 'https://api.mercadopago.com'
  }

  createCheckout(_input: CreateCheckoutInput): Promise<CreateCheckoutResult> {
    return Promise.reject(new Error('MercadoPago.createCheckout será implementado na Fase 6.'))
  }

  getPayment(_externalId: string): Promise<PaymentSnapshot> {
    return Promise.reject(new Error('MercadoPago.getPayment será implementado na Fase 6.'))
  }

  refund(_input: RefundInput): Promise<RefundResult> {
    return Promise.reject(new Error('MercadoPago.refund será implementado na Fase 6.'))
  }

  verifyWebhook(_input: WebhookVerificationInput): Promise<boolean> {
    return Promise.reject(new Error('MercadoPago.verifyWebhook será implementado na Fase 6.'))
  }
}
