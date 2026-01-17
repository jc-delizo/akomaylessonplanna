import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/middleware/admin-auth'
import { createAdminClient } from '@/lib/supabase/admin'

/**
 * GET /api/admin/email/configuration/[emailType]
 * Get single email configuration
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ emailType: string }> }
) {
  try {
    const authResult = await requireAdmin(request)
    if (!authResult.success) {
      return authResult.response
    }

    const { emailType } = await params
    const supabase = createAdminClient()

    const { data: config, error } = await supabase
      .from('email_configuration')
      .select('*')
      .eq('email_type', emailType)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Configuration not found' }, { status: 404 })
      }
      console.error('Error fetching email configuration:', error)
      return NextResponse.json(
        { error: 'Failed to fetch email configuration' },
        { status: 500 }
      )
    }

    return NextResponse.json({ configuration: config })
  } catch (error) {
    console.error('Error in GET /api/admin/email/configuration/[emailType]:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * PUT /api/admin/email/configuration/[emailType]
 * Update single email configuration
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ emailType: string }> }
) {
  try {
    const authResult = await requireAdmin(request)
    if (!authResult.success) {
      return authResult.response
    }

    const { emailType } = await params
    const supabase = createAdminClient()
    const body = await request.json()
    const { is_enabled, notes } = body

    const { data: updated, error } = await supabase
      .from('email_configuration')
      .update({
        is_enabled: is_enabled !== undefined ? is_enabled : true,
        notes: notes || null,
        updated_by: authResult.admin.userId,
        updated_at: new Date().toISOString(),
      })
      .eq('email_type', emailType)
      .select()
      .single()

    if (error) {
      console.error('Error updating email configuration:', error)
      return NextResponse.json(
        { error: 'Failed to update email configuration' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, configuration: updated })
  } catch (error) {
    console.error('Error in PUT /api/admin/email/configuration/[emailType]:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
