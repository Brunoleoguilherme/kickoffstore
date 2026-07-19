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
import {
  constructWebhookEvent,
  createCheckoutSession,
  retrieveCheckoutSession,
  type StripeCheckoutSession,
} from './stripe'

export interface StripeConfig {
  secretKey?: string
  webhookSecret?: string
  /** Base pública do site, usada para success/cancel URLs. */
  appUrl?: string
}

/** Mapeia o `payment_status` de uma Checkout Session para o status interno. */
function mapSessionStatus(s: StripeCheckoutSession): PaymentSnapshot['status'] {
  if (s.payment_status === 'paid') return 'approved'
  if (s.payment_status === 'no_payment_required') return 'approved'
  if (s.payment_status === 'unpaid') return 'pending'
  return 'processing'
}

/**
 * Adaptador Stripe (cartão) por trás do contrato `PaymentProvider`.
 * A lógica de baixo nível vive em `./stripe` (cópia fiel do BFWC).
 */
export class StripePaymentProvider implements PaymentProvider {
  private readonly appUrl: string
  private readonly webhookSecret?: string

  constructor(config: StripeConfig) {
    if (!config.secretKey) {
      throw new IntegrationNotConfiguredError('Stripe', ['STRIPE_SECRET_KEY'])
    }
    // `secretKey` é lido por process.env dentro de ./stripe; validamos aqui a presença.
    this.appUrl = (config.appUrl ?? 'http://localhost:3000').replace(/\/$/, '')
    this.webhookSecret = config.webhookSecret
  }

  async createCheckout(input: CreateCheckoutInput): Promise<CreateCheckoutResult> {
    const session = await createCheckoutSession({
      mode: 'payment',
      client_reference_id: input.orderId,
      customer_email: input.payer.email,
      locale: 'pt-BR',
      metadata: { order_id: input.orderId, ...(input.metadata ?? {}) },
      payment_intent_data: { metadata: { order_id: input.orderId } },
      payment_method_options: { card: { installments: { enabled: true } } },
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: input.currency.toLowerCase(),
            unit_amount: input.amountCents,
            product_data: { name: input.description },
          },
        },
      ],
      success_url: `${this.appUrl}/conta/pedidos?paid=1&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${this.appUrl}/carrinho?canceled=1`,
    })

    if (!session.url) throw new Error('Stripe não retornou a URL de checkout.')

    return {
      externalId: session.id,
      status: 'pending',
      redirectUrl: session.url,
      raw: session as unknown as Record<string, unknown>,
    }
  }

  async getPayment(externalId: string): Promise<PaymentSnapshot> {
    const session = await retrieveCheckoutSession(externalId)
    return {
      externalId: session.id,
      status: mapSessionStatus(session),
      amountCents: session.amount_total ?? 0,
      paidAmountCents: session.payment_status === 'paid' ? session.amount_total ?? 0 : 0,
      raw: session as unknown as Record<string, unknown>,
    }
  }

  refund(_input: RefundInput): Promise<RefundResult> {
    // Estornos ainda não fazem parte do escopo copiado do BFWC.
    return Promise.reject(new Error('Stripe.refund será implementado numa fase futura.'))
  }

  verifyWebhook(input: WebhookVerificationInput): Promise<boolean> {
    try {
      const sig = input.headers['stripe-signature'] ?? null
      constructWebhookEvent(input.rawBody, sig, input.secret || this.webhookSecret)
      return Promise.resolve(true)
    } catch {
      return Promise.resolve(false)
    }
  }
}
