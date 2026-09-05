import { createHmac } from 'node:crypto'
import { describe, expect, it } from 'vitest'
import {
  hasValidBearerToken,
  hasValidHmacSha256Signature,
  parseAmountToCentavos,
  secretsMatch,
} from '../lib/security/request-security'

describe('request security helpers', () => {
  it('compares non-empty, equal secrets', () => {
    expect(secretsMatch('correct horse', 'correct horse')).toBe(true)
    expect(secretsMatch('correct horse', 'correct house')).toBe(false)
    expect(secretsMatch('', '')).toBe(false)
  })

  it('requires an exact Bearer token', () => {
    expect(hasValidBearerToken('Bearer cron-secret', 'cron-secret')).toBe(true)
    expect(hasValidBearerToken('Basic cron-secret', 'cron-secret')).toBe(false)
    expect(hasValidBearerToken('Bearer wrong', 'cron-secret')).toBe(false)
    expect(hasValidBearerToken(null, 'cron-secret')).toBe(false)
  })

  it('validates hex HMAC-SHA256 signatures with an optional prefix', () => {
    const payload = '{"event":"paid"}'
    const digest = createHmac('sha256', 'webhook-secret').update(payload).digest('hex')

    expect(hasValidHmacSha256Signature(payload, digest, 'webhook-secret')).toBe(true)
    expect(hasValidHmacSha256Signature(payload, `sha256=${digest}`, 'webhook-secret')).toBe(true)
    expect(hasValidHmacSha256Signature(`${payload} `, digest, 'webhook-secret')).toBe(false)
    expect(hasValidHmacSha256Signature(payload, 'not-hex', 'webhook-secret')).toBe(false)
  })
})

describe('parseAmountToCentavos', () => {
  it.each([
    ['0', 0],
    ['1', 100],
    ['1.5', 150],
    ['19.99', 1999],
    [25.4, 2540],
  ])('parses %s', (value, expected) => {
    expect(parseAmountToCentavos(value)).toBe(expected)
  })

  it.each(['', '-1', '1.234', '1e3', '12 pesos', Number.NaN, null, undefined])(
    'rejects invalid amount %s',
    (value) => {
      expect(parseAmountToCentavos(value)).toBeNull()
    }
  )
})
