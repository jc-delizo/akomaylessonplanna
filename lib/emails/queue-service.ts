import { createAdminClient } from '@/lib/supabase/admin'
import { sendEmailViaResend } from './resend-client'
import { renderEmailTemplate, prepareTemplateData } from './template-renderer'
import { checkRateLimits } from './rate-limiter'
import { shouldSendEmail } from './preference-checker'
import type { EmailType } from './email-types'
import type { TemplateData } from './template-renderer'

export interface AddToQueueParams {
  emailType: EmailType
  recipientEmail: string
  recipientUserId?: string | null
  templateData: TemplateData
  priority?: number // 1 = highest, 10 = lowest
  sendAfter?: Date
  templateId?: string
}

/**
 * Add email to queue (Tier 2 & 3: Scheduled/Batch)
 */
export async function addToQueue(params: AddToQueueParams): Promise<string> {
  const supabase = createAdminClient()

  // Check if should send
  const shouldSend = await shouldSendEmail(
    params.recipientUserId || null,
    params.emailType,
    params.recipientEmail
  )

  if (!shouldSend.shouldSend) {
    throw new Error(shouldSend.reason || 'Email not allowed')
  }

  // Check rate limits
  const rateLimitCheck = await checkRateLimits(
    params.recipientUserId || null,
    params.emailType
  )

  if (!rateLimitCheck.allowed) {
    // Still add to queue but schedule for later
    const sendAfter = params.sendAfter || new Date(Date.now() + 60 * 60 * 1000) // 1 hour later

    const { data, error } = await supabase
      .from('email_queue')
      .insert({
        email_type: params.emailType,
        recipient_email: params.recipientEmail,
        recipient_user_id: params.recipientUserId || null,
        template_id: params.templateId || null,
        template_data: params.templateData,
        priority: params.priority || 5,
        send_after: sendAfter.toISOString(),
        status: 'pending',
      })
      .select('id')
      .single()

    if (error) throw error
    return data.id
  }

  // Add to queue
  const { data, error } = await supabase
    .from('email_queue')
    .insert({
      email_type: params.emailType,
      recipient_email: params.recipientEmail,
      recipient_user_id: params.recipientUserId || null,
      template_id: params.templateId || null,
      template_data: params.templateData,
      priority: params.priority || 5,
      send_after: params.sendAfter?.toISOString() || new Date().toISOString(),
      status: 'pending',
    })
    .select('id')
    .single()

  if (error) throw error
  return data.id
}

/**
 * Send email immediately (Tier 1: Real-Time)
 * Bypasses queue for urgent emails
 */
export async function sendImmediate(params: {
  emailType: EmailType
  recipientEmail: string
  recipientUserId?: string | null
  subject: string
  html: string
  text?: string
  templateData?: TemplateData
}): Promise<{ success: boolean; emailId?: string; error?: string }> {
  const supabase = createAdminClient()

  // Check if should send
  const shouldSend = await shouldSendEmail(
    params.recipientUserId || null,
    params.emailType,
    params.recipientEmail
  )

  if (!shouldSend.shouldSend) {
    return {
      success: false,
      error: shouldSend.reason || 'Email not allowed',
    }
  }

  // Check rate limits
  const rateLimitCheck = await checkRateLimits(
    params.recipientUserId || null,
    params.emailType
  )

  if (!rateLimitCheck.allowed) {
    // Fall back to queue if rate limited
    try {
      const queueId = await addToQueue({
        emailType: params.emailType,
        recipientEmail: params.recipientEmail,
        recipientUserId: params.recipientUserId || null,
        templateData: params.templateData || {},
        priority: 1, // High priority
      })
      return {
        success: true,
        emailId: queueId,
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to queue email',
      }
    }
  }

  try {
    // Prepare template data
    const templateData = prepareTemplateData({
      ...params.templateData,
      user_email: params.recipientEmail,
    })

    // Render template if needed
    let renderedHtml = params.html
    let renderedSubject = params.subject

    if (params.templateData) {
      renderedHtml = await renderEmailTemplate(params.html, templateData)
      renderedSubject = await renderEmailTemplate(params.subject, templateData)
    }

    // Send via Resend
    const result = await sendEmailViaResend({
      to: params.recipientEmail,
      subject: renderedSubject,
      html: renderedHtml,
      text: params.text,
      tags: [
        { name: 'email_type', value: params.emailType },
        { name: 'immediate', value: 'true' },
      ],
    })

    // Create analytics record (for immediate sends without queue)
    const { data: analytics } = await supabase
      .from('email_analytics')
      .insert({
        resend_email_id: result?.id || null,
        recipient_email: params.recipientEmail,
        email_type: params.emailType,
        sent_at: new Date().toISOString(),
      })
      .select('id')
      .single()

    return {
      success: true,
      emailId: analytics?.id,
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to send email',
    }
  }
}

/**
 * Schedule email for later (Tier 2: Scheduled)
 */
export async function scheduleEmail(
  params: AddToQueueParams & { sendAfter: Date }
): Promise<string> {
  return addToQueue({
    ...params,
    sendAfter: params.sendAfter,
  })
}

/**
 * Send batch emails (Tier 3: Bulk)
 * Creates queue items for all recipients with rate limiting
 */
export async function sendBatch(params: {
  emailType: EmailType
  recipientEmails: string[]
  recipientUserIds?: (string | null)[]
  templateData: TemplateData
  priority?: number
  batchSize?: number
  delayBetweenBatches?: number
}): Promise<{ queued: number; errors: number }> {
  const {
    emailType,
    recipientEmails,
    recipientUserIds = [],
    templateData,
    priority = 7, // Lower priority for bulk
    batchSize = 500,
    delayBetweenBatches = 60000, // 1 minute
  } = params

  let queued = 0
  let errors = 0

  // Process in batches
  for (let i = 0; i < recipientEmails.length; i += batchSize) {
    const batch = recipientEmails.slice(i, i + batchSize)
    const batchUserIds = recipientUserIds.slice(i, i + batchSize)

    // Create queue items for batch
    const queuePromises = batch.map((email, index) => {
      const userId = batchUserIds[index] || null

      return addToQueue({
        emailType,
        recipientEmail: email,
        recipientUserId: userId,
        templateData,
        priority,
      }).catch((error) => {
        console.error(`Failed to queue email for ${email}:`, error)
        errors++
        return null
      })
    })

    const results = await Promise.all(queuePromises)
    queued += results.filter((r) => r !== null).length

    // Delay between batches (except for last batch)
    if (i + batchSize < recipientEmails.length) {
      await new Promise((resolve) =>
        setTimeout(resolve, delayBetweenBatches)
      )
    }
  }

  return { queued, errors }
}
