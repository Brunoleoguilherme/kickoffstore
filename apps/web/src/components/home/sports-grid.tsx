import Link from 'next/link'
import { Trophy, Palette, Sparkles, Music, Flame, Star, ArrowUpRight } from 'lucide-react'
import { SPORTS, sportHref, type CategoryItem } from '@/lib/home/nav'

const ICONS: Record<CategoryItem['icon'], typeof Trophy> = { Trophy, Palette, Sparkles, Music, Flame, Star }

// Imagens temáticas por coleção (temporárias — trocar por arte própria depois).
const IMAGE: Record<string, string> = {
  esporte: 'https://loremflickr.com/800/500/sport,jersey?lock=301',
  autorais: 'https://loremflickr.com/800/500/illustration,art?lock=302',
  'cultura-pop': 'https://loremflickr.com/800/500/pop,art?lock=303',
  musica: 'https://loremflickr.com/800/500/music,concert?lock=304',
  streetwear: 'https://loremflickr.com/800/500/streetwear,fashion?lock=305',
  classicos: 'https://loremflickr.com/800/500/minimal,fashion?lock=306',
}

export function SportsGrid() {
  return (
    <section className="mx-auto max-w-[1440px] px-6 py-16 sm:px-8">
      <div className="mb-8">
        <span className="text-xs font-semibold uppercase tracking-[0.3em] text-brand-500">Explore</span>
        <h2 className="mt-1 font-display text-3xl font-extrabold uppercase tracking-tight text-white">
          Compre por coleção
        </h2>
      </div>
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {SPORTS.map((s) => {
          const Icon = ICONS[s.icon]
          return (
            <Link
              key={s.slug}
              href={sportHref(s.name)}
              className="group relative flex h-52 items-end overflow-hidden rounded-2xl border border-white/10 transition-all hover:-translate-y-1 hover:border-brand-500/50"
            >
              {/* imagem de fundo temática */}
              <div
                aria-hidden
                className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-105"
                style={{ backgroundImage: `url('${IMAGE[s.slug]}')` }}
              />
              <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-night-900 via-night-900/60 to-night-900/10" />

              <div className="relative p-6">
                <span className="flex items-center gap-2 font-display text-2xl font-extrabold uppercase tracking-tight text-white">
                  <Icon className="h-5 w-5 text-brand-500" aria-hidden />
                  {s.name}
                </span>
                <span className="mt-1 flex items-center gap-1 text-sm font-semibold uppercase tracking-wide text-brand-500">
                  Ver produtos
                  <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" aria-hidden />
                </span>
              </div>
            </Link>
          )
        })}
      </div>
    </section>
  )
}
