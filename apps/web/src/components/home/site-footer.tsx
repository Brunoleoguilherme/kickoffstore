'use client'

import Link from 'next/link'
import { Instagram, Facebook, Youtube, Lock } from 'lucide-react'
import { SPORTS, sportHref } from '@/lib/home/nav'
import { useBrand } from '@/components/partners/brand-context'

const COLS: Array<{ title: string; links: Array<{ label: string; href: string }> }> = [
  {
    title: 'Institucional',
    links: [
      { label: 'Sobre a Kickoffstore', href: '/' },
      { label: 'Trabalhe conosco', href: '/' },
      { label: 'Blog', href: '/' },
    ],
  },
  {
    title: 'Atendimento',
    links: [
      { label: 'Central de ajuda', href: '/' },
      { label: 'Trocas e devoluções', href: '/' },
      { label: 'Fale conosco', href: '/' },
    ],
  },
  {
    title: 'Minha conta',
    links: [
      { label: 'Entrar', href: '/entrar' },
      { label: 'Meus pedidos', href: '/conta/pedidos' },
      { label: 'Favoritos', href: '/conta/favoritos' },
    ],
  },
  {
    title: 'Políticas',
    links: [
      { label: 'Privacidade', href: '/' },
      { label: 'Termos de uso', href: '/' },
      { label: 'Trocas', href: '/' },
    ],
  },
]

export function SiteFooter() {
  const brand = useBrand()
  const isPartner = brand.isPartner
  const brandName = brand.name
  const description = isPartner
    ? (brand.tagline ?? `Loja oficial ${brand.name}.`)
    : 'Equipamento esportivo premium para quem leva o esporte a sério. Performance starts here.'

  const socials: Array<{ Icon: typeof Instagram; href: string }> = isPartner
    ? (
        [
          brand.instagram ? { Icon: Instagram, href: brand.instagram } : null,
          brand.facebook ? { Icon: Facebook, href: brand.facebook } : null,
          brand.youtube ? { Icon: Youtube, href: brand.youtube } : null,
        ].filter(Boolean) as Array<{ Icon: typeof Instagram; href: string }>
      )
    : [Instagram, Facebook, Youtube].map((Icon) => ({ Icon, href: '/' }))

  return (
    <footer className="border-t border-white/10 bg-[#0B0B0B]">
      <div className="mx-auto max-w-[1440px] px-6 py-14 sm:px-8">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-6">
          <div className="lg:col-span-2">
            {isPartner ? (
              brand.logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={brand.logoUrl} alt={brandName} className="h-10 w-auto max-w-[180px] object-contain" />
              ) : (
                <span className="font-display text-2xl font-extrabold uppercase tracking-tight text-white">
                  {brandName}
                </span>
              )
            ) : (
              <span className="font-display text-2xl font-extrabold uppercase tracking-tight">
                <span className="text-white">KICKOFF</span>
                <span className="text-brand-500">STORE</span>
              </span>
            )}
            <p className="mt-3 max-w-xs text-sm text-night-300">{description}</p>
            {socials.length > 0 && (
              <div className="mt-5 flex gap-3">
                {socials.map(({ Icon, href }, i) => (
                  <a
                    key={i}
                    href={href}
                    target={isPartner ? '_blank' : undefined}
                    rel="noopener noreferrer"
                    aria-label="Rede social"
                    className="rounded-full border border-white/10 p-2 text-night-200 transition-colors hover:border-brand-500/60 hover:text-brand-500"
                  >
                    <Icon className="h-4 w-4" aria-hidden />
                  </a>
                ))}
              </div>
            )}
          </div>

          {!isPartner && (
            <div>
              <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-white">Modalidades</h3>
              <ul className="space-y-2 text-sm text-night-300">
                {SPORTS.map((s) => (
                  <li key={s.slug}>
                    <Link href={sportHref(s.name)} className="transition-colors hover:text-brand-500">
                      {s.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {COLS.map((col) => (
            <div key={col.title}>
              <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-white">{col.title}</h3>
              <ul className="space-y-2 text-sm text-night-300">
                {col.links.map((l) => (
                  <li key={l.label}>
                    <Link href={l.href} className="transition-colors hover:text-brand-500">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-col gap-4 border-t border-white/10 pt-6 text-sm text-night-400 sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {new Date().getFullYear()} {brandName}. Todos os direitos reservados.
            {isPartner && <span className="ml-2 text-night-500">· powered by Kickoffstore</span>}
          </p>
          <p className="flex items-center gap-2">
            <Lock className="h-4 w-4 text-brand-500" aria-hidden /> Pagamento seguro • Pix, cartão e boleto
          </p>
        </div>
      </div>
    </footer>
  )
}
