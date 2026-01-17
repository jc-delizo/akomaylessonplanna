import { createAdminClient } from '@/lib/supabase/admin'
import { sendEmailViaResend } from './resend-client'
import { renderEmailTemplate, prepareTemplateData } from './template-renderer'
import { checkRateLimits } from './rate-limiter'
import { shouldSendEmail } from './preference-checker'
import type { EmailType } from './email-types'

/**
 * Retry schedule with exponential backoff
 */
const RETRY_SCHEDULE = {
  attempt1: 0, // Immediate
  attempt2: 60, // 1 minute later
  attempt3: 300, // 5 minutes later
  maxAttempts: 3,
} as const

/**
 * Process a single email from the queue
 */
export async function processEmailQueueItem(queueId: string): Promise<{
  success: boolean
  error?: string
}> {
  const supabase = createAdminClient()

  // Get email from queue
  const { data: emailItem, error: fetchError } = await supabase
    .from('email_queue')
    .select('*')
    .eq('id', queueId)
    .single()

  if (fetchError || !emailItem) {
    return {
      success: false,
      error: `Failed to fetch email from queue: ${fetchError?.message}`,
    }
  }

  // Check if already processed
  if (emailItem.status === 'sent' || emailItem.status === 'cancelled') {
    return { success: true }
  }

  // Check if max attempts reached
  if (emailItem.attempts >= emailItem.max_attempts) {
    await supabase
      .from('email_queue')
      .update({
        status: 'failed',
        failed_at: new Date().toISOString(),
        last_error: 'Max attempts reached',
      })
      .eq('id', queueId)

    return {
      success: false,
      error: 'Max attempts reached',
    }
  }

  // Check if should send based on preferences and rate limits
  const shouldSend = await shouldSendEmail(
    emailItem.recipient_user_id || null,
    emailItem.email_type as EmailType,
    emailItem.recipient_email
  )

  if (!shouldSend.shouldSend) {
    await supabase
      .from('email_queue')
      .update({
        status: 'cancelled',
        last_error: shouldSend.reason || 'Email not allowed',
      })
      .eq('id', queueId)

    return {
      success: false,
      error: shouldSend.reason || 'Email not allowed',
    }
  }

  // Check rate limits
  const rateLimitCheck = await checkRateLimits(
    emailItem.recipient_user_id || null,
    emailItem.email_type
  )

  if (!rateLimitCheck.allowed) {
    // Reschedule for later (don't mark as failed yet)
    const retryDelay = getRetryDelay(emailItem.attempts)
    await supabase
      .from('email_queue')
      .update({
        send_after: new Date(Date.now() + retryDelay * 1000).toISOString(),
        attempts: emailItem.attempts + 1,
        last_error: rateLimitCheck.reason,
      })
      .eq('id', queueId)

    return {
      success: false,
      error: rateLimitCheck.reason,
    }
  }

  // Mark as processing
  await supabase
    .from('email_queue')
    .update({
      status: 'processing',
      processed_at: new Date().toISOString(),
      attempts: emailItem.attempts + 1,
    })
    .eq('id', queueId)

  try {
    // Get template
    let htmlTemplate = ''
    let subject = ''

    if (emailItem.template_id) {
      const { data: template } = await supabase
        .from('email_templates')
        .select('*')
        .eq('id', emailItem.template_id)
        .single()

      if (template) {
        htmlTemplate = template.body_html
        subject = template.subject_line
      }
    }

    // If no template, use basic HTML
    if (!htmlTemplate) {
      htmlTemplate = '<html><body>{{content}}</body></html>'
      subject = 'Notification from AKOMAYLESSONPLANNA'
    }

    // Prepare template data
    const templateData = prepareTemplateData({
      ...emailItem.template_data,
      user_email: emailItem.recipient_email,
    })

    // Render template
    const renderedHtml = await renderEmailTemplate(htmlTemplate, templateData)
    const renderedSubject = await renderEmailTemplate(subject, templateData)

    // Send email via Resend
    const result = await sendEmailViaResend({
      to: emailItem.recipient_email,
      subject: renderedSubject,
      html: renderedHtml,
      tags: [
        { name: 'email_type', value: emailItem.email_type },
        { name: 'queue_id', value: queueId },
      ],
    })

    // Mark as sent
    await supabase
      .from('email_queue')
      .update({
        status: 'sent',
        sent_at: new Date().toISOString(),
      })
      .eq('id', queueId)

    // Create analytics record (if not already exists from immediate send)
    const { data: existingAnalytics } = await supabase
      .from('email_analytics')
      .select('id')
      .eq('email_queue_id', queueId)
      .single()

    if (!existingAnalytics) {
      await supabase.from('email_analytics').insert({
        email_queue_id: queueId,
        resend_email_id: result?.id || null,
        recipient_email: emailItem.recipient_email,
        email_type: emailItem.email_type,
        sent_at: new Date().toISOString(),
      })
    } else {
      // Update existing analytics with resend_email_id
      await supabase
        .from('email_analytics')
        .update({
          resend_email_id: result?.id || null,
        })
        .eq('id', existingAnalytics.id)
    }

    return { success: true }
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error'

    // Check if should retry
    const shouldRetry = emailItem.attempts < emailItem.max_attempts
    const retryDelay = getRetryDelay(emailItem.attempts)

    if (shouldRetry) {
      // Reschedule for retry
      await supabase
        .from('email_queue')
        .update({
          status: 'pending',
          send_after: new Date(Date.now() + retryDelay * 1000).toISOString(),
          last_error: errorMessage,
          error_details: { error: String(error) },
        })
        .eq('id', queueId)
    } else {
      // Mark as failed
      await supabase
        .from('email_queue')
        .update({
          status: 'failed',
          failed_at: new Date().toISOString(),
          last_error: errorMessage,
          error_details: { error: String(error) },
        })
        .eq('id', queueId)

      // Check if hard bounce and add to suppression list
      if (errorMessage.includes('bounce') || errorMessage.includes('invalid')) {
        await supabase.from('email_suppression_list').insert({
          email: emailItem.recipient_email.toLowerCase(),
          reason: 'hard_bounce',
        })
      }
    }

    return {
      success: false,
      error: errorMessage,
    }
  }
}

/**
 * Get retry delay in seconds based on attempt number
 */
function getRetryDelay(attempts: number): number {
  switch (attempts) {
    case 0:
      return RETRY_SCHEDULE.attempt1
    case 1:
      return RETRY_SCHEDULE.attempt2
    case 2:
      return RETRY_SCHEDULE.attempt3
    default:
      return RETRY_SCHEDULE.attempt3
  }
}

/**
 * Process pending emails from the queue
 * Processes up to 50 emails at a time, ordered by priority and send_after
 */
export async function processEmailQueue(): Promise<{
  processed: number
  succeeded: number
  failed: number
}> {
  const supabase = createAdminClient()
  const now = new Date().toISOString()

  // Get pending emails ready to send
  const { data: pendingEmails, error } = await supabase
    .from('email_queue')
    .select('id')
    .eq('status', 'pending')
    .lte('send_after', now)
    .order('priority', { ascending: true })
    .order('send_after', { ascending: true })
    .limit(50)

  if (error) {
    console.error('Error fetching pending emails:', error)
    return { processed: 0, succeeded: 0, failed: 0 }
  }

  if (!pendingEmails || pendingEmails.length === 0) {
    return { processed: 0, succeeded: 0, failed: 0 }
  }

  let succeeded = 0
  let failed = 0

  // Process emails sequentially to respect rate limits
  for (const email of pendingEmails) {
    const result = await processEmailQueueItem(email.id)
    if (result.success) {
      succeeded++
    } else {
      failed++
      console.error(`Failed to process email ${email.id}:`, result.error)
    }

    // Small delay between emails to respect rate limits
    await new Promise((resolve) => setTimeout(resolve, 100))
  }

  return {
    processed: pendingEmails.length,
    succeeded,
    failed,
  }
}
