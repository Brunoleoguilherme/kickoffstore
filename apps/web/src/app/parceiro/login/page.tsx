import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getCurrentPartnerOwner } from '@/lib/partners/portal'
import { PartnerLoginForm } from './login-form'

export const metadata: Metadata = { title: 'Portal do parceiro' }
export const dynamic = 'force-dynamic'

export default async function PartnerLoginPage() {
  const owner = await getCurrentPartnerOwner()
  if (owner) redirect('/parceiro/painel')

  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col justify-center px-6 py-16">
      <div className="mb-8 text-center">
        <span className="text-lg font-black text-brand-600">Clube da Estampa</span>
        <h1 className="mt-2 text-2xl font-bold">Portal do parceiro</h1>
        <p className="mt-1 text-sm text-night-500">
          Entre para personalizar a sua loja (cores, logo e mais).
        </p>
      </div>

      <div className="rounded-2xl border border-night-100 p-6 shadow-sm">
        <PartnerLoginForm />
      </div>

      <p className="mt-6 text-center text-xs text-night-500">
        Ainda não tem acesso? Fale com o Clube da Estampa para vincular sua loja.{' '}
        <Link href="/redefinir-senha" className="text-brand-600 hover:underline">
          Esqueci a senha
        </Link>
      </p>
    </div>
  )
}
