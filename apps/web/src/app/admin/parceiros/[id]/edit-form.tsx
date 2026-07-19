'use client'

import { useFormState } from 'react-dom'
import { updatePartnerAction } from '@/lib/partners/partner-actions'
import type { ActionState } from '@/lib/auth/actions'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { FormMessage } from '@/components/ui/form-message'
import { SubmitButton } from '@/components/auth/submit-button'
import { ColorField } from '@/components/partners/color-field'

const initial: ActionState = {}

export interface PartnerInitial {
  name: string
  slug: string
  active: boolean
  primaryColor: string
  accentColor: string
  logoUrl: string
  bannerUrl: string
  contactEmail: string
  instagram: string
  facebook: string
  youtube: string
}

export function PartnerEditForm({
  partnerId,
  initial: p,
}: {
  partnerId: string
  initial: PartnerInitial
}) {
  const [state, formAction] = useFormState(updatePartnerAction.bind(null, partnerId), initial)
  return (
    <form action={formAction} className="space-y-4">
      <FormMessage error={state.error} success={state.success} />
      <div>
        <Label htmlFor="name">Nome do parceiro</Label>
        <Input id="name" name="name" defaultValue={p.name} required />
      </div>
      <div>
        <Label htmlFor="slug">Subdomínio (slug)</Label>
        <Input id="slug" name="slug" defaultValue={p.slug} required />
        <p className="mt-1 text-xs text-night-500">{p.slug}.kickoffstore.com.br</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <ColorField name="primaryColor" label="Cor primária" defaultValue={p.primaryColor || '#1e3a8a'} />
        <ColorField name="accentColor" label="Cor de destaque" defaultValue={p.accentColor || '#f59e0b'} />
      </div>
      <div>
        <Label htmlFor="logo">Logo do parceiro</Label>
        {p.logoUrl ? (
          <div className="mb-2 flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={p.logoUrl}
              alt="Logo atual"
              className="h-12 w-auto max-w-[140px] rounded-md border border-night-100 object-contain p-1"
            />
            <span className="text-xs text-night-500">Logo atual (envie um novo para trocar)</span>
          </div>
        ) : null}
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
        {p.bannerUrl ? (
          <div className="mb-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={p.bannerUrl}
              alt="Banner atual"
              className="h-24 w-full rounded-md border border-night-100 object-cover"
            />
            <span className="text-xs text-night-500">Banner atual (envie um novo para trocar)</span>
          </div>
        ) : null}
        <input
          id="banner"
          type="file"
          name="banner"
          accept="image/png,image/jpeg,image/webp"
          className="block w-full text-sm text-night-700 file:mr-3 file:rounded-md file:border-0 file:bg-brand-600 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-brand-700"
        />
        <p className="mt-1 text-xs text-night-500">Imagem larga do topo (hero), até 6 MB.</p>
      </div>
      <div>
        <Label htmlFor="contactEmail">E-mail de contato</Label>
        <Input id="contactEmail" name="contactEmail" type="email" defaultValue={p.contactEmail} />
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
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
      </div>
      <label className="flex items-center gap-2 text-sm text-night-700">
        <input type="checkbox" name="active" defaultChecked={p.active} className="h-4 w-4" />
        Parceiro ativo (subdomínio publicado)
      </label>
      <SubmitButton>Salvar</SubmitButton>
    </form>
  )
}
