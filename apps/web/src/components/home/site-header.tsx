'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Search, Heart, ShoppingCart, User, Menu, X } from 'lucide-react'
import { HeaderLogo } from './header-logo'
import { SPORTS, sportHref } from '@/lib/home/nav'
import { useCart } from '@/components/cart/cart-context'
import { useBrand } from '@/components/partners/brand-context'

const NAV_EXTRA = [
  { name: 'Marcas', href: '/produtos' },
  { name: 'Outlet', href: '/produtos' },
]

export function SiteHeader() {
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)
  const { count, hydrated } = useCart()
  const cartCount = hydrated ? count : 0
  const brand = useBrand()

  // Loja de parceiro: menu enxuto (sem as modalidades do Clube da Estampa).
  const navItems = brand.isPartner
    ? [
        { name: 'Produtos', href: '/produtos' },
        { name: 'Favoritos', href: '/conta/favoritos' },
        { name: 'Carrinho', href: '/carrinho' },
        { name: 'Login', href: '/entrar' },
      ]
    : [
        ...SPORTS.map((s) => ({ name: s.name, href: sportHref(s.name) })),
        ...NAV_EXTRA,
      ]

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const icons = (
    <div className="flex items-center gap-1.5 text-white">
      <Link href="/produtos" aria-label="Buscar" className="rounded-full p-2 transition-colors hover:text-brand-500">
        <Search className="h-5 w-5" aria-hidden />
      </Link>
      <Link href="/conta/favoritos" aria-label="Favoritos" className="rounded-full p-2 transition-colors hover:text-brand-500">
        <Heart className="h-5 w-5" aria-hidden />
      </Link>
      <Link href="/carrinho" aria-label="Carrinho" className="relative rounded-full p-2 transition-colors hover:text-brand-500">
        <ShoppingCart className="h-5 w-5" aria-hidden />
        {cartCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-brand-500 px-1 text-[10px] font-bold text-night-900">
            {cartCount}
          </span>
        )}
      </Link>
      <Link href="/conta" aria-label="Minha conta" className="rounded-full p-2 transition-colors hover:text-brand-500">
        <User className="h-5 w-5" aria-hidden />
      </Link>
    </div>
  )

  return (
    <header
      className={`fixed inset-x-0 top-9 z-40 transition-colors duration-300 ${
        scrolled ? 'bg-[rgba(5,5,5,0.92)] backdrop-blur-md border-b border-white/10' : 'bg-transparent'
      }`}
    >
      <div
        className={`mx-auto flex max-w-[1440px] items-center justify-between gap-4 px-4 sm:px-8 ${
          brand.isPartner ? 'h-20 sm:h-24' : 'h-16'
        }`}
      >
        <HeaderLogo />

        {/* nav desktop */}
        <nav className="hidden items-center gap-5 text-sm font-semibold uppercase tracking-wide text-night-200 lg:flex">
          {navItems.map((n) => (
            <Link key={n.name} href={n.href} className="transition-colors hover:text-brand-500">
              {n.name}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-1">
          {icons}
          <button
            type="button"
            aria-label="Abrir menu"
            onClick={() => setOpen(true)}
            className="rounded-full p-2 text-white transition-colors hover:text-brand-500 lg:hidden"
          >
            <Menu className="h-6 w-6" aria-hidden />
          </button>
        </div>
      </div>

      {/* drawer mobile */}
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/60" onClick={() => setOpen(false)} aria-hidden />
          <div className="absolute right-0 top-0 flex h-full w-72 max-w-[85%] flex-col bg-[#0B0B0B] p-6 shadow-2xl">
            <div className="mb-6 flex items-center justify-between">
              <span className="font-display text-lg font-extrabold text-white">MENU</span>
              <button type="button" aria-label="Fechar menu" onClick={() => setOpen(false)} className="text-white">
                <X className="h-6 w-6" aria-hidden />
              </button>
            </div>
            <nav className="flex flex-col gap-1 text-sm font-semibold uppercase tracking-wide text-night-200">
              {navItems.map((n) => (
                <Link
                  key={n.name}
                  href={n.href}
                  onClick={() => setOpen(false)}
                  className="rounded-md px-3 py-2.5 transition-colors hover:bg-white/5 hover:text-brand-500"
                >
                  {n.name}
                </Link>
              ))}
            </nav>
          </div>
        </div>
      )}
    </header>
  )
}
