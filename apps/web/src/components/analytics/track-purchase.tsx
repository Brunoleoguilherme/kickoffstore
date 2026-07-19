'use client'

import { useEffect } from 'react'
import { trackPurchase } from '@/lib/analytics/events'

/**
 * Dispara o evento purchase / Purchase ao retornar do pagamento aprovado.
 * Usa sessionStorage para não contar a mesma compra duas vezes (ex.: refresh).
 */
export function TrackPurchase({ orderId, valueCents }: { orderId: string; valueCents: number }) {
  useEffect(() => {
    try {
      const key = `ks_purchase_${orderId}`
      if (window.sessionStorage.getItem(key)) return
      window.sessionStorage.setItem(key, '1')
    } catch {
      // sessionStorage indisponível — segue e dispara mesmo assim.
    }
    trackPurchase({ orderId, valueCents })
  }, [orderId, valueCents])
  return null
}
