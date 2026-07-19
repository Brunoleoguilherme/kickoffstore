'use client'

import { useFormState } from 'react-dom'
import { signUpAction, type ActionState } from '@/lib/auth/actions'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { FormMessage } from '@/components/ui/form-message'
import { SubmitButton } from '@/components/auth/submit-button'
import { GoogleButton } from '@/components/auth/google-button'

const initial: ActionState = {}

export function SignUpForm() {
  const [state, formAction] = useFormState(signUpAction, initial)
  return (
    <div className="space-y-4">
      <GoogleButton next="/conta" />

      <div className="flex items-center gap-3 text-xs text-night-400">
        <span className="h-px flex-1 bg-night-100" />
        ou cadastre-se com e-mail
        <span className="h-px flex-1 bg-night-100" />
      </div>

      <form action={formAction} className="space-y-4">
      <FormMessage error={state.error} success={state.success} />
      <div>
        <Label htmlFor="fullName">Nome completo</Label>
        <Input id="fullName" name="fullName" autoComplete="name" required />
      </div>
      <div>
        <Label htmlFor="email">E-mail</Label>
        <Input id="email" name="email" type="email" autoComplete="email" required />
      </div>
      <div>
        <Label htmlFor="password">Senha</Label>
        <Input id="password" name="password" type="password" autoComplete="new-password" required />
        <p className="mt-1 text-xs text-night-500">Mín. 8 caracteres, com maiúscula, minúscula e número.</p>
      </div>
      <label className="flex items-start gap-2 text-sm text-night-800">
        <input type="checkbox" name="acceptTerms" className="mt-0.5" required />
        <span>
          Li e aceito os termos de uso e a política de privacidade.
        </span>
      </label>
        <SubmitButton className="w-full">Criar conta</SubmitButton>
      </form>
    </div>
  )
}
