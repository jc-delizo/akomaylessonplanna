import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

/**
 * POST /api/messages/report
 * Report user or message
 * Body: { reported_user_id, message_id (optional), conversation_id (optional), report_type, description }
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      reported_user_id,
      message_id,
      conversation_id,
      report_type,
      description,
    } = body

    if (!reported_user_id || !report_type) {
      return NextResponse.json(
        { error: 'reported_user_id and report_type are required' },
        { status: 400 }
      )
    }

    const validReportTypes = [
      'harassment',
      'fraud',
      'inappropriate',
      'spam',
      'other',
    ]
    if (!validReportTypes.includes(report_type)) {
      return NextResponse.json(
        { error: 'Invalid report_type' },
        { status: 400 }
      )
    }

    if (reported_user_id === user.id) {
      return NextResponse.json(
        { error: 'Cannot report yourself' },
        { status: 400 }
      )
    }

    // Verify reported user exists
    const { data: reportedUser } = await supabase
      .from('users')
      .select('id')
      .eq('id', reported_user_id)
      .single()

    if (!reportedUser) {
      return NextResponse.json(
        { error: 'Reported user not found' },
        { status: 404 }
      )
    }

    // If message_id provided, verify it exists and belongs to reported user
    if (message_id) {
      const { data: message } = await supabase
        .from('messages')
        .select('sender_id')
        .eq('id', message_id)
        .single()

      if (!message) {
        return NextResponse.json(
          { error: 'Message not found' },
          { status: 404 }
        )
      }

      if (message.sender_id !== reported_user_id) {
        return NextResponse.json(
          { error: 'Message does not belong to reported user' },
          { status: 400 }
        )
      }
    }

    // Create report
    const { data: report, error: reportError } = await supabase
      .from('message_reports')
      .insert({
        reporter_id: user.id,
        reported_user_id,
        message_id: message_id || null,
        conversation_id: conversation_id || null,
        report_type,
        description: description || null,
        status: 'pending',
      })
      .select()
      .single()

    if (reportError) {
      console.error('Error creating report:', reportError)
      return NextResponse.json(
        { error: 'Failed to create report' },
        { status: 500 }
      )
    }

    // If message_id provided, flag the message
    if (message_id) {
      await supabase
        .from('messages')
        .update({
          is_flagged: true,
          flag_reason: 'user_report',
        })
        .eq('id', message_id)
    }

    return NextResponse.json({ report }, { status: 201 })
  } catch (error) {
    console.error('Error in POST /api/messages/report:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
