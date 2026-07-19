import { Truck, ShieldCheck, MapPin } from 'lucide-react'

const ITEMS = [
  { icon: Truck, label: 'Frete grátis acima de R$ 399' },
  { icon: ShieldCheck, label: 'Compra 100% segura' },
  { icon: MapPin, label: 'Entrega para todo o Brasil' },
]

/** Barra fina no topo (36px) com selos de confiança. */
export function AnnouncementBar() {
  return (
    <div className="fixed inset-x-0 top-0 z-50 border-b border-white/5 bg-[#0B0B0B]">
      <div className="mx-auto flex h-9 max-w-[1440px] items-center justify-center gap-8 px-4 text-xs sm:justify-between">
        {ITEMS.map((it, i) => (
          <span
            key={it.label}
            className={`flex items-center gap-2 text-night-200 ${i > 0 ? 'hidden sm:flex' : 'flex'}`}
          >
            <it.icon className="h-3.5 w-3.5 text-brand-500" aria-hidden />
            <span>
              {it.label.split(' ').map((w, j) =>
                /grátis|segura|Brasil/i.test(w) ? (
                  <span key={j} className="text-white">
                    {w}{' '}
                  </span>
                ) : (
                  <span key={j}>{w} </span>
                ),
              )}
            </span>
          </span>
        ))}
      </div>
    </div>
  )
}
