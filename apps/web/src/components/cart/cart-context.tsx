'use client'

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'

export interface CartLine {
  variantId: string
  productId: string
  slug: string
  name: string
  variantLabel: string | null
  unitPriceCents: number
  imageUrl: string | null
  quantity: number
}

interface CartContextValue {
  items: CartLine[]
  count: number
  subtotalCents: number
  hydrated: boolean
  add: (line: Omit<CartLine, 'quantity'>, quantity?: number) => void
  setQuantity: (variantId: string, quantity: number) => void
  remove: (variantId: string) => void
  clear: () => void
}

const CartContext = createContext<CartContextValue | null>(null)
const STORAGE_KEY = 'ks_cart_v1'

function readStorage(): CartLine[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as CartLine[]
    if (!Array.isArray(parsed)) return []
    return parsed.filter((l) => l && typeof l.variantId === 'string' && l.quantity > 0)
  } catch {
    return []
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartLine[]>([])
  const [hydrated, setHydrated] = useState(false)

  // Hidrata do localStorage apenas no cliente (evita mismatch de SSR).
  useEffect(() => {
    setItems(readStorage())
    setHydrated(true)
  }, [])

  // Persiste a cada mudança (após hidratar).
  useEffect(() => {
    if (!hydrated) return
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
    } catch {
      /* storage cheio/indisponível — ignora */
    }
  }, [items, hydrated])

  const value = useMemo<CartContextValue>(() => {
    const count = items.reduce((n, l) => n + l.quantity, 0)
    const subtotalCents = items.reduce((n, l) => n + l.unitPriceCents * l.quantity, 0)
    return {
      items,
      count,
      subtotalCents,
      hydrated,
      add(line, quantity = 1) {
        setItems((prev) => {
          const existing = prev.find((l) => l.variantId === line.variantId)
          if (existing) {
            return prev.map((l) =>
              l.variantId === line.variantId ? { ...l, quantity: l.quantity + quantity } : l,
            )
          }
          return [...prev, { ...line, quantity }]
        })
      },
      setQuantity(variantId, quantity) {
        setItems((prev) =>
          quantity <= 0
            ? prev.filter((l) => l.variantId !== variantId)
            : prev.map((l) => (l.variantId === variantId ? { ...l, quantity } : l)),
        )
      },
      remove(variantId) {
        setItems((prev) => prev.filter((l) => l.variantId !== variantId))
      },
      clear() {
        setItems([])
      },
    }
  }, [items, hydrated])

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart precisa estar dentro de <CartProvider>')
  return ctx
}
