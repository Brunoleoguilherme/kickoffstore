'use client'

import { useFormState } from 'react-dom'
import { uploadPartnerLogoAction } from '@/lib/partners/portal-actions'
import type { ActionState } from '@/lib/auth/actions'
import { FormMessage } from '@/components/ui/form-message'
import { SubmitButton } from '@/components/auth/submit-button'

const initial: ActionState = {}

export function LogoForm({ currentLogo }: { currentLogo: string | null }) {
  const [state, formAction] = useFormState(uploadPartnerLogoAction, initial)
  return (
    <form action={formAction} className="space-y-4">
      <FormMessage error={state.error} success={state.success} />
      {currentLogo ? (
        <div className="flex items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={currentLogo}
            alt="Logo atual"
            className="h-14 w-auto max-w-[160px] rounded-md border border-night-100 object-contain p-1"
          />
          <span className="text-xs text-night-500">Logo atual</span>
        </div>
      ) : (
        <p className="text-sm text-night-500">Nenhum logo enviado ainda.</p>
      )}
      <input
        type="file"
        name="logo"
        accept="image/png,image/jpeg,image/webp,image/svg+xml"
        required
        className="block w-full text-sm text-night-700 file:mr-3 file:rounded-md file:border-0 file:bg-brand-600 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-brand-700"
      />
      <p className="text-xs text-night-500">PNG, JPG, WEBP ou SVG, até 4 MB.</p>
      <SubmitButton>Enviar logo</SubmitButton>
    </form>
  )
}
