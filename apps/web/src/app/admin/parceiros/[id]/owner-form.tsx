'use client'

import { useFormState } from 'react-dom'
import {
  setPartnerOwnerAction,
  type OwnerActionState,
} from '@/lib/partners/partner-actions'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { FormMessage } from '@/components/ui/form-message'
import { SubmitButton } from '@/components/auth/submit-button'

const initial: OwnerActionState = {}

export function OwnerForm({ partnerId }: { partnerId: string }) {
  const [state, formAction] = useFormState(
    setPartnerOwnerAction.bind(null, partnerId),
    initial,
  )
  return (
    <form action={formAction} className="space-y-4">
      <FormMessage error={state.error} success={state.success} />
      <div>
        <Label htmlFor="email">E-mail do dono da loja</Label>
        <Input id="email" name="email" type="email" placeholder="dono@time.com" required />
        <p className="mt-1 text-xs text-night-500">
          Cria/vincula o acesso ao portal. Um link para definir a senha é gerado abaixo.
        </p>
      </div>
      <SubmitButton>Vincular dono</SubmitButton>

      {state.inviteLink && (
        <div className="rounded-md border border-night-200 bg-night-50 p-3">
          <p className="mb-1 text-xs font-semibold text-night-600">
            Envie este link para o parceiro definir a senha:
          </p>
          <textarea
            readOnly
            value={state.inviteLink}
            rows={3}
            onFocus={(e) => e.currentTarget.select()}
            className="w-full resize-none rounded border border-night-200 bg-white p-2 text-xs text-night-700"
          />
        </div>
      )}
    </form>
  )
}
