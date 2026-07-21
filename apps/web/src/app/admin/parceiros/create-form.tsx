'use client'

import { useFormState } from 'react-dom'
import { createPartnerAction } from '@/lib/partners/partner-actions'
import type { ActionState } from '@/lib/auth/actions'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { FormMessage } from '@/components/ui/form-message'
import { SubmitButton } from '@/components/auth/submit-button'
import { ColorField } from '@/components/partners/color-field'

const initial: ActionState = {}

export function PartnerCreateForm() {
  const [state, formAction] = useFormState(createPartnerAction, initial)
  return (
    <form action={formAction} className="space-y-4">
      <FormMessage error={state.error} success={state.success} />
      <div>
        <Label htmlFor="name">Nome do parceiro</Label>
        <Input id="name" name="name" placeholder="BH Wolves" required />
      </div>
      <div>
        <Label htmlFor="slug">Subdomínio (slug)</Label>
        <Input id="slug" name="slug" placeholder="bhwolves" required />
        <p className="mt-1 text-xs text-night-500">Vira bhwolves.kickoffstore.com.br</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <ColorField name="primaryColor" label="Cor primária" defaultValue="#1e3a8a" />
        <ColorField name="accentColor" label="Cor de destaque" defaultValue="#f59e0b" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="logo">Logo do parceiro</Label>
          <input
            id="logo"
            type="file"
            name="logo"
            accept="image/png,image/jpeg,image/webp,image/svg+xml"
            className="block w-full text-sm text-night-700 file:mr-3 file:rounded-md file:border-0 file:bg-brand-600 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-brand-700"
          />
          <p className="mt-1 text-xs text-night-500">PNG, JPG, WEBP ou SVG, até 4 MB.</p>
        </div>
        <div>
          <Label htmlFor="banner">Banner da loja</Label>
          <input
            id="banner"
            type="file"
            name="banner"
            accept="image/png,image/jpeg,image/webp"
            className="block w-full text-sm text-night-700 file:mr-3 file:rounded-md file:border-0 file:bg-brand-600 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-brand-700"
          />
          <p className="mt-1 text-xs text-night-500">Imagem larga do topo, até 6 MB.</p>
        </div>
      </div>
      <div>
        <Label htmlFor="contactEmail">E-mail de contato</Label>
        <Input id="contactEmail" name="contactEmail" type="email" placeholder="contato@time.com" />
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <Label htmlFor="instagram">Instagram (URL)</Label>
          <Input id="instagram" name="instagram" placeholder="https://instagram.com/…" />
        </div>
        <div>
          <Label htmlFor="facebook">Facebook (URL)</Label>
          <Input id="facebook" name="facebook" placeholder="https://facebook.com/…" />
        </div>
        <div>
          <Label htmlFor="youtube">YouTube (URL)</Label>
          <Input id="youtube" name="youtube" placeholder="https://youtube.com/…" />
        </div>
      </div>
      <SubmitButton>Criar parceiro</SubmitButton>
    </form>
  )
}
