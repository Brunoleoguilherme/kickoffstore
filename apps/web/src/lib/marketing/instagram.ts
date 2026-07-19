import 'server-only'

/**
 * Integração com o Instagram (Graph API da Meta) — fase 1: publicação de posts.
 *
 * Requer, no ambiente:
 *   INSTAGRAM_ACCESS_TOKEN  — token de acesso de longa duração da conta.
 *   INSTAGRAM_BUSINESS_ID   — id da conta profissional do Instagram (IG User ID).
 *
 * Sem essas variáveis, `isInstagramConfigured()` retorna false e a UI mostra o
 * estado "conectar conta". A publicação segue o fluxo oficial de 2 passos:
 * cria um container de mídia e depois publica.
 *
 * DMs (directs) entram na fase 2 — exigem webhook + permissão de mensagens
 * (instagram_manage_messages) aprovada em App Review, e respeitam a janela de 24h.
 */

const GRAPH = 'https://graph.facebook.com/v21.0'

export function isInstagramConfigured(): boolean {
  return Boolean(process.env.INSTAGRAM_ACCESS_TOKEN && process.env.INSTAGRAM_BUSINESS_ID)
}

function creds(): { token: string; igId: string } {
  const token = process.env.INSTAGRAM_ACCESS_TOKEN
  const igId = process.env.INSTAGRAM_BUSINESS_ID
  if (!token || !igId) {
    throw new Error('Instagram não configurado (INSTAGRAM_ACCESS_TOKEN / INSTAGRAM_BUSINESS_ID).')
  }
  return { token, igId }
}

export interface InstagramProfile {
  username: string
  followers: number
  mediaCount: number
}

/** Perfil básico da conta conectada (para exibir no admin). */
export async function getInstagramProfile(): Promise<InstagramProfile> {
  const { token, igId } = creds()
  const url = `${GRAPH}/${igId}?fields=username,followers_count,media_count&access_token=${encodeURIComponent(token)}`
  const res = await fetch(url, { cache: 'no-store' })
  const data = (await res.json()) as {
    username?: string
    followers_count?: number
    media_count?: number
    error?: { message?: string }
  }
  if (!res.ok) throw new Error(data.error?.message ?? 'Falha ao consultar o perfil do Instagram.')
  return {
    username: String(data.username ?? ''),
    followers: Number(data.followers_count ?? 0),
    mediaCount: Number(data.media_count ?? 0),
  }
}

/**
 * Publica uma foto no feed. `imageUrl` precisa ser uma URL pública (JPEG).
 * Passo 1: cria o container. Passo 2: publica o container.
 */
export async function publishInstagramPhoto(
  imageUrl: string,
  caption: string,
): Promise<{ id: string }> {
  const { token, igId } = creds()

  const createRes = await fetch(`${GRAPH}/${igId}/media`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ image_url: imageUrl, caption, access_token: token }),
  })
  const created = (await createRes.json()) as { id?: string; error?: { message?: string } }
  if (!createRes.ok || !created.id) {
    throw new Error(created.error?.message ?? 'Falha ao criar a mídia no Instagram.')
  }

  const publishRes = await fetch(`${GRAPH}/${igId}/media_publish`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ creation_id: created.id, access_token: token }),
  })
  const published = (await publishRes.json()) as { id?: string; error?: { message?: string } }
  if (!publishRes.ok || !published.id) {
    throw new Error(published.error?.message ?? 'Falha ao publicar no Instagram.')
  }
  return { id: String(published.id) }
}
