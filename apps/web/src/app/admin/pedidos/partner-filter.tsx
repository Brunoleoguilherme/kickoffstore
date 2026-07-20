'use client'

import { useRouter, usePathname } from 'next/navigation'

export interface PartnerOption {
  id: string
  name: string
}

export function PartnerFilter({
  partners,
  selected,
}: {
  partners: PartnerOption[]
  selected: string
}) {
  const router = useRouter()
  const pathname = usePathname()
  return (
    <label className="flex items-center gap-2 text-sm text-night-600">
      Loja
      <select
        value={selected}
        onChange={(e) => {
          const v = e.target.value
          router.push(v ? `${pathname}?parceiro=${encodeURIComponent(v)}` : pathname)
        }}
        className="rounded-md border border-night-200 px-3 py-2 text-sm"
      >
        <option value="">Todas</option>
        <option value="loja">Loja principal (Clube da Estampa)</option>
        {partners.map((p) => (
          <option key={p.id} value={p.id}>
            {p.name}
          </option>
        ))}
      </select>
    </label>
  )
}
