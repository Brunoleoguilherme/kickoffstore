import Link from 'next/link'
import { Trophy, Shield, Flag, Footprints, Target, Dumbbell, ArrowUpRight } from 'lucide-react'
import { SPORTS, sportHref, type CategoryItem } from '@/lib/home/nav'

const ICONS: Record<CategoryItem['icon'], typeof Trophy> = { Trophy, Shield, Flag, Footprints, Target, Dumbbell }

// Imagens temáticas por modalidade (temporárias — trocar por arte própria depois).
const IMAGE: Record<string, string> = {
  futebol: 'https://loremflickr.com/800/500/soccer,stadium?lock=301',
  'futebol-americano': 'https://loremflickr.com/800/500/american,football?lock=302',
  'flag-football': 'https://loremflickr.com/800/500/flag,football?lock=303',
  corrida: 'https://loremflickr.com/800/500/running,track?lock=304',
  basquete: 'https://loremflickr.com/800/500/basketball,court?lock=305',
  'academia-fitness': 'https://loremflickr.com/800/500/gym,fitness?lock=306',
}

export function SportsGrid() {
  return (
    <section className="mx-auto max-w-[1440px] px-6 py-16 sm:px-8">
      <div className="mb-8">
        <span className="text-xs font-semibold uppercase tracking-[0.3em] text-brand-500">Explore</span>
        <h2 className="mt-1 font-display text-3xl font-extrabold uppercase tracking-tight text-white">
          Compre por modalidade
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
