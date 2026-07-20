import type { Metadata } from 'next'
import Link from 'next/link'
import { requireUser } from '@/lib/auth/session'
import { createAdminClient } from '@/lib/supabase/admin'
import { getDefaultOrganizationId } from '@/lib/org'
import { formatBRL } from '@clubedaestampa/ui'
import {
  REVENUE_STATUSES,
  currentMonthKey,
  lastMonths,
  monthOptions,
  monthKey as toMonthKey,
  type OrderLite,
} from '@/lib/admin/metrics'
import { MonthPicker } from '@/components/admin/month-picker'
import { MonthTimeline, MonthsComparison } from '@/components/admin/metrics-panels'

export const metadata: Metadata = { title: 'Dashboard' }

const STATUS_LABEL: Record<string, string> = {
  awaiting_payment: 'Aguardando pagamento',
  paid: 'Pago',
  fiscal_authorized: 'Nota autorizada',
  picking: 'Separação',
  packed: 'Embalado',
  shipped: 'Enviado',
  delivered: 'Entregue',
  cancelled: 'Cancelado',
  refunded: 'Reembolsado',
}

interface OrderRow {
  id: string
  order_number: string
  status: string
  total_cents: number
  created_at: string
  customer_snapshot: { name?: string } | null
}

function StatCard({
  label,
  value,
  hint,
  danger,
}: {
  label: string
  value: string
  hint?: string
  danger?: boolean
}) {
  return (
    <div className="rounded-xl border border-night-100 p-5">
      <p className="text-xs font-medium uppercase tracking-wide text-night-500">{label}</p>
      <p className={`mt-1 text-2xl font-bold ${danger ? 'text-danger' : ''}`}>{value}</p>
      {hint && <p className="mt-1 text-xs text-night-500">{hint}</p>}
    </div>
  )
}

const LOW_STOCK_DEFAULT = 5

export default async function AdminDashboard({
  searchParams,
}: {
  searchParams?: { mes?: string }
}) {
  await requireUser()
  const admin = createAdminClient()
  const orgId = await getDefaultOrganizationId()

  const now = new Date()
  const options = monthOptions(now, 6)
  const selectedMonth =
    searchParams?.mes && options.includes(searchParams.mes) ? searchParams.mes : currentMonthKey(now)
  const comparisonMonths = lastMonths(now, 6)

  const [
    productsActive,
    productsTotal,
    brandsCount,
    categoriesCount,
    ordersRes,
    variantsRes,
    balancesRes,
    orderItemsRes,
  ] = await Promise.all([
    admin.from('products').select('id', { count: 'exact', head: true }).eq('status', 'active'),
    admin.from('products').select('id', { count: 'exact', head: true }),
    admin.from('brands').select('id', { count: 'exact', head: true }),
    admin.from('categories').select('id', { count: 'exact', head: true }),
    admin
      .from('orders')
      .select('id, order_number, status, total_cents, created_at, customer_snapshot')
      .order('created_at', { ascending: false })
      .limit(2000),
    admin
      .from('product_variants')
      .select('id, active, low_stock_threshold, color, size, products(name)')
      .limit(2000),
    admin.from('inventory_balances').select('variant_id, on_hand, reserved').limit(5000),
    admin.from('order_items').select('product_name, quantity, orders(status, created_at)').limit(5000),
  ])

  // Estoque: agrega saldo por variação ativa.
  const variants = (variantsRes.data ?? []) as unknown as Array<{
    id: string
    active: boolean
    low_stock_threshold: number | null
    color: string | null
    size: string | null
    products: { name: string } | { name: string }[] | null
  }>
  const balances = (balancesRes.data ?? []) as unknown as Array<{
    variant_id: string
    on_hand: number | null
    reserved: number | null
  }>
  const onHandBy = new Map<string, number>()
  const reservedBy = new Map<string, number>()
  for (const b of balances) {
    onHandBy.set(b.variant_id, (onHandBy.get(b.variant_id) ?? 0) + Number(b.on_hand ?? 0))
    reservedBy.set(b.variant_id, (reservedBy.get(b.variant_id) ?? 0) + Number(b.reserved ?? 0))
  }
  let totalUnits = 0
  let lowStockCount = 0
  let outOfStockCount = 0
  const lowStockList: Array<{ name: string; variation: string; available: number }> = []
  for (const v of variants) {
    if (!v.active) continue
    if (!onHandBy.has(v.id)) continue // variação sem saldo cadastrado
    const onHand = onHandBy.get(v.id) ?? 0
    const available = Math.max(0, onHand - (reservedBy.get(v.id) ?? 0))
    totalUnits += onHand
    const threshold = v.low_stock_threshold && v.low_stock_threshold > 0 ? v.low_stock_threshold : LOW_STOCK_DEFAULT
    if (available <= 0) outOfStockCount += 1
    else if (available <= threshold) lowStockCount += 1
    if (available < 5) {
      const p = v.products
      const name = Array.isArray(p) ? (p[0]?.name ?? '—') : (p?.name ?? '—')
      const variation = [v.color, v.size].filter(Boolean).join(' · ') || '—'
      lowStockList.push({ name, variation, available })
    }
  }
  lowStockList.sort((a, b) => a.available - b.available)

  // Mais vendidos: soma quantidade por produto, apenas em pedidos pagos/adiante do mês selecionado.
  const orderItems = (orderItemsRes.data ?? []) as unknown as Array<{
    product_name: string
    quantity: number
    orders: { status: string; created_at: string } | { status: string; created_at: string }[] | null
  }>
  const soldBy = new Map<string, number>()
  for (const it of orderItems) {
    const o = it.orders
    const row = Array.isArray(o) ? o[0] : o
    if (!row?.status || !REVENUE_STATUSES.includes(row.status)) continue
    if (toMonthKey(row.created_at) !== selectedMonth) continue
    soldBy.set(it.product_name, (soldBy.get(it.product_name) ?? 0) + Number(it.quantity ?? 0))
  }
  const bestSellers = Array.from(soldBy.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)

  const orders = (ordersRes.data ?? []) as unknown as OrderRow[]
  const ordersLite: OrderLite[] = orders.map((o) => ({
    status: o.status,
    total_cents: o.total_cents,
    created_at: o.created_at,
  }))
  const paidOrders = orders.filter((o) => REVENUE_STATUSES.includes(o.status))
  const revenue = paidOrders.reduce((sum, o) => sum + o.total_cents, 0)
  const avgTicket = paidOrders.length ? Math.round(revenue / paidOrders.length) : 0

  const statusCounts = orders.reduce<Record<string, number>>((acc, o) => {
    acc[o.status] = (acc[o.status] ?? 0) + 1
    return acc
  }, {})
  const statusEntries = Object.entries(statusCounts).sort((a, b) => b[1] - a[1])
  const recent = orders.slice(0, 5)

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-sm text-night-500">
            Visão geral da operação {orgId ? '' : '(organização não encontrada)'}
          </p>
        </div>
        <MonthPicker options={options} selected={selectedMonth} />
      </div>

      <MonthTimeline orders={ordersLite} monthKey={selectedMonth} />

      <div className="grid gap-8 lg:grid-cols-2">
        <section>
          <h2 className="mb-3 font-semibold">Mais vendidos do mês</h2>
          {bestSellers.length === 0 ? (
            <p className="text-sm text-night-500">Sem vendas no mês selecionado.</p>
          ) : (
            <div className="overflow-hidden rounded-lg border border-night-100">
              <table className="w-full text-left text-sm">
                <thead className="bg-night-50 text-night-500">
                  <tr>
                    <th className="px-4 py-2 font-medium">Produto</th>
                    <th className="px-4 py-2 text-right font-medium">Vendidos</th>
                  </tr>
                </thead>
                <tbody>
                  {bestSellers.map(([name, qty]) => (
                    <tr key={name} className="border-t border-night-100">
                      <td className="px-4 py-2 font-medium">{name}</td>
                      <td className="px-4 py-2 text-right font-semibold">{qty}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-semibold">Estoque baixo (menos de 5 un.)</h2>
            <Link href="/admin/estoque" className="text-sm font-medium text-brand-600 hover:underline">
              Ver estoque
            </Link>
          </div>
          {lowStockList.length === 0 ? (
            <p className="text-sm text-night-500">Nenhum item abaixo de 5 unidades. 👍</p>
          ) : (
            <div className="overflow-hidden rounded-lg border border-night-100">
              <table className="w-full text-left text-sm">
                <thead className="bg-night-50 text-night-500">
                  <tr>
                    <th className="px-4 py-2 font-medium">Produto</th>
                    <th className="px-4 py-2 font-medium">Variação</th>
                    <th className="px-4 py-2 text-right font-medium">Disp.</th>
                  </tr>
                </thead>
                <tbody>
                  {lowStockList.slice(0, 12).map((r, i) => (
                    <tr key={i} className="border-t border-night-100">
                      <td className="px-4 py-2 font-medium">{r.name}</td>
                      <td className="px-4 py-2 text-night-500">{r.variation}</td>
                      <td className="px-4 py-2 text-right font-semibold text-danger">{r.available}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>

      <MonthsComparison orders={ordersLite} monthKeys={comparisonMonths} />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Receita (paga)" value={formatBRL(revenue)} hint={`${paidOrders.length} pedido(s) pago(s)`} />
        <StatCard label="Ticket médio" value={formatBRL(avgTicket)} />
        <StatCard label="Pedidos" value={String(orders.length)} hint="total" />
        <StatCard
          label="Produtos"
          value={String(productsActive.count ?? 0)}
          hint={`${productsTotal.count ?? 0} no total`}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Marcas" value={String(brandsCount.count ?? 0)} />
        <StatCard label="Categorias" value={String(categoriesCount.count ?? 0)} />
        <StatCard label="Produtos publicados" value={String(productsActive.count ?? 0)} />
      </div>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-semibold">Estoque</h2>
          <Link href="/admin/estoque" className="text-sm font-medium text-brand-600 hover:underline">
            Ver estoque
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
          <StatCard label="Unidades em estoque" value={totalUnits.toLocaleString('pt-BR')} />
          <StatCard
            label="Estoque baixo"
            value={String(lowStockCount)}
            hint="no nível de alerta"
            danger={lowStockCount > 0}
          />
          <StatCard label="Sem estoque" value={String(outOfStockCount)} danger={outOfStockCount > 0} />
        </div>
      </section>

      <div className="grid gap-8 lg:grid-cols-2">
        <section>
          <h2 className="mb-3 font-semibold">Pedidos por status</h2>
          {statusEntries.length === 0 ? (
            <p className="text-sm text-night-500">Nenhum pedido.</p>
          ) : (
            <div className="space-y-2">
              {statusEntries.map(([status, count]) => {
                const pct = orders.length ? Math.round((count / orders.length) * 100) : 0
                return (
                  <div key={status}>
                    <div className="mb-1 flex justify-between text-sm">
                      <span>{STATUS_LABEL[status] ?? status}</span>
                      <span className="text-night-500">{count}</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-night-100">
                      <div className="h-full rounded-full bg-brand-500" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </section>

        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-semibold">Últimos pedidos</h2>
            <Link href="/admin/pedidos" className="text-sm font-medium text-brand-600 hover:underline">
              Ver todos
            </Link>
          </div>
          <div className="overflow-hidden rounded-lg border border-night-100">
            <table className="w-full text-left text-sm">
              <thead className="bg-night-50 text-night-500">
                <tr>
                  <th className="px-4 py-2 font-medium">Pedido</th>
                  <th className="px-4 py-2 font-medium">Status</th>
                  <th className="px-4 py-2 font-medium">Total</th>
                </tr>
              </thead>
              <tbody>
                {recent.map((o) => (
                  <tr key={o.id} className="border-t border-night-100">
                    <td className="px-4 py-2 font-medium">{o.order_number}</td>
                    <td className="px-4 py-2">{STATUS_LABEL[o.status] ?? o.status}</td>
                    <td className="px-4 py-2">{formatBRL(o.total_cents)}</td>
                  </tr>
                ))}
                {recent.length === 0 && (
                  <tr>
                    <td colSpan={3} className="px-4 py-6 text-center text-night-500">
                      Nenhum pedido ainda.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  )
}
