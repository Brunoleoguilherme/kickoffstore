import type { Metadata } from 'next'
import { requirePermission } from '@/lib/auth/session'
import { ProductForm } from './product-form'

export const metadata: Metadata = { title: 'Novo produto' }

export default async function NovoProdutoPage() {
  await requirePermission('catalog.write')
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Novo produto</h1>
      <p className="text-sm text-night-500">
        Preços em centavos. Publique apenas com os campos mínimos preenchidos.
      </p>
      <ProductForm />
    </div>
  )
}
