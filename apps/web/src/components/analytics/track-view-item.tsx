'use client'

import { useEffect } from 'react'
import { trackViewItem } from '@/lib/analytics/events'

/** Dispara o evento view_item / ViewContent ao abrir a página do produto. */
export function TrackViewItem({
  id,
  name,
  priceCents,
}: {
  id: string
  name: string
  priceCents: number
}) {
  useEffect(() => {
    trackViewItem({ id, name, priceCents })
  }, [id, name, priceCents])
  return null
}
