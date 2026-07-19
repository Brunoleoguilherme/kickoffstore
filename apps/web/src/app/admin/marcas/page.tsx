import type { Metadata } from 'next'
import { requirePermission } from '@/lib/auth/session'
import { createClient } from '@/lib/supabase/server'
import { BrandForm } from './create-form'

export const metadata: Metadata = { title: 'Marcas' }

interface Row {
  id: string
  name: string
  slug: string
  active: boolean
}

export default async function MarcasPage() {
  await requirePermission('catalog.read')
  const supabase = createClient()
  const { data } = await supabase
    .from('brands')
    .select('id, name, slug, active')
    .order('name', { ascending: true })
  const rows = (data ?? []) as unknown as Row[]

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Marcas</h1>
        <p className="text-sm text-night-500">Marcas disponíveis no catálogo.</p>
      </div>

      <section className="max-w-md rounded-xl border border-night-100 p-6">
        <h2 className="mb-4 font-semibold">Nova marca</h2>
        <BrandForm />
      </section>

      <section>
        <h2 className="mb-3 font-semibold">Marcas ({rows.length})</h2>
        <div className="overflow-hidden rounded-lg border border-night-100">
          <table className="w-full text-left text-sm">
            <thead className="bg-night-50 text-night-500">
              <tr>
                <th className="px-4 py-2 font-medium">Nome</th>
                <th className="px-4 py-2 font-medium">Slug</th>
                <th className="px-4 py-2 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((b) => (
                <tr key={b.id} className="border-t border-night-100">
                  <td className="px-4 py-2 font-medium">{b.name}</td>
                  <td className="px-4 py-2 text-night-500">{b.slug}</td>
                  <td className="px-4 py-2">
                    <span className="rounded-full bg-night-50 px-2 py-0.5 text-xs">
                      {b.active ? 'ativa' : 'inativa'}
                    </span>
                  </td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={3} className="px-4 py-6 text-center text-night-500">
                    Nenhuma marca.
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
