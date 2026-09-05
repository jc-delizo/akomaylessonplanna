import { createHmac, timingSafeEqual } from 'node:crypto'

/**
 * Compare secrets without leaking their matching prefix through response timing.
 */
export function secretsMatch(provided: string | null | undefined, expected: string | null | undefined): boolean {
  if (!provided || !expected) return false

  const providedBuffer = Buffer.from(provided)
  const expectedBuffer = Buffer.from(expected)

  if (providedBuffer.length !== expectedBuffer.length) return false

  return timingSafeEqual(providedBuffer, expectedBuffer)
}

export function hasValidBearerToken(
  authorization: string | null,
  expectedSecret: string | null | undefined
): boolean {
  if (!authorization?.startsWith('Bearer ')) return false

  return secretsMatch(authorization.slice('Bearer '.length), expectedSecret)
}

/**
 * Validate the hex-encoded HMAC-SHA256 contract used by the payment callbacks.
 */
export function hasValidHmacSha256Signature(
  payload: string,
  signature: string | null,
  secret: string | null | undefined
): boolean {
  if (!signature || !secret) return false

  const normalizedSignature = signature.startsWith('sha256=')
    ? signature.slice('sha256='.length)
    : signature

  if (!/^[a-f\d]{64}$/i.test(normalizedSignature)) return false

  const digest = createHmac('sha256', secret).update(payload).digest('hex')
  return secretsMatch(normalizedSignature.toLowerCase(), digest)
}

/**
 * Parse a peso amount without floating-point comparison errors.
 */
export function parseAmountToCentavos(value: unknown): number | null {
  if (typeof value !== 'string' && typeof value !== 'number') return null

  const normalized = String(value).trim()
  if (!/^(?:0|[1-9]\d*)(?:\.\d{1,2})?$/.test(normalized)) return null

  const [pesos, centavos = ''] = normalized.split('.')
  const parsed = Number(pesos) * 100 + Number(centavos.padEnd(2, '0'))

  return Number.isSafeInteger(parsed) ? parsed : null
}
