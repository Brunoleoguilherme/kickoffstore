'use client'

import { useFormState } from 'react-dom'
import { createProductAction } from '@/lib/catalog/admin-actions'
import type { ActionState } from '@/lib/auth/actions'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { FormMessage } from '@/components/ui/form-message'
import { SubmitButton } from '@/components/auth/submit-button'

const initial: ActionState = {}

export function ProductForm() {
  const [state, formAction] = useFormState(createProductAction, initial)
  return (
    <form action={formAction} className="max-w-xl space-y-4">
      <FormMessage error={state.error} success={state.success} />
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <Label htmlFor="name">Nome</Label>
          <Input id="name" name="name" required />
        </div>
        <div className="col-span-2">
          <Label htmlFor="slug">Slug</Label>
          <Input id="slug" name="slug" placeholder="camisa-brasil-2026" required />
        </div>
        <div className="col-span-2">
          <Label htmlFor="shortDescription">Descrição curta</Label>
          <Input id="shortDescription" name="shortDescription" />
        </div>
        <div>
          <Label htmlFor="sku">SKU inicial</Label>
          <Input id="sku" name="sku" required />
        </div>
        <div>
          <Label htmlFor="priceCents">Preço (centavos)</Label>
          <Input id="priceCents" name="priceCents" type="number" min="0" required />
        </div>
        <div>
          <Label htmlFor="costCents">Custo (centavos)</Label>
          <Input id="costCents" name="costCents" type="number" min="0" defaultValue={0} />
        </div>
        <div>
          <Label htmlFor="color">Cor</Label>
          <Input id="color" name="color" />
        </div>
        <div>
          <Label htmlFor="size">Tamanho</Label>
          <Input id="size" name="size" />
        </div>
        <div className="col-span-2">
          <Label htmlFor="status">Status</Label>
          <select
            id="status"
            name="status"
            className="flex h-11 w-full rounded-md border border-night-100 bg-white px-3 text-sm"
            defaultValue="draft"
          >
            <option value="draft">Rascunho</option>
            <option value="active">Publicado</option>
          </select>
        </div>
      </div>
      <SubmitButton>Salvar produto</SubmitButton>
    </form>
  )
}
