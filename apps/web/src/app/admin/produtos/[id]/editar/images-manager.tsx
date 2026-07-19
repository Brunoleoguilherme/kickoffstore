'use client'

import { useFormState } from 'react-dom'
import {
  uploadProductImageAction,
  deleteProductImageAction,
  setPrimaryImageAction,
} from '@/lib/catalog/product-edit-actions'
import type { ActionState } from '@/lib/auth/actions'
import { Label } from '@/components/ui/label'
import { FormMessage } from '@/components/ui/form-message'
import { SubmitButton } from '@/components/auth/submit-button'

export interface ImageItem {
  id: string
  url: string | null
  alt: string
  isPrimary: boolean
}

const initialState: ActionState = {}

export function ImagesManager({ productId, images }: { productId: string; images: ImageItem[] }) {
  const upload = uploadProductImageAction.bind(null, productId)
  const [state, formAction] = useFormState(upload, initialState)

  return (
    <div className="space-y-5">
      <form action={formAction} className="space-y-3 rounded-lg border border-night-100 p-4">
        <FormMessage error={state.error} success={state.success} />
        <div>
          <Label htmlFor="file">Enviar nova imagem (JPG, PNG, WEBP • máx. 8 MB)</Label>
          <input
            id="file"
            name="file"
            type="file"
            accept="image/jpeg,image/png,image/webp,image/avif"
            required
            className="block w-full text-sm file:mr-3 file:rounded-md file:border-0 file:bg-brand-500 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-night-900 hover:file:bg-brand-400"
          />
        </div>
        <div>
          <Label htmlFor="altText">Texto alternativo (acessibilidade)</Label>
          <input
            id="altText"
            name="altText"
            placeholder="Ex.: Chuteira preta e dourada vista de lado"
            className="flex h-11 w-full rounded-md border border-night-100 px-3 text-sm"
          />
        </div>
        <SubmitButton>Enviar imagem</SubmitButton>
      </form>

      {images.length === 0 ? (
        <p className="text-sm text-night-500">Nenhuma imagem ainda.</p>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          {images.map((img) => (
            <div key={img.id} className="overflow-hidden rounded-lg border border-night-100">
              <div className="relative aspect-square bg-night-50">
                {img.url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={img.url} alt={img.alt} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full items-center justify-center text-xs text-night-500">
                    Sem prévia
                  </div>
                )}
                {img.isPrimary && (
                  <span className="absolute left-2 top-2 rounded bg-brand-500 px-2 py-0.5 text-xs font-bold text-night-900">
                    Principal
                  </span>
                )}
              </div>
              <div className="flex items-center justify-between gap-2 p-2 text-xs">
                {!img.isPrimary && (
                  <form action={setPrimaryImageAction.bind(null, img.id)}>
                    <button className="font-medium text-brand-600 hover:underline">
                      Tornar principal
                    </button>
                  </form>
                )}
                <form action={deleteProductImageAction.bind(null, img.id)} className="ml-auto">
                  <button className="font-medium text-danger hover:underline">Excluir</button>
                </form>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
