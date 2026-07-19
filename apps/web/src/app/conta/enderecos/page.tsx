import type { Metadata } from 'next'
import { requireUser } from '@/lib/auth/session'

export const metadata: Metadata = { title: 'Meus endereços' }

export default async function EnderecosPage() {
  await requireUser()
  return (
    <div className="space-y-4">
      <h1 className="font-display text-2xl font-extrabold uppercase tracking-tight">Meus endereços</h1>
      <div className="rounded-xl border border-white/10 bg-surface p-8 text-center text-night-300">
        <p>Você ainda não cadastrou endereços.</p>
        <p className="mt-1 text-sm text-night-400">
          O endereço de entrega é informado durante o checkout.
        </p>
      </div>
    </div>
  )
}
