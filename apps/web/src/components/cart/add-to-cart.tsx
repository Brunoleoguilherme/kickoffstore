'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Check, Heart, Minus, Plus, ShoppingCart } from 'lucide-react'
import { formatBRL } from '@kickoffstore/ui'
import { useCart } from './cart-context'
import { trackAddToCart } from '@/lib/analytics/events'

export interface AddToCartVariant {
  id: string
  label: string
  priceCents: number
}

interface AddToCartProps {
  productId: string
  slug: string
  name: string
  imageUrl: string | null
  variants: AddToCartVariant[]
}

export function AddToCart({ productId, slug, name, imageUrl, variants }: AddToCartProps) {
  const router = useRouter()
  const { add } = useCart()
  const [selectedId, setSelectedId] = useState<string>(variants[0]?.id ?? '')
  const [qty, setQty] = useState(1)
  const [added, setAdded] = useState(false)

  const hasVariants = variants.length > 0
  const selected = variants.find((v) => v.id === selectedId) ?? variants[0]

  function handleAdd(goToCart: boolean) {
    if (!selected) return
    add(
      {
        variantId: selected.id,
        productId,
        slug,
        name,
        variantLabel: variants.length > 1 ? selected.label : null,
        unitPriceCents: selected.priceCents,
        imageUrl,
      },
      qty,
    )
    trackAddToCart({ id: selected.id, name, priceCents: selected.priceCents, quantity: qty })
    if (goToCart) {
      router.push('/carrinho')
      return
    }
    setAdded(true)
    window.setTimeout(() => setAdded(false), 2500)
  }

  return (
    <>
    <div className="mt-6">
      {variants.length > 1 && (
        <div className="mb-5">
          <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-white">
            Escolha a variação
          </h2>
          <div className="flex flex-wrap gap-2">
            {variants.map((v) => {
              const active = v.id === selectedId
              return (
                <button
                  key={v.id}
                  type="button"
                  onClick={() => setSelectedId(v.id)}
                  className={`rounded-lg border px-3 py-2 text-sm transition-colors ${
                    active
                      ? 'border-brand-500 bg-brand-500/10 text-brand-400'
                      : 'border-white/15 bg-surface text-night-200 hover:border-white/40'
                  }`}
                >
                  {v.label}
                </button>
              )
            })}
          </div>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3">
        {/* quantidade */}
        <div className="inline-flex h-12 items-center rounded-lg border border-white/20">
          <button
            type="button"
            aria-label="Diminuir quantidade"
            onClick={() => setQty((q) => Math.max(1, q - 1))}
            className="flex h-full w-11 items-center justify-center text-white transition-colors hover:text-brand-500"
          >
            <Minus className="h-4 w-4" aria-hidden />
          </button>
          <span className="w-8 text-center text-sm font-semibold text-white">{qty}</span>
          <button
            type="button"
            aria-label="Aumentar quantidade"
            onClick={() => setQty((q) => Math.min(99, q + 1))}
            className="flex h-full w-11 items-center justify-center text-white transition-colors hover:text-brand-500"
          >
            <Plus className="h-4 w-4" aria-hidden />
          </button>
        </div>

        <button
          type="button"
          disabled={!hasVariants}
          onClick={() => handleAdd(true)}
          className="inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-lg bg-brand-500 px-6 text-sm font-semibold uppercase tracking-wide text-night-900 transition-all hover:-translate-y-0.5 hover:bg-brand-400 hover:shadow-gold disabled:cursor-not-allowed disabled:opacity-50 sm:flex-none"
        >
          <ShoppingCart className="h-5 w-5" aria-hidden /> Adicionar ao carrinho
        </button>

        <Link
          href="/conta/favoritos"
          aria-label="Favoritar"
          className="inline-flex h-12 items-center justify-center rounded-lg border border-white/20 px-4 transition-colors hover:border-brand-500/60 hover:text-brand-500"
        >
          <Heart className="h-5 w-5" aria-hidden />
        </Link>
      </div>

      {hasVariants && (
        <button
          type="button"
          onClick={() => handleAdd(false)}
          className="mt-3 inline-flex items-center gap-2 text-sm text-night-300 transition-colors hover:text-brand-400"
        >
          {added ? (
            <>
              <Check className="h-4 w-4 text-success" aria-hidden /> Adicionado! Continuar comprando
            </>
          ) : (
            'Adicionar e continuar comprando'
          )}
        </button>
      )}

      {!hasVariants && (
        <p className="mt-3 text-sm text-danger">Produto sem variação disponível para compra.</p>
      )}
    </div>

    {/* Barra fixa de compra — só no mobile, sempre visível */}
    {selected && (
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-white/10 bg-[rgba(5,5,5,0.95)] px-4 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] backdrop-blur-md lg:hidden">
        <div className="mx-auto flex max-w-[1200px] items-center justify-between gap-4">
          <div className="leading-tight">
            <p className="text-[11px] uppercase tracking-wide text-night-400">Total</p>
            <p className="text-lg font-bold text-brand-500">{formatBRL(selected.priceCents * qty)}</p>
          </div>
          <button
            type="button"
            onClick={() => handleAdd(true)}
            className="inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-lg bg-brand-500 px-6 text-sm font-semibold uppercase tracking-wide text-night-900 transition-colors hover:bg-brand-400"
          >
            <ShoppingCart className="h-5 w-5" aria-hidden /> Adicionar
          </button>
        </div>
      </div>
    )}
    </>
  )
}
