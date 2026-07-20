import Link from 'next/link'
import { requireUser } from '@/lib/auth/session'
import { signOutAction } from '@/lib/auth/actions'

export const dynamic = 'force-dynamic'

export default async function ContaLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser()
  return (
    <div className="min-h-dvh bg-night-900 text-white">
      <div className="mx-auto max-w-5xl px-6 py-10">
        <header className="mb-8 flex items-center justify-between border-b border-white/10 pb-5">
          <div>
            <Link href="/" className="font-display text-xl font-extrabold uppercase tracking-tight text-white">
              CLUBE DA ESTAMPA<span className="text-brand-500">STORE</span>
            </Link>
            <p className="mt-1 text-sm text-night-300">Minha conta · {user.email}</p>
          </div>
          <form action={signOutAction}>
            <button className="text-sm font-medium text-night-200 transition-colors hover:text-danger">
              Sair
            </button>
          </form>
        </header>
        <div className="grid gap-8 md:grid-cols-[200px_1fr]">
          <nav className="flex flex-col gap-1 text-sm">
            <Link href="/conta" className="rounded-md px-3 py-2 text-night-200 transition-colors hover:bg-white/5 hover:text-brand-400">
              Visão geral
            </Link>
            <Link href="/conta/pedidos" className="rounded-md px-3 py-2 text-night-200 transition-colors hover:bg-white/5 hover:text-brand-400">
              Pedidos
            </Link>
            <Link href="/conta/enderecos" className="rounded-md px-3 py-2 text-night-200 transition-colors hover:bg-white/5 hover:text-brand-400">
              Endereços
            </Link>
            <Link href="/conta/favoritos" className="rounded-md px-3 py-2 text-night-200 transition-colors hover:bg-white/5 hover:text-brand-400">
              Favoritos
            </Link>
          </nav>
          <main>{children}</main>
        </div>
      </div>
    </div>
  )
}
