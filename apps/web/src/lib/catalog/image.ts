import { clientEnv } from '@clubedaestampa/validation'

const BUCKET = 'product-images'

/** Resolve a public Storage URL for a product image path. */
export function productImageUrl(path: string | null): string | null {
  if (!path) return null
  if (path.startsWith('http')) return path
  const base = clientEnv.NEXT_PUBLIC_SUPABASE_URL
  if (!base) return null
  return `${base}/storage/v1/object/public/${BUCKET}/${path}`
}
