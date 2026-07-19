'use client'

import { createContext, useContext } from 'react'

export interface Brand {
  name: string
  logoUrl: string | null
  isPartner: boolean
  tagline: string | null
  instagram: string | null
  facebook: string | null
  youtube: string | null
}

const DEFAULT_BRAND: Brand = {
  name: 'Kickoffstore',
  logoUrl: null,
  isPartner: false,
  tagline: null,
  instagram: null,
  facebook: null,
  youtube: null,
}

const BrandContext = createContext<Brand>(DEFAULT_BRAND)

export function BrandProvider({ value, children }: { value: Brand; children: React.ReactNode }) {
  return <BrandContext.Provider value={value}>{children}</BrandContext.Provider>
}

export function useBrand(): Brand {
  return useContext(BrandContext)
}
