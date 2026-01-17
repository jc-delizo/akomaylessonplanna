import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/middleware/admin-auth'

/**
 * PUT /api/admin/messages/reports/[id]/resolve
 * Resolve report
 * Body: { resolution, status (resolved/dismissed) }
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await requireAdmin(request)
    if (!authResult.success) {
      return authResult.response
    }

    const { id: reportId } = await params
    const supabase = await createClient()
    const body = await request.json()
    const { resolution, status } = body

    if (!status || !['resolved', 'dismissed'].includes(status)) {
      return NextResponse.json(
        { error: 'Status must be "resolved" or "dismissed"' },
        { status: 400 }
      )
    }

    // Get report
    const { data: report, error: reportError } = await supabase
      .from('message_reports')
      .select('id, message_id')
      .eq('id', reportId)
      .single()

    if (reportError || !report) {
      return NextResponse.json(
        { error: 'Report not found' },
        { status: 404 }
      )
    }

    // Update report
    const { data: updated, error: updateError } = await supabase
      .from('message_reports')
      .update({
        status,
        resolution: resolution || null,
        reviewed_by: authResult.admin.userId,
        resolved_at: new Date().toISOString(),
      })
      .eq('id', reportId)
      .select()
      .single()

    if (updateError) {
      console.error('Error resolving report:', updateError)
      return NextResponse.json(
        { error: 'Failed to resolve report' },
        { status: 500 }
      )
    }

    // If dismissed and message was flagged, unflag it
    if (status === 'dismissed' && report.message_id) {
      await supabase
        .from('messages')
        .update({
          is_flagged: false,
          flag_reason: null,
        })
        .eq('id', report.message_id)
    }

    return NextResponse.json({ report: updated })
  } catch (error) {
    console.error('Error in PUT /api/admin/messages/reports/[id]/resolve:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
