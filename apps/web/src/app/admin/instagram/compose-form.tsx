'use client'

import { useFormState, useFormStatus } from 'react-dom'
import {
  publishInstagramPostAction,
  type InstagramActionState,
} from '@/lib/marketing/instagram-actions'

const initial: InstagramActionState = {}

function PublishButton() {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-md bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-700 disabled:opacity-50"
    >
      {pending ? 'Publicando…' : 'Publicar agora'}
    </button>
  )
}

export function ComposeForm() {
  const [state, action] = useFormState(publishInstagramPostAction, initial)
  return (
    <form action={action} className="space-y-4">
      <div>
        <label htmlFor="imageUrl" className="mb-1 block text-sm font-medium text-night-700">
          URL da imagem (JPEG, pública)
        </label>
        <input
          id="imageUrl"
          name="imageUrl"
          type="url"
          required
          placeholder="https://…/foto.jpg"
          className="h-11 w-full rounded-md border border-night-200 px-3 text-sm"
        />
        <p className="mt-1 text-xs text-night-500">
          A imagem precisa estar acessível publicamente. Em breve dá pra subir do computador.
        </p>
      </div>
      <div>
        <label htmlFor="caption" className="mb-1 block text-sm font-medium text-night-700">
          Legenda
        </label>
        <textarea
          id="caption"
          name="caption"
          rows={4}
          placeholder="Escreva a legenda do post… #kickoffstore"
          className="w-full rounded-md border border-night-200 px-3 py-2 text-sm"
        />
      </div>
      <div className="flex items-center gap-3">
        <PublishButton />
        {state.ok && (
          <span className="text-sm font-medium text-success">✓ Publicado! (id {state.postId})</span>
        )}
        {state.error && <span className="text-sm text-danger">{state.error}</span>}
      </div>
    </form>
  )
}
