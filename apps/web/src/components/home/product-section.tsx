import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import type { ProductSummary } from '@/lib/catalog/models'
import { HomeProductCard } from './product-card'

interface Props {
  id?: string
  label: string
  title: string
  description?: string
  products: ProductSummary[]
  badge?: 'novo'
  /** Reduz o espaço no topo (usado para encostar a seção no hero do parceiro). */
  tightTop?: boolean
}

export function ProductSection({ id, label, title, description, products, badge, tightTop }: Props) {
  if (products.length === 0) return null
  return (
    <section
      id={id}
      className={`mx-auto max-w-[1440px] px-6 pb-16 sm:px-8 ${tightTop ? 'pt-4' : 'pt-16'}`}
    >
      <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-md">
          <span className="text-xs font-semibold uppercase tracking-[0.3em] text-brand-500">{label}</span>
          <h2 className="mt-1 font-display text-3xl font-extrabold uppercase tracking-tight text-white">
            {title}
          </h2>
          {description && <p className="mt-2 text-night-300">{description}</p>}
        </div>
        <Link
          href="/produtos"
          className="group inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-brand-500 transition-colors hover:text-brand-400"
        >
          Ver todos
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden />
        </Link>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {products.map((p) => (
          <HomeProductCard key={p.id} product={p} badge={badge} />
        ))}
      </div>
    </section>
  )
}
