import { ShieldCheck, Award, Lock, RefreshCw } from 'lucide-react'

const BENEFITS = [
  { icon: ShieldCheck, title: 'Produtos originais', text: 'Das melhores marcas' },
  { icon: Award, title: 'Atendimento de verdade', text: 'Gente pronta pra ajudar' },
  { icon: Lock, title: 'Compra segura', text: 'Seus dados protegidos' },
  { icon: RefreshCw, title: 'Troca fácil', text: 'Até 7 dias após o recebimento' },
]

export function BenefitsStrip() {
  return (
    <section aria-label="Benefícios" className="border-y border-white/5 bg-[#0B0B0B]">
      <div className="mx-auto grid max-w-[1440px] gap-px px-4 py-6 sm:grid-cols-2 sm:px-8 lg:grid-cols-4">
        {BENEFITS.map((b) => (
          <div key={b.title} className="flex items-center gap-3 px-2 py-2">
            <b.icon className="h-7 w-7 shrink-0 text-brand-500" aria-hidden />
            <div>
              <p className="text-sm font-semibold text-white">{b.title}</p>
              <p className="text-xs text-night-300">{b.text}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
