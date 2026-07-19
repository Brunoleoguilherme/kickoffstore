import { describe, expect, it } from 'vitest'
import {
  MercadoPagoPaymentProvider,
  StripePaymentProvider,
  CoraPaymentProvider,
  IntegrationNotConfiguredError,
  classifyDocument,
  encodeForm,
} from '../src'

describe('MercadoPagoPaymentProvider', () => {
  it('refuses to construct without a token', () => {
    expect(() => new MercadoPagoPaymentProvider({})).toThrow(IntegrationNotConfiguredError)
  })
  it('constructs with a token', () => {
    expect(() => new MercadoPagoPaymentProvider({ accessToken: 'TEST-token' })).not.toThrow()
  })
})

describe('StripePaymentProvider', () => {
  it('refuses to construct without a secret key', () => {
    expect(() => new StripePaymentProvider({})).toThrow(IntegrationNotConfiguredError)
  })
  it('constructs with a secret key', () => {
    expect(() => new StripePaymentProvider({ secretKey: 'sk_test_x' })).not.toThrow()
  })
})

describe('CoraPaymentProvider', () => {
  it('refuses to construct without full credentials', () => {
    expect(() => new CoraPaymentProvider({ clientId: 'x' })).toThrow(IntegrationNotConfiguredError)
  })
  it('constructs with full credentials', () => {
    expect(
      () => new CoraPaymentProvider({ clientId: 'x', certBase64: 'y', keyBase64: 'z' }),
    ).not.toThrow()
  })
})

describe('classifyDocument', () => {
  it('detects CPF (11 digits)', () => {
    expect(classifyDocument('529.982.247-25')).toEqual({ identity: '52998224725', type: 'CPF' })
  })
  it('detects CNPJ (14 digits)', () => {
    expect(classifyDocument('11.222.333/0001-81')).toEqual({
      identity: '11222333000181',
      type: 'CNPJ',
    })
  })
  it('rejects invalid lengths', () => {
    expect(classifyDocument('123')).toBeNull()
    expect(classifyDocument(undefined)).toBeNull()
  })
})

describe('encodeForm (Stripe form-urlencoded)', () => {
  it('flattens nested objects and arrays', () => {
    const out = encodeForm({
      mode: 'payment',
      line_items: [{ price_data: { currency: 'brl', unit_amount: 1000 } }],
    })
    expect(out).toContain('mode=payment')
    expect(out).toContain('line_items%5B0%5D%5Bprice_data%5D%5Bcurrency%5D=brl')
    expect(out).toContain('line_items%5B0%5D%5Bprice_data%5D%5Bunit_amount%5D=1000')
  })
  it('skips undefined and null values', () => {
    const out = encodeForm({ a: 'x', b: undefined, c: null })
    expect(out).toEqual(['a=x'])
  })
})
