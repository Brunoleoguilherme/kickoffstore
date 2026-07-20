import type { Metadata } from 'next'
import { Inter, Montserrat } from 'next/font/google'
import { clientEnv } from '@clubedaestampa/validation'
import { CartProvider } from '@/components/cart/cart-context'
import { Analytics } from '@/components/analytics/analytics'
import { PartnerBar } from '@/components/partners/partner-bar'
import { BrandProvider } from '@/components/partners/brand-context'
import { getActivePartner } from '@/lib/partners/context'
import { partnerThemeCss } from '@/lib/partners/theme'
import './globals.css'

const inter = Inter({ subsets: ['latin'], variable: '--font-sans', display: 'swap' })
const montserrat = Montserrat({
  subsets: ['latin'],
  weight: ['600', '700', '800', '900'],
  variable: '--font-display',
  display: 'swap',
})

export async function generateMetadata(): Promise<Metadata> {
  const partner = await getActivePartner()
  const name = partner?.name ?? clientEnv.NEXT_PUBLIC_APP_NAME
  return {
    title: {
      default: partner
        ? `${name} — Loja oficial`
        : `${name} — Performance starts here`,
      template: `%s · ${name}`,
    },
    description: partner
      ? `Loja oficial ${partner.name} — powered by Clube da Estampa.`
      : 'Clube da Estampa: artigos esportivos premium com curadoria por modalidade. Performance starts here.',
    metadataBase: new URL(clientEnv.NEXT_PUBLIC_APP_URL),
  }
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const partner = await getActivePartner()
  const themeCss = partner ? partnerThemeCss(partner.primaryColor, partner.accentColor) : ''
  const partnerBar = await PartnerBar()
  const brand = {
    name: partner?.name ?? 'Clube da Estampa',
    logoUrl: partner?.logoUrl ?? null,
    isPartner: Boolean(partner),
    tagline: partner?.tagline ?? null,
    instagram: partner?.instagram ?? null,
    facebook: partner?.facebook ?? null,
    youtube: partner?.youtube ?? null,
  }
  return (
    <html lang="pt-BR" className={`${inter.variable} ${montserrat.variable}`}>
      <body className="bg-white font-sans text-night-900 antialiased">
        {themeCss ? <style dangerouslySetInnerHTML={{ __html: themeCss }} /> : null}
        {partnerBar}
        <BrandProvider value={brand}>
          <CartProvider>{children}</CartProvider>
        </BrandProvider>
        <Analytics />
      </body>
    </html>
  )
}
