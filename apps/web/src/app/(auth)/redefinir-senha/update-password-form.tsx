'use client'

import { useFormState } from 'react-dom'
import { updatePasswordAction, type ActionState } from '@/lib/auth/actions'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { FormMessage } from '@/components/ui/form-message'
import { SubmitButton } from '@/components/auth/submit-button'

const initial: ActionState = {}

export function UpdatePasswordForm() {
  const [state, formAction] = useFormState(updatePasswordAction, initial)
  return (
    <form action={formAction} className="space-y-4">
      <FormMessage error={state.error} success={state.success} />
      <div>
        <Label htmlFor="password">Nova senha</Label>
        <Input id="password" name="password" type="password" autoComplete="new-password" required />
      </div>
      <SubmitButton className="w-full">Salvar senha</SubmitButton>
    </form>
  )
}
