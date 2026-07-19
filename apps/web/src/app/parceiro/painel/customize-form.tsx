'use client'

import { useFormState } from 'react-dom'
import { updateOwnPartnerAction } from '@/lib/partners/portal-actions'
import type { ActionState } from '@/lib/auth/actions'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { FormMessage } from '@/components/ui/form-message'
import { SubmitButton } from '@/components/auth/submit-button'
import { ColorField } from '@/components/partners/color-field'

const initial: ActionState = {}

export interface CustomizeInitial {
  name: string
  tagline: string
  primaryColor: string
  accentColor: string
  contactEmail: string
  instagram: string
  facebook: string
  youtube: string
}

export function CustomizeForm({ initial: p }: { initial: CustomizeInitial }) {
  const [state, formAction] = useFormState(updateOwnPartnerAction, initial)
  return (
    <form action={formAction} className="space-y-4">
      <FormMessage error={state.error} success={state.success} />
      <div>
        <Label htmlFor="name">Nome da loja</Label>
        <Input id="name" name="name" defaultValue={p.name} required />
      </div>
      <div>
        <Label htmlFor="tagline">Frase de destaque</Label>
        <Input id="tagline" name="tagline" defaultValue={p.tagline} placeholder="Vista as cores do time." />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <ColorField name="primaryColor" label="Cor primária" defaultValue={p.primaryColor || '#1e3a8a'} />
        <ColorField name="accentColor" label="Cor de destaque" defaultValue={p.accentColor || '#f59e0b'} />
      </div>
      <div>
        <Label htmlFor="contactEmail">E-mail de contato</Label>
        <Input id="contactEmail" name="contactEmail" type="email" defaultValue={p.contactEmail} />
      </div>
      <div>
        <Label htmlFor="instagram">Instagram (URL)</Label>
        <Input id="instagram" name="instagram" defaultValue={p.instagram} placeholder="https://instagram.com/…" />
      </div>
      <div>
        <Label htmlFor="facebook">Facebook (URL)</Label>
        <Input id="facebook" name="facebook" defaultValue={p.facebook} placeholder="https://facebook.com/…" />
      </div>
      <div>
        <Label htmlFor="youtube">YouTube (URL)</Label>
        <Input id="youtube" name="youtube" defaultValue={p.youtube} placeholder="https://youtube.com/…" />
      </div>
      <SubmitButton>Salvar personalização</SubmitButton>
    </form>
  )
}
