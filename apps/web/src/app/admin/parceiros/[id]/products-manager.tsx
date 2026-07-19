'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
  toggleSharedProductAction,
  setExclusiveProductAction,
} from '@/lib/partners/partner-actions'

export interface ProductLite {
  id: string
  name: string
  status: string
}

export interface SharedProduct extends ProductLite {
  enabled: boolean
}

export function ProductsManager({
  partnerId,
  exclusives,
  shared,
}: {
  partnerId: string
  exclusives: ProductLite[]
  shared: SharedProduct[]
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [addId, setAddId] = useState('')

  function run(fn: () => Promise<void>) {
    startTransition(async () => {
      await fn()
      router.refresh()
    })
  }

  return (
    <div className="space-y-8">
      <div>
        <h3 className="mb-2 font-semibold">Produtos exclusivos deste parceiro</h3>
        <p className="mb-3 text-sm text-night-500">
          Aparecem só na vitrine deste parceiro (ex.: camisa oficial do time).
        </p>
        {exclusives.length === 0 ? (
          <p className="text-sm text-night-500">Nenhum produto exclusivo ainda.</p>
        ) : (
          <ul className="divide-y divide-night-100 rounded-lg border border-night-100">
            {exclusives.map((p) => (
              <li key={p.id} className="flex items-center justify-between px-4 py-2 text-sm">
                <span>
                  {p.name}
                  {p.status !== 'active' && (
                    <span className="ml-2 text-xs text-night-400">({p.status})</span>
                  )}
                </span>
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => run(() => setExclusiveProductAction(partnerId, p.id, false))}
                  className="text-xs font-medium text-danger hover:underline disabled:opacity-50"
                >
                  Remover exclusividade
                </button>
              </li>
            ))}
          </ul>
        )}

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <select
            value={addId}
            onChange={(e) => setAddId(e.target.value)}
            className="rounded-md border border-night-200 px-3 py-2 text-sm"
          >
            <option value="">Tornar um produto compartilhado em exclusivo…</option>
            {shared.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
          <button
            type="button"
            disabled={pending || !addId}
            onClick={() => {
              const id = addId
              setAddId('')
              run(() => setExclusiveProductAction(partnerId, id, true))
            }}
            className="rounded-md bg-night-900 px-4 py-2 text-sm font-semibold text-white hover:bg-night-700 disabled:opacity-50"
          >
            Tornar exclusivo
          </button>
        </div>
      </div>

      <div>
        <h3 className="mb-2 font-semibold">Produtos compartilhados na vitrine</h3>
        <p className="mb-3 text-sm text-night-500">
          Produtos da Kickoffstore que este parceiro também vende. Marque para incluir.
        </p>
        {shared.length === 0 ? (
          <p className="text-sm text-night-500">Nenhum produto compartilhado disponível.</p>
        ) : (
          <ul className="grid gap-1 sm:grid-cols-2">
            {shared.map((p) => (
              <li key={p.id}>
                <label className="flex items-center gap-2 rounded-md border border-night-100 px-3 py-2 text-sm">
                  <input
                    type="checkbox"
                    checked={p.enabled}
                    disabled={pending}
                    onChange={(e) =>
                      run(() => toggleSharedProductAction(partnerId, p.id, e.target.checked))
                    }
                    className="h-4 w-4"
                  />
                  <span>
                    {p.name}
                    {p.status !== 'active' && (
                      <span className="ml-2 text-xs text-night-400">({p.status})</span>
                    )}
                  </span>
                </label>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
