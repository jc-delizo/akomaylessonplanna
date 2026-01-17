import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/middleware/admin-auth'
import { createAdminClient } from '@/lib/supabase/admin'

/**
 * GET /api/admin/email/templates/[emailType]
 * Get single email template
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

    const { data: template, error } = await supabase
      .from('email_templates')
      .select('*')
      .eq('email_type', emailType)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Template not found' }, { status: 404 })
      }
      console.error('Error fetching email template:', error)
      return NextResponse.json(
        { error: 'Failed to fetch email template' },
        { status: 500 }
      )
    }

    return NextResponse.json({ template })
  } catch (error) {
    console.error('Error in GET /api/admin/email/templates/[emailType]:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * PUT /api/admin/email/templates/[emailType]
 * Update email template (creates new version)
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
    const {
      subject_line,
      preheader,
      body_html,
      body_text,
      cta_enabled,
      cta_text,
      cta_link_template,
    } = body

    // Get current template
    const { data: currentTemplate, error: fetchError } = await supabase
      .from('email_templates')
      .select('*')
      .eq('email_type', emailType)
      .single()

    if (fetchError || !currentTemplate) {
      return NextResponse.json(
        { error: 'Template not found' },
        { status: 404 }
      )
    }

    // Save current version before updating
    const newVersion = (currentTemplate.version || 1) + 1
    await supabase.from('email_template_versions').insert({
      template_id: currentTemplate.id,
      version: currentTemplate.version || 1,
      subject_line: currentTemplate.subject_line,
      body_html: currentTemplate.body_html,
      created_by: authResult.admin.userId,
    })

    // Update template
    const { data: updated, error } = await supabase
      .from('email_templates')
      .update({
        subject_line: subject_line || currentTemplate.subject_line,
        preheader: preheader !== undefined ? preheader : currentTemplate.preheader,
        body_html: body_html || currentTemplate.body_html,
        body_text: body_text !== undefined ? body_text : currentTemplate.body_text,
        cta_enabled: cta_enabled !== undefined ? cta_enabled : currentTemplate.cta_enabled,
        cta_text: cta_text !== undefined ? cta_text : currentTemplate.cta_text,
        cta_link_template: cta_link_template !== undefined ? cta_link_template : currentTemplate.cta_link_template,
        version: newVersion,
        updated_by: authResult.admin.userId,
        updated_at: new Date().toISOString(),
      })
      .eq('id', currentTemplate.id)
      .select()
      .single()

    if (error) {
      console.error('Error updating email template:', error)
      return NextResponse.json(
        { error: 'Failed to update email template' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, template: updated })
  } catch (error) {
    console.error('Error in PUT /api/admin/email/templates/[emailType]:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
