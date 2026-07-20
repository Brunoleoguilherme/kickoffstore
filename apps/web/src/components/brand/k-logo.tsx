interface KLogoProps {
  size?: number
  className?: string
  title?: string
}

/**
 * Clube da Estampa "K" monogram — geometric, two-tone (graphite + gold).
 * Vector recreation of the Brand Book symbol. Transparent background.
 */
export function KLogo({ size = 32, className, title = 'Clube da Estampa' }: KLogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      role="img"
      aria-label={title}
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="kof-gold" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#f2d27a" />
          <stop offset="0.55" stopColor="#d9ae3f" />
          <stop offset="1" stopColor="#c89a2b" />
        </linearGradient>
        <linearGradient id="kof-steel" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#2c2f34" />
          <stop offset="1" stopColor="#0e1013" />
        </linearGradient>
      </defs>

      {/* haste (grafite com fio prata) */}
      <polygon points="24,8 42,8 42,92 24,92" fill="url(#kof-steel)" stroke="#cfcfcf" strokeWidth="1.2" strokeLinejoin="round" />
      {/* braço superior (dourado) */}
      <polygon points="42,50 70,8 95,8 57,52" fill="url(#kof-gold)" stroke="#86641a" strokeWidth="0.8" strokeLinejoin="round" />
      {/* braço inferior (grafite com fio dourado) */}
      <polygon points="42,50 57,50 95,92 71,92" fill="url(#kof-steel)" stroke="#c89a2b" strokeWidth="1" strokeLinejoin="round" />
    </svg>
  )
}
