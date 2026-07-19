import { describe, expect, it } from 'vitest'
import { cepSchema, centsSchema, skuSchema, slugSchema } from '../src/primitives'
import { productSchema, publishProductSchema } from '../src/catalog'
import { signUpSchema } from '../src/auth'

describe('primitives', () => {
  it('normalizes CEP digits', () => {
    expect(cepSchema.parse('01310-100')).toBe('01310100')
  })
  it('rejects fractional cents', () => {
    expect(centsSchema.safeParse(10.5).success).toBe(false)
    expect(centsSchema.safeParse(1050).success).toBe(true)
  })
  it('validates slug format', () => {
    expect(slugSchema.safeParse('camisa-brasil').success).toBe(true)
    expect(slugSchema.safeParse('Camisa Brasil').success).toBe(false)
  })
  it('validates sku', () => {
    expect(skuSchema.safeParse('KOS-CAM-001').success).toBe(true)
    expect(skuSchema.safeParse('inv alid').success).toBe(false)
  })
})

describe('catalog', () => {
  it('requires at least one variant', () => {
    const r = productSchema.safeParse({ name: 'X', slug: 'x', variants: [] })
    expect(r.success).toBe(false)
  })
  it('publish requires positive price', () => {
    const base = {
      name: 'Camisa',
      slug: 'camisa',
      status: 'active' as const,
      variants: [{ sku: 'A1', priceCents: 0 }],
    }
    expect(publishProductSchema.safeParse(base).success).toBe(false)
  })
})

describe('auth', () => {
  it('enforces strong password and terms', () => {
    const ok = signUpSchema.safeParse({
      fullName: 'Bruno',
      email: 'bruno@example.com',
      password: 'Abcd1234',
      acceptTerms: true,
    })
    expect(ok.success).toBe(true)
    const weak = signUpSchema.safeParse({
      fullName: 'Bruno',
      email: 'bruno@example.com',
      password: 'abc',
      acceptTerms: true,
    })
    expect(weak.success).toBe(false)
  })
})
