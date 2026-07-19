import Link from 'next/link'
import type { Metadata } from 'next'
import { SignUpForm } from './sign-up-form'

export const metadata: Metadata = { title: 'Criar conta' }

export default function CriarContaPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold">Criar conta</h1>
      <p className="mb-6 mt-1 text-sm text-night-500">Leva menos de um minuto.</p>
      <SignUpForm />
      <p className="mt-6 text-center text-sm text-night-500">
        Já tem conta?{' '}
        <Link href="/entrar" className="text-brand-600 hover:underline">
          Entrar
        </Link>
      </p>
    </div>
  )
}
