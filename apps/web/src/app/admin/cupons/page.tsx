import type { Metadata } from 'next'
import { requirePermission } from '@/lib/auth/session'
import { createAdminClient } from '@/lib/supabase/admin'
import { formatBRL } from '@kickoffstore/ui'
import { CouponCreateForm, type PartnerOpt } from './create-form'
import { CouponRowActions } from './row-actions'

export const metadata: Metadata = { title: 'Cupons' }
export const dynamic = 'force-dynamic'

interface CouponRow {
  id: string
  code: string
  discount_type: 'percent' | 'fixed'
  discount_value: number
  active: boolean
  min_order_cents: number
  max_uses: number | null
  used_count: number
  expires_at: string | null
  partner_id: string | null
}

function discountLabel(c: CouponRow): string {
  return c.discount_type === 'percent' ? `${c.discount_value}%` : formatBRL(c.discount_value)
}

export default async function CuponsPage() {
  await requirePermission('catalog.read')
  const admin = createAdminClient()

  const [{ data: couponsData }, { data: partnersData }] = await Promise.all([
    admin
      .from('coupons')
      .select(
        'id, code, discount_type, discount_value, active, min_order_cents, max_uses, used_count, expires_at, partner_id',
      )
      .order('created_at', { ascending: false }),
    admin.from('partners').select('id, name').order('name', { ascending: true }),
  ])
  const coupons = (couponsData ?? []) as unknown as CouponRow[]
  const partners = (partnersData ?? []) as unknown as PartnerOpt[]
  const partnerName = new Map(partners.map((p) => [p.id, p.name]))

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Cupons</h1>
        <p className="text-sm text-night-500">Descontos aplicados no checkout.</p>
      </div>

      <section className="rounded-xl border border-night-100 p-6">
        <h2 className="mb-4 font-semibold">Novo cupom</h2>
        <CouponCreateForm partners={partners} />
      </section>

      <section>
        <h2 className="mb-3 font-semibold">Cupons ({coupons.length})</h2>
        <div className="overflow-x-auto rounded-lg border border-night-100">
          <table className="w-full text-left text-sm">
            <thead className="bg-night-50 text-night-500">
              <tr>
                <th className="px-4 py-2 font-medium">Código</th>
                <th className="px-4 py-2 font-medium">Desconto</th>
                <th className="px-4 py-2 font-medium">Mín.</th>
                <th className="px-4 py-2 font-medium">Usos</th>
                <th className="px-4 py-2 font-medium">Validade</th>
                <th className="px-4 py-2 font-medium">Loja</th>
                <th className="px-4 py-2 font-medium">Status</th>
                <th className="px-4 py-2" />
              </tr>
            </thead>
            <tbody>
              {coupons.map((c) => (
                <tr key={c.id} className="border-t border-night-100">
                  <td className="px-4 py-2 font-mono font-medium">{c.code}</td>
                  <td className="px-4 py-2">{discountLabel(c)}</td>
                  <td className="px-4 py-2 text-night-500">
                    {c.min_order_cents > 0 ? formatBRL(c.min_order_cents) : '—'}
                  </td>
                  <td className="px-4 py-2 text-night-500">
                    {c.used_count}
                    {c.max_uses != null ? `/${c.max_uses}` : ''}
                  </td>
                  <td className="px-4 py-2 text-night-500">
                    {c.expires_at ? new Date(c.expires_at).toLocaleDateString('pt-BR') : '—'}
                  </td>
                  <td className="px-4 py-2 text-night-500">
                    {c.partner_id ? (partnerName.get(c.partner_id) ?? 'Parceiro') : 'Todas'}
                  </td>
                  <td className="px-4 py-2">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs ${
                        c.active ? 'bg-success/10 text-success' : 'bg-night-50 text-night-500'
                      }`}
                    >
                      {c.active ? 'ativo' : 'inativo'}
                    </span>
                  </td>
                  <td className="px-4 py-2">
                    <CouponRowActions id={c.id} active={c.active} />
                  </td>
                </tr>
              ))}
              {coupons.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-6 text-center text-night-500">
                    Nenhum cupom ainda.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}
