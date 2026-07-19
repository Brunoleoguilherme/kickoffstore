'use client'

import Link from 'next/link'
import { Minus, Plus, ShoppingCart, Trash2 } from 'lucide-react'
import { formatBRL } from '@kickoffstore/ui'
import { AnnouncementBar } from '@/components/home/announcement-bar'
import { SiteHeader } from '@/components/home/site-header'
import { SiteFooter } from '@/components/home/site-footer'
import { useCart } from '@/components/cart/cart-context'

export default function CarrinhoPage() {
  const { items, subtotalCents, count, hydrated, setQuantity, remove } = useCart()

  return (
    <div className="min-h-dvh overflow-x-hidden bg-night-900 text-white">
      <AnnouncementBar />
      <SiteHeader />

      <main className="mx-auto max-w-[1100px] px-6 pb-24 pt-28 sm:px-8">
        <h1 className="font-display text-3xl font-extrabold uppercase tracking-tight sm:text-4xl">
          Seu carrinho
        </h1>

        {/* Antes de hidratar o localStorage, não sabemos os itens: evita flash de "vazio". */}
        {!hydrated ? (
          <p className="mt-10 text-night-300">Carregando…</p>
        ) : items.length === 0 ? (
          <div className="mt-16 flex flex-col items-center text-center">
            <ShoppingCart className="h-16 w-16 text-night-500" aria-hidden />
            <h2 className="mt-6 font-display text-2xl font-bold">Seu carrinho está vazio</h2>
            <p className="mt-2 text-night-300">Explore a loja e adicione seus produtos favoritos.</p>
            <Link
              href="/produtos"
              className="mt-8 inline-flex h-12 items-center justify-center rounded-lg bg-brand-500 px-8 text-sm font-semibold uppercase tracking-wide text-night-900 transition-colors hover:bg-brand-400"
            >
              Explorar a loja
            </Link>
          </div>
        ) : (
          <div className="mt-10 grid gap-8 lg:grid-cols-[1fr_360px]">
            {/* itens */}
            <ul className="flex flex-col divide-y divide-white/10 rounded-2xl border border-white/10 bg-surface">
              {items.map((line) => (
                <li key={line.variantId} className="flex gap-4 p-4 sm:p-5">
                  <div className="h-24 w-24 shrink-0 overflow-hidden rounded-lg border border-white/10 bg-night-800">
                    {line.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={line.imageUrl} alt={line.name} className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full items-center justify-center text-xs text-night-400">
                        Sem foto
                      </div>
                    )}
                  </div>

                  <div className="flex flex-1 flex-col">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <Link
                          href={`/produtos/${line.slug}`}
                          className="font-semibold text-white transition-colors hover:text-brand-400"
                        >
                          {line.name}
                        </Link>
                        {line.variantLabel && (
                          <p className="mt-0.5 text-sm text-night-300">{line.variantLabel}</p>
                        )}
                      </div>
                      <button
                        type="button"
                        aria-label={`Remover ${line.name}`}
                        onClick={() => remove(line.variantId)}
                        className="rounded-md p-1.5 text-night-400 transition-colors hover:bg-white/5 hover:text-danger"
                      >
                        <Trash2 className="h-4 w-4" aria-hidden />
                      </button>
                    </div>

                    <div className="mt-auto flex items-end justify-between pt-3">
                      <div className="inline-flex h-10 items-center rounded-lg border border-white/20">
                        <button
                          type="button"
                          aria-label="Diminuir quantidade"
                          onClick={() => setQuantity(line.variantId, line.quantity - 1)}
                          className="flex h-full w-9 items-center justify-center text-white transition-colors hover:text-brand-500"
                        >
                          <Minus className="h-3.5 w-3.5" aria-hidden />
                        </button>
                        <span className="w-8 text-center text-sm font-semibold">{line.quantity}</span>
                        <button
                          type="button"
                          aria-label="Aumentar quantidade"
                          onClick={() => setQuantity(line.variantId, line.quantity + 1)}
                          className="flex h-full w-9 items-center justify-center text-white transition-colors hover:text-brand-500"
                        >
                          <Plus className="h-3.5 w-3.5" aria-hidden />
                        </button>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-brand-500">
                          {formatBRL(line.unitPriceCents * line.quantity)}
                        </p>
                        {line.quantity > 1 && (
                          <p className="text-xs text-night-400">{formatBRL(line.unitPriceCents)} cada</p>
                        )}
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>

            {/* resumo */}
            <aside className="h-fit rounded-2xl border border-white/10 bg-surface p-6">
              <h2 className="font-display text-lg font-bold uppercase tracking-wide">Resumo</h2>
              <div className="mt-4 flex justify-between text-sm text-night-200">
                <span>
                  Subtotal ({count} {count === 1 ? 'item' : 'itens'})
                </span>
                <span className="font-semibold text-white">{formatBRL(subtotalCents)}</span>
              </div>
              <div className="mt-2 flex justify-between text-sm text-night-300">
                <span>Frete</span>
                <span>Calculado no checkout</span>
              </div>
              <div className="mt-4 flex items-baseline justify-between border-t border-white/10 pt-4">
                <span className="text-sm uppercase tracking-wide text-night-300">Total</span>
                <span className="text-2xl font-bold text-brand-500">{formatBRL(subtotalCents)}</span>
              </div>

              <Link
                href="/checkout"
                className="mt-6 flex h-12 w-full items-center justify-center rounded-lg bg-brand-500 text-sm font-semibold uppercase tracking-wide text-night-900 transition-all hover:-translate-y-0.5 hover:bg-brand-400 hover:shadow-gold"
              >
                Finalizar compra
              </Link>
              <Link
                href="/produtos"
                className="mt-3 flex h-11 w-full items-center justify-center rounded-lg border border-white/15 text-sm font-semibold uppercase tracking-wide text-night-200 transition-colors hover:border-white/40"
              >
                Continuar comprando
              </Link>
            </aside>
          </div>
        )}
      </main>

      <SiteFooter />
    </div>
  )
}
