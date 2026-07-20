import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { KLogo } from '@/components/brand/k-logo'

/**
 * Hero em duas colunas. Fundo: /hero-bg.jpg (arte de marca) + overlay.
 * Produto: /hero-product.png (PNG transparente). Se ausente, mostra o "K".
 */
export function HeroSection() {
  return (
    <section className="relative isolate overflow-hidden">
      {/* fundo de marca */}
      <div
        aria-hidden
        className="absolute inset-0 -z-10 bg-cover bg-center"
        style={{ backgroundImage: "url('/hero-bg.jpg')" }}
      />
      <div aria-hidden className="absolute inset-0 -z-10 bg-gradient-to-r from-night-900 via-night-900/85 to-night-900/40" />
      <div aria-hidden className="absolute inset-0 -z-10 bg-gradient-to-b from-night-900/30 via-transparent to-night-900" />

      <div className="mx-auto grid min-h-[560px] max-w-[1440px] items-start gap-8 px-6 pb-16 pt-24 sm:px-8 lg:min-h-[680px] lg:grid-cols-2 lg:pt-24">
        {/* texto */}
        <div className="max-w-xl">
          <span className="inline-block rounded-md border border-brand-500/40 bg-brand-500/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.3em] text-brand-500">
            Estampas autorais
          </span>
          <h1 className="mt-6 font-display text-4xl font-extrabold uppercase leading-[1.05] tracking-tight text-white sm:text-6xl">
            Vista o que você <span className="text-brand-500">curte</span>.
          </h1>
          <p className="mt-5 max-w-md text-base text-night-200 sm:text-lg">
            Estampas autorais em coleções que falam a sua língua — do esporte à cultura pop.
            Qualidade premium e entrega confiável.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/produtos"
              className="inline-flex h-[52px] items-center gap-2 rounded-lg bg-brand-500 px-7 text-sm font-semibold uppercase tracking-wide text-night-900 transition-all duration-200 hover:-translate-y-0.5 hover:bg-brand-400 hover:shadow-gold"
            >
              Explorar a loja <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
            <Link
              href="#lancamentos"
              className="inline-flex h-[52px] items-center rounded-lg border border-white/20 px-7 text-sm font-semibold uppercase tracking-wide text-white transition-all duration-200 hover:-translate-y-0.5 hover:border-brand-500/60"
            >
              Ver lançamentos
            </Link>
          </div>
        </div>

        {/* produto / K */}
        <div className="relative hidden h-[560px] w-full items-center justify-center lg:flex">
          <KLogo size={560} className="opacity-30 xl:translate-x-6" />
          <div
            aria-hidden
            className="absolute inset-0 bg-contain bg-center bg-no-repeat drop-shadow-[0_30px_60px_rgba(200,154,43,0.25)]"
            style={{ backgroundImage: "url('/hero-product.png')" }}
          />
        </div>
      </div>
    </section>
  )
}
