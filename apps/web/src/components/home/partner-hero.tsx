import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

/**
 * Hero da loja de um parceiro: usa a frase de destaque, o logo e as cores do
 * time (via tema). Sem imagens específicas do Clube da Estampa.
 *
 * Com `bare`, renderiza apenas o conteúdo (sem fundo e sem a marca d'água) —
 * usado quando o fundo/logo são desenhados por um contêiner externo que cobre
 * também a seção de Destaques.
 */
export function PartnerHero({
  name,
  tagline,
  logoUrl,
  bannerUrl,
  bare = false,
}: {
  name: string
  tagline: string | null
  logoUrl: string | null
  bannerUrl?: string | null
  bare?: boolean
}) {
  return (
    <section className={bare ? 'relative' : 'relative isolate overflow-hidden'}>
      {!bare && bannerUrl ? (
        <>
          <div
            aria-hidden
            className="absolute inset-0 -z-10 bg-cover bg-center"
            style={{ backgroundImage: `url('${bannerUrl}')` }}
          />
          <div
            aria-hidden
            className="absolute inset-0 -z-10 bg-gradient-to-r from-night-900 via-night-900/80 to-night-900/40"
          />
        </>
      ) : null}

      {!bare && !bannerUrl ? (
        <>
          <div
            aria-hidden
            className="absolute inset-0 -z-10 bg-gradient-to-br from-brand-700 via-night-900 to-night-900"
          />
          <div aria-hidden className="absolute inset-0 -z-10 opacity-30 [background:radial-gradient(60%_60%_at_80%_0%,rgb(var(--brand-500))_0%,transparent_70%)]" />
        </>
      ) : null}

      {/* Logo grande como marca d'água no fundo (metade visível, à direita) */}
      {!bare && logoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={logoUrl}
          alt=""
          aria-hidden
          className="pointer-events-none absolute bottom-0 right-0 hidden h-[165%] w-auto max-w-[95%] object-contain object-bottom opacity-[0.09] drop-shadow-2xl lg:block"
        />
      ) : null}

      <div className="relative mx-auto max-w-[1440px] px-6 pb-4 pt-28 sm:px-8 sm:pt-32">
        <span className="inline-block rounded-md border border-brand-500/50 bg-brand-500/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.3em] text-brand-300">
          Loja oficial
        </span>
        <h1 className="mt-4 max-w-2xl font-display text-4xl font-extrabold uppercase leading-[1.05] tracking-tight text-white sm:text-5xl">
          {tagline || `Vista as cores do ${name}.`}
        </h1>
        <div className="mt-4 flex flex-col gap-5 sm:flex-row sm:items-center">
          <p className="max-w-md text-base text-night-200 sm:text-lg">
            Produtos oficiais e coleção do time, com entrega para todo o Brasil.
          </p>
          <Link
            href="/produtos"
            className="inline-flex h-[52px] shrink-0 items-center gap-2 rounded-lg bg-brand-500 px-7 text-sm font-semibold uppercase tracking-wide text-night-900 transition-all duration-200 hover:-translate-y-0.5 hover:bg-brand-400 hover:shadow-gold"
          >
            Explorar a loja <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        </div>
      </div>
    </section>
  )
}
