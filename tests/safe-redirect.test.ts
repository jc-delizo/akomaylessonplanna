import { describe, expect, it } from 'vitest'
import { getSafeRedirectPath } from '../lib/utils/safe-redirect'

describe('getSafeRedirectPath', () => {
  it('keeps same-site paths, queries, and fragments', () => {
    expect(getSafeRedirectPath('/checkout?items=one#payment')).toBe(
      '/checkout?items=one#payment'
    )
  })

  it.each([
    'https://attacker.example/phish',
    '//attacker.example/phish',
    '/\\attacker.example/phish',
    'javascript:alert(1)',
    'marketplace',
  ])('rejects unsafe redirect %s', (candidate) => {
    expect(getSafeRedirectPath(candidate)).toBe('/marketplace')
  })

  it('uses the requested fallback for missing values', () => {
    expect(getSafeRedirectPath(null, '/login')).toBe('/login')
  })
})
