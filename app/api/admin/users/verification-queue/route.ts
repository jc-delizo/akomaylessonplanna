import { createAdminClient } from '@/lib/supabase/admin'
import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/middleware/admin-auth'
import { getVerificationQueueData } from '@/lib/utils/admin-verification-queue'

/**
 * GET /api/admin/users/verification-queue
 * Get teacher verification queue (oldest first - FCFS)
 */
export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAdmin(request)
    if (!authResult.success) {
      return authResult.response
    }

    const supabase = createAdminClient()
    const result = await getVerificationQueueData(supabase)
    return NextResponse.json(result)
  } catch (error) {
    console.error('Error in GET /api/admin/users/verification-queue:', error)
    const message = error instanceof Error ? error.message : 'Internal server error'
    return NextResponse.json(
      { error: message === 'Failed to fetch verification queue' ? message : 'Internal server error' },
      { status: 500 }
    )
  }
}
