import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/middleware/admin-auth'
import { sendImmediate } from '@/lib/emails/queue-service'
import { createAdminClient } from '@/lib/supabase/admin'
import { renderEmailTemplate, prepareTemplateData } from '@/lib/emails/template-renderer'

/**
 * POST /api/admin/email/templates/[emailType]/test
 * Send test email to admin
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
    const { test_email } = body

    // Get admin email
    const { data: admin } = await supabase
      .from('users')
      .select('email, name')
      .eq('id', authResult.admin.userId)
      .single()

    if (!admin) {
      return NextResponse.json({ error: 'Admin not found' }, { status: 404 })
    }

    const recipientEmail = test_email || admin.email

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

    // Prepare sample template data
    const sampleData = prepareTemplateData({
      user_name: admin.name || 'Test User',
      user_email: recipientEmail,
      order_id: 'TEST-12345',
      order_total: '₱150.00',
      product_title: 'Test Product',
      product_url: `${process.env.NEXT_PUBLIC_APP_URL || 'https://akomaylessonplanna.com'}/products/test`,
    })

    // Render template
    const html = await renderEmailTemplate(template.body_html, sampleData)
    const subject = await renderEmailTemplate(template.subject_line, sampleData)

    // Send test email
    await sendImmediate({
      emailType: params.emailType as any,
      recipientEmail,
      recipientUserId: authResult.admin.userId,
      subject: `[TEST] ${subject}`,
      html,
      templateData: sampleData,
    })

    return NextResponse.json({
      success: true,
      message: `Test email sent to ${recipientEmail}`,
    })
  } catch (error) {
    console.error('Error in POST /api/admin/email/templates/[emailType]/test:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
