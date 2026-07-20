import Link from 'next/link'
import { redirect } from 'next/navigation'
import { requireUser, isStaff, getUserPermissions } from '@/lib/auth/session'
import { signOutAction } from '@/lib/auth/actions'

export const dynamic = 'force-dynamic'

const NAV: Array<{ href: string; label: string; perm?: string }> = [
  { href: '/admin', label: 'Dashboard' },
  { href: '/admin/produtos', label: 'Produtos', perm: 'catalog.read' },
  { href: '/admin/categorias', label: 'Categorias', perm: 'catalog.read' },
  { href: '/admin/marcas', label: 'Marcas', perm: 'catalog.read' },
  { href: '/admin/estoque', label: 'Estoque', perm: 'inventory.read' },
  { href: '/admin/pedidos', label: 'Pedidos', perm: 'orders.read' },
  { href: '/admin/parceiros', label: 'Parceiros', perm: 'catalog.read' },
  { href: '/admin/cupons', label: 'Cupons', perm: 'catalog.read' },
  { href: '/admin/relatorios', label: 'Relatórios' },
  { href: '/admin/campanhas', label: 'Campanhas' },
  { href: '/admin/instagram', label: 'Instagram' },
  { href: '/admin/usuarios', label: 'Usuários', perm: 'users.manage' },
]

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireUser()
  const staff = await isStaff()
  if (!staff) redirect('/conta')
  const perms = await getUserPermissions()

  return (
    <div
      className="relative flex min-h-dvh bg-cover bg-fixed bg-center"
      style={{ backgroundImage: "url('/admin-bg.jpg')" }}
    >
      {/* camada clara para legibilidade sobre o fundo de marca */}
      <div aria-hidden className="pointer-events-none absolute inset-0 bg-white/55" />

      <aside className="relative z-10 w-60 shrink-0 border-r border-night-100 bg-white/80 p-4 backdrop-blur">
        <Link href="/admin" className="text-lg font-black text-brand-600">
          Clube da Estampa
        </Link>
        <p className="mb-4 text-xs uppercase tracking-wide text-night-500">Administração</p>
        <nav className="flex flex-col gap-1 text-sm">
          {NAV.filter((n) => !n.perm || perms.has(n.perm)).map((n) => (
            <Link
              key={n.href}
              href={n.href}
              className="rounded-md px-3 py-2 transition-colors hover:bg-brand-500/10 hover:text-brand-700"
            >
              {n.label}
            </Link>
          ))}
        </nav>
        <form action={signOutAction} className="mt-6">
          <button className="text-sm text-night-500 hover:text-danger">Sair</button>
        </form>
      </aside>

      <main className="relative z-10 flex-1 p-8">{children}</main>
    </div>
  )
}
