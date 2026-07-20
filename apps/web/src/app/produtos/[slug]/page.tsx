import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { formatBRL, formatInstallments } from '@clubedaestampa/ui'
import { getProductBySlug } from '@/lib/catalog/queries'
import { productImageUrl } from '@/lib/catalog/image'
import { AnnouncementBar } from '@/components/home/announcement-bar'
import { SiteHeader } from '@/components/home/site-header'
import { SiteFooter } from '@/components/home/site-footer'
import { AddToCart, type AddToCartVariant } from '@/components/cart/add-to-cart'
import { TrackViewItem } from '@/components/analytics/track-view-item'

interface Props {
  params: { slug: string }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const product = await getProductBySlug(params.slug)
  if (!product) return { title: 'Produto não encontrado' }
  return {
    title: product.seoTitle ?? product.name,
    description: product.seoDescription ?? product.shortDescription ?? undefined,
    openGraph: { title: product.name, images: productImageUrl(product.imagePath) ?? undefined },
  }
}

export default async function ProdutoPage({ params }: Props) {
  const product = await getProductBySlug(params.slug)
  if (!product) notFound()

  const cover = productImageUrl(product.imagePath)
  const priceFrom = product.variants.length
    ? Math.min(...product.variants.map((v) => v.priceCents))
    : 0
  const compareAt = product.variants.find((v) => v.compareAtCents)?.compareAtCents ?? null
  const images = product.images.length ? product.images : cover ? [{ path: product.imagePath ?? '', alt: product.name, isPrimary: true }] : []
  const cartVariants: AddToCartVariant[] = product.variants.map((v) => ({
    id: v.id,
    label: [v.color, v.size].filter(Boolean).join(' · ') || v.sku,
    priceCents: v.priceCents,
  }))

  return (
    <div className="min-h-dvh overflow-x-hidden bg-night-900 text-white">
      <AnnouncementBar />
      <SiteHeader />

      <main className="mx-auto max-w-[1200px] px-6 pb-28 pt-28 sm:px-8 lg:pb-20">
        <Link
          href="/produtos"
          className="inline-flex items-center gap-2 text-sm text-night-300 transition-colors hover:text-brand-500"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden /> Voltar ao catálogo
        </Link>

        <div className="mt-6 grid gap-10 lg:grid-cols-2">
          {/* galeria */}
          <div>
            <div className="aspect-square overflow-hidden rounded-2xl border border-white/10 bg-surface">
              {cover ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={cover} alt={product.imageAlt ?? product.name} className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full items-center justify-center text-night-400">Sem imagem</div>
              )}
            </div>
            {images.length > 1 && (
              <div className="mt-3 flex gap-3">
                {images.slice(0, 4).map((im, i) => {
                  const u = productImageUrl(im.path)
                  return (
                    <div key={i} className="h-20 w-20 overflow-hidden rounded-lg border border-white/10 bg-surface">
                      {u && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={u} alt={im.alt} className="h-full w-full object-cover" />
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* info */}
          <div>
            {product.brandName && (
              <span className="text-sm font-medium uppercase tracking-wide text-night-300">
                {product.brandName}
              </span>
            )}
            <h1 className="font-display text-3xl font-extrabold uppercase tracking-tight sm:text-4xl">
              {product.name}
            </h1>

            <div className="mt-5 flex items-baseline gap-3">
              <span className="text-3xl font-bold text-brand-500">{formatBRL(priceFrom)}</span>
              {compareAt && compareAt > priceFrom && (
                <span className="text-lg text-night-400 line-through">{formatBRL(compareAt)}</span>
              )}
            </div>
            <p className="mt-1 text-sm text-night-300">{formatInstallments(priceFrom, 10)}</p>

            {product.shortDescription && (
              <p className="mt-5 text-night-200">{product.shortDescription}</p>
            )}

            <TrackViewItem id={product.id} name={product.name} priceCents={priceFrom} />
            <AddToCart
              productId={product.id}
              slug={product.slug}
              name={product.name}
              imageUrl={cover ?? null}
              variants={cartVariants}
            />

            {product.description && (
              <div className="mt-10 border-t border-white/10 pt-6">
                <h2 className="mb-2 font-semibold text-white">Descrição</h2>
                <p className="whitespace-pre-line text-night-200">{product.description}</p>
              </div>
            )}
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  )
}
