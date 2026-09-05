import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getResendClient } from '@/lib/emails/resend-client'

/**
 * POST /api/webhooks/resend
 * Handle Resend webhook events (delivery, opens, clicks, bounces)
 * 
 * Webhook events from Resend:
 * - email.sent
 * - email.delivered
 * - email.delivery_delayed
 * - email.complained
 * - email.bounced
 * - email.opened
 * - email.clicked
 */
export async function POST(request: NextRequest) {
  const webhookSecret = process.env.RESEND_WEBHOOK_SECRET
  if (!webhookSecret) {
    console.error('RESEND_WEBHOOK_SECRET is not configured')
    return NextResponse.json({ error: 'Webhook is not configured' }, { status: 503 })
  }

  const webhookId = request.headers.get('svix-id')
  const webhookTimestamp = request.headers.get('svix-timestamp')
  const webhookSignature = request.headers.get('svix-signature')

  if (!webhookId || !webhookTimestamp || !webhookSignature) {
    return NextResponse.json({ error: 'Missing webhook signature headers' }, { status: 400 })
  }

  const body = await request.text()
  let event

  try {
    event = getResendClient().webhooks.verify({
      payload: body,
      headers: {
        id: webhookId,
        timestamp: webhookTimestamp,
        signature: webhookSignature,
      },
      webhookSecret,
    })
  } catch (error) {
    console.warn('Rejected invalid Resend webhook:', error)
    return NextResponse.json({ error: 'Invalid webhook signature' }, { status: 401 })
  }

  if (!event.type.startsWith('email.') || !('email_id' in event.data)) {
    return NextResponse.json({ success: true, message: 'Event type ignored' })
  }

  const { type, data, created_at: eventCreatedAt } = event

  let supabase: ReturnType<typeof createAdminClient> | null = null
  let eventClaimed = false

  try {
    supabase = createAdminClient()

    // Resend retries deliveries, so claim the Svix event ID before mutating counters.
    const { error: eventClaimError } = await supabase.from('webhook_events').insert({
      provider: 'resend',
      event_id: webhookId,
    })

    if (eventClaimError?.code === '23505') {
      return NextResponse.json({ success: true, message: 'Event already processed' })
    }

    if (eventClaimError) {
      console.error('Unable to claim Resend webhook event:', eventClaimError)
      return NextResponse.json({ error: 'Webhook processing unavailable' }, { status: 503 })
    }
    eventClaimed = true

    // Find email in analytics by resend_email_id
    const { data: analytics, error: findError } = await supabase
      .from('email_analytics')
      .select('*')
      .eq('resend_email_id', data.email_id)
      .single()

    if (findError || !analytics) {
      // A delivery can race the analytics insert immediately after sending.
      // Release the claim and ask Resend to retry instead of losing the event.
      console.warn('Email not found in analytics:', data.email_id)
      await supabase
        .from('webhook_events')
        .delete()
        .eq('provider', 'resend')
        .eq('event_id', webhookId)
      eventClaimed = false
      return NextResponse.json({ error: 'Email analytics not ready' }, { status: 503 })
    }

    // Update analytics based on event type
    switch (type) {
      case 'email.delivered':
        const { error: deliveredError } = await supabase
          .from('email_analytics')
          .update({
            delivered_at: new Date(eventCreatedAt).toISOString(),
          })
          .eq('id', analytics.id)
        if (deliveredError) throw deliveredError

        // Update email_queue status if exists
        if (analytics.email_queue_id) {
          const { error: queueError } = await supabase
            .from('email_queue')
            .update({ status: 'sent' })
            .eq('id', analytics.email_queue_id)
          if (queueError) throw queueError
        }
        break

      case 'email.opened':
        const { error: openError } = await supabase.rpc('record_email_engagement', {
          p_analytics_id: analytics.id,
          p_event_type: 'opened',
          p_event_at: new Date(eventCreatedAt).toISOString(),
        })
        if (openError) throw openError
        break

      case 'email.clicked':
        const { error: clickError } = await supabase.rpc('record_email_engagement', {
          p_analytics_id: analytics.id,
          p_event_type: 'clicked',
          p_event_at: new Date(eventCreatedAt).toISOString(),
        })
        if (clickError) throw clickError
        break

      case 'email.bounced':
        const { error: bounceError } = await supabase
          .from('email_analytics')
          .update({
            bounced: true,
            bounce_reason: data.bounce?.type || 'unknown',
            bounced_at: new Date(eventCreatedAt).toISOString(),
          })
          .eq('id', analytics.id)
        if (bounceError) throw bounceError

        // Add to suppression list if hard bounce
        if (data.bounce?.type === 'hard' || data.bounce?.type === 'permanent') {
          const { error: suppressionError } = await supabase.from('email_suppression_list').upsert({
            email: analytics.recipient_email.toLowerCase(),
            reason: 'hard_bounce',
          }, {
            onConflict: 'email',
            ignoreDuplicates: true,
          })
          if (suppressionError) throw suppressionError
        }
        break

      case 'email.complained':
        const { error: complaintError } = await supabase
          .from('email_analytics')
          .update({
            spam_complained: true,
          })
          .eq('id', analytics.id)
        if (complaintError) throw complaintError

        // Add to suppression list
        const { error: complaintSuppressionError } = await supabase.from('email_suppression_list').upsert({
          email: analytics.recipient_email.toLowerCase(),
          reason: 'spam_complaint',
        }, {
          onConflict: 'email',
          ignoreDuplicates: true,
        })
        if (complaintSuppressionError) throw complaintSuppressionError
        break

      default:
        // Delivery-delay and sent events do not mutate the current analytics model.
        break
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    if (supabase && eventClaimed) {
      const { error: releaseError } = await supabase
        .from('webhook_events')
        .delete()
        .eq('provider', 'resend')
        .eq('event_id', webhookId)
      if (releaseError) {
        console.error('Unable to release failed Resend event claim:', releaseError)
      }
    }
    console.error('Error processing Resend webhook:', error)
    return NextResponse.json({ success: false, error: 'Processing failed' }, { status: 500 })
  }
}
