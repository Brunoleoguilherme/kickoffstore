import type { Metadata } from 'next'
import { requirePermission } from '@/lib/auth/session'
import { createClient } from '@/lib/supabase/server'
import { InviteStaffForm } from './invite-form'

export const metadata: Metadata = { title: 'Usuários' }

const ROLE_OPTIONS = [
  { code: 'support', label: 'Atendimento' },
  { code: 'warehouse', label: 'Estoque' },
  { code: 'catalog', label: 'Catálogo' },
  { code: 'finance', label: 'Financeiro' },
  { code: 'fiscal', label: 'Fiscal' },
  { code: 'manager', label: 'Gestão' },
  { code: 'admin', label: 'Administrador' },
]

export default async function UsuariosPage() {
  await requirePermission('users.manage')
  const supabase = createClient()
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, full_name, status, created_at')
    .order('created_at', { ascending: false })
    .limit(50)

  const rows = (profiles ?? []) as Array<{
    id: string
    full_name: string | null
    status: string
    created_at: string
  }>

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Usuários</h1>
        <p className="text-sm text-night-500">Convide equipe e atribua perfis de acesso.</p>
      </div>

      <section className="max-w-md rounded-xl border border-night-100 p-6">
        <h2 className="mb-4 font-semibold">Convidar membro da equipe</h2>
        <InviteStaffForm roleOptions={ROLE_OPTIONS} />
      </section>

      <section>
        <h2 className="mb-3 font-semibold">Membros ({rows.length})</h2>
        <div className="overflow-hidden rounded-lg border border-night-100">
          <table className="w-full text-left text-sm">
            <thead className="bg-night-50 text-night-500">
              <tr>
                <th className="px-4 py-2 font-medium">Nome</th>
                <th className="px-4 py-2 font-medium">Status</th>
                <th className="px-4 py-2 font-medium">Criado em</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((p) => (
                <tr key={p.id} className="border-t border-night-100">
                  <td className="px-4 py-2">{p.full_name ?? '—'}</td>
                  <td className="px-4 py-2">{p.status}</td>
                  <td className="px-4 py-2 text-night-500">
                    {new Date(p.created_at).toLocaleDateString('pt-BR')}
                  </td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={3} className="px-4 py-6 text-center text-night-500">
                    Nenhum usuário ainda.
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
