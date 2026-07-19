'use client'

import { useFormState, useFormStatus } from 'react-dom'
import { setTrackingAction, type ShipmentActionState } from '@/lib/orders/shipment-actions'

const initial: ShipmentActionState = {}

function SaveButton() {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-md bg-brand-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-700 disabled:opacity-50"
    >
      {pending ? 'Salvando…' : 'Salvar rastreio'}
    </button>
  )
}

export function TrackingForm({
  orderId,
  carrier,
  trackingCode,
}: {
  orderId: string
  carrier: string
  trackingCode: string
}) {
  const [state, action] = useFormState(setTrackingAction, initial)
  return (
    <form action={action} className="flex flex-wrap items-end gap-3">
      <input type="hidden" name="orderId" value={orderId} />
      <label className="flex flex-col gap-1 text-sm text-night-600">
        Transportadora
        <input
          type="text"
          name="carrier"
          defaultValue={carrier || 'Correios'}
          className="w-40 rounded-md border border-night-200 px-3 py-2 text-sm"
        />
      </label>
      <label className="flex flex-col gap-1 text-sm text-night-600">
        Código de rastreio
        <input
          type="text"
          name="trackingCode"
          defaultValue={trackingCode}
          placeholder="Ex.: AA123456789BR"
          className="w-52 rounded-md border border-night-200 px-3 py-2 text-sm"
        />
      </label>
      <SaveButton />
      {state.ok && <span className="text-sm font-medium text-success">✓ salvo</span>}
      {state.error && <span className="text-sm text-danger">{state.error}</span>}
    </form>
  )
}
