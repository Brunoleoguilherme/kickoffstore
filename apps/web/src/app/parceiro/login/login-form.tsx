'use client'

import { useFormState } from 'react-dom'
import { partnerSignInAction } from '@/lib/partners/portal-actions'
import type { ActionState } from '@/lib/auth/actions'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { FormMessage } from '@/components/ui/form-message'
import { SubmitButton } from '@/components/auth/submit-button'

const initial: ActionState = {}

export function PartnerLoginForm() {
  const [state, formAction] = useFormState(partnerSignInAction, initial)
  return (
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
      <SubmitButton>Entrar</SubmitButton>
    </form>
  )
}
