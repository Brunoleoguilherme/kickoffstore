import { describe, expect, it } from 'vitest'
import { formatBRL, discountPercent, formatInstallments } from '../src/format'

describe('format', () => {
  it('formats cents to BRL', () => {
    const out = formatBRL(49900)
    expect(out).toContain('R$')
    expect(out).toContain('499,00')
  })
  it('computes discount percent', () => {
    expect(discountPercent(8000, 10000)).toBe(20)
    expect(discountPercent(10000, 8000)).toBe(0)
  })
  it('formats installments', () => {
    expect(formatInstallments(49900, 10)).toContain('10x')
  })
})
