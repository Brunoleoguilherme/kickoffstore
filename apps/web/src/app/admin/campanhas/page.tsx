import type { Metadata } from 'next'
import { requireUser } from '@/lib/auth/session'
import { formatBRL } from '@kickoffstore/ui'
import { getCampaignOverview, type ChannelMetrics } from '@/lib/marketing/campaigns'

export const metadata: Metadata = { title: 'Campanhas' }
export const dynamic = 'force-dynamic'

function num(n: number): string {
  return n.toLocaleString('pt-BR')
}

function pct(n: number): string {
  return `${(n * 100).toLocaleString('pt-BR', { maximumFractionDigits: 2 })}%`
}

function StatCard({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-xl border border-night-100 p-5">
      <p className="text-xs font-medium uppercase tracking-wide text-night-500">{label}</p>
      <p className="mt-1 text-2xl font-bold">{value}</p>
      {hint && <p className="mt-1 text-xs text-night-500">{hint}</p>}
    </div>
  )
}

function totals(channels: ChannelMetrics[]) {
  return channels.reduce(
    (acc, c) => ({
      spendCents: acc.spendCents + c.spendCents,
      impressions: acc.impressions + c.impressions,
      clicks: acc.clicks + c.clicks,
      conversions: acc.conversions + c.conversions,
      revenueCents: acc.revenueCents + c.revenueCents,
    }),
    { spendCents: 0, impressions: 0, clicks: 0, conversions: 0, revenueCents: 0 },
  )
}

export default async function CampanhasPage() {
  await requireUser()
  const overview = await getCampaignOverview()
  const t = totals(overview.channels)
  const roas = t.spendCents > 0 ? t.revenueCents / t.spendCents : 0
  const ctr = t.impressions > 0 ? t.clicks / t.impressions : 0
  const cpaCents = t.conversions > 0 ? Math.round(t.spendCents / t.conversions) : 0

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Campanhas</h1>
        <p className="text-sm text-night-500">
          Métricas de tráfego pago por canal · {overview.rangeLabel}
        </p>
      </div>

      {!overview.connected && (
        <div className="rounded-xl border border-night-200 bg-night-50 p-5 text-sm text-night-700">
          <p className="font-semibold text-night-900">Fonte de dados não conectada</p>
          <p className="mt-1">
            Esta aba está pronta para exibir gasto, cliques, conversões e ROAS de Google Ads, Meta,
            TikTok e outros. Para puxar os dados reais, vamos conectar o provedor (ex.: Supermetrics)
            definindo a variável <code className="rounded bg-night-100 px-1">SUPERMETRICS_API_KEY</code>.
            Assim que conectarmos, os números abaixo passam a ser reais.
          </p>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Investimento" value={formatBRL(t.spendCents)} />
        <StatCard label="Receita atribuída" value={formatBRL(t.revenueCents)} />
        <StatCard label="ROAS" value={`${roas.toLocaleString('pt-BR', { maximumFractionDigits: 2 })}x`} hint="Receita / investimento" />
        <StatCard label="Conversões" value={num(t.conversions)} hint={`CPA ${formatBRL(cpaCents)}`} />
        <StatCard label="Impressões" value={num(t.impressions)} />
        <StatCard label="Cliques" value={num(t.clicks)} hint={`CTR ${pct(ctr)}`} />
      </div>

      <section className="overflow-x-auto rounded-lg border border-night-100">
        <table className="w-full text-left text-sm">
          <thead className="bg-night-50 text-night-500">
            <tr>
              <th className="px-4 py-2 font-medium">Canal</th>
              <th className="px-4 py-2 text-right font-medium">Investimento</th>
              <th className="px-4 py-2 text-right font-medium">Impressões</th>
              <th className="px-4 py-2 text-right font-medium">Cliques</th>
              <th className="px-4 py-2 text-right font-medium">Conversões</th>
              <th className="px-4 py-2 text-right font-medium">Receita</th>
              <th className="px-4 py-2 text-right font-medium">ROAS</th>
            </tr>
          </thead>
          <tbody>
            {overview.channels.map((c) => {
              const r = c.spendCents > 0 ? c.revenueCents / c.spendCents : 0
              return (
                <tr key={c.channel} className="border-t border-night-100">
                  <td className="px-4 py-2 font-medium">{c.channel}</td>
                  <td className="px-4 py-2 text-right">{formatBRL(c.spendCents)}</td>
                  <td className="px-4 py-2 text-right">{num(c.impressions)}</td>
                  <td className="px-4 py-2 text-right">{num(c.clicks)}</td>
                  <td className="px-4 py-2 text-right">{num(c.conversions)}</td>
                  <td className="px-4 py-2 text-right">{formatBRL(c.revenueCents)}</td>
                  <td className="px-4 py-2 text-right">
                    {r.toLocaleString('pt-BR', { maximumFractionDigits: 2 })}x
                  </td>
                </tr>
              )
            })}
            {overview.channels.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-night-500">
                  Nenhum dado de campanha ainda. Conecte a fonte de dados para começar a acompanhar.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </section>
    </div>
  )
}
