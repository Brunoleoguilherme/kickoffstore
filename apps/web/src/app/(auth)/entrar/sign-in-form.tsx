'use client'

import { useFormState } from 'react-dom'
import { signInAction, type ActionState } from '@/lib/auth/actions'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { FormMessage } from '@/components/ui/form-message'
import { SubmitButton } from '@/components/auth/submit-button'
import { GoogleButton } from '@/components/auth/google-button'

const initial: ActionState = {}

export function SignInForm() {
  const [state, formAction] = useFormState(signInAction, initial)
  return (
    <div className="space-y-4">
      <form action={formAction} className="space-y-4">
        <FormMessage error={state.error} success={state.success} />
        <div>
          <Label htmlFor="email">E-mail</Label>
          <Input id="email" name="email" type="email" autoComplete="email" required />
        </div>
        <div>
          <Label htmlFor="password">Senha</Label>
          <Input id="password" name="password" type="password" autoComplete="current-password" required />
        </div>
        <SubmitButton className="w-full">Entrar</SubmitButton>
      </form>

      <div className="flex items-center gap-3 text-xs text-night-400">
        <span className="h-px flex-1 bg-night-100" />
        ou
        <span className="h-px flex-1 bg-night-100" />
      </div>

      <GoogleButton next="/conta" />
    </div>
  )
}
