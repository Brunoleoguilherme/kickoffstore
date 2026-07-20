import type { Metadata } from 'next'
import Link from 'next/link'
import { requirePermission } from '@/lib/auth/session'
import { createClient } from '@/lib/supabase/server'
import { formatBRL } from '@clubedaestampa/ui'

export const metadata: Metadata = { title: 'Produtos' }

interface Row {
  id: string
  name: string
  slug: string
  status: string
  product_variants: Array<{ price_cents: number }>
}

export default async function AdminProdutosPage() {
  await requirePermission('catalog.read')
  const supabase = createClient()
  const { data } = await supabase
    .from('products')
    .select('id, name, slug, status, product_variants(price_cents)')
    .order('created_at', { ascending: false })
    .limit(100)
  const rows = (data ?? []) as unknown as Row[]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Produtos</h1>
        <div className="flex gap-2">
          <Link
            href="/admin/produtos/importar"
            className="rounded-md border border-night-100 px-4 py-2 text-sm font-semibold hover:bg-night-50"
          >
            Importar CSV
          </Link>
          <Link
            href="/admin/produtos/novo"
            className="rounded-md bg-brand-500 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-600"
          >
            Novo produto
          </Link>
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border border-night-100">
        <table className="w-full text-left text-sm">
          <thead className="bg-night-50 text-night-500">
            <tr>
              <th className="px-4 py-2 font-medium">Nome</th>
              <th className="px-4 py-2 font-medium">Slug</th>
              <th className="px-4 py-2 font-medium">Status</th>
              <th className="px-4 py-2 font-medium">A partir de</th>
              <th className="px-4 py-2 font-medium">Ação</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((p) => {
              const prices = p.product_variants.map((v) => v.price_cents)
              const from = prices.length ? Math.min(...prices) : 0
              return (
                <tr key={p.id} className="border-t border-night-100">
                  <td className="px-4 py-2 font-medium">{p.name}</td>
                  <td className="px-4 py-2 text-night-500">{p.slug}</td>
                  <td className="px-4 py-2">
                    <span className="rounded-full bg-night-50 px-2 py-0.5 text-xs">{p.status}</span>
                  </td>
                  <td className="px-4 py-2">{formatBRL(from)}</td>
                  <td className="px-4 py-2"><Link href={`/admin/produtos/${p.id}/editar`} className="font-medium text-brand-600 hover:underline">Editar</Link></td>
                </tr>
              )
            })}
            {rows.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-night-500">
                  Nenhum produto. Crie o primeiro.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
