'use client'

import { useFormState, useFormStatus } from 'react-dom'
import { updateVariantDimensionsAction } from '@/lib/catalog/product-edit-actions'
import type { ActionState } from '@/lib/auth/actions'

export interface VariantDims {
  id: string
  sku: string
  color: string | null
  size: string | null
  weightGrams: number
  widthCm: number
  heightCm: number
  lengthCm: number
}

const initial: ActionState = {}

function SaveButton() {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      className="h-9 shrink-0 rounded-md bg-brand-600 px-4 text-sm font-semibold text-white transition-colors hover:bg-brand-700 disabled:opacity-50"
    >
      {pending ? 'Salvando…' : 'Salvar'}
    </button>
  )
}

const num =
  'w-full rounded-md border border-night-200 px-2 py-1.5 text-sm text-night-800 outline-none focus:border-brand-500'
const cap = 'mb-1 block text-[11px] font-semibold uppercase tracking-wide text-night-400'

function Row({ v }: { v: VariantDims }) {
  const [state, action] = useFormState(
    updateVariantDimensionsAction.bind(null, v.id),
    initial,
  )
  const variacao = [v.color, v.size].filter(Boolean).join(' · ') || '—'
  return (
    <form action={action} className="rounded-lg border border-night-100 p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-night-800">{v.sku}</p>
          <p className="text-xs text-night-500">{variacao}</p>
        </div>
        {state.success && <span className="text-xs font-medium text-success">✓ salvo</span>}
        {state.error && <span className="text-xs text-danger">{state.error}</span>}
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <label>
          <span className={cap}>Peso (g)</span>
          <input
            type="number"
            name="weightGrams"
            min={0}
            step={1}
            defaultValue={v.weightGrams}
            inputMode="numeric"
            className={num}
          />
        </label>
        <label>
          <span className={cap}>Largura (cm)</span>
          <input
            type="number"
            name="widthCm"
            min={0}
            step="0.1"
            defaultValue={v.widthCm}
            inputMode="decimal"
            className={num}
          />
        </label>
        <label>
          <span className={cap}>Altura (cm)</span>
          <input
            type="number"
            name="heightCm"
            min={0}
            step="0.1"
            defaultValue={v.heightCm}
            inputMode="decimal"
            className={num}
          />
        </label>
        <label>
          <span className={cap}>Compr. (cm)</span>
          <input
            type="number"
            name="lengthCm"
            min={0}
            step="0.1"
            defaultValue={v.lengthCm}
            inputMode="decimal"
            className={num}
          />
        </label>
      </div>
      <div className="mt-3 flex justify-end">
        <SaveButton />
      </div>
    </form>
  )
}

export function VariantDimensions({ variants }: { variants: VariantDims[] }) {
  if (variants.length === 0) {
    return <p className="text-sm text-night-500">Nenhuma variação cadastrada.</p>
  }
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {variants.map((v) => (
        <Row key={v.id} v={v} />
      ))}
    </div>
  )
}
