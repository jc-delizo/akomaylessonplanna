import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

/**
 * GET /api/me/verification-status
 * Get current user's verification status
 * 
 * Returns: { verification: { id, status, prc_license_number, prc_license_expiry, rejection_reason, created_at, attempt_count } | null }
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Check authentication
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get latest verification record
    const { data: verificationRecords, error: fetchError } = await supabase
      .from('teacher_id_verifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)

    if (fetchError) {
      // Handle table not found error gracefully (migration not run yet)
      if (fetchError.code === 'PGRST205') {
        // Table doesn't exist - migration not run yet, return null verification
        return NextResponse.json({
          verification: null,
        })
      }
      console.error('Error fetching verification status:', fetchError)
      return NextResponse.json(
        { error: 'Failed to fetch verification status' },
        { status: 500 }
      )
    }

    const latestVerification = verificationRecords && verificationRecords.length > 0 
      ? verificationRecords[0] 
      : null

    // Count rejected attempts
    let attemptCount = 0
    if (latestVerification) {
      const { data: rejectedCount, error: countError } = await supabase
        .from('teacher_id_verifications')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('status', 'rejected')

      // Handle table not found error gracefully
      if (!countError || countError.code !== 'PGRST205') {
        attemptCount = rejectedCount?.length || 0
      }
    }

    return NextResponse.json({
      verification: latestVerification
        ? {
            id: latestVerification.id,
            status: latestVerification.status,
            prc_license_number: latestVerification.prc_license_number,
            prc_license_expiry: latestVerification.prc_license_expiry,
            rejection_reason: latestVerification.rejection_reason,
            created_at: latestVerification.created_at,
            attempt_count: attemptCount,
          }
        : null,
    })
  } catch (error) {
    console.error('Error in GET /api/me/verification-status:', error)
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    )
  }
}
