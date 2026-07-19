'use client'

import { useFormState, useFormStatus } from 'react-dom'
import { setStockAction, type StockActionState } from './stock-actions'

const initial: StockActionState = {}

function SaveButton() {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-md bg-brand-600 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-brand-700 disabled:opacity-50"
    >
      {pending ? 'Salvando…' : 'Salvar'}
    </button>
  )
}

export function AdjustForm({
  variantId,
  current,
  threshold,
}: {
  variantId: string
  current: number
  threshold: number | null
}) {
  const [state, action] = useFormState(setStockAction, initial)
  return (
    <form action={action} className="flex flex-wrap items-center gap-2">
      <input type="hidden" name="variantId" value={variantId} />
      <label className="flex items-center gap-1 text-xs text-night-500">
        Saldo
        <input
          type="number"
          name="onHand"
          min={0}
          defaultValue={current}
          aria-label="Novo saldo"
          className="w-20 rounded-md border border-night-200 px-2 py-1 text-sm"
        />
      </label>
      <label className="flex items-center gap-1 text-xs text-night-500">
        Avisar ≤
        <input
          type="number"
          name="threshold"
          min={0}
          defaultValue={threshold ?? 0}
          aria-label="Avisar quando o disponível ficar menor ou igual a"
          className="w-16 rounded-md border border-night-200 px-2 py-1 text-sm"
        />
      </label>
      <input
        type="text"
        name="reason"
        placeholder="Motivo (opcional)"
        aria-label="Motivo do ajuste"
        className="w-36 rounded-md border border-night-200 px-2 py-1 text-sm"
      />
      <SaveButton />
      {state.ok && <span className="text-xs font-medium text-success">✓ salvo</span>}
      {state.error && <span className="text-xs text-danger">{state.error}</span>}
    </form>
  )
}
