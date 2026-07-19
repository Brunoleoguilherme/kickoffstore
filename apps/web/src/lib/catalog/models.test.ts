import { describe, expect, it } from 'vitest'
import { discountPercent } from '@kickoffstore/ui'

// Sanity: price-from is the min of variant prices (logic used in queries.toSummary).
describe('catalog price logic', () => {
  it('computes price-from as minimum', () => {
    const prices = [29990, 19990, 24990]
    expect(Math.min(...prices)).toBe(19990)
  })
  it('discount uses compareAt vs price', () => {
    expect(discountPercent(19990, 29990)).toBe(33)
  })
})
