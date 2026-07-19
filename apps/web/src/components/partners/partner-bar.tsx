import { getActivePartner } from '@/lib/partners/context'

/**
 * Faixa de marca do parceiro (white-label). Renderiza só em subdomínios de
 * parceiro ativo; na loja principal não aparece nada.
 */
export async function PartnerBar() {
  const partner = await getActivePartner()
  if (!partner) return null

  const bg = partner.primaryColor ?? '#0a0a0a'
  const accent = partner.accentColor ?? '#ffffff'

  return (
    <div
      className="flex items-center justify-center gap-3 px-4 py-2 text-sm font-semibold"
      style={{ background: bg, color: accent }}
    >
      {partner.logoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={partner.logoUrl}
          alt={partner.name}
          className="h-6 w-auto max-w-[120px] object-contain"
        />
      ) : null}
      <span>Loja oficial · {partner.name}</span>
    </div>
  )
}
