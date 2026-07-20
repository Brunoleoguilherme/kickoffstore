/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: [
    '@clubedaestampa/ui',
    '@clubedaestampa/types',
    '@clubedaestampa/validation',
    '@clubedaestampa/integrations',
  ],
  experimental: {
    serverActions: {
      bodySizeLimit: '8mb',
    },
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '*.supabase.co' },
    ],
  },
}

export default nextConfig
