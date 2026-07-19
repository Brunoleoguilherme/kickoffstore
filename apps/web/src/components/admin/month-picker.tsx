'use client'

import { useRouter, usePathname } from 'next/navigation'
import { monthLabel } from '@/lib/admin/metrics'

export function MonthPicker({ options, selected }: { options: string[]; selected: string }) {
  const router = useRouter()
  const pathname = usePathname()
  return (
    <label className="flex items-center gap-2 text-sm text-night-600">
      Mês
      <select
        value={selected}
        onChange={(e) => router.push(`${pathname}?mes=${e.target.value}`)}
        className="rounded-md border border-night-200 px-3 py-2 text-sm"
      >
        {options.map((k) => (
          <option key={k} value={k}>
            {monthLabel(k)}
          </option>
        ))}
      </select>
    </label>
  )
}
