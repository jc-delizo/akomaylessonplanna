import { describe, expect, it } from 'vitest'
import {
  isUuid,
  parseBoundedInteger,
  sanitizePostgrestSearchTerm,
} from '../lib/utils/query-params'

describe('sanitizePostgrestSearchTerm', () => {
  it('keeps ordinary Unicode search text', () => {
    expect(sanitizePostgrestSearchTerm('  Filipino C++ lesson  ')).toBe('Filipino C++ lesson')
  })

  it('removes PostgREST filter control characters and wildcards', () => {
    expect(sanitizePostgrestSearchTerm('math%,status.eq.draft_(test)')).toBe(
      'math status.eq.draft test'
    )
  })

  it('limits oversized terms', () => {
    expect(sanitizePostgrestSearchTerm('a'.repeat(200), 20)).toHaveLength(20)
  })
})

describe('parseBoundedInteger', () => {
  it('parses and clamps integer query parameters', () => {
    expect(parseBoundedInteger('12', 1, 1, 50)).toBe(12)
    expect(parseBoundedInteger('500', 1, 1, 50)).toBe(50)
    expect(parseBoundedInteger('-2', 1, 1, 50)).toBe(1)
  })

  it('uses the fallback for malformed values', () => {
    expect(parseBoundedInteger('3.5', 7, 1, 50)).toBe(7)
    expect(parseBoundedInteger('nope', 7, 1, 50)).toBe(7)
  })
})

describe('isUuid', () => {
  it('accepts UUIDs and rejects filter expressions', () => {
    expect(isUuid('10000000-0000-4000-8000-000000000001')).toBe(true)
    expect(isUuid('1),status.eq.open')).toBe(false)
  })
})
