import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/middleware/admin-auth'
import { createAdminClient } from '@/lib/supabase/admin'

/**
 * POST /api/admin/email/templates/[emailType]/revert
 * Revert template to a previous version
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { emailType: string } }
) {
  try {
    const authResult = await requireAdmin(request)
    if (!authResult.success) {
      return authResult.response
    }

    const supabase = createAdminClient()
    const body = await request.json()
    const { version } = body

    if (!version || typeof version !== 'number') {
      return NextResponse.json(
        { error: 'Version number is required' },
        { status: 400 }
      )
    }

    // Get template
    const { data: template, error: templateError } = await supabase
      .from('email_templates')
      .select('*')
      .eq('email_type', params.emailType)
      .single()

    if (templateError || !template) {
      return NextResponse.json(
        { error: 'Template not found' },
        { status: 404 }
      )
    }

    // Get version to revert to
    const { data: versionData, error: versionError } = await supabase
      .from('email_template_versions')
      .select('*')
      .eq('template_id', template.id)
      .eq('version', version)
      .single()

    if (versionError || !versionData) {
      return NextResponse.json(
        { error: 'Version not found' },
        { status: 404 }
      )
    }

    // Save current version before reverting
    const newVersion = (template.version || 1) + 1
    await supabase.from('email_template_versions').insert({
      template_id: template.id,
      version: template.version || 1,
      subject_line: template.subject_line,
      body_html: template.body_html,
      created_by: authResult.admin.userId,
    })

    // Revert to selected version
    const { data: reverted, error } = await supabase
      .from('email_templates')
      .update({
        subject_line: versionData.subject_line,
        body_html: versionData.body_html,
        version: newVersion,
        updated_by: authResult.admin.userId,
        updated_at: new Date().toISOString(),
      })
      .eq('id', template.id)
      .select()
      .single()

    if (error) {
      console.error('Error reverting template:', error)
      return NextResponse.json(
        { error: 'Failed to revert template' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      template: reverted,
      message: `Reverted to version ${version}`,
    })
  } catch (error) {
    console.error('Error in POST /api/admin/email/templates/[emailType]/revert:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
