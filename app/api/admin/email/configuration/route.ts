import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin, logAdminAction } from '@/lib/middleware/admin-auth'
import { createAdminClient } from '@/lib/supabase/admin'
import { EMAIL_TYPES } from '@/lib/emails/email-types'

/**
 * GET /api/admin/email/configuration
 * Get all email configurations (26 types)
 */
export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAdmin(request)
    if (!authResult.success) {
      return authResult.response
    }

    const supabase = createAdminClient()

    // Get all email configurations
    const { data: configurations, error } = await supabase
      .from('email_configuration')
      .select('*')
      .order('email_type')

    if (error) {
      console.error('Error fetching email configurations:', error)
      return NextResponse.json(
        { error: 'Failed to fetch email configurations' },
        { status: 500 }
      )
    }

    // Get stats for each email type (sent today, last sent)
    const today = new Date().toISOString().split('T')[0]
    const statsPromises = (configurations || []).map(async (config) => {
      // Count sent today
      const { count: sentToday } = await supabase
        .from('email_queue')
        .select('*', { count: 'exact', head: true })
        .eq('email_type', config.email_type)
        .eq('status', 'sent')
        .gte('sent_at', `${today}T00:00:00`)

      // Get last sent
      const { data: lastSent } = await supabase
        .from('email_queue')
        .select('sent_at')
        .eq('email_type', config.email_type)
        .eq('status', 'sent')
        .order('sent_at', { ascending: false })
        .limit(1)
        .single()

      return {
        ...config,
        sent_today: sentToday || 0,
        last_sent: lastSent?.sent_at || null,
      }
    })

    const configsWithStats = await Promise.all(statsPromises)

    // Merge with email type metadata
    const result = configsWithStats.map((config) => {
      const metadata = EMAIL_TYPES[config.email_type as keyof typeof EMAIL_TYPES]
      return {
        ...config,
        metadata: metadata || null,
      }
    })

    return NextResponse.json({ configurations: result })
  } catch (error) {
    console.error('Error in GET /api/admin/email/configuration:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * PUT /api/admin/email/configuration
 * Update email configuration
 * Body: { email_type, is_enabled, notes }
 */
export async function PUT(request: NextRequest) {
  try {
    const authResult = await requireAdmin(request)
    if (!authResult.success) {
      return authResult.response
    }

    const supabase = createAdminClient()
    const body = await request.json()
    const { email_type, is_enabled, notes } = body

    if (!email_type) {
      return NextResponse.json(
        { error: 'email_type is required' },
        { status: 400 }
      )
    }

    // Update configuration
    const { data: updated, error } = await supabase
      .from('email_configuration')
      .update({
        is_enabled: is_enabled !== undefined ? is_enabled : true,
        notes: notes || null,
        updated_by: authResult.admin.userId,
        updated_at: new Date().toISOString(),
      })
      .eq('email_type', email_type)
      .select()
      .single()

    if (error) {
      console.error('Error updating email configuration:', error)
      return NextResponse.json(
        { error: 'Failed to update email configuration' },
        { status: 500 }
      )
    }

    // Log action
    await logAdminAction(
      authResult.admin.userId,
      'email_configuration_updated',
      'email_configuration',
      email_type,
      { is_enabled, notes },
      `Email ${email_type} ${is_enabled ? 'enabled' : 'disabled'}`
    )

    return NextResponse.json({ success: true, configuration: updated })
  } catch (error) {
    console.error('Error in PUT /api/admin/email/configuration:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
