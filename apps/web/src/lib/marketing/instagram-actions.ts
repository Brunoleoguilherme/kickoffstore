'use server'

import { requireUser, isStaff } from '@/lib/auth/session'
import { publishInstagramPhoto } from '@/lib/marketing/instagram'

export interface InstagramActionState {
  ok?: boolean
  error?: string
  postId?: string
}

/** Publica uma foto no Instagram a partir do admin (apenas staff). */
export async function publishInstagramPostAction(
  _prev: InstagramActionState,
  formData: FormData,
): Promise<InstagramActionState> {
  try {
    await requireUser()
    if (!(await isStaff())) return { error: 'Sem permissão.' }

    const imageUrl = String(formData.get('imageUrl') ?? '').trim()
    const caption = String(formData.get('caption') ?? '').trim()
    if (!imageUrl) return { error: 'Informe a URL pública da imagem (JPEG).' }
    if (!/^https?:\/\//i.test(imageUrl)) return { error: 'A URL da imagem deve começar com http(s).' }

    const { id } = await publishInstagramPhoto(imageUrl, caption)
    return { ok: true, postId: id }
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Erro ao publicar no Instagram.' }
  }
}
