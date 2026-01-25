import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/middleware/admin-auth'

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

    const supabase = await createClient()

    // Get pending verifications (oldest first)
    const { data: verifications, error } = await supabase
      .from('teacher_id_verifications')
      .select(`
        *,
        user:users!teacher_id_verifications_user_id_fkey(
          id,
          first_name,
          last_name,
          email,
          username,
          avatar_url,
          created_at
        )
      `)
      .eq('status', 'pending')
      .order('created_at', { ascending: true }) // Oldest first (FCFS)

    if (error) {
      console.error('Error fetching verification queue:', error)
      // Handle missing table gracefully (table might not exist yet)
      if (error.code === 'PGRST205' || error.message?.includes('schema cache')) {
        return NextResponse.json({
          verifications: [],
          total: 0,
        })
      }
      return NextResponse.json({ error: 'Failed to fetch verification queue' }, { status: 500 })
    }

    return NextResponse.json({
      verifications: verifications || [],
      total: verifications?.length || 0,
    })
  } catch (error) {
    console.error('Error in GET /api/admin/users/verification-queue:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
