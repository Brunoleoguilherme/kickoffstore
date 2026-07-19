import { describe, expect, it } from 'vitest'
import { canTransitionOrder, ORDER_STATUSES, ORDER_TRANSITIONS } from '../src/orders'

describe('order state machine', () => {
  it('allows awaiting_payment -> paid', () => {
    expect(canTransitionOrder('awaiting_payment', 'paid')).toBe(true)
  })
  it('forbids delivered -> picking', () => {
    expect(canTransitionOrder('delivered', 'picking')).toBe(false)
  })
  it('terminal states have no outgoing transitions', () => {
    expect(ORDER_TRANSITIONS.cancelled).toHaveLength(0)
    expect(ORDER_TRANSITIONS.refunded).toHaveLength(0)
  })
  it('every transition target is a known status', () => {
    const known = new Set(ORDER_STATUSES)
    for (const targets of Object.values(ORDER_TRANSITIONS)) {
      for (const t of targets) expect(known.has(t)).toBe(true)
    }
  })
})
