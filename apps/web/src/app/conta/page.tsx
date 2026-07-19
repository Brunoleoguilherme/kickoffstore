import type { Metadata } from 'next'
import { getUser, isStaff } from '@/lib/auth/session'
import Link from 'next/link'

export const metadata: Metadata = { title: 'Minha conta' }

export default async function ContaPage() {
  const user = await getUser()
  const staff = await isStaff()
  return (
    <div className="space-y-4">
      <h1 className="font-display text-2xl font-extrabold uppercase tracking-tight">Olá!</h1>
      <p className="text-night-300">
        Bem-vindo à sua área. Aqui você acompanha pedidos, endereços e favoritos.
      </p>
      {staff && (
        <Link
          href="/admin"
          className="inline-block rounded-lg bg-brand-500 px-4 py-2 text-sm font-semibold uppercase tracking-wide text-night-900 transition-colors hover:bg-brand-400"
        >
          Acessar painel administrativo
        </Link>
      )}
      <p className="text-xs text-night-500">Sessão: {user?.id}</p>
    </div>
  )
}
