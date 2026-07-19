import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { requirePermission } from '@/lib/auth/session'
import { createAdminClient } from '@/lib/supabase/admin'
import { PartnerEditForm } from './edit-form'
import { ProductsManager, type ProductLite, type SharedProduct } from './products-manager'
import { OwnerForm } from './owner-form'

export const metadata: Metadata = { title: 'Parceiro' }
export const dynamic = 'force-dynamic'

interface PartnerRow {
  id: string
  name: string
  slug: string
  active: boolean
  primary_color: string | null
  accent_color: string | null
  logo_url: string | null
  banner_url: string | null
  contact_email: string | null
  instagram_url: string | null
  facebook_url: string | null
  youtube_url: string | null
}

interface ProductRow {
  id: string
  name: string
  status: string
  partner_id: string | null
}

export default async function ParceiroEditPage({ params }: { params: { id: string } }) {
  await requirePermission('catalog.write')
  const admin = createAdminClient()

  const { data: partnerData } = await admin
    .from('partners')
    .select(
      'id, name, slug, active, primary_color, accent_color, logo_url, banner_url, contact_email, instagram_url, facebook_url, youtube_url',
    )
    .eq('id', params.id)
    .maybeSingle()
  const partner = partnerData as unknown as PartnerRow | null
  if (!partner) notFound()

  const [{ data: productsData }, { data: linkData }] = await Promise.all([
    admin.from('products').select('id, name, status, partner_id').order('name', { ascending: true }),
    admin.from('partner_products').select('product_id').eq('partner_id', partner.id),
  ])
  const products = (productsData ?? []) as unknown as ProductRow[]
  const enabledIds = new Set(
    ((linkData ?? []) as unknown as Array<{ product_id: string }>).map((l) => l.product_id),
  )

  // Exclusivos deste parceiro.
  const exclusives: ProductLite[] = products
    .filter((p) => p.partner_id === partner.id)
    .map((p) => ({ id: p.id, name: p.name, status: p.status }))

  // Compartilhados = produtos sem dono (partner_id null), com flag de habilitado.
  const shared: SharedProduct[] = products
    .filter((p) => p.partner_id === null)
    .map((p) => ({ id: p.id, name: p.name, status: p.status, enabled: enabledIds.has(p.id) }))

  return (
    <div className="max-w-4xl space-y-8">
      <div>
        <Link
          href="/admin/parceiros"
          className="inline-flex items-center gap-2 text-sm text-night-500 transition-colors hover:text-brand-600"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden /> Voltar aos parceiros
        </Link>
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-bold">{partner.name}</h1>
          <span className="rounded-full bg-night-50 px-3 py-1 text-xs font-medium">
            {partner.active ? 'ativo' : 'inativo'}
          </span>
        </div>
        <p className="mt-1 text-sm text-night-500">{partner.slug}.kickoffstore.com.br</p>
      </div>

      <section className="rounded-xl border border-night-100 p-6">
        <h2 className="mb-4 font-semibold">Dados e marca</h2>
        <PartnerEditForm
          partnerId={partner.id}
          initial={{
            name: partner.name,
            slug: partner.slug,
            active: partner.active,
            primaryColor: partner.primary_color ?? '',
            accentColor: partner.accent_color ?? '',
            logoUrl: partner.logo_url ?? '',
            bannerUrl: partner.banner_url ?? '',
            contactEmail: partner.contact_email ?? '',
            instagram: partner.instagram_url ?? '',
            facebook: partner.facebook_url ?? '',
            youtube: partner.youtube_url ?? '',
          }}
        />
      </section>

      <section className="rounded-xl border border-night-100 p-6">
        <h2 className="mb-4 font-semibold">Catálogo do parceiro</h2>
        <ProductsManager partnerId={partner.id} exclusives={exclusives} shared={shared} />
      </section>

      <section className="rounded-xl border border-night-100 p-6">
        <h2 className="mb-1 font-semibold">Acesso ao portal</h2>
        <p className="mb-4 text-sm text-night-500">
          Defina quem pode entrar em <code>/parceiro/login</code> para personalizar esta loja
          (cores, logo, etc.).
        </p>
        <OwnerForm partnerId={partner.id} />
      </section>
    </div>
  )
}
