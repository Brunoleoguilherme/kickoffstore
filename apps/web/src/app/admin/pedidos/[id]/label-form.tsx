'use client'

import { useFormState, useFormStatus } from 'react-dom'
import { buyLabelAction, type BuyLabelState } from '@/lib/orders/shipment-actions'

const initial: BuyLabelState = {}

function GenerateButton() {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-md bg-night-900 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-night-700 disabled:opacity-50"
    >
      {pending ? 'Gerando etiqueta…' : 'Comprar frete e gerar etiqueta'}
    </button>
  )
}

export function LabelForm({ orderId }: { orderId: string }) {
  const [state, action] = useFormState(buyLabelAction, initial)
  return (
    <form
      action={action}
      onSubmit={(e) => {
        if (
          !window.confirm(
            'Comprar o frete e gerar a etiqueta agora? Isso debita o saldo da sua conta Melhor Envio.',
          )
        ) {
          e.preventDefault()
        }
      }}
      className="flex flex-wrap items-center gap-3"
    >
      <input type="hidden" name="orderId" value={orderId} />
      <GenerateButton />
      {state.ok && state.labelUrl && (
        <a
          href={state.labelUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm font-semibold text-brand-600 hover:underline"
        >
          Abrir etiqueta (PDF) ↗
        </a>
      )}
      {state.ok && state.trackingCode && (
        <span className="text-sm text-success">✓ Rastreio: {state.trackingCode}</span>
      )}
      {state.ok && !state.labelUrl && !state.trackingCode && (
        <span className="text-sm text-success">✓ Etiqueta gerada.</span>
      )}
      {state.error && <span className="text-sm text-danger">{state.error}</span>}
    </form>
  )
}
