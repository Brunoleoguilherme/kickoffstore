import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { formatBRL } from '@clubedaestampa/ui'
import { requireUser } from '@/lib/auth/session'
import { createAdminClient } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: 'Pedido' }

const STATUS_LABEL: Record<string, string> = {
  awaiting_payment: 'Aguardando pagamento',
  payment_processing: 'Processando pagamento',
  paid: 'Pago',
  fiscal_pending: 'Pago · emitindo nota',
  fiscal_authorized: 'Pago · nota emitida',
  picking: 'Em separação',
  packed: 'Embalado',
  shipped: 'Enviado',
  delivered: 'Entregue',
  cancel_requested: 'Cancelamento solicitado',
  cancelled: 'Cancelado',
  refunded: 'Reembolsado',
  return_requested: 'Devolução solicitada',
  returned: 'Devolvido',
}

function label(s: string): string {
  return STATUS_LABEL[s] ?? s
}

function dt(v: string | null): string {
  return v ? new Date(v).toLocaleString('pt-BR') : '—'
}

interface OrderRow {
  id: string
  order_number: string
  status: string
  subtotal_cents: number
  discount_cents: number
  shipping_cents: number
  total_cents: number
  created_at: string
  customer_snapshot: { name?: string; email?: string } | null
  shipping_address: {
    street?: string
    number?: string
    complement?: string | null
    district?: string | null
    city?: string
    state?: string
    zip?: string
  } | null
}

interface ItemRow {
  product_name: string
  variant_name: string | null
  quantity: number
  total_cents: number
}

interface HistoryRow {
  to_status: string
  created_at: string
}

interface ShipmentRow {
  provider: string | null
  service_name: string | null
  tracking_code: string | null
  shipped_at: string | null
  delivered_at: string | null
}

export default async function ClientePedidoPage({ params }: { params: { id: string } }) {
  const user = await requireUser()
  const email = (user.email ?? '').toLowerCase()
  const admin = createAdminClient()

  const { data: orderData } = await admin
    .from('orders')
    .select(
      'id, order_number, status, subtotal_cents, discount_cents, shipping_cents, total_cents, created_at, customer_snapshot, shipping_address',
    )
    .eq('id', params.id)
    .maybeSingle()
  const order = orderData as unknown as OrderRow | null

  // Só o dono do pedido (casado pelo e-mail) pode ver.
  if (!order || (order.customer_snapshot?.email ?? '').toLowerCase() !== email) notFound()

  const [{ data: itemsData }, { data: historyData }, { data: shipmentData }] = await Promise.all([
    admin
      .from('order_items')
      .select('product_name, variant_name, quantity, total_cents')
      .eq('order_id', order.id),
    admin
      .from('order_status_history')
      .select('to_status, created_at')
      .eq('order_id', order.id)
      .order('created_at', { ascending: true }),
    admin
      .from('shipments')
      .select('provider, service_name, tracking_code, shipped_at, delivered_at')
      .eq('order_id', order.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
  ])
  const items = (itemsData ?? []) as unknown as ItemRow[]
  const history = (historyData ?? []) as unknown as HistoryRow[]
  const shipment = (shipmentData ?? null) as unknown as ShipmentRow | null
  const addr = order.shipping_address

  return (
    <div className="space-y-6">
      <Link
        href="/conta/pedidos"
        className="inline-flex items-center gap-2 text-sm text-night-300 transition-colors hover:text-brand-400"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden /> Voltar aos pedidos
      </Link>

      <div className="flex flex-wrap items-center gap-3">
        <h1 className="font-display text-2xl font-extrabold uppercase tracking-tight">
          Pedido {order.order_number}
        </h1>
        <span className="rounded-full bg-brand-500/15 px-3 py-1 text-xs font-semibold text-brand-400">
          {label(order.status)}
        </span>
      </div>

      {/* Rastreio */}
      <section className="rounded-xl border border-white/10 bg-surface p-6">
        <h2 className="mb-3 font-semibold text-white">Rastreamento</h2>
        {shipment?.tracking_code ? (
          <div className="space-y-2 text-sm text-night-200">
            <p>
              Transportadora:{' '}
              <strong className="text-white">
                {shipment.service_name ?? shipment.provider ?? 'Correios'}
              </strong>
            </p>
            <p>
              Código:{' '}
              <strong className="font-mono text-brand-400">{shipment.tracking_code}</strong>
            </p>
            {shipment.delivered_at ? (
              <p className="text-success">Entregue em {dt(shipment.delivered_at)}</p>
            ) : shipment.shipped_at ? (
              <p className="text-night-300">Enviado em {dt(shipment.shipped_at)}</p>
            ) : null}
            <a
              href="https://rastreamento.correios.com.br/app/index.php"
              target="_blank"
              rel="noreferrer"
              className="mt-2 inline-block rounded-lg bg-brand-500 px-4 py-2 text-sm font-semibold uppercase tracking-wide text-night-900 hover:bg-brand-400"
            >
              Rastrear nos Correios
            </a>
            <p className="text-xs text-night-400">Cole o código na página dos Correios para ver o trajeto.</p>
          </div>
        ) : (
          <p className="text-sm text-night-300">
            Assim que seu pedido for despachado, o código de rastreio aparece aqui.
          </p>
        )}
      </section>

      {/* Linha do tempo */}
      <section className="rounded-xl border border-white/10 bg-surface p-6">
        <h2 className="mb-3 font-semibold text-white">Andamento</h2>
        <ol className="space-y-3">
          {history.map((h, idx) => (
            <li key={idx} className="flex items-start gap-3 text-sm">
              <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-brand-500" aria-hidden />
              <span>
                <span className="font-medium text-white">{label(h.to_status)}</span>
                <span className="block text-xs text-night-400">{dt(h.created_at)}</span>
              </span>
            </li>
          ))}
          {history.length === 0 && (
            <li className="text-sm text-night-300">Pedido criado em {dt(order.created_at)}.</li>
          )}
        </ol>
      </section>

      {/* Itens + totais */}
      <section className="rounded-xl border border-white/10 bg-surface p-6">
        <h2 className="mb-3 font-semibold text-white">Itens</h2>
        <table className="w-full text-left text-sm">
          <tbody>
            {items.map((i, idx) => (
              <tr key={idx} className="border-b border-white/5">
                <td className="py-2 text-night-200">
                  {i.quantity}× {i.product_name}
                  {i.variant_name && <span className="text-night-400"> · {i.variant_name}</span>}
                </td>
                <td className="py-2 text-right text-night-200">{formatBRL(i.total_cents)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <dl className="mt-4 space-y-1 text-sm">
          <div className="flex justify-between text-night-300">
            <dt>Subtotal</dt>
            <dd>{formatBRL(order.subtotal_cents)}</dd>
          </div>
          <div className="flex justify-between text-night-300">
            <dt>Frete</dt>
            <dd>{formatBRL(order.shipping_cents)}</dd>
          </div>
          <div className="flex justify-between border-t border-white/10 pt-2 text-base font-bold text-white">
            <dt>Total</dt>
            <dd className="text-brand-400">{formatBRL(order.total_cents)}</dd>
          </div>
        </dl>
      </section>

      {/* Entrega */}
      {addr && (
        <section className="rounded-xl border border-white/10 bg-surface p-6">
          <h2 className="mb-3 font-semibold text-white">Endereço de entrega</h2>
          <address className="text-sm not-italic text-night-300">
            {addr.street}, {addr.number}
            {addr.complement ? ` — ${addr.complement}` : ''}
            <br />
            {addr.district ? `${addr.district} — ` : ''}
            {addr.city}/{addr.state} · CEP {addr.zip}
          </address>
        </section>
      )}
    </div>
  )
}
