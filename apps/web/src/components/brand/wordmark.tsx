import Link from 'next/link'
import { cn } from '@/lib/utils'

interface WordmarkProps {
  href?: string
  className?: string
  /** Kept for backward compatibility; the logo image already includes the tagline. */
  tagline?: boolean
  mark?: boolean
  size?: 'sm' | 'md' | 'lg' | 'xl'
}

const HEIGHTS: Record<NonNullable<WordmarkProps['size']>, number> = {
  sm: 30,
  md: 42,
  lg: 88,
  xl: 104,
}

/** Clube da Estampa official logo (Brand Book v1.0), rendered from the brand asset. */
export function Wordmark({ href, className, size = 'md' }: WordmarkProps) {
  const img = (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/logo-mark.png"
      alt="Clube da Estampa — Performance starts here"
      style={{ height: HEIGHTS[size], width: 'auto' }}
      className="select-none"
      draggable={false}
    />
  )

  if (href) {
    return (
      <Link href={href} className={cn('inline-flex', className)}>
        {img}
      </Link>
    )
  }
  return <span className={cn('inline-flex', className)}>{img}</span>
}
