'use client'

import { useFormState } from 'react-dom'
import { importCatalogCsvAction } from '@/lib/catalog/admin-actions'
import { FormMessage } from '@/components/ui/form-message'
import { SubmitButton } from '@/components/auth/submit-button'

const EXAMPLE = `product_name,product_slug,sku,ean,color,size,price_cents,cost_cents,ncm
Camisa Brasil 2026,camisa-brasil-2026,KOS-CAM-001,,Amarelo,M,19990,9000,6109.10.00
Camisa Brasil 2026,camisa-brasil-2026,KOS-CAM-002,,Amarelo,G,19990,9000,6109.10.00`

const initial = {}

export function ImportForm() {
  const [state, formAction] = useFormState(importCatalogCsvAction, initial as never)
  const s = state as { error?: string; success?: string; rowErrors?: Array<{ line: number; message: string }> }
  return (
    <form action={formAction} className="max-w-2xl space-y-4">
      <FormMessage error={s.error} success={s.success} />
      <div>
        <label htmlFor="csv" className="mb-1.5 block text-sm font-medium">
          Cole o CSV (cabeçalho obrigatório)
        </label>
        <textarea
          id="csv"
          name="csv"
          rows={10}
          defaultValue={EXAMPLE}
          className="w-full rounded-md border border-night-100 p-3 font-mono text-xs"
        />
      </div>
      <SubmitButton>Importar</SubmitButton>

      {s.rowErrors && s.rowErrors.length > 0 && (
        <div className="rounded-md border border-danger/30 bg-danger/5 p-3 text-sm">
          <p className="mb-1 font-semibold text-danger">Linhas com erro:</p>
          <ul className="list-inside list-disc text-night-800">
            {s.rowErrors.map((e) => (
              <li key={e.line}>
                Linha {e.line}: {e.message}
              </li>
            ))}
          </ul>
        </div>
      )}
    </form>
  )
}
