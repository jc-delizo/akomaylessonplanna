import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import crypto from 'crypto'

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
  try {
    // Verify webhook signature
    const signature = request.headers.get('resend-signature')
    const body = await request.text()

    if (signature) {
      // Verify signature (Resend provides webhook secret)
      const webhookSecret = process.env.RESEND_WEBHOOK_SECRET
      if (webhookSecret) {
        const hmac = crypto.createHmac('sha256', webhookSecret)
        const digest = hmac.update(body).digest('hex')

        if (signature !== digest) {
          console.error('Invalid Resend webhook signature')
          return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
        }
      }
    }

    const event = JSON.parse(body)
    const { type, data } = event

    const supabase = createAdminClient()

    // Find email in analytics by resend_email_id
    const { data: analytics, error: findError } = await supabase
      .from('email_analytics')
      .select('*')
      .eq('resend_email_id', data.email_id)
      .single()

    if (findError || !analytics) {
      // Email not found - might be from before analytics tracking
      console.warn('Email not found in analytics:', data.email_id)
      return NextResponse.json({ success: true, message: 'Email not tracked' })
    }

    // Update analytics based on event type
    switch (type) {
      case 'email.delivered':
        await supabase
          .from('email_analytics')
          .update({
            delivered_at: new Date(data.timestamp || Date.now()).toISOString(),
          })
          .eq('id', analytics.id)

        // Update email_queue status if exists
        if (analytics.email_queue_id) {
          await supabase
            .from('email_queue')
            .update({ status: 'sent' })
            .eq('id', analytics.email_queue_id)
        }
        break

      case 'email.opened':
        await supabase
          .from('email_analytics')
          .update({
            opened_at: analytics.opened_at || new Date(data.timestamp || Date.now()).toISOString(),
            open_count: (analytics.open_count || 0) + 1,
          })
          .eq('id', analytics.id)
        break

      case 'email.clicked':
        await supabase
          .from('email_analytics')
          .update({
            clicked_at: analytics.clicked_at || new Date(data.timestamp || Date.now()).toISOString(),
            click_count: (analytics.click_count || 0) + 1,
          })
          .eq('id', analytics.id)
        break

      case 'email.bounced':
        await supabase
          .from('email_analytics')
          .update({
            bounced: true,
            bounce_reason: data.bounce_type || 'unknown',
            bounced_at: new Date(data.timestamp || Date.now()).toISOString(),
          })
          .eq('id', analytics.id)

        // Add to suppression list if hard bounce
        if (data.bounce_type === 'hard') {
          await supabase.from('email_suppression_list').insert({
            email: analytics.recipient_email.toLowerCase(),
            reason: 'hard_bounce',
          })
        }
        break

      case 'email.complained':
        await supabase
          .from('email_analytics')
          .update({
            spam_complained: true,
          })
          .eq('id', analytics.id)

        // Add to suppression list
        await supabase.from('email_suppression_list').insert({
          email: analytics.recipient_email.toLowerCase(),
          reason: 'spam_complaint',
        })
        break

      default:
        console.log('Unhandled Resend webhook event:', type)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error processing Resend webhook:', error)
    // Return 200 to prevent Resend from retrying
    return NextResponse.json({ success: false, error: 'Processing failed' }, { status: 200 })
  }
}
