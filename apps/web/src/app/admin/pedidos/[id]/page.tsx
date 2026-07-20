import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { ORDER_TRANSITIONS, type OrderStatus } from '@clubedaestampa/types'
import { formatBRL } from '@clubedaestampa/ui'
import { isMelhorEnvioConfigured } from '@clubedaestampa/integrations'
import { requirePermission } from '@/lib/auth/session'
import { createAdminClient } from '@/lib/supabase/admin'
import { StatusForm } from './status-form'
import { TrackingForm } from './tracking-form'
import { LabelForm } from './label-form'

export const metadata: Metadata = { title: 'Pedido' }
export const dynamic = 'force-dynamic'

const STATUS_LABEL: Record<string, string> = {
  draft: 'Rascunho',
  awaiting_payment: 'Aguardando pagamento',
  payment_processing: 'Processando pagamento',
  paid: 'Pago',
  fiscal_pending: 'Fiscal pendente',
  fiscal_failed: 'Falha fiscal',
  fiscal_authorized: 'Nota autorizada',
  picking: 'Separação',
  packed: 'Embalado',
  shipped: 'Enviado',
  delivered: 'Entregue',
  cancel_requested: 'Cancelamento solicitado',
  cancelled: 'Cancelado',
  refunded: 'Reembolsado',
  return_requested: 'Devolução solicitada',
  returned: 'Devolvido',
}

function label(status: string): string {
  return STATUS_LABEL[status] ?? status
}

interface OrderRow {
  id: string
  order_number: string
  status: string
  channel: string
  currency: string
  subtotal_cents: number
  discount_cents: number
  shipping_cents: number
  tax_cents: number
  total_cents: number
  created_at: string
  paid_at: string | null
  cancelled_at: string | null
  customer_snapshot: { name?: string; email?: string; document?: string } | null
  shipping_address: {
    zip?: string
    street?: string
    number?: string
    complement?: string | null
    district?: string | null
    city?: string
    state?: string
  } | null
  shipping_method_snapshot: { serviceId?: number; name?: string; company?: string } | null
  partner_id: string | null
}

interface ItemRow {
  product_name: string
  variant_name: string | null
  sku: string | null
  quantity: number
  unit_price_cents: number
  total_cents: number
}

interface HistoryRow {
  from_status: string | null
  to_status: string
  reason: string | null
  created_at: string
}

interface PaymentRow {
  provider: string
  method: string
  status: string
  amount_cents: number
  approved_at: string | null
}

interface ShipmentRow {
  provider: string | null
  service_name: string | null
  status: string
  tracking_code: string | null
  label_storage_path: string | null
  external_id: string | null
  shipped_at: string | null
  delivered_at: string | null
}

function dt(v: string | null): string {
  return v ? new Date(v).toLocaleString('pt-BR') : '—'
}

export default async function PedidoDetailPage({ params }: { params: { id: string } }) {
  await requirePermission('orders.read')
  const admin = createAdminClient()

  const { data: orderData } = await admin
    .from('orders')
    .select(
      'id, order_number, status, channel, currency, subtotal_cents, discount_cents, shipping_cents, tax_cents, total_cents, created_at, paid_at, cancelled_at, customer_snapshot, shipping_address, shipping_method_snapshot, partner_id',
    )
    .eq('id', params.id)
    .maybeSingle()
  const order = orderData as unknown as OrderRow | null
  if (!order) notFound()

  const [{ data: itemsData }, { data: historyData }, { data: paymentsData }, { data: shipmentData }] =
    await Promise.all([
      admin
        .from('order_items')
        .select('product_name, variant_name, sku, quantity, unit_price_cents, total_cents')
        .eq('order_id', order.id),
      admin
        .from('order_status_history')
        .select('from_status, to_status, reason, created_at')
        .eq('order_id', order.id)
        .order('created_at', { ascending: false }),
      admin
        .from('payments')
        .select('provider, method, status, amount_cents, approved_at')
        .eq('order_id', order.id),
      admin
        .from('shipments')
        .select(
          'provider, service_name, status, tracking_code, label_storage_path, external_id, shipped_at, delivered_at',
        )
        .eq('order_id', order.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle(),
    ])
  const items = (itemsData ?? []) as unknown as ItemRow[]
  const history = (historyData ?? []) as unknown as HistoryRow[]
  const payments = (paymentsData ?? []) as unknown as PaymentRow[]
  const shipment = (shipmentData ?? null) as unknown as ShipmentRow | null

  const nextOptions = (ORDER_TRANSITIONS[order.status as OrderStatus] ?? []).map((s) => ({
    value: s,
    label: label(s),
  }))

  const addr = order.shipping_address
  const cust = order.customer_snapshot
  const meEnabled = isMelhorEnvioConfigured()
  const meServiceId = order.shipping_method_snapshot?.serviceId

  let storeName = 'Clube da Estampa'
  if (order.partner_id) {
    const { data: pd } = await admin
      .from('partners')
      .select('name')
      .eq('id', order.partner_id)
      .maybeSingle()
    storeName = (pd as { name: string } | null)?.name ?? 'Parceiro'
  }

  return (
    <div className="space-y-8">
      <div>
        <Link
          href="/admin/pedidos"
          className="inline-flex items-center gap-2 text-sm text-night-500 transition-colors hover:text-brand-600"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden /> Voltar aos pedidos
        </Link>
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-bold">Pedido {order.order_number}</h1>
          <span className="rounded-full bg-night-50 px-3 py-1 text-xs font-medium">
            {label(order.status)}
          </span>
          <span className="rounded-full bg-brand-50 px-3 py-1 text-xs font-medium text-brand-700">
            Loja: {storeName}
          </span>
        </div>
        <p className="mt-1 text-sm text-night-500">Criado em {dt(order.created_at)}</p>
      </div>

      {/* Ação de status */}
      <section className="rounded-xl border border-night-100 p-5">
        <h2 className="mb-3 font-semibold">Alterar status</h2>
        <StatusForm orderId={order.id} options={nextOptions} />
      </section>

      {/* Envio / rastreio */}
      <section className="rounded-xl border border-night-100 p-5">
        <h2 className="mb-3 font-semibold">Envio / rastreio</h2>
        {shipment?.tracking_code ? (
          <p className="mb-3 text-sm text-night-600">
            Atual: <strong>{shipment.service_name ?? shipment.provider ?? 'Correios'}</strong> ·{' '}
            <span className="font-mono">{shipment.tracking_code}</span>
            {shipment.shipped_at ? ` · enviado ${dt(shipment.shipped_at)}` : ''}
          </p>
        ) : (
          <p className="mb-3 text-sm text-night-500">Nenhum código de rastreio ainda.</p>
        )}

        {/* Melhor Envio: comprar frete + gerar etiqueta (usa o serviço escolhido no checkout) */}
        {meEnabled && (
          <div className="mb-4 rounded-lg border border-night-100 bg-night-50/60 p-4">
            <p className="mb-1 text-sm font-medium">Etiqueta Melhor Envio</p>
            {meServiceId ? (
              <>
                <p className="mb-3 text-xs text-night-500">
                  Serviço escolhido pelo cliente:{' '}
                  {order.shipping_method_snapshot?.company
                    ? `${order.shipping_method_snapshot.company} `
                    : ''}
                  {order.shipping_method_snapshot?.name ?? '—'}.
                </p>
                {shipment?.label_storage_path && (
                  <p className="mb-3 text-sm">
                    <a
                      href={shipment.label_storage_path}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-semibold text-brand-600 hover:underline"
                    >
                      Abrir etiqueta gerada (PDF) ↗
                    </a>
                  </p>
                )}
                <LabelForm orderId={order.id} />
              </>
            ) : (
              <p className="text-xs text-night-500">
                Este pedido não tem serviço de frete do Melhor Envio (foi criado antes da integração
                ou sem cálculo de frete). Use o rastreio manual abaixo.
              </p>
            )}
          </div>
        )}

        <TrackingForm
          orderId={order.id}
          carrier={shipment?.service_name ?? shipment?.provider ?? 'Correios'}
          trackingCode={shipment?.tracking_code ?? ''}
        />
      </section>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Itens */}
        <section className="lg:col-span-2 rounded-xl border border-night-100 p-5">
          <h2 className="mb-3 font-semibold">Itens</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-night-500">
                <tr>
                  <th className="py-2 font-medium">Produto</th>
                  <th className="py-2 font-medium">Qtd</th>
                  <th className="py-2 text-right font-medium">Unitário</th>
                  <th className="py-2 text-right font-medium">Total</th>
                </tr>
              </thead>
              <tbody>
                {items.map((i, idx) => (
                  <tr key={idx} className="border-t border-night-100">
                    <td className="py-2">
                      {i.product_name}
                      {i.variant_name && <span className="text-night-500"> · {i.variant_name}</span>}
                      {i.sku && <span className="block text-xs text-night-400">{i.sku}</span>}
                    </td>
                    <td className="py-2">{i.quantity}</td>
                    <td className="py-2 text-right">{formatBRL(i.unit_price_cents)}</td>
                    <td className="py-2 text-right">{formatBRL(i.total_cents)}</td>
                  </tr>
                ))}
                {items.length === 0 && (
                  <tr>
                    <td colSpan={4} className="py-4 text-center text-night-500">
                      Sem itens.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <dl className="mt-4 space-y-1 border-t border-night-100 pt-4 text-sm">
            <div className="flex justify-between">
              <dt className="text-night-500">Subtotal</dt>
              <dd>{formatBRL(order.subtotal_cents)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-night-500">Desconto</dt>
              <dd>-{formatBRL(order.discount_cents)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-night-500">Frete</dt>
              <dd>{formatBRL(order.shipping_cents)}</dd>
            </div>
            <div className="flex justify-between border-t border-night-100 pt-2 text-base font-bold">
              <dt>Total</dt>
              <dd>{formatBRL(order.total_cents)}</dd>
            </div>
          </dl>
        </section>

        {/* Cliente + entrega + pagamento */}
        <div className="space-y-6">
          <section className="rounded-xl border border-night-100 p-5">
            <h2 className="mb-3 font-semibold">Cliente</h2>
            <p className="text-sm">{cust?.name ?? '—'}</p>
            <p className="text-sm text-night-500">{cust?.email ?? '—'}</p>
            {cust?.document && <p className="text-sm text-night-500">Doc: {cust.document}</p>}
          </section>

          <section className="rounded-xl border border-night-100 p-5">
            <h2 className="mb-3 font-semibold">Entrega</h2>
            {addr ? (
              <address className="text-sm not-italic text-night-600">
                {addr.street}, {addr.number}
                {addr.complement ? ` — ${addr.complement}` : ''}
                <br />
                {addr.district ? `${addr.district} — ` : ''}
                {addr.city}/{addr.state}
                <br />
                CEP {addr.zip}
              </address>
            ) : (
              <p className="text-sm text-night-500">—</p>
            )}
          </section>

          <section className="rounded-xl border border-night-100 p-5">
            <h2 className="mb-3 font-semibold">Pagamento</h2>
            {payments.length === 0 && <p className="text-sm text-night-500">Nenhum registro.</p>}
            {payments.map((p, idx) => (
              <div key={idx} className="mb-2 text-sm">
                <p className="font-medium">
                  {p.method} · {p.provider}
                </p>
                <p className="text-night-500">
                  {p.status} · {formatBRL(p.amount_cents)}
                  {p.approved_at ? ` · aprovado ${dt(p.approved_at)}` : ''}
                </p>
              </div>
            ))}
            {order.paid_at && (
              <p className="mt-1 text-xs text-night-400">Pago em {dt(order.paid_at)}</p>
            )}
          </section>
        </div>
      </div>

      {/* Histórico */}
      <section className="rounded-xl border border-night-100 p-5">
        <h2 className="mb-3 font-semibold">Histórico de status</h2>
        <ol className="space-y-2 text-sm">
          {history.map((h, idx) => (
            <li key={idx} className="flex flex-wrap items-baseline gap-2">
              <span className="text-night-400">{dt(h.created_at)}</span>
              <span className="font-medium">
                {h.from_status ? `${label(h.from_status)} → ` : ''}
                {label(h.to_status)}
              </span>
              {h.reason && <span className="text-night-500">· {h.reason}</span>}
            </li>
          ))}
          {history.length === 0 && <li className="text-night-500">Sem histórico.</li>}
        </ol>
      </section>
    </div>
  )
}
