import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/middleware/admin-auth'
import { createAdminClient } from '@/lib/supabase/admin'

/**
 * GET /api/admin/email/templates
 * List all email templates
 */
export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAdmin(request)
    if (!authResult.success) {
      return authResult.response
    }

    const supabase = createAdminClient()

    const { data: templates, error } = await supabase
      .from('email_templates')
      .select('*')
      .order('category')
      .order('template_name')

    if (error) {
      console.error('Error fetching email templates:', error)
      return NextResponse.json(
        { error: 'Failed to fetch email templates' },
        { status: 500 }
      )
    }

    return NextResponse.json({ templates: templates || [] })
  } catch (error) {
    console.error('Error in GET /api/admin/email/templates:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * POST /api/admin/email/templates
 * Create new email template
 */
export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAdmin(request)
    if (!authResult.success) {
      return authResult.response
    }

    const supabase = createAdminClient()
    const body = await request.json()
    const {
      email_type,
      template_name,
      subject_line,
      preheader,
      body_html,
      body_text,
      cta_enabled,
      cta_text,
      cta_link_template,
      description,
      category,
    } = body

    if (!email_type || !template_name || !subject_line || !body_html) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const { data: template, error } = await supabase
      .from('email_templates')
      .insert({
        email_type,
        template_name,
        subject_line,
        preheader: preheader || null,
        body_html,
        body_text: body_text || null,
        cta_enabled: cta_enabled || false,
        cta_text: cta_text || null,
        cta_link_template: cta_link_template || null,
        description: description || null,
        category: category || null,
        created_by: authResult.admin.userId,
        updated_by: authResult.admin.userId,
        version: 1,
        is_active: true,
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating email template:', error)
      return NextResponse.json(
        { error: 'Failed to create email template' },
        { status: 500 }
      )
    }

    // Create initial version
    await supabase.from('email_template_versions').insert({
      template_id: template.id,
      version: 1,
      subject_line: template.subject_line,
      body_html: template.body_html,
      created_by: authResult.admin.userId,
    })

    return NextResponse.json({ success: true, template }, { status: 201 })
  } catch (error) {
    console.error('Error in POST /api/admin/email/templates:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
