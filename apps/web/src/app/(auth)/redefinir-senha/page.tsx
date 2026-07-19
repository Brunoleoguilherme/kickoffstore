import type { Metadata } from 'next'
import { UpdatePasswordForm } from './update-password-form'

export const metadata: Metadata = { title: 'Redefinir senha' }

export default function RedefinirSenhaPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold">Definir nova senha</h1>
      <p className="mb-6 mt-1 text-sm text-night-500">Escolha uma senha forte.</p>
      <UpdatePasswordForm />
    </div>
  )
}
