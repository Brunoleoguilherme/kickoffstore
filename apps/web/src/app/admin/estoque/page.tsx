import type { Metadata } from 'next'
import { requirePermission } from '@/lib/auth/session'
import { createAdminClient } from '@/lib/supabase/admin'
import { AdjustForm } from './adjust-form'

export const metadata: Metadata = { title: 'Estoque' }
export const dynamic = 'force-dynamic'

const LOW_STOCK_THRESHOLD = 5

interface VariantRow {
  id: string
  sku: string
  color: string | null
  size: string | null
  active: boolean
  low_stock_threshold: number | null
  products: { name: string } | { name: string }[] | null
}

function productName(p: VariantRow['products']): string {
  if (Array.isArray(p)) return p[0]?.name ?? '—'
  return p?.name ?? '—'
}

function variantLabel(v: VariantRow): string {
  return [v.color, v.size].filter(Boolean).join(' · ') || '—'
}

export default async function EstoquePage() {
  await requirePermission('inventory.read')
  const admin = createAdminClient()

  const { data: variantsData } = await admin
    .from('product_variants')
    .select('*, products(name)')
    .order('sku', { ascending: true })
    .limit(500)
  const variants = (variantsData ?? []) as unknown as VariantRow[]

  const { data: balData } = await admin
    .from('inventory_balances')
    .select('variant_id, on_hand, reserved')
  const onHandByVariant = new Map<string, number>()
  const reservedByVariant = new Map<string, number>()
  for (const b of (balData ?? []) as Array<{
    variant_id: string
    on_hand: number | null
    reserved: number | null
  }>) {
    onHandByVariant.set(b.variant_id, (onHandByVariant.get(b.variant_id) ?? 0) + Number(b.on_hand ?? 0))
    reservedByVariant.set(
      b.variant_id,
      (reservedByVariant.get(b.variant_id) ?? 0) + Number(b.reserved ?? 0),
    )
  }

  const rows = variants.map((v) => {
    const oh = onHandByVariant.get(v.id) ?? 0
    const rs = reservedByVariant.get(v.id) ?? 0
    const available = Math.max(0, oh - rs)
    const tracked = onHandByVariant.has(v.id)
    const threshold = v.low_stock_threshold && v.low_stock_threshold > 0 ? v.low_stock_threshold : null
    const effective = threshold ?? LOW_STOCK_THRESHOLD
    return { v, tracked, onHand: oh, reserved: rs, available, threshold, low: tracked && available <= effective }
  })
  const lowStock = rows.filter((r) => r.low).length

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Estoque</h1>
        <p className="text-sm text-night-500">
          Saldo por variação. Informe o novo saldo e salve para registrar uma movimentação.
        </p>
      </div>

      <div className="flex flex-wrap gap-4 text-sm">
        <span className="rounded-lg border border-night-100 px-4 py-2">
          Variações: <strong>{rows.length}</strong>
        </span>
        <span className="rounded-lg border border-night-100 px-4 py-2">
          Estoque baixo (≤ {LOW_STOCK_THRESHOLD}): <strong className="text-danger">{lowStock}</strong>
        </span>
      </div>

      <div className="overflow-x-auto rounded-lg border border-night-100">
        <table className="w-full text-left text-sm">
          <thead className="bg-night-50 text-night-500">
            <tr>
              <th className="px-4 py-2 font-medium">Produto</th>
              <th className="px-4 py-2 font-medium">Variação</th>
              <th className="px-4 py-2 font-medium">SKU</th>
              <th className="px-4 py-2 font-medium">Em estoque</th>
              <th className="px-4 py-2 font-medium">Reservado</th>
              <th className="px-4 py-2 font-medium">Disponível</th>
              <th className="px-4 py-2 font-medium">Alerta ≤</th>
              <th className="px-4 py-2 font-medium">Ajustar saldo / limite</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.v.id} className="border-t border-night-100">
                <td className="px-4 py-2 font-medium">
                  {productName(r.v.products)}
                  {!r.v.active && (
                    <span className="ml-2 rounded-full bg-night-50 px-2 py-0.5 text-xs text-night-500">
                      inativa
                    </span>
                  )}
                </td>
                <td className="px-4 py-2 text-night-500">{variantLabel(r.v)}</td>
                <td className="px-4 py-2 text-night-500">{r.v.sku}</td>
                <td className="px-4 py-2">{r.tracked ? r.onHand : '—'}</td>
                <td className="px-4 py-2 text-night-500">{r.reserved}</td>
                <td className="px-4 py-2">
                  <span className={r.low ? 'font-semibold text-danger' : 'font-semibold'}>
                    {r.tracked ? r.available : '—'}
                  </span>
                </td>
                <td className="px-4 py-2 text-night-500">{r.threshold ?? '—'}</td>
                <td className="px-4 py-2">
                  <AdjustForm variantId={r.v.id} current={r.onHand} threshold={r.threshold} />
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-6 text-center text-night-500">
                  Nenhuma variação cadastrada.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
