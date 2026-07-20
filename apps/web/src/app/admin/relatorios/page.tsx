import type { Metadata } from 'next'
import { requireUser } from '@/lib/auth/session'
import { createAdminClient } from '@/lib/supabase/admin'
import { formatBRL } from '@clubedaestampa/ui'
import {
  REVENUE_STATUSES,
  currentMonthKey,
  lastMonths,
  monthOptions,
  monthLabel,
  metricsForMonth,
  monthKey as toMonthKey,
  type OrderLite,
} from '@/lib/admin/metrics'
import { MonthPicker } from '@/components/admin/month-picker'
import { MonthTimeline, MonthsComparison } from '@/components/admin/metrics-panels'

export const metadata: Metadata = { title: 'Relatórios' }

function StatCard({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-xl border border-night-100 p-5">
      <p className="text-xs font-medium uppercase tracking-wide text-night-500">{label}</p>
      <p className="mt-1 text-2xl font-bold">{value}</p>
      {hint && <p className="mt-1 text-xs text-night-500">{hint}</p>}
    </div>
  )
}

export default async function RelatoriosPage({
  searchParams,
}: {
  searchParams?: { mes?: string }
}) {
  await requireUser()
  const admin = createAdminClient()

  const now = new Date()
  const options = monthOptions(now, 6)
  const selectedMonth =
    searchParams?.mes && options.includes(searchParams.mes) ? searchParams.mes : currentMonthKey(now)
  const comparisonMonths = lastMonths(now, 6)

  const [ordersRes, orderItemsRes] = await Promise.all([
    admin
      .from('orders')
      .select('status, total_cents, created_at')
      .order('created_at', { ascending: false })
      .limit(5000),
    admin.from('order_items').select('product_name, quantity, orders(status, created_at)').limit(5000),
  ])

  const orders = (ordersRes.data ?? []) as unknown as OrderLite[]
  const month = metricsForMonth(orders, selectedMonth)
  const avgTicket = month.paid ? Math.round(month.revenueCents / month.paid) : 0

  // Mais vendidos do mês selecionado.
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
    .slice(0, 10)

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Relatórios</h1>
          <p className="text-sm text-night-500">Desempenho por mês e comparativo histórico.</p>
        </div>
        <MonthPicker options={options} selected={selectedMonth} />
      </div>

      <MonthTimeline orders={orders} monthKey={selectedMonth} />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Receita do mês" value={formatBRL(month.revenueCents)} hint={monthLabel(selectedMonth)} />
        <StatCard label="Ticket médio" value={formatBRL(avgTicket)} />
        <StatCard label="Pedidos" value={String(month.orders)} hint="criados no mês" />
        <StatCard label="Pagos" value={String(month.paid)} hint={`${month.delivered} entregue(s)`} />
      </div>

      <MonthsComparison orders={orders} monthKeys={comparisonMonths} />

      <section>
        <h2 className="mb-3 font-semibold">Mais vendidos — {monthLabel(selectedMonth)}</h2>
        {bestSellers.length === 0 ? (
          <p className="text-sm text-night-500">Sem vendas no mês selecionado.</p>
        ) : (
          <div className="overflow-hidden rounded-lg border border-night-100">
            <table className="w-full text-left text-sm">
              <thead className="bg-night-50 text-night-500">
                <tr>
                  <th className="px-4 py-2 font-medium">#</th>
                  <th className="px-4 py-2 font-medium">Produto</th>
                  <th className="px-4 py-2 text-right font-medium">Vendidos</th>
                </tr>
              </thead>
              <tbody>
                {bestSellers.map(([name, qty], i) => (
                  <tr key={name} className="border-t border-night-100">
                    <td className="px-4 py-2 text-night-400">{i + 1}</td>
                    <td className="px-4 py-2 font-medium">{name}</td>
                    <td className="px-4 py-2 text-right font-semibold">{qty}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  )
}
