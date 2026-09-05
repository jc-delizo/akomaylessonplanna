import { NextRequest, NextResponse } from 'next/server'
import { processEmailQueue } from '@/lib/emails/queue-processor'
import { hasValidBearerToken } from '@/lib/security/request-security'

function authorizeCron(request: NextRequest): NextResponse | null {
  const cronSecret = process.env.CRON_SECRET
  if (!cronSecret) {
    console.error('CRON_SECRET is not configured')
    return NextResponse.json({ error: 'Cron is not configured' }, { status: 503 })
  }

  if (!hasValidBearerToken(request.headers.get('authorization'), cronSecret)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  return null
}

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
    const authError = authorizeCron(request)
    if (authError) return authError

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
export async function GET(request: NextRequest) {
  try {
    const authError = authorizeCron(request)
    if (authError) return authError

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
