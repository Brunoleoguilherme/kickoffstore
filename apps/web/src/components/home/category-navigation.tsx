import Link from 'next/link'
import { Trophy, Shield, Flag, Footprints, Target, Dumbbell } from 'lucide-react'
import { SPORTS, sportHref, type CategoryItem } from '@/lib/home/nav'

const ICONS: Record<CategoryItem['icon'], typeof Trophy> = {
  Trophy,
  Shield,
  Flag,
  Footprints,
  Target,
  Dumbbell,
}

/** Faixa de modalidades logo abaixo do hero. Scroll horizontal no mobile. */
export function CategoryNavigation() {
  return (
    <nav aria-label="Modalidades" className="border-y border-white/5 bg-[#0B0B0B]">
      <div className="mx-auto max-w-[1440px] px-4 sm:px-8">
        <ul className="flex snap-x gap-3 overflow-x-auto py-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden lg:grid lg:grid-cols-6 lg:overflow-visible">
          {SPORTS.map((s) => {
            const Icon = ICONS[s.icon]
            return (
              <li key={s.slug} className="snap-start">
                <Link
                  href={sportHref(s.name)}
                  className="flex min-w-[150px] items-center justify-center gap-2 rounded-lg border border-white/10 bg-surface px-4 py-3 text-sm font-semibold uppercase tracking-wide text-night-200 transition-all hover:-translate-y-0.5 hover:border-brand-500/60 hover:text-white lg:min-w-0"
                >
                  <Icon className="h-4 w-4 text-brand-500" aria-hidden />
                  {s.name}
                </Link>
              </li>
            )
          })}
        </ul>
      </div>
    </nav>
  )
}
