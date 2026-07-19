import 'server-only'

/**
 * Camada de métricas de tráfego pago (Campanhas).
 *
 * A ideia: puxar gasto/impressões/cliques/conversões/receita por canal
 * (Google Ads, Meta, TikTok, etc.) via um provedor de dados — por exemplo
 * a API do Supermetrics — no servidor, usando uma chave em variável de
 * ambiente (SUPERMETRICS_API_KEY).
 *
 * Enquanto a integração não está conectada, retornamos `connected: false`
 * e a UI exibe o estado "conectar fonte de dados". Quando a chave existir,
 * a busca real entra em `fetchFromProvider()`.
 */

export interface ChannelMetrics {
  channel: string
  spendCents: number
  impressions: number
  clicks: number
  conversions: number
  revenueCents: number
}

export interface CampaignOverview {
  connected: boolean
  rangeLabel: string
  channels: ChannelMetrics[]
}

/** True quando a fonte de dados de campanhas (ex.: Supermetrics) está configurada. */
export function isCampaignsConfigured(): boolean {
  return Boolean(process.env.SUPERMETRICS_API_KEY)
}

/**
 * Busca a visão consolidada de campanhas por canal.
 * TODO: implementar a chamada real ao provedor (Supermetrics) aqui,
 * mapeando cada fonte (Google/Meta/TikTok) para ChannelMetrics.
 */
export async function getCampaignOverview(): Promise<CampaignOverview> {
  if (!isCampaignsConfigured()) {
    return { connected: false, rangeLabel: 'Últimos 30 dias', channels: [] }
  }
  // Placeholder até a integração ser ligada — mantém a UI funcional sem dados falsos.
  return { connected: true, rangeLabel: 'Últimos 30 dias', channels: [] }
}
