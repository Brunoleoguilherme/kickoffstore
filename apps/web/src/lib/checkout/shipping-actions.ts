'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import {
  isMelhorEnvioConfigured,
  calculateShipping,
  type ShippingQuote,
} from '@kickoffstore/integrations'
import type { CheckoutLineInput } from './actions'

/** Indica se a loja já conectou o Melhor Envio (para exibir o cálculo de frete). */
export async function shippingEnabledAction(): Promise<boolean> {
  return isMelhorEnvioConfigured()
}

export interface QuoteShippingResult {
  /** false quando a loja ainda não conectou o Melhor Envio → checkout segue sem frete. */
  configured: boolean
  ok: boolean
  quotes?: ShippingQuote[]
  message?: string
}

interface VariantDims {
  id: string
  price_cents: number
  weight_grams: number | null
  width_cm: number | null
  height_cm: number | null
  length_cm: number | null
  active: boolean
}

/**
 * Cota o frete para um CEP a partir dos itens do carrinho.
 * Preços/dimensões vêm do banco (nunca do cliente). Best-effort:
 * qualquer falha vira uma mensagem amigável, sem quebrar o checkout.
 */
export async function quoteShippingAction(
  zip: string,
  lines: CheckoutLineInput[],
): Promise<QuoteShippingResult> {
  if (!isMelhorEnvioConfigured()) {
    return { configured: false, ok: false }
  }

  try {
    const clean = (lines ?? []).filter((l) => l && l.variantId && l.quantity > 0)
    if (clean.length === 0) return { configured: true, ok: false, message: 'Carrinho vazio.' }

    const cep = String(zip ?? '').replace(/\D/g, '')
    if (cep.length !== 8) {
      return { configured: true, ok: false, message: 'Informe um CEP válido para calcular o frete.' }
    }

    const admin = createAdminClient()
    const variantIds = Array.from(new Set(clean.map((l) => l.variantId)))
    const { data, error } = await admin
      .from('product_variants')
      .select('id, price_cents, weight_grams, width_cm, height_cm, length_cm, active')
      .in('id', variantIds)
    if (error) return { configured: true, ok: false, message: 'Falha ao validar os produtos.' }

    const rows = (data ?? []) as unknown as VariantDims[]
    const byId = new Map(rows.map((r) => [r.id, r]))

    const products = clean
      .map((l) => {
        const v = byId.get(l.variantId)
        if (!v || !v.active) return null
        const qty = Math.min(Math.max(Math.trunc(l.quantity), 1), 99)
        return {
          id: v.id,
          width: Number(v.width_cm ?? 0),
          height: Number(v.height_cm ?? 0),
          length: Number(v.length_cm ?? 0),
          weight: Number(v.weight_grams ?? 0) / 1000,
          insuranceValue: Number(v.price_cents ?? 0) / 100,
          quantity: qty,
        }
      })
      .filter((p): p is NonNullable<typeof p> => p !== null)

    if (products.length === 0) {
      return { configured: true, ok: false, message: 'Produtos indisponíveis para cálculo de frete.' }
    }

    const quotes = await calculateShipping({ toPostalCode: cep, products })
    if (quotes.length === 0) {
      return { configured: true, ok: false, message: 'Nenhuma opção de frete disponível para este CEP.' }
    }
    return { configured: true, ok: true, quotes }
  } catch (err) {
    console.error('quoteShippingAction error', err)
    return {
      configured: true,
      ok: false,
      message: err instanceof Error ? err.message : 'Falha ao calcular o frete.',
    }
  }
}
