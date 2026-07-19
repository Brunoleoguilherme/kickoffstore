'use client'

import { useState } from 'react'

/** Paleta padrão de cores para a marca do parceiro. */
const PALETTE = [
  '#1e3a8a', '#2563eb', '#0ea5e9', '#0d9488', '#059669', '#16a34a',
  '#ca8a04', '#f59e0b', '#ea580c', '#dc2626', '#db2777', '#7c3aed',
  '#111827', '#374151', '#6b7280', '#000000',
]

/**
 * Campo de cor com paleta clicável + seletor + hex. O valor é enviado no form
 * por um input hidden com o `name` informado.
 */
export function ColorField({
  name,
  label,
  defaultValue,
}: {
  name: string
  label: string
  defaultValue?: string
}) {
  const [value, setValue] = useState(defaultValue && /^#[0-9a-fA-F]{6}$/.test(defaultValue) ? defaultValue : '#1e3a8a')

  return (
    <div>
      <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-night-500">
        {label}
      </span>
      <div className="mb-2 flex flex-wrap gap-1.5">
        {PALETTE.map((c) => {
          const selected = value.toLowerCase() === c.toLowerCase()
          return (
            <button
              key={c}
              type="button"
              onClick={() => setValue(c)}
              aria-label={c}
              className={`h-7 w-7 rounded-full border-2 transition-transform hover:scale-110 ${
                selected ? 'border-night-900 ring-2 ring-night-300' : 'border-white shadow-sm'
              }`}
              style={{ background: c }}
            />
          )
        })}
      </div>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className="h-9 w-12 cursor-pointer rounded-md border border-night-200 bg-white p-1"
          aria-label={`${label} — seletor`}
        />
        <input
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className="w-28 rounded-md border border-night-200 px-2 py-1.5 text-sm"
          aria-label={`${label} — hex`}
        />
      </div>
      <input type="hidden" name={name} value={value} />
    </div>
  )
}
