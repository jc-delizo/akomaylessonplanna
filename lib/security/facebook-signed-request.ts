import crypto from 'crypto'

interface FacebookDeletionPayload {
  user_id: string
}

export function verifyFacebookSignedRequest(
  signedRequest: string,
  appSecret: string
): FacebookDeletionPayload | null {
  try {
    const [encodedSignature, payload] = signedRequest.split('.', 2)
    if (!encodedSignature || !payload || !appSecret) return null

    const signature = Buffer.from(encodedSignature, 'base64url')
    const expectedSignature = crypto
      .createHmac('sha256', appSecret)
      .update(payload)
      .digest()

    if (
      signature.length !== expectedSignature.length ||
      !crypto.timingSafeEqual(signature, expectedSignature)
    ) {
      return null
    }

    const decodedPayload = Buffer.from(payload, 'base64url').toString('utf-8')
    const data: unknown = JSON.parse(decodedPayload)
    if (
      !data ||
      typeof data !== 'object' ||
      !('algorithm' in data) ||
      typeof data.algorithm !== 'string' ||
      data.algorithm.toUpperCase() !== 'HMAC-SHA256' ||
      !('user_id' in data) ||
      typeof data.user_id !== 'string' ||
      data.user_id.length === 0 ||
      data.user_id.length > 255
    ) {
      return null
    }

    return { user_id: data.user_id }
  } catch {
    return null
  }
}
