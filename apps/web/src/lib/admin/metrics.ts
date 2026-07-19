/**
 * Métricas de pedidos por mês (compartilhado entre Dashboard e Relatórios).
 * Funções puras: recebem os pedidos já carregados e calculam.
 */

export const REVENUE_STATUSES = [
  'paid',
  'fiscal_pending',
  'fiscal_authorized',
  'picking',
  'packed',
  'shipped',
  'delivered',
]
const SHIPPED_STATUSES = ['shipped', 'delivered']

export interface OrderLite {
  status: string
  total_cents: number
  created_at: string
}

export interface MonthlyMetrics {
  orders: number
  paid: number
  shipped: number
  delivered: number
  revenueCents: number
}

/** Chave de mês "YYYY-MM" a partir de uma data ISO. */
export function monthKey(iso: string): string {
  return (iso ?? '').slice(0, 7)
}

/** Rótulo amigável "jul/2026" a partir de "2026-07". */
export function monthLabel(key: string): string {
  const [y, m] = key.split('-')
  const nomes = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez']
  const idx = Math.max(0, Math.min(11, Number(m) - 1))
  return `${nomes[idx]}/${y}`
}

/** Mês atual "YYYY-MM" a partir de uma data de referência. */
export function currentMonthKey(ref: Date): string {
  const y = ref.getUTCFullYear()
  const m = String(ref.getUTCMonth() + 1).padStart(2, '0')
  return `${y}-${m}`
}

/** Lista dos últimos N meses (mais antigo → mais recente), terminando no mês de ref. */
export function lastMonths(ref: Date, count: number): string[] {
  const out: string[] = []
  for (let i = count - 1; i >= 0; i--) {
    const d = new Date(Date.UTC(ref.getUTCFullYear(), ref.getUTCMonth() - i, 1))
    out.push(currentMonthKey(d))
  }
  return out
}

/** Opções de mês para o seletor: últimos N meses (mais recente primeiro). */
export function monthOptions(ref: Date, count: number): string[] {
  return lastMonths(ref, count).slice().reverse()
}

/** Métricas de um mês específico (coorte por mês de criação do pedido). */
export function metricsForMonth(orders: OrderLite[], key: string): MonthlyMetrics {
  const m: MonthlyMetrics = { orders: 0, paid: 0, shipped: 0, delivered: 0, revenueCents: 0 }
  for (const o of orders) {
    if (monthKey(o.created_at) !== key) continue
    m.orders += 1
    if (REVENUE_STATUSES.includes(o.status)) {
      m.paid += 1
      m.revenueCents += Number(o.total_cents ?? 0)
    }
    if (SHIPPED_STATUSES.includes(o.status)) m.shipped += 1
    if (o.status === 'delivered') m.delivered += 1
  }
  return m
}

/** Série de métricas para vários meses (para o comparativo). */
export function seriesForMonths(
  orders: OrderLite[],
  keys: string[],
): Array<{ key: string; label: string } & MonthlyMetrics> {
  return keys.map((key) => ({ key, label: monthLabel(key), ...metricsForMonth(orders, key) }))
}
