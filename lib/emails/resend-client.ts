import { Resend } from 'resend'

/**
 * Resend client singleton
 * Initialize once and reuse across the application
 */
let resendClient: Resend | null = null

export function getResendClient(): Resend {
  if (!resendClient) {
    const apiKey = process.env.RESEND_API_KEY

    if (!apiKey) {
      throw new Error(
        'RESEND_API_KEY environment variable is not set. Please configure it in your .env file.'
      )
    }

    resendClient = new Resend(apiKey)
  }

  return resendClient
}

/**
 * Get the from email address
 * Falls back to a default if not configured
 */
export function getFromEmail(): string {
  return (
    process.env.RESEND_FROM_EMAIL ||
    process.env.NEXT_PUBLIC_APP_EMAIL ||
    'noreply@akomaylessonplanna.com'
  )
}

/**
 * Send email via Resend
 * This is a low-level function - use queue service for production
 */
export async function sendEmailViaResend(params: {
  to: string | string[]
  subject: string
  html: string
  text?: string
  from?: string
  replyTo?: string
  tags?: Array<{ name: string; value: string }>
}) {
  const resend = getResendClient()

  const result = await resend.emails.send({
    from: params.from || getFromEmail(),
    to: params.to,
    subject: params.subject,
    html: params.html,
    text: params.text,
    ...(params.replyTo && { replyTo: params.replyTo }),
    tags: params.tags,
  })

  if (result.error) {
    throw new Error(`Resend API error: ${result.error.message}`)
  }

  return result.data
}
