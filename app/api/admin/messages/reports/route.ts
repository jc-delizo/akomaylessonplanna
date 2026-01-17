import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/middleware/admin-auth'

/**
 * GET /api/admin/messages/reports
 * Get all user reports
 * Query params: status, report_type
 */
export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAdmin(request)
    if (!authResult.success) {
      return authResult.response
    }

    const supabase = await createClient()

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const reportType = searchParams.get('report_type')

    // Build query
    let query = supabase
      .from('message_reports')
      .select(
        `
        *,
        reporter:reporter_id(id, name, username, email),
        reported_user:reported_user_id(id, name, username, email),
        reviewed_by_user:reviewed_by(id, name, username),
        conversation:conversation_id(id, buyer_id, seller_id),
        message:message_id(id, content, sender_id)
      `
      )
      .order('created_at', { ascending: false })

    // Apply filters
    if (status) {
      query = query.eq('status', status)
    }
    if (reportType) {
      query = query.eq('report_type', reportType)
    }

    const { data: reports, error } = await query.limit(100)

    if (error) {
      console.error('Error fetching reports:', error)
      return NextResponse.json(
        { error: 'Failed to fetch reports' },
        { status: 500 }
      )
    }

    return NextResponse.json({ reports: reports || [] })
  } catch (error) {
    console.error('Error in GET /api/admin/messages/reports:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
