import type { Metadata } from 'next'
import { Search } from 'lucide-react'
import { isSupabaseConfigured } from '@kickoffstore/validation'
import { listActiveProducts, searchProducts } from '@/lib/catalog/queries'
import { AnnouncementBar } from '@/components/home/announcement-bar'
import { SiteHeader } from '@/components/home/site-header'
import { SiteFooter } from '@/components/home/site-footer'
import { HomeProductCard } from '@/components/home/product-card'

export const metadata: Metadata = {
  title: 'Produtos',
  description: 'Explore o catálogo esportivo premium da Kickoffstore.',
}

export default async function ProdutosPage({ searchParams }: { searchParams: { q?: string } }) {
  const q = searchParams.q?.trim() ?? ''
  const configured = isSupabaseConfigured()
  const products = configured ? (q ? await searchProducts(q, 60) : await listActiveProducts(60)) : []

  return (
    <div className="min-h-dvh overflow-x-hidden bg-night-900 text-white">
      <AnnouncementBar />
      <SiteHeader />

      <main className="mx-auto max-w-[1440px] px-6 pb-20 pt-28 sm:px-8">
        <div className="flex flex-col gap-6 border-b border-white/10 pb-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <span className="text-xs font-semibold uppercase tracking-[0.3em] text-brand-500">Catálogo</span>
            <h1 className="mt-1 font-display text-3xl font-extrabold uppercase tracking-tight sm:text-4xl">
              {q ? `Busca: “${q}”` : 'Todos os produtos'}
            </h1>
            <p className="mt-1 text-sm text-night-300">{products.length} produto(s)</p>
          </div>
          <form action="/produtos" className="flex w-full max-w-md items-center gap-2">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-night-400" aria-hidden />
              <input
                name="q"
                defaultValue={q}
                placeholder="Buscar produtos, marcas, SKU…"
                aria-label="Buscar"
                className="h-11 w-full rounded-lg border border-white/15 bg-surface pl-9 pr-3 text-sm text-white outline-none placeholder:text-night-500 focus-visible:border-brand-500"
              />
            </div>
            <button className="h-11 rounded-lg bg-brand-500 px-5 text-sm font-semibold uppercase tracking-wide text-night-900 transition-colors hover:bg-brand-400">
              Buscar
            </button>
          </form>
        </div>

        {!configured ? (
          <p className="mt-10 rounded-lg border border-brand-500/30 bg-brand-500/10 px-4 py-3 text-sm text-brand-500">
            Catálogo indisponível: configure o Supabase (.env.local).
          </p>
        ) : products.length === 0 ? (
          <p className="py-20 text-center text-night-400">
            {q ? 'Nenhum produto encontrado para sua busca.' : 'Nenhum produto publicado ainda.'}
          </p>
        ) : (
          <div className="mt-8 grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4">
            {products.map((p) => (
              <HomeProductCard key={p.id} product={p} />
            ))}
          </div>
        )}
      </main>

      <SiteFooter />
    </div>
  )
}
