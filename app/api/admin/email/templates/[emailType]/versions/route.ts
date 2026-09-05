import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/middleware/admin-auth'
import { createAdminClient } from '@/lib/supabase/admin'

/**
 * GET /api/admin/email/templates/[emailType]/versions
 * Get template version history
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

    // Get template
    const { data: template, error: templateError } = await supabase
      .from('email_templates')
      .select('id')
      .eq('email_type', emailType)
      .single()

    if (templateError || !template) {
      return NextResponse.json(
        { error: 'Template not found' },
        { status: 404 }
      )
    }

    // Get versions
    const { data: versions, error } = await supabase
      .from('email_template_versions')
      .select('*, created_by:users!email_template_versions_created_by_fkey(id, first_name, last_name, email)')
      .eq('template_id', template.id)
      .order('version', { ascending: false })

    if (error) {
      console.error('Error fetching template versions:', error)
      return NextResponse.json(
        { error: 'Failed to fetch template versions' },
        { status: 500 }
      )
    }

    return NextResponse.json({ versions: versions || [] })
  } catch (error) {
    console.error('Error in GET /api/admin/email/templates/[emailType]/versions:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
