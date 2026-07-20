'use client'

import { useFormState } from 'react-dom'
import { updateProductAction } from '@/lib/catalog/product-edit-actions'
import type { ActionState } from '@/lib/auth/actions'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { FormMessage } from '@/components/ui/form-message'
import { SubmitButton } from '@/components/auth/submit-button'

interface Taxon {
  id: string
  name: string
}

interface Props {
  productId: string
  initial: {
    name: string
    shortDescription: string
    description: string
    status: string
    categoryId: string
    brandId: string
    sportId: string
    showInMain: boolean
    sections: string[]
  }
  categories: Taxon[]
  brands: Taxon[]
  sports: Taxon[]
  partners: Taxon[]
  selectedPartnerIds: string[]
}

const initialState: ActionState = {}
const selectClass = 'flex h-11 w-full rounded-md border border-night-100 bg-white px-3 text-sm'
const checkRow = 'flex items-center gap-2 text-sm'

export function EditForm({
  productId,
  initial,
  categories,
  brands,
  sports,
  partners,
  selectedPartnerIds,
}: Props) {
  const action = updateProductAction.bind(null, productId)
  const [state, formAction] = useFormState(action, initialState)
  return (
    <form action={formAction} className="space-y-4">
      <FormMessage error={state.error} success={state.success} />
      <div>
        <Label htmlFor="name">Nome</Label>
        <Input id="name" name="name" defaultValue={initial.name} required />
      </div>
      <div>
        <Label htmlFor="shortDescription">Descrição curta</Label>
        <Input id="shortDescription" name="shortDescription" defaultValue={initial.shortDescription} />
      </div>
      <div>
        <Label htmlFor="description">Descrição</Label>
        <textarea
          id="description"
          name="description"
          rows={5}
          defaultValue={initial.description}
          className="w-full rounded-md border border-night-100 p-3 text-sm"
        />
      </div>

      <div>
        <Label htmlFor="categoryId">Categoria</Label>
        <select id="categoryId" name="categoryId" defaultValue={initial.categoryId} className={selectClass}>
          <option value="">— Nenhuma —</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <Label htmlFor="brandId">Marca</Label>
        <select id="brandId" name="brandId" defaultValue={initial.brandId} className={selectClass}>
          <option value="">— Nenhuma —</option>
          {brands.map((b) => (
            <option key={b.id} value={b.id}>
              {b.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <Label htmlFor="sportId">Esporte</Label>
        <select id="sportId" name="sportId" defaultValue={initial.sportId} className={selectClass}>
          <option value="">— Nenhum —</option>
          {sports.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <Label htmlFor="status">Status</Label>
        <select id="status" name="status" defaultValue={initial.status} className={selectClass}>
          <option value="draft">Rascunho</option>
          <option value="active">Publicado</option>
          <option value="archived">Arquivado</option>
        </select>
      </div>

      <div className="rounded-md border border-night-100 p-3">
        <Label>Seções na loja principal</Label>
        <p className="mb-2 text-xs text-night-500">
          Onde aparece na home do Clube da Estampa. Nas lojas de parceiro, configure na tela do parceiro.
        </p>
        <div className="space-y-1.5">
          <label className={checkRow}>
            <input
              type="checkbox"
              name="sections"
              value="destaques"
              defaultChecked={initial.sections.includes('destaques')}
            />
            Destaques (topo da home)
          </label>
          <label className={checkRow}>
            <input
              type="checkbox"
              name="sections"
              value="mais_vendidos"
              defaultChecked={initial.sections.includes('mais_vendidos')}
            />
            Mais vendidos
          </label>
        </div>
      </div>

      <div className="rounded-md border border-night-100 p-3">
        <Label>Lojas onde aparece</Label>
        <p className="mb-2 text-xs text-night-500">Marque em quais vitrines este produto é exibido.</p>
        <div className="space-y-1.5">
          <label className={checkRow}>
            <input
              type="checkbox"
              name="showInMain"
              value="1"
              defaultChecked={initial.showInMain}
            />
            Loja principal (Clube da Estampa)
          </label>
          {partners.map((p) => (
            <label key={p.id} className={checkRow}>
              <input
                type="checkbox"
                name="partners"
                value={p.id}
                defaultChecked={selectedPartnerIds.includes(p.id)}
              />
              {p.name}
            </label>
          ))}
        </div>
      </div>

      <SubmitButton>Salvar alterações</SubmitButton>
    </form>
  )
}
