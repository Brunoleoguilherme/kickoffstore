import Link from 'next/link'
import type { Metadata } from 'next'
import { SignInForm } from './sign-in-form'

export const metadata: Metadata = { title: 'Entrar' }

export default function EntrarPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold">Entrar</h1>
      <p className="mb-6 mt-1 text-sm text-night-500">Acesse sua conta Kickoffstore.</p>
      <SignInForm />
      <div className="mt-6 flex items-center justify-between text-sm">
        <Link href="/recuperar-senha" className="text-brand-600 hover:underline">
          Esqueci a senha
        </Link>
        <Link href="/criar-conta" className="text-brand-600 hover:underline">
          Criar conta
        </Link>
      </div>
    </div>
  )
}
