import crypto from 'crypto'
import { describe, expect, it } from 'vitest'
import { verifyFacebookSignedRequest } from '../lib/security/facebook-signed-request'
import { hashDeletionConfirmationCode } from '../lib/security/data-deletion'

function sign(payload: Record<string, unknown>, secret: string) {
  const encodedPayload = Buffer.from(JSON.stringify(payload)).toString('base64url')
  const signature = crypto
    .createHmac('sha256', secret)
    .update(encodedPayload)
    .digest('base64url')

  return `${signature}.${encodedPayload}`
}

describe('verifyFacebookSignedRequest', () => {
  const secret = 'facebook-test-secret'

  it('accepts a correctly signed HMAC-SHA256 payload', () => {
    const request = sign(
      { algorithm: 'HMAC-SHA256', user_id: 'facebook-user-123' },
      secret
    )

    expect(verifyFacebookSignedRequest(request, secret)).toEqual({
      user_id: 'facebook-user-123',
    })
  })

  it('rejects a tampered signature', () => {
    const request = sign(
      { algorithm: 'HMAC-SHA256', user_id: 'facebook-user-123' },
      secret
    )

    expect(verifyFacebookSignedRequest(`x${request}`, secret)).toBeNull()
  })

  it('rejects an unsupported algorithm', () => {
    const request = sign(
      { algorithm: 'none', user_id: 'facebook-user-123' },
      secret
    )

    expect(verifyFacebookSignedRequest(request, secret)).toBeNull()
  })

  it('rejects a missing user identifier', () => {
    const request = sign({ algorithm: 'HMAC-SHA256' }, secret)

    expect(verifyFacebookSignedRequest(request, secret)).toBeNull()
  })

  it('rejects malformed input', () => {
    expect(verifyFacebookSignedRequest('not-a-signed-request', secret)).toBeNull()
  })
})

describe('hashDeletionConfirmationCode', () => {
  it('creates a deterministic SHA-256 digest without retaining the token', () => {
    const token = '0123456789abcdef0123456789abcdef'
    const digest = hashDeletionConfirmationCode(token)

    expect(digest).toMatch(/^[a-f0-9]{64}$/)
    expect(digest).not.toContain(token)
    expect(hashDeletionConfirmationCode(token)).toBe(digest)
  })
})
