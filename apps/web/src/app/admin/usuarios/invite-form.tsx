'use client'

import { useFormState } from 'react-dom'
import { inviteStaffAction } from '@/lib/auth/staff'
import type { ActionState } from '@/lib/auth/actions'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { FormMessage } from '@/components/ui/form-message'
import { SubmitButton } from '@/components/auth/submit-button'

const initial: ActionState = {}

export function InviteStaffForm({ roleOptions }: { roleOptions: Array<{ code: string; label: string }> }) {
  const [state, formAction] = useFormState(inviteStaffAction, initial)
  return (
    <form action={formAction} className="space-y-4">
      <FormMessage error={state.error} success={state.success} />
      <div>
        <Label htmlFor="fullName">Nome</Label>
        <Input id="fullName" name="fullName" required />
      </div>
      <div>
        <Label htmlFor="email">E-mail</Label>
        <Input id="email" name="email" type="email" required />
      </div>
      <div>
        <Label htmlFor="roleCode">Perfil de acesso</Label>
        <select
          id="roleCode"
          name="roleCode"
          required
          className="flex h-11 w-full rounded-md border border-night-100 bg-white px-3 text-sm"
        >
          {roleOptions.map((r) => (
            <option key={r.code} value={r.code}>
              {r.label}
            </option>
          ))}
        </select>
      </div>
      <SubmitButton>Enviar convite</SubmitButton>
    </form>
  )
}
