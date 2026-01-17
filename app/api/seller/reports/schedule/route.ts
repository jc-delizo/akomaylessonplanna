import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
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
    const { report_type, frequency, format } = body

    if (!['weekly_performance', 'monthly_summary'].includes(report_type)) {
      return NextResponse.json({ error: 'Invalid report_type' }, { status: 400 })
    }

    if (!['weekly', 'monthly'].includes(frequency)) {
      return NextResponse.json({ error: 'Invalid frequency' }, { status: 400 })
    }

    if (!['pdf', 'xlsx'].includes(format)) {
      return NextResponse.json({ error: 'Invalid format' }, { status: 400 })
    }

    // Calculate next_send_at
    const now = new Date()
    let nextSendAt: Date

    if (frequency === 'weekly') {
      // Next Monday
      const daysUntilMonday = (8 - now.getDay()) % 7 || 7
      nextSendAt = new Date(now.getTime() + daysUntilMonday * 24 * 60 * 60 * 1000)
      nextSendAt.setHours(8, 0, 0, 0) // 8 AM
    } else {
      // First of next month
      nextSendAt = new Date(now.getFullYear(), now.getMonth() + 1, 1, 8, 0, 0, 0)
    }

    // Create scheduled report
    const { data: scheduledReport, error } = await supabase
      .from('scheduled_reports')
      .insert({
        user_id: user.id,
        report_type,
        frequency,
        format,
        is_active: true,
        next_send_at: nextSendAt.toISOString(),
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating scheduled report:', error)
      return NextResponse.json({ error: 'Failed to create scheduled report' }, { status: 500 })
    }

    return NextResponse.json({ report: scheduledReport })
  } catch (error) {
    console.error('Error in POST /api/seller/reports/schedule:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET() {
  try {
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

    // Get scheduled reports
    const { data: reports, error } = await supabase
      .from('scheduled_reports')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching scheduled reports:', error)
      return NextResponse.json({ error: 'Failed to fetch reports' }, { status: 500 })
    }

    return NextResponse.json({ reports: reports || [] })
  } catch (error) {
    console.error('Error in GET /api/seller/reports/schedule:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
