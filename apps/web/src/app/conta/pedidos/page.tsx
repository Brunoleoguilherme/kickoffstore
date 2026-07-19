import type { Metadata } from 'next'
import Link from 'next/link'
import { requireUser } from '@/lib/auth/session'
import { createAdminClient } from '@/lib/supabase/admin'
import { formatBRL } from '@kickoffstore/ui'
import { TrackPurchase } from '@/components/analytics/track-purchase'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: 'Meus pedidos' }

interface OrderRow {
  id: string
  order_number: string
  status: string
  total_cents: number
  created_at: string
  customer_snapshot: { email?: string } | null
}

interface PaymentRow {
  order_id: string
  method: string
  status: string
}

// Rótulos amigáveis para o status do pedido.
const ORDER_LABEL: Record<string, { text: string; cls: string }> = {
  awaiting_payment: { text: 'Aguardando pagamento', cls: 'bg-amber-100 text-amber-800' },
  payment_processing: { text: 'Processando', cls: 'bg-amber-100 text-amber-800' },
  paid: { text: 'Pago', cls: 'bg-green-100 text-green-800' },
  fiscal_pending: { text: 'Pago · emitindo NF', cls: 'bg-green-100 text-green-800' },
  fiscal_authorized: { text: 'Pago · NF emitida', cls: 'bg-green-100 text-green-800' },
  picking: { text: 'Em separação', cls: 'bg-blue-100 text-blue-800' },
  packed: { text: 'Embalado', cls: 'bg-blue-100 text-blue-800' },
  shipped: { text: 'Enviado', cls: 'bg-blue-100 text-blue-800' },
  delivered: { text: 'Entregue', cls: 'bg-green-100 text-green-800' },
  cancelled: { text: 'Cancelado', cls: 'bg-night-100 text-night-600' },
  refunded: { text: 'Reembolsado', cls: 'bg-night-100 text-night-600' },
}

const METHOD_LABEL: Record<string, string> = {
  pix: 'Pix',
  credit_card: 'Cartão',
  debit_card: 'Cartão',
  boleto: 'Boleto',
}

function orderBadge(status: string): { text: string; cls: string } {
  return ORDER_LABEL[status] ?? { text: status, cls: 'bg-night-100 text-night-600' }
}

export default async function MeusPedidosPage({
  searchParams,
}: {
  searchParams?: { paid?: string }
}) {
  const user = await requireUser()
  const email = (user.email ?? '').toLowerCase()

  // O checkout cria pedidos como convidado (sem customer_id vinculado ao login),
  // então casamos pelos e-mails do pedido = e-mail do usuário autenticado.
  // Consulta feita no servidor (service role) e SEMPRE filtrada ao próprio usuário.
  const admin = createAdminClient()
  const { data } = await admin
    .from('orders')
    .select('id, order_number, status, total_cents, created_at, customer_snapshot')
    .order('created_at', { ascending: false })
    .limit(200)

  const rows = ((data ?? []) as unknown as OrderRow[]).filter(
    (o) => (o.customer_snapshot?.email ?? '').toLowerCase() === email,
  )

  // Forma de pagamento por pedido (última cobrança registrada).
  const ids = rows.map((r) => r.id)
  let paymentByOrder = new Map<string, PaymentRow>()
  if (ids.length > 0) {
    const { data: pays } = await admin
      .from('payments')
      .select('order_id, method, status')
      .in('order_id', ids)
    const payRows = (pays ?? []) as unknown as PaymentRow[]
    paymentByOrder = new Map(payRows.map((p) => [p.order_id, p]))
  }

  const justPaid = searchParams?.paid === '1' && rows.length > 0 ? rows[0] : null

  return (
    <div className="space-y-4">
      {justPaid && <TrackPurchase orderId={justPaid.id} valueCents={justPaid.total_cents} />}
      <h1 className="font-display text-2xl font-extrabold uppercase tracking-tight">Meus pedidos</h1>
      {rows.length === 0 ? (
        <div className="rounded-xl border border-white/10 bg-surface p-8 text-center">
          <p className="text-night-300">Você ainda não tem pedidos.</p>
          <Link
            href="/produtos"
            className="mt-3 inline-block rounded-lg bg-brand-500 px-4 py-2 text-sm font-semibold uppercase tracking-wide text-night-900 hover:bg-brand-400"
          >
            Explorar a loja
          </Link>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-white/10 bg-surface">
          <table className="w-full text-left text-sm">
            <thead className="bg-white/5 text-night-300">
              <tr>
                <th className="px-4 py-3 font-medium">Pedido</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Pagamento</th>
                <th className="px-4 py-3 font-medium">Total</th>
                <th className="px-4 py-3 font-medium">Data</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((o) => {
                const badge = orderBadge(o.status)
                const pay = paymentByOrder.get(o.id)
                const method = pay ? (METHOD_LABEL[pay.method] ?? pay.method) : '—'
                return (
                  <tr key={o.id} className="border-t border-white/10">
                    <td className="px-4 py-3 font-medium">
                      <Link href={`/conta/pedidos/${o.id}`} className="text-brand-400 hover:underline">
                        {o.order_number}
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-block rounded-full px-2.5 py-1 text-xs font-semibold ${badge.cls}`}>
                        {badge.text}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-night-200">{method}</td>
                    <td className="px-4 py-3 font-semibold text-white">{formatBRL(o.total_cents)}</td>
                    <td className="px-4 py-3 text-night-400">
                      {new Date(o.created_at).toLocaleDateString('pt-BR')}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
      <p className="text-xs text-night-400">
        Os pedidos aparecem aqui pelo e-mail informado no checkout ({email}). O status muda para
        “Pago” automaticamente quando o pagamento é confirmado.
      </p>
    </div>
  )
}
