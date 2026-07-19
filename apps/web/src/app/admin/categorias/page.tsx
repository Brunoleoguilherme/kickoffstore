import type { Metadata } from 'next'
import { requirePermission } from '@/lib/auth/session'
import { createClient } from '@/lib/supabase/server'
import { CategoryForm } from './create-form'

export const metadata: Metadata = { title: 'Categorias' }

interface Row {
  id: string
  name: string
  slug: string
  active: boolean
  sort_order: number
}

export default async function CategoriasPage() {
  await requirePermission('catalog.read')
  const supabase = createClient()
  const { data } = await supabase
    .from('categories')
    .select('id, name, slug, active, sort_order')
    .order('sort_order', { ascending: true })
  const rows = (data ?? []) as unknown as Row[]

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Categorias</h1>
        <p className="text-sm text-night-500">Organize o catálogo por categoria.</p>
      </div>

      <section className="max-w-md rounded-xl border border-night-100 p-6">
        <h2 className="mb-4 font-semibold">Nova categoria</h2>
        <CategoryForm />
      </section>

      <section>
        <h2 className="mb-3 font-semibold">Categorias ({rows.length})</h2>
        <div className="overflow-hidden rounded-lg border border-night-100">
          <table className="w-full text-left text-sm">
            <thead className="bg-night-50 text-night-500">
              <tr>
                <th className="px-4 py-2 font-medium">Nome</th>
                <th className="px-4 py-2 font-medium">Slug</th>
                <th className="px-4 py-2 font-medium">Ordem</th>
                <th className="px-4 py-2 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((c) => (
                <tr key={c.id} className="border-t border-night-100">
                  <td className="px-4 py-2 font-medium">{c.name}</td>
                  <td className="px-4 py-2 text-night-500">{c.slug}</td>
                  <td className="px-4 py-2">{c.sort_order}</td>
                  <td className="px-4 py-2">
                    <span className="rounded-full bg-night-50 px-2 py-0.5 text-xs">
                      {c.active ? 'ativa' : 'inativa'}
                    </span>
                  </td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-6 text-center text-night-500">
                    Nenhuma categoria.
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
