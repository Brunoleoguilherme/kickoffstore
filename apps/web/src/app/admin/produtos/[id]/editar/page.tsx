import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { requirePermission } from '@/lib/auth/session'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { productImageUrl } from '@/lib/catalog/image'
import { formatBRL } from '@clubedaestampa/ui'
import { EditForm } from './edit-form'
import { ImagesManager, type ImageItem } from './images-manager'
import { ProductActions } from './product-actions'
import { VariantDimensions } from './variant-dimensions'

export const metadata: Metadata = { title: 'Editar produto' }

interface RawProduct {
  id: string
  name: string
  slug: string
  short_description: string | null
  description: string | null
  status: string
  brand_id: string | null
  primary_category_id: string | null
  sport_id: string | null
  show_in_main: boolean
  home_sections: string[] | null
  product_images: Array<{ id: string; storage_path: string; alt_text: string; is_primary: boolean; sort_order: number }>
  product_variants: Array<{
    id: string
    sku: string
    color: string | null
    size: string | null
    price_cents: number
    weight_grams: number | null
    width_cm: number | null
    height_cm: number | null
    length_cm: number | null
  }>
}

interface Taxon {
  id: string
  name: string
}

export default async function EditarProdutoPage({ params }: { params: { id: string } }) {
  await requirePermission('catalog.write')
  const supabase = createClient()
  const { data } = await supabase
    .from('products')
    .select(
      'id, name, slug, short_description, description, status, brand_id, primary_category_id, sport_id, show_in_main, home_sections, product_images(id, storage_path, alt_text, is_primary, sort_order), product_variants(id, sku, color, size, price_cents, weight_grams, width_cm, height_cm, length_cm)',
    )
    .eq('id', params.id)
    .maybeSingle()

  if (!data) notFound()
  const p = data as unknown as RawProduct

  // Listas para os seletores (serviço, sempre carregam no admin).
  const admin = createAdminClient()
  const [catsRes, brandsRes, sportsRes, partnersRes, ppRes] = await Promise.all([
    admin.from('categories').select('id, name').order('name'),
    admin.from('brands').select('id, name').order('name'),
    admin.from('sports').select('id, name').order('name'),
    admin.from('partners').select('id, name').eq('active', true).order('name'),
    admin.from('partner_products').select('partner_id').eq('product_id', params.id),
  ])
  const categories = (catsRes.data ?? []) as unknown as Taxon[]
  const brands = (brandsRes.data ?? []) as unknown as Taxon[]
  const sports = (sportsRes.data ?? []) as unknown as Taxon[]
  const partners = (partnersRes.data ?? []) as unknown as Taxon[]
  const selectedPartnerIds = ((ppRes.data ?? []) as Array<{ partner_id: string }>).map(
    (r) => r.partner_id,
  )

  const images: ImageItem[] = p.product_images
    .slice()
    .sort((a, b) => Number(b.is_primary) - Number(a.is_primary) || a.sort_order - b.sort_order)
    .map((i) => ({
      id: i.id,
      url: productImageUrl(i.storage_path),
      alt: i.alt_text,
      isPrimary: i.is_primary,
    }))

  return (
    <div className="max-w-4xl space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <Link href="/admin/produtos" className="text-sm text-brand-600 hover:underline">
            ← Voltar
          </Link>
          <h1 className="text-2xl font-bold">Editar: {p.name}</h1>
          <p className="text-sm text-night-500">/{p.slug}</p>
        </div>
        <Link
          href={`/produtos/${p.slug}`}
          className="text-sm font-semibold text-brand-600 hover:underline"
          target="_blank"
        >
          Ver na loja ↗
        </Link>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        <section className="rounded-xl border border-night-100 p-6">
          <h2 className="mb-4 font-semibold">Dados do produto</h2>
          <EditForm
            productId={p.id}
            initial={{
              name: p.name,
              shortDescription: p.short_description ?? '',
              description: p.description ?? '',
              status: p.status,
              categoryId: p.primary_category_id ?? '',
              brandId: p.brand_id ?? '',
              sportId: p.sport_id ?? '',
              showInMain: p.show_in_main,
              sections: p.home_sections ?? [],
            }}
            categories={categories}
            brands={brands}
            sports={sports}
            partners={partners}
            selectedPartnerIds={selectedPartnerIds}
          />
        </section>

        <section className="rounded-xl border border-night-100 p-6">
          <h2 className="mb-4 font-semibold">Imagens</h2>
          <ImagesManager productId={p.id} images={images} />
        </section>
      </div>

      <section>
        <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-semibold">Variações ({p.product_variants.length})</h2>
          <span className="text-xs text-night-500">
            Preços:{' '}
            {p.product_variants.map((v) => `${v.sku} ${formatBRL(v.price_cents)}`).join(' · ') || '—'}
          </span>
        </div>
        <p className="mb-3 text-sm text-night-500">
          Peso e medidas alimentam o cálculo de frete. Preencha os valores reais da embalagem de cada
          variação.
        </p>
        <VariantDimensions
          variants={p.product_variants.map((v) => ({
            id: v.id,
            sku: v.sku,
            color: v.color,
            size: v.size,
            weightGrams: Number(v.weight_grams ?? 0),
            widthCm: Number(v.width_cm ?? 0),
            heightCm: Number(v.height_cm ?? 0),
            lengthCm: Number(v.length_cm ?? 0),
          }))}
        />
      </section>

      <section className="rounded-xl border border-danger/30 p-6">
        <h2 className="mb-1 font-semibold">Ações do produto</h2>
        <p className="mb-4 text-sm text-night-500">Despublicar remove o produto da loja sem apagá-lo. Excluir remove de vez (ou arquiva, se houver vendas).</p>
        <ProductActions productId={p.id} status={p.status} />
      </section>
    </div>
  )
}
