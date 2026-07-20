/**
 * Gera a sobrescrita de tema (variáveis CSS da escala "brand") a partir das
 * cores de um parceiro. A escala padrão (dourado Clube da Estampa) fica em
 * globals.css; aqui só produzimos a sobrescrita quando há parceiro ativo.
 *
 * As variáveis guardam CANAIS RGB ("200 154 43") para funcionar com o padrão
 * do Tailwind `rgb(var(--brand-500) / <alpha-value>)` (mantém as opacidades).
 */

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const h = hex.trim().replace('#', '')
  if (!/^[0-9a-fA-F]{6}$/.test(h)) return null
  return {
    r: parseInt(h.slice(0, 2), 16),
    g: parseInt(h.slice(2, 4), 16),
    b: parseInt(h.slice(4, 6), 16),
  }
}

function mix(c: number, target: number, ratio: number): number {
  return Math.round(c * (1 - ratio) + target * ratio)
}

function shade(rgb: { r: number; g: number; b: number }, target: number, ratio: number): string {
  return `${mix(rgb.r, target, ratio)} ${mix(rgb.g, target, ratio)} ${mix(rgb.b, target, ratio)}`
}

/** Retorna o CSS de `:root { --brand-*: ... }` do parceiro (ou '' se cor inválida). */
export function partnerThemeCss(primaryHex: string | null, accentHex: string | null): string {
  if (!primaryHex) return ''
  const p = hexToRgb(primaryHex)
  if (!p) return ''
  const a = (accentHex && hexToRgb(accentHex)) || p

  const vars: Record<string, string> = {
    '--brand-50': shade(p, 255, 0.92),
    '--brand-100': shade(p, 255, 0.84),
    '--brand-200': shade(p, 255, 0.68),
    '--brand-300': shade(p, 255, 0.46),
    '--brand-400': shade(p, 255, 0.22),
    '--brand-500': `${p.r} ${p.g} ${p.b}`,
    '--brand-600': shade(p, 0, 0.16),
    '--brand-700': shade(p, 0, 0.32),
    '--brand-800': shade(p, 0, 0.52),
    '--brand-900': shade(p, 0, 0.68),
    '--accent': `${a.r} ${a.g} ${a.b}`,
  }
  const body = Object.entries(vars)
    .map(([k, v]) => `${k}:${v}`)
    .join(';')
  return `:root{${body}}`
}
