import type { Metadata } from 'next'
import Link from 'next/link'
import { requirePermission } from '@/lib/auth/session'
import { createAdminClient } from '@/lib/supabase/admin'
import { PartnerCreateForm } from './create-form'

export const metadata: Metadata = { title: 'Parceiros' }
export const dynamic = 'force-dynamic'

interface Row {
  id: string
  name: string
  slug: string
  active: boolean
  primary_color: string | null
}

export default async function ParceirosPage() {
  await requirePermission('catalog.read')
  const admin = createAdminClient()
  const { data } = await admin
    .from('partners')
    .select('id, name, slug, active, primary_color')
    .order('name', { ascending: true })
  const rows = (data ?? []) as unknown as Row[]

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Parceiros</h1>
        <p className="text-sm text-night-500">
          Lojas white-label por subdomínio (ex.: <code>bhwolves.kickoffstore.com.br</code>). Cada
          parceiro tem sua marca e seu catálogo; o estoque e os pedidos são centrais.
        </p>
      </div>

      <section className="max-w-lg rounded-xl border border-night-100 p-6">
        <h2 className="mb-4 font-semibold">Novo parceiro</h2>
        <PartnerCreateForm />
      </section>

      <section>
        <h2 className="mb-3 font-semibold">Parceiros ({rows.length})</h2>
        <div className="overflow-hidden rounded-lg border border-night-100">
          <table className="w-full text-left text-sm">
            <thead className="bg-night-50 text-night-500">
              <tr>
                <th className="px-4 py-2 font-medium">Nome</th>
                <th className="px-4 py-2 font-medium">Subdomínio</th>
                <th className="px-4 py-2 font-medium">Status</th>
                <th className="px-4 py-2" />
              </tr>
            </thead>
            <tbody>
              {rows.map((p) => (
                <tr key={p.id} className="border-t border-night-100">
                  <td className="px-4 py-2">
                    <span className="inline-flex items-center gap-2 font-medium">
                      <span
                        aria-hidden
                        className="inline-block h-3 w-3 rounded-full border border-night-200"
                        style={{ background: p.primary_color ?? '#e5e7eb' }}
                      />
                      {p.name}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-night-500">{p.slug}.kickoffstore.com.br</td>
                  <td className="px-4 py-2">
                    <span className="rounded-full bg-night-50 px-2 py-0.5 text-xs">
                      {p.active ? 'ativo' : 'inativo'}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-right">
                    <Link
                      href={`/admin/parceiros/${p.id}`}
                      className="text-sm font-medium text-brand-600 hover:underline"
                    >
                      Gerenciar
                    </Link>
                  </td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-6 text-center text-night-500">
                    Nenhum parceiro ainda.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}
