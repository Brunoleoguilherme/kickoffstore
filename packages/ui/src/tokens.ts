/**
 * Kickoffstore design tokens — Brand Book v1.0.
 * Dark, premium, high-contrast identity: absolute black + graphite base,
 * gold (dourado) as the premium accent, brushed silver and white for contrast.
 * Shared by web (Tailwind) and mobile (Expo).
 */
export const colors = {
  // Gold / "dourado" — the premium accent. 500 = Dourado #C89A2B, 200 = Ouro Claro #F2D27A.
  brand: {
    50: '#fbf6e9',
    100: '#f7ebc7',
    200: '#f2d27a', // Ouro Claro
    300: '#e6c05a',
    400: '#d9ae3f',
    500: '#c89a2b', // Dourado (primary)
    600: '#a87f20',
    700: '#86641a',
    800: '#5e4712',
    900: '#3d2e0b',
  },
  // Neutral base — 900 = Preto Absoluto #050505, 800 = Grafite #1A1A1A.
  night: {
    50: '#f5f5f5',
    100: '#e4e4e4',
    200: '#cfcfcf', // Prata Escovado
    300: '#9a9a9a',
    400: '#6b6b6b',
    500: '#3d3d3d',
    600: '#2a2a2a',
    700: '#1f1f1f',
    800: '#1a1a1a', // Grafite
    900: '#050505', // Preto Absoluto
  },
  silver: '#cfcfcf',
  accent: '#c89a2b', // gold accent (brand-aligned)
  danger: '#e5484d',
  warning: '#f5a524',
  success: '#3ba55d',
} as const

export const radii = { sm: 4, md: 8, lg: 12, xl: 16, pill: 9999 } as const
export const spacing = { xs: 4, sm: 8, md: 16, lg: 24, xl: 32, '2xl': 48 } as const
export const fontSizes = { xs: 12, sm: 14, base: 16, lg: 18, xl: 22, '2xl': 28, '3xl': 36 } as const

/** Brand tagline (Brand Book). */
export const BRAND_TAGLINE = 'Performance starts here'

export type ColorScale = typeof colors.brand
