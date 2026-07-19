import type { Metadata } from 'next'
import { requirePermission } from '@/lib/auth/session'
import { ImportForm } from './import-form'

export const metadata: Metadata = { title: 'Importar catálogo (CSV)' }

export default async function ImportarPage() {
  await requirePermission('catalog.write')
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Importar catálogo (CSV)</h1>
      <p className="text-sm text-night-500">
        Cada linha é uma variação (SKU). Produtos são agrupados por <code>product_slug</code>. Preços
        em centavos. Campos fiscais (NCM) devem ser confirmados com o contador.
      </p>
      <ImportForm />
    </div>
  )
}
