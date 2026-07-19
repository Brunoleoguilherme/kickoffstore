import type { Cents, CurrencyCode, UUID } from './common'
import type { PaymentMethod } from './orders'

/* =========================================================================
 * Payment provider contract (see CLAUDE.md "Contratos de integração").
 * Every provider (Mercado Pago first) must sit behind this interface.
 * ========================================================================= */
export interface CreateCheckoutInput {
  orderId: UUID
  amountCents: Cents
  currency: CurrencyCode
  method: PaymentMethod
  idempotencyKey: string
  payer: { name: string; email: string; taxId?: string }
  description: string
  metadata?: Record<string, string>
}

export interface CreateCheckoutResult {
  externalId: string
  status: PaymentSnapshot['status']
  /** e.g. Pix QR code, boleto URL, or hosted checkout URL. */
  redirectUrl?: string
  pixQrCode?: string
  pixQrCodeBase64?: string
  boletoUrl?: string
  raw?: Record<string, unknown>
}

export interface PaymentSnapshot {
  externalId: string
  status: 'pending' | 'processing' | 'approved' | 'rejected' | 'refunded' | 'cancelled' | 'expired'
  amountCents: Cents
  paidAmountCents?: Cents
  feeCents?: Cents
  approvedAt?: string
  raw?: Record<string, unknown>
}

export interface RefundInput {
  paymentExternalId: string
  amountCents: Cents
  idempotencyKey: string
  reason: string
}

export interface RefundResult {
  externalId: string
  status: 'pending' | 'approved' | 'rejected'
  raw?: Record<string, unknown>
}

export interface WebhookVerificationInput {
  rawBody: string
  headers: Record<string, string | undefined>
  secret: string
}

export interface PaymentProvider {
  createCheckout(input: CreateCheckoutInput): Promise<CreateCheckoutResult>
  getPayment(externalId: string): Promise<PaymentSnapshot>
  refund(input: RefundInput): Promise<RefundResult>
  verifyWebhook(input: WebhookVerificationInput): Promise<boolean>
}

/* =========================================================================
 * Fiscal provider contract (Nuvem Fiscal first).
 * ========================================================================= */
export interface IssueInvoiceInput {
  orderId: UUID
  idempotencyKey: string
  documentType: 'nfe' | 'nfce'
  /** Fiscal fields (NCM/CFOP/CST) must be validated with an accountant. */
  payload: Record<string, unknown>
}

export interface IssueInvoiceResult {
  externalId: string
  status: FiscalDocumentSnapshot['status']
  raw?: Record<string, unknown>
}

export interface FiscalDocumentSnapshot {
  externalId: string
  status: 'pending' | 'processing' | 'authorized' | 'rejected' | 'cancelled'
  accessKey?: string
  protocol?: string
  number?: string
  series?: string
  rejectionCode?: string
  rejectionMessage?: string
  authorizedAt?: string
  raw?: Record<string, unknown>
}

export interface CancelInvoiceInput {
  externalId: string
  idempotencyKey: string
  reason: string
}

export interface CancelInvoiceResult {
  externalId: string
  status: 'cancelled' | 'rejected'
  raw?: Record<string, unknown>
}

export interface FiscalProvider {
  issueInvoice(input: IssueInvoiceInput): Promise<IssueInvoiceResult>
  getInvoice(externalId: string): Promise<FiscalDocumentSnapshot>
  cancelInvoice(input: CancelInvoiceInput): Promise<CancelInvoiceResult>
  downloadXml(externalId: string): Promise<Uint8Array>
  downloadDanfe(externalId: string): Promise<Uint8Array>
}

/* =========================================================================
 * Shipping provider contract (Melhor Envio first).
 * ========================================================================= */
export interface ShippingQuoteInput {
  originPostalCode: string
  destinationPostalCode: string
  items: Array<{
    quantity: number
    weightGrams: number
    lengthCm: number
    widthCm: number
    heightCm: number
    unitPriceCents: Cents
  }>
}

export interface ShippingQuote {
  serviceCode: string
  serviceName: string
  carrier: string
  priceCents: Cents
  estimatedDays: number
  raw?: Record<string, unknown>
}

export interface PurchaseLabelInput {
  shipmentId: UUID
  serviceCode: string
  idempotencyKey: string
  payload: Record<string, unknown>
}

export interface ShippingLabelResult {
  externalId: string
  trackingCode?: string
  labelUrl?: string
  raw?: Record<string, unknown>
}

export interface TrackingSnapshot {
  externalId: string
  status: string
  events: Array<{
    status: string
    description?: string
    location?: string
    occurredAt: string
  }>
  raw?: Record<string, unknown>
}

export interface ShippingProvider {
  quote(input: ShippingQuoteInput): Promise<ShippingQuote[]>
  purchaseLabel(input: PurchaseLabelInput): Promise<ShippingLabelResult>
  track(externalId: string): Promise<TrackingSnapshot>
}

/* =========================================================================
 * Email provider contract (Resend first).
 * ========================================================================= */
export interface SendEmailInput {
  to: string
  from: string
  subject: string
  html: string
  text?: string
  replyTo?: string
  tags?: Record<string, string>
  idempotencyKey?: string
}

export interface SendEmailResult {
  externalId: string
  raw?: Record<string, unknown>
}

export interface EmailProvider {
  send(input: SendEmailInput): Promise<SendEmailResult>
  verifyWebhook(input: WebhookVerificationInput): Promise<boolean>
}
