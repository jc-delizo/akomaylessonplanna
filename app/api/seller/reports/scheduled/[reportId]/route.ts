import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ reportId: string }> }
) {
  try {
    const { reportId } = await params
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify user is Pro/Pioneer seller
    const { data: userData } = await supabase
      .from('users')
      .select('role, can_sell, subscription_tier')
      .eq('id', user.id)
      .single()

    if (!userData || userData.role !== 'seller' || !userData.can_sell) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const isProOrPioneer =
      userData.subscription_tier === 'pro' || userData.subscription_tier === 'pioneer'

    if (!isProOrPioneer) {
      return NextResponse.json(
        { error: 'Pro/Pioneer subscription required' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { frequency, format, is_active } = body

    // Verify report belongs to user
    const { data: existingReport } = await supabase
      .from('scheduled_reports')
      .select('*')
      .eq('id', reportId)
      .eq('user_id', user.id)
      .single()

    if (!existingReport) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 })
    }

    // Calculate next_send_at if frequency changed
    const updateData: any = {}
    if (frequency !== undefined) updateData.frequency = frequency
    if (format !== undefined) updateData.format = format
    if (is_active !== undefined) updateData.is_active = is_active

    if (frequency && frequency !== existingReport.frequency) {
      const now = new Date()
      let nextSendAt: Date

      if (frequency === 'weekly') {
        const daysUntilMonday = (8 - now.getDay()) % 7 || 7
        nextSendAt = new Date(now.getTime() + daysUntilMonday * 24 * 60 * 60 * 1000)
        nextSendAt.setHours(8, 0, 0, 0)
      } else {
        nextSendAt = new Date(now.getFullYear(), now.getMonth() + 1, 1, 8, 0, 0, 0)
      }

      updateData.next_send_at = nextSendAt.toISOString()
    }

    const { data: updatedReport, error } = await supabase
      .from('scheduled_reports')
      .update(updateData)
      .eq('id', reportId)
      .eq('user_id', user.id)
      .select()
      .single()

    if (error) {
      console.error('Error updating scheduled report:', error)
      return NextResponse.json({ error: 'Failed to update report' }, { status: 500 })
    }

    return NextResponse.json({ report: updatedReport })
  } catch (error) {
    console.error('Error in PUT /api/seller/reports/scheduled/:reportId:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ reportId: string }> }
) {
  try {
    const { reportId } = await params
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify user is Pro/Pioneer seller
    const { data: userData } = await supabase
      .from('users')
      .select('role, can_sell, subscription_tier')
      .eq('id', user.id)
      .single()

    if (!userData || userData.role !== 'seller' || !userData.can_sell) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const isProOrPioneer =
      userData.subscription_tier === 'pro' || userData.subscription_tier === 'pioneer'

    if (!isProOrPioneer) {
      return NextResponse.json(
        { error: 'Pro/Pioneer subscription required' },
        { status: 403 }
      )
    }

    // Delete scheduled report
    const { error } = await supabase
      .from('scheduled_reports')
      .delete()
      .eq('id', reportId)
      .eq('user_id', user.id)

    if (error) {
      console.error('Error deleting scheduled report:', error)
      return NextResponse.json({ error: 'Failed to delete report' }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: 'Scheduled report deleted' })
  } catch (error) {
    console.error('Error in DELETE /api/seller/reports/scheduled/:reportId:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
