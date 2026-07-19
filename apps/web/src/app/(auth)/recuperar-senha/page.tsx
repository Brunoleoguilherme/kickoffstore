import Link from 'next/link'
import type { Metadata } from 'next'
import { ResetRequestForm } from './reset-request-form'

export const metadata: Metadata = { title: 'Recuperar senha' }

export default function RecuperarSenhaPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold">Recuperar senha</h1>
      <p className="mb-6 mt-1 text-sm text-night-500">Enviaremos um link para redefinir sua senha.</p>
      <ResetRequestForm />
      <p className="mt-6 text-center text-sm">
        <Link href="/entrar" className="text-brand-600 hover:underline">
          Voltar para entrar
        </Link>
      </p>
    </div>
  )
}
