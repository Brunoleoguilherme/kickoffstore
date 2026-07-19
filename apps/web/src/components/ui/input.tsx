import * as React from 'react'
import { cn } from '@/lib/utils'

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>

export const Input = React.forwardRef<HTMLInputElement, InputProps>(({ className, ...props }, ref) => (
  <input
    ref={ref}
    className={cn(
      'flex h-12 w-full rounded-md border border-night-100 bg-white px-3 text-base outline-none transition-colors placeholder:text-night-500 focus-visible:border-brand-500 focus-visible:ring-2 focus-visible:ring-brand-500/20 disabled:opacity-50 sm:h-11 sm:text-sm',
      className,
    )}
    {...props}
  />
))
Input.displayName = 'Input'
