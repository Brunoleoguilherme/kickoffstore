import type { MetadataRoute } from 'next'
import { clientEnv, isSupabaseConfigured } from '@clubedaestampa/validation'
import { listActiveProducts } from '@/lib/catalog/queries'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = clientEnv.NEXT_PUBLIC_APP_URL
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: base, changeFrequency: 'daily', priority: 1 },
    { url: `${base}/produtos`, changeFrequency: 'daily', priority: 0.9 },
  ]

  if (!isSupabaseConfigured()) return staticRoutes

  try {
    const products = await listActiveProducts(1000)
    return [
      ...staticRoutes,
      ...products.map((p) => ({
        url: `${base}/produtos/${p.slug}`,
        changeFrequency: 'weekly' as const,
        priority: 0.7,
      })),
    ]
  } catch {
    return staticRoutes
  }
}
