export interface CategoryItem {
  name: string
  slug: string
  /** ícone lucide (nome do componente) */
  icon: 'Trophy' | 'Shield' | 'Flag' | 'Footprints' | 'Target' | 'Dumbbell'
}

/** Modalidades esportivas (reusadas em header, hero e grade). */
export const SPORTS: CategoryItem[] = [
  { name: 'Futebol', slug: 'futebol', icon: 'Trophy' },
  { name: 'Futebol Americano', slug: 'futebol-americano', icon: 'Shield' },
  { name: 'Flag Football', slug: 'flag-football', icon: 'Flag' },
  { name: 'Corrida', slug: 'corrida', icon: 'Footprints' },
  { name: 'Basquete', slug: 'basquete', icon: 'Target' },
  { name: 'Academia & Fitness', slug: 'academia-fitness', icon: 'Dumbbell' },
]

/** Constrói o link de busca por modalidade (usa a busca já existente). */
export function sportHref(name: string): string {
  return `/produtos?q=${encodeURIComponent(name)}`
}
