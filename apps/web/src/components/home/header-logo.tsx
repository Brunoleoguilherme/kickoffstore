'use client'

import Link from 'next/link'
import { KLogo } from '@/components/brand/k-logo'
import { useBrand } from '@/components/partners/brand-context'

/**
 * Logo do header. Na loja principal: símbolo K + KICKOFFSTORE.
 * Numa loja de parceiro: o logo enviado pelo parceiro (ou o nome dele).
 */
export function HeaderLogo() {
  const brand = useBrand()

  if (brand.isPartner) {
    return (
      <Link
        href="/"
        aria-label={`${brand.name} — página inicial`}
        className="flex shrink-0 items-center gap-2.5"
      >
        {brand.logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={brand.logoUrl}
            alt={brand.name}
            className="h-16 w-auto max-w-[280px] object-contain sm:h-20"
          />
        ) : (
          <span className="font-display text-xl font-extrabold uppercase leading-none tracking-tight text-white sm:text-2xl">
            {brand.name}
          </span>
        )}
      </Link>
    )
  }

  return (
    <Link
      href="/"
      aria-label="KickoffStore — página inicial"
      className="flex shrink-0 items-center gap-2.5"
    >
      <KLogo size={40} />
      <span className="font-display text-xl font-extrabold uppercase leading-none tracking-tight sm:text-2xl">
        <span className="text-white">KICKOFF</span>
        <span className="text-brand-500">STORE</span>
      </span>
    </Link>
  )
}
