import { formatBRL } from '@kickoffstore/ui'
import {
  metricsForMonth,
  seriesForMonths,
  monthLabel,
  type OrderLite,
} from '@/lib/admin/metrics'

/** Etapas da linha do tempo do mês selecionado. */
export function MonthTimeline({
  orders,
  monthKey,
}: {
  orders: OrderLite[]
  monthKey: string
}) {
  const m = metricsForMonth(orders, monthKey)
  const steps: Array<{ label: string; value: number; tone: string }> = [
    { label: 'Pedidos', value: m.orders, tone: 'bg-night-100 text-night-700' },
    { label: 'Pagos', value: m.paid, tone: 'bg-brand-500/10 text-brand-700' },
    { label: 'Enviados', value: m.shipped, tone: 'bg-amber-500/10 text-amber-700' },
    { label: 'Entregues', value: m.delivered, tone: 'bg-emerald-500/10 text-emerald-700' },
  ]
  return (
    <section>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="font-semibold">Linha do tempo — {monthLabel(monthKey)}</h2>
        <span className="text-sm text-night-500">Receita: {formatBRL(m.revenueCents)}</span>
      </div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-stretch">
        {steps.map((s, i) => (
          <div key={s.label} className="flex flex-1 items-center gap-3">
            <div className={`flex-1 rounded-xl border border-night-100 p-4 ${s.tone}`}>
              <p className="text-xs font-medium uppercase tracking-wide opacity-80">{s.label}</p>
              <p className="mt-1 text-2xl font-bold">{s.value}</p>
            </div>
            {i < steps.length - 1 && (
              <span aria-hidden className="hidden text-night-300 sm:block">
                →
              </span>
            )}
          </div>
        ))}
      </div>
    </section>
  )
}

/** Comparativo dos últimos meses (barras por mês). */
export function MonthsComparison({
  orders,
  monthKeys,
}: {
  orders: OrderLite[]
  monthKeys: string[]
}) {
  const series = seriesForMonths(orders, monthKeys)
  const maxRevenue = Math.max(1, ...series.map((s) => s.revenueCents))
  return (
    <section>
      <h2 className="mb-3 font-semibold">Comparativo — últimos {monthKeys.length} meses</h2>
      <div className="rounded-xl border border-night-100 p-5">
        <div className="flex items-end justify-between gap-2" style={{ height: 160 }}>
          {series.map((s) => {
            const pct = Math.round((s.revenueCents / maxRevenue) * 100)
            return (
              <div key={s.key} className="flex flex-1 flex-col items-center justify-end gap-2">
                <span className="text-[11px] font-semibold text-night-600">
                  {formatBRL(s.revenueCents)}
                </span>
                <div
                  className="w-full rounded-t-md bg-brand-500"
                  style={{ height: `${Math.max(2, pct)}%` }}
                  title={`${s.paid} pedido(s) pago(s)`}
                />
              </div>
            )
          })}
        </div>
        <div className="mt-2 flex justify-between gap-2">
          {series.map((s) => (
            <div key={s.key} className="flex-1 text-center text-[11px] text-night-500">
              {s.label}
            </div>
          ))}
        </div>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="text-night-500">
              <tr>
                <th className="px-2 py-1 font-medium">Mês</th>
                <th className="px-2 py-1 text-right font-medium">Pedidos</th>
                <th className="px-2 py-1 text-right font-medium">Pagos</th>
                <th className="px-2 py-1 text-right font-medium">Enviados</th>
                <th className="px-2 py-1 text-right font-medium">Entregues</th>
                <th className="px-2 py-1 text-right font-medium">Receita</th>
              </tr>
            </thead>
            <tbody>
              {series.map((s) => (
                <tr key={s.key} className="border-t border-night-100">
                  <td className="px-2 py-1 font-medium">{s.label}</td>
                  <td className="px-2 py-1 text-right">{s.orders}</td>
                  <td className="px-2 py-1 text-right">{s.paid}</td>
                  <td className="px-2 py-1 text-right">{s.shipped}</td>
                  <td className="px-2 py-1 text-right">{s.delivered}</td>
                  <td className="px-2 py-1 text-right font-semibold">{formatBRL(s.revenueCents)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  )
}
