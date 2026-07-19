'use client'

import { useTransition } from 'react'
import { deleteProductAction, setProductStatusAction } from '@/lib/catalog/product-edit-actions'

export function ProductActions({ productId, status }: { productId: string; status: string }) {
  const [pending, startTransition] = useTransition()
  const isActive = status === 'active'

  function togglePublish() {
    startTransition(async () => {
      await setProductStatusAction(productId, isActive ? 'archived' : 'active')
    })
  }

  function remove() {
    if (!confirm('Excluir este produto? Se ele não tiver vendas, será apagado de vez. Esta ação não pode ser desfeita.')) {
      return
    }
    startTransition(async () => {
      await deleteProductAction(productId)
    })
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <button
        onClick={togglePublish}
        disabled={pending}
        className="rounded-md border border-night-200 px-4 py-2 text-sm font-semibold uppercase tracking-wide transition-colors hover:bg-night-50 disabled:opacity-50"
      >
        {isActive ? 'Despublicar do site' : 'Publicar na loja'}
      </button>
      <button
        onClick={remove}
        disabled={pending}
        className="rounded-md border border-danger/40 px-4 py-2 text-sm font-semibold uppercase tracking-wide text-danger transition-colors hover:bg-danger/10 disabled:opacity-50"
      >
        Excluir produto
      </button>
      {pending && <span className="text-sm text-night-500">Processando…</span>}
    </div>
  )
}
