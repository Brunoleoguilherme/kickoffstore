import type { Metadata } from 'next'
import Link from 'next/link'
import { requireUser } from '@/lib/auth/session'

export const metadata: Metadata = { title: 'Meus favoritos' }

export default async function FavoritosPage() {
  await requireUser()
  return (
    <div className="space-y-4">
      <h1 className="font-display text-2xl font-extrabold uppercase tracking-tight">Meus favoritos</h1>
      <div className="rounded-xl border border-white/10 bg-surface p-8 text-center text-night-300">
        <p>Sua lista de favoritos está vazia.</p>
        <Link href="/produtos" className="mt-3 inline-block text-brand-400 hover:underline">
          Descobrir produtos
        </Link>
      </div>
    </div>
  )
}
