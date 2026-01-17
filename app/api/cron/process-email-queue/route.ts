import { NextRequest, NextResponse } from 'next/server'
import { processEmailQueue } from '@/lib/emails/queue-processor'

/**
 * POST /api/cron/process-email-queue
 * Process pending emails from the queue
 * 
 * This endpoint should be called by a cron job every minute
 * Can also be called manually by admins
 * 
 * Security: Should be protected with a secret token or Vercel Cron
 */
export async function POST(request: NextRequest) {
  try {
    // Optional: Verify cron secret token
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      // Allow if no secret is set (for development)
      // In production, require the secret
      if (process.env.NODE_ENV === 'production') {
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 401 }
        )
      }
    }

    // Process email queue
    const result = await processEmailQueue()

    return NextResponse.json({
      success: true,
      ...result,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Error processing email queue:', error)
    return NextResponse.json(
      {
        error: 'Failed to process email queue',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

/**
 * GET /api/cron/process-email-queue
 * Get queue status (for monitoring)
 */
export async function GET() {
  try {
    const { createAdminClient } = await import('@/lib/supabase/admin')
    const supabase = createAdminClient()

    // Get queue stats
    const { count: pendingCount } = await supabase
      .from('email_queue')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending')

    const { count: processingCount } = await supabase
      .from('email_queue')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'processing')

    const { count: failedCount } = await supabase
      .from('email_queue')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'failed')

    return NextResponse.json({
      queue: {
        pending: pendingCount || 0,
        processing: processingCount || 0,
        failed: failedCount || 0,
      },
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Error getting queue status:', error)
    return NextResponse.json(
      {
        error: 'Failed to get queue status',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
