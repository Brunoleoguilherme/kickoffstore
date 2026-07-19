import type { Metadata } from 'next'
import Link from 'next/link'
import { requirePermission } from '@/lib/auth/session'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { formatBRL } from '@kickoffstore/ui'
import { PartnerFilter, type PartnerOption } from './partner-filter'

export const metadata: Metadata = { title: 'Pedidos' }
export const dynamic = 'force-dynamic'

interface Row {
  id: string
  order_number: string
  status: string
  total_cents: number
  channel: string
  created_at: string
  partner_id: string | null
  customer_snapshot: { name?: string } | null
}

const STATUS_LABEL: Record<string, string> = {
  awaiting_payment: 'Aguardando pagamento',
  paid: 'Pago',
  fiscal_pending: 'Fiscal pendente',
  fiscal_authorized: 'Nota autorizada',
  picking: 'Separação',
  packed: 'Embalado',
  shipped: 'Enviado',
  delivered: 'Entregue',
  cancelled: 'Cancelado',
  refunded: 'Reembolsado',
}

export default async function AdminPedidosPage({
  searchParams,
}: {
  searchParams?: { parceiro?: string }
}) {
  await requirePermission('orders.read')
  const supabase = createClient()
  const admin = createAdminClient()

  // Parceiros para o filtro e para nomear a coluna "Loja".
  const { data: partnersData } = await admin
    .from('partners')
    .select('id, name')
    .order('name', { ascending: true })
  const partners = (partnersData ?? []) as unknown as PartnerOption[]
  const partnerName = new Map(partners.map((p) => [p.id, p.name]))

  const filter = searchParams?.parceiro ?? ''
  let query = supabase
    .from('orders')
    .select('id, order_number, status, total_cents, channel, created_at, partner_id, customer_snapshot')
    .order('created_at', { ascending: false })
    .limit(100)
  if (filter === 'loja') {
    query = query.is('partner_id', null)
  } else if (filter) {
    query = query.eq('partner_id', filter)
  }
  const { data } = await query
  const rows = (data ?? []) as unknown as Row[]

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Pedidos</h1>
          <p className="text-sm text-night-500">Fila de pedidos e status operacional.</p>
        </div>
        <PartnerFilter partners={partners} selected={filter} />
      </div>

      <div className="overflow-hidden rounded-lg border border-night-100">
        <table className="w-full text-left text-sm">
          <thead className="bg-night-50 text-night-500">
            <tr>
              <th className="px-4 py-2 font-medium">Pedido</th>
              <th className="px-4 py-2 font-medium">Cliente</th>
              <th className="px-4 py-2 font-medium">Loja</th>
              <th className="px-4 py-2 font-medium">Status</th>
              <th className="px-4 py-2 font-medium">Total</th>
              <th className="px-4 py-2 font-medium">Data</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((o) => (
              <tr key={o.id} className="border-t border-night-100">
                <td className="px-4 py-2 font-medium">
                  <Link href={`/admin/pedidos/${o.id}`} className="text-brand-600 hover:underline">
                    {o.order_number}
                  </Link>
                </td>
                <td className="px-4 py-2">{o.customer_snapshot?.name ?? '—'}</td>
                <td className="px-4 py-2 text-night-500">
                  {o.partner_id ? (partnerName.get(o.partner_id) ?? 'Parceiro') : 'Kickoffstore'}
                </td>
                <td className="px-4 py-2">
                  <span className="rounded-full bg-night-50 px-2 py-0.5 text-xs">
                    {STATUS_LABEL[o.status] ?? o.status}
                  </span>
                </td>
                <td className="px-4 py-2">{formatBRL(o.total_cents)}</td>
                <td className="px-4 py-2 text-night-500">
                  {new Date(o.created_at).toLocaleDateString('pt-BR')}
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-night-500">
                  Nenhum pedido para este filtro.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
