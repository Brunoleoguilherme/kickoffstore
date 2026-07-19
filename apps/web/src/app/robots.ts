import type { MetadataRoute } from 'next'
import { clientEnv } from '@kickoffstore/validation'

export default function robots(): MetadataRoute.Robots {
  const base = clientEnv.NEXT_PUBLIC_APP_URL
  return {
    rules: [{ userAgent: '*', allow: '/', disallow: ['/admin', '/conta', '/api'] }],
    sitemap: `${base}/sitemap.xml`,
  }
}
