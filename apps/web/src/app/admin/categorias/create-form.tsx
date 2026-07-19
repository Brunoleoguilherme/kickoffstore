'use client'

import { useFormState } from 'react-dom'
import { createCategoryAction } from '@/lib/catalog/taxonomy-actions'
import type { ActionState } from '@/lib/auth/actions'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { FormMessage } from '@/components/ui/form-message'
import { SubmitButton } from '@/components/auth/submit-button'

const initial: ActionState = {}

export function CategoryForm() {
  const [state, formAction] = useFormState(createCategoryAction, initial)
  return (
    <form action={formAction} className="space-y-4">
      <FormMessage error={state.error} success={state.success} />
      <div>
        <Label htmlFor="name">Nome</Label>
        <Input id="name" name="name" required />
      </div>
      <div>
        <Label htmlFor="slug">Slug</Label>
        <Input id="slug" name="slug" placeholder="calcados" required />
      </div>
      <div>
        <Label htmlFor="sortOrder">Ordem</Label>
        <Input id="sortOrder" name="sortOrder" type="number" defaultValue={0} />
      </div>
      <SubmitButton>Criar categoria</SubmitButton>
    </form>
  )
}
