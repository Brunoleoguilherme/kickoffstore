export interface CategoryItem {
  name: string
  slug: string
  /** ícone lucide (nome do componente) */
  icon: 'Trophy' | 'Palette' | 'Sparkles' | 'Music' | 'Flame' | 'Star'
}

/** Coleções de estampas (reusadas em header, hero e grade). */
export const SPORTS: CategoryItem[] = [
  { name: 'Esporte', slug: 'esporte', icon: 'Trophy' },
  { name: 'Estampas Autorais', slug: 'autorais', icon: 'Palette' },
  { name: 'Cultura Pop', slug: 'cultura-pop', icon: 'Sparkles' },
  { name: 'Música', slug: 'musica', icon: 'Music' },
  { name: 'Streetwear', slug: 'streetwear', icon: 'Flame' },
  { name: 'Clássicos', slug: 'classicos', icon: 'Star' },
]

/** Constrói o link de busca por coleção (usa a busca já existente). */
export function sportHref(name: string): string {
  return `/produtos?q=${encodeURIComponent(name)}`
}
