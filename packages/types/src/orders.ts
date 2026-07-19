/** Order lifecycle states (see CLAUDE.md "Fluxo de pedido"). History is append-only. */
export const ORDER_STATUSES = [
  'draft',
  'awaiting_payment',
  'payment_processing',
  'paid',
  'fiscal_pending',
  'fiscal_authorized',
  'fiscal_failed',
  'picking',
  'packed',
  'shipped',
  'delivered',
  'cancel_requested',
  'cancelled',
  'return_requested',
  'returned',
  'refunded',
] as const

export type OrderStatus = (typeof ORDER_STATUSES)[number]

/**
 * Allowed order status transitions (see docs/08-api-e-webhooks.md §6).
 * Any transition not listed here must be rejected server-side.
 */
export const ORDER_TRANSITIONS: Readonly<Record<OrderStatus, readonly OrderStatus[]>> = {
  draft: ['awaiting_payment', 'cancelled'],
  awaiting_payment: ['payment_processing', 'paid', 'cancelled'],
  payment_processing: ['paid', 'awaiting_payment', 'cancelled'],
  paid: ['fiscal_pending', 'cancel_requested', 'refunded'],
  fiscal_pending: ['fiscal_authorized', 'fiscal_failed', 'cancel_requested'],
  fiscal_failed: ['fiscal_pending', 'cancel_requested'],
  fiscal_authorized: ['picking', 'cancel_requested'],
  picking: ['packed', 'cancel_requested'],
  packed: ['shipped', 'cancel_requested'],
  shipped: ['delivered', 'return_requested'],
  delivered: ['return_requested'],
  cancel_requested: ['cancelled'],
  cancelled: [],
  return_requested: ['returned'],
  returned: ['refunded'],
  refunded: [],
}

export function canTransitionOrder(from: OrderStatus, to: OrderStatus): boolean {
  return ORDER_TRANSITIONS[from].includes(to)
}

export type OrderChannel = 'web' | 'mobile' | 'admin' | 'pos' | 'marketplace'
export type PaymentMethod = 'pix' | 'credit_card' | 'debit_card' | 'boleto' | 'store_credit' | 'other'
