import type { PaymentMethod, PaymentProvider } from '@kickoffstore/types'
import { MercadoPagoPaymentProvider } from './mercado-pago'
import { StripePaymentProvider } from './stripe-provider'
import { CoraPaymentProvider } from './cora-provider'

type Env = Record<string, string | undefined>

/** Provedor de cartão (Stripe). Server-only. Lança se faltar STRIPE_SECRET_KEY. */
export function createCardPaymentProvider(env: Env = process.env): PaymentProvider {
  return new StripePaymentProvider({
    secretKey: env.STRIPE_SECRET_KEY,
    webhookSecret: env.STRIPE_WEBHOOK_SECRET,
    appUrl: env.NEXT_PUBLIC_APP_URL,
  })
}

/** Provedor de Pix (Cora). Server-only. Lança se faltar credencial Cora. */
export function createPixPaymentProvider(env: Env = process.env): PaymentProvider {
  return new CoraPaymentProvider({
    clientId: env.CORA_CLIENT_ID,
    certBase64: env.CORA_CERT_BASE64,
    keyBase64: env.CORA_KEY_BASE64,
    env: env.CORA_ENV,
  })
}

/**
 * Resolve o provedor de pagamento pela forma escolhida:
 *   - pix                     → Cora
 *   - credit_card/debit_card  → Stripe
 * As demais formas ainda usam o adaptador estrutural do Mercado Pago.
 * Server-only. Lança IntegrationNotConfiguredError se faltar credencial.
 */
export function createPaymentProvider(
  method: PaymentMethod = 'pix',
  env: Env = process.env,
): PaymentProvider {
  if (method === 'pix') return createPixPaymentProvider(env)
  if (method === 'credit_card' || method === 'debit_card') return createCardPaymentProvider(env)
  return new MercadoPagoPaymentProvider({
    accessToken: env.MERCADO_PAGO_ACCESS_TOKEN,
    webhookSecret: env.MERCADO_PAGO_WEBHOOK_SECRET,
  })
}
