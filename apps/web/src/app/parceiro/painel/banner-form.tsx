'use client'

import { useFormState } from 'react-dom'
import { uploadPartnerBannerAction } from '@/lib/partners/portal-actions'
import type { ActionState } from '@/lib/auth/actions'
import { FormMessage } from '@/components/ui/form-message'
import { SubmitButton } from '@/components/auth/submit-button'

const initial: ActionState = {}

export function BannerForm({ currentBanner }: { currentBanner: string | null }) {
  const [state, formAction] = useFormState(uploadPartnerBannerAction, initial)
  return (
    <form action={formAction} className="space-y-4">
      <FormMessage error={state.error} success={state.success} />
      {currentBanner ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={currentBanner}
          alt="Banner atual"
          className="h-28 w-full rounded-md border border-night-100 object-cover"
        />
      ) : (
        <p className="text-sm text-night-500">Nenhum banner enviado ainda.</p>
      )}
      <input
        type="file"
        name="banner"
        accept="image/png,image/jpeg,image/webp"
        required
        className="block w-full text-sm text-night-700 file:mr-3 file:rounded-md file:border-0 file:bg-brand-600 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-brand-700"
      />
      <p className="text-xs text-night-500">Imagem larga do topo (hero). PNG, JPG ou WEBP, até 6 MB.</p>
      <SubmitButton>Enviar banner</SubmitButton>
    </form>
  )
}
