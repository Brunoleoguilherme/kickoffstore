'use client'

import { useFormState, useFormStatus } from 'react-dom'
import { changeOrderStatusAction, type OrderActionState } from '@/lib/orders/order-actions'

const initial: OrderActionState = {}

interface Option {
  value: string
  label: string
}

function ApplyButton() {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-md bg-brand-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-700 disabled:opacity-50"
    >
      {pending ? 'Aplicando…' : 'Aplicar'}
    </button>
  )
}

export function StatusForm({ orderId, options }: { orderId: string; options: Option[] }) {
  const [state, action] = useFormState(changeOrderStatusAction, initial)

  if (options.length === 0) {
    return <p className="text-sm text-night-500">Sem próximas transições para este status.</p>
  }

  return (
    <form action={action} className="flex flex-wrap items-end gap-3">
      <input type="hidden" name="orderId" value={orderId} />
      <label className="flex flex-col gap-1 text-sm text-night-600">
        Mudar para
        <select
          name="toStatus"
          className="rounded-md border border-night-200 px-3 py-2 text-sm"
        >
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </label>
      <label className="flex flex-1 flex-col gap-1 text-sm text-night-600">
        Motivo (opcional)
        <input
          type="text"
          name="reason"
          placeholder="Ex.: cliente pediu cancelamento"
          className="min-w-[12rem] rounded-md border border-night-200 px-3 py-2 text-sm"
        />
      </label>
      <ApplyButton />
      {state.ok && <span className="text-sm font-medium text-success">✓ atualizado</span>}
      {state.error && <span className="text-sm text-danger">{state.error}</span>}
    </form>
  )
}
