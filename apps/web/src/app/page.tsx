import { isSupabaseConfigured } from '@kickoffstore/validation'
import { listSectionProducts } from '@/lib/catalog/queries'
import { getActivePartner } from '@/lib/partners/context'
import { AnnouncementBar } from '@/components/home/announcement-bar'
import { SiteHeader } from '@/components/home/site-header'
import { HeroSection } from '@/components/home/hero-section'
import { PartnerHero } from '@/components/home/partner-hero'
import { CategoryNavigation } from '@/components/home/category-navigation'
import { BenefitsStrip } from '@/components/home/benefits-strip'
import { ProductSection } from '@/components/home/product-section'
import { SportsGrid } from '@/components/home/sports-grid'
import { BrandsStrip } from '@/components/home/brands-strip'
import { NewsletterSection } from '@/components/home/newsletter-section'
import { SiteFooter } from '@/components/home/site-footer'

export const dynamic = 'force-dynamic'

export default async function HomePage() {
  const configured = isSupabaseConfigured()
  const lancamentos = configured ? await listSectionProducts('destaques', 4) : []
  const maisVendidos = configured ? await listSectionProducts('mais_vendidos', 4) : []
  const partner = await getActivePartner()

  // Loja de parceiro: página enxuta com a marca do time (sem seções da Kickoffstore).
  if (partner) {
    return (
      <div className="overflow-x-hidden bg-night-900 text-white">
        <AnnouncementBar />
        <SiteHeader />
        <main>
          {partner.bannerUrl ? (
            <>
              <PartnerHero
                name={partner.name}
                tagline={partner.tagline}
                logoUrl={partner.logoUrl}
                bannerUrl={partner.bannerUrl}
              />
              <ProductSection
                id="destaques"
                label="Loja oficial"
                title="Destaques"
                description={`Os produtos da loja oficial ${partner.name}.`}
                products={lancamentos}
                tightTop
              />
            </>
          ) : (
            // Fundo + marca d'água cobrem o hero E os Destaques, para o logo
            // do time descer até um pouco depois dos cards.
            <div className="relative isolate overflow-hidden">
              <div
                aria-hidden
                className="absolute inset-0 -z-20 bg-gradient-to-br from-brand-700 via-night-900 to-night-900"
              />
              <div
                aria-hidden
                className="absolute inset-0 -z-20 opacity-30 [background:radial-gradient(60%_60%_at_80%_0%,rgb(var(--brand-500))_0%,transparent_70%)]"
              />
              {partner.logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={partner.logoUrl}
                  alt=""
                  aria-hidden
                  className="pointer-events-none absolute right-[-10px] top-[-46px] -z-10 hidden h-[820px] w-auto max-w-[860px] object-contain object-top opacity-[0.09] drop-shadow-2xl lg:block"
                />
              ) : null}
              <PartnerHero
                name={partner.name}
                tagline={partner.tagline}
                logoUrl={partner.logoUrl}
                bannerUrl={partner.bannerUrl}
                bare
              />
              <ProductSection
                id="destaques"
                label="Loja oficial"
                title="Destaques"
                description={`Os produtos da loja oficial ${partner.name}.`}
                products={lancamentos}
                tightTop
              />
            </div>
          )}
          {maisVendidos.length > 0 && (
            <ProductSection
              label="Em alta"
              title="Mais vendidos"
              description="Os favoritos da torcida."
              products={maisVendidos}
            />
          )}
          <BenefitsStrip />
          <NewsletterSection />
        </main>
        <SiteFooter />
      </div>
    )
  }

  return (
    <div className="overflow-x-hidden bg-night-900 text-white">
      <AnnouncementBar />
      <SiteHeader />

      <main>
        <HeroSection />
        <CategoryNavigation />
        <BenefitsStrip />

        <ProductSection
          id="lancamentos"
          label="Novo por aqui"
          title="Lançamentos"
          description="Os melhores equipamentos acabaram de chegar."
          products={lancamentos}
          badge="novo"
        />

        <SportsGrid />

        <ProductSection
          label="Em alta"
          title="Mais vendidos"
          description="Os favoritos de quem já é do time."
          products={maisVendidos}
        />

        <BrandsStrip />
        <NewsletterSection />
      </main>

      <SiteFooter />
    </div>
  )
}
