'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { setStorePlacementsAction } from '@/lib/partners/partner-actions'

export interface BoardItem {
  id: string
  name: string
  image: string | null
}

type Col = 'available' | 'destaques' | 'mais_vendidos'

const COLUMNS: { key: Col; title: string; hint: string }[] = [
  { key: 'available', title: 'Disponíveis', hint: 'Produtos da loja fora da home' },
  { key: 'destaques', title: 'Destaques', hint: '1ª linha da home' },
  { key: 'mais_vendidos', title: 'Mais vendidos', hint: '2ª linha da home' },
]

export function PlacementBoard({
  partnerId,
  items,
  initialDestaques,
  initialMaisVendidos,
}: {
  partnerId: string
  items: BoardItem[]
  initialDestaques: string[]
  initialMaisVendidos: string[]
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const byId = new Map(items.map((i) => [i.id, i]))
  const placed = new Set([...initialDestaques, ...initialMaisVendidos])

  const [cols, setCols] = useState<Record<Col, string[]>>({
    available: items.map((i) => i.id).filter((id) => !placed.has(id)),
    destaques: initialDestaques.filter((id) => byId.has(id)),
    mais_vendidos: initialMaisVendidos.filter((id) => byId.has(id)),
  })
  const [dragId, setDragId] = useState<string | null>(null)

  function move(id: string, to: Col, index: number) {
    setCols((prev) => {
      const next: Record<Col, string[]> = {
        available: prev.available.filter((x) => x !== id),
        destaques: prev.destaques.filter((x) => x !== id),
        mais_vendidos: prev.mais_vendidos.filter((x) => x !== id),
      }
      const arr = next[to]
      const at = Math.max(0, Math.min(index, arr.length))
      arr.splice(at, 0, id)
      startTransition(async () => {
        await setStorePlacementsAction(partnerId, next.destaques, next.mais_vendidos)
        router.refresh()
      })
      return next
    })
  }

  return (
    <div>
      <p className="mb-3 text-sm text-night-500">
        Arraste os produtos entre as colunas. A ordem dentro de Destaques e Mais vendidos é a ordem
        exata que aparece na home desta loja.
      </p>
      <div className="grid gap-3 sm:grid-cols-3">
        {COLUMNS.map((col) => (
          <div
            key={col.key}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault()
              if (dragId) move(dragId, col.key, cols[col.key].length)
            }}
            className={`rounded-lg border border-night-100 bg-night-50/40 p-2 ${
              pending ? 'opacity-60' : ''
            }`}
          >
            <div className="mb-2 px-1">
              <h4 className="text-sm font-semibold">{col.title}</h4>
              <p className="text-[11px] text-night-400">{col.hint}</p>
            </div>
            <div className="min-h-16 space-y-2">
              {cols[col.key].map((id, idx) => {
                const it = byId.get(id)
                if (!it) return null
                return (
                  <div
                    key={id}
                    draggable
                    onDragStart={() => setDragId(id)}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      if (dragId) move(dragId, col.key, idx)
                    }}
                    className="flex cursor-grab items-center gap-2 rounded-md border border-night-100 bg-white p-2 shadow-sm active:cursor-grabbing"
                  >
                    {it.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={it.image}
                        alt=""
                        className="h-10 w-10 shrink-0 rounded object-cover"
                      />
                    ) : (
                      <div className="h-10 w-10 shrink-0 rounded bg-night-100" />
                    )}
                    <span className="text-xs leading-tight">{it.name}</span>
                  </div>
                )
              })}
              {cols[col.key].length === 0 && (
                <p className="px-1 py-4 text-center text-[11px] text-night-300">Arraste aqui</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
