import type { Config } from 'tailwindcss'
import { colors } from '@kickoffstore/ui/tokens'

const config: Config = {
  darkMode: ['class'],
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // brand e accent são dirigidos por variáveis CSS (padrão = dourado
        // Kickoffstore, em globals.css). Parceiros sobrescrevem por subdomínio.
        brand: {
          50: 'rgb(var(--brand-50) / <alpha-value>)',
          100: 'rgb(var(--brand-100) / <alpha-value>)',
          200: 'rgb(var(--brand-200) / <alpha-value>)',
          300: 'rgb(var(--brand-300) / <alpha-value>)',
          400: 'rgb(var(--brand-400) / <alpha-value>)',
          500: 'rgb(var(--brand-500) / <alpha-value>)',
          600: 'rgb(var(--brand-600) / <alpha-value>)',
          700: 'rgb(var(--brand-700) / <alpha-value>)',
          800: 'rgb(var(--brand-800) / <alpha-value>)',
          900: 'rgb(var(--brand-900) / <alpha-value>)',
        },
        night: colors.night,
        accent: 'rgb(var(--accent) / <alpha-value>)',
        silver: colors.silver,
        surface: '#111111',
        'surface-light': '#181818',
        'background-secondary': '#0B0B0B',
        danger: colors.danger,
        success: colors.success,
        warning: colors.warning,
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
        display: ['var(--font-display)', 'var(--font-sans)', 'sans-serif'],
      },
      boxShadow: {
        gold: '0 0 0 1px rgba(200,154,43,0.35), 0 8px 30px -12px rgba(200,154,43,0.45)',
      },
    },
  },
  plugins: [],
}

export default config
