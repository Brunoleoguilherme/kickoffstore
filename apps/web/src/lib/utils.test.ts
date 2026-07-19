import { describe, expect, it } from 'vitest'
import { cn } from './utils'

describe('cn', () => {
  it('merges tailwind classes with later winning', () => {
    expect(cn('px-2', 'px-4')).toBe('px-4')
  })
  it('handles conditionals', () => {
    expect(cn('a', false && 'b', 'c')).toBe('a c')
  })
})
