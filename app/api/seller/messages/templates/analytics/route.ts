import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

/**
 * GET /api/seller/messages/templates/analytics
 * Get template usage stats (Pro/Pioneer)
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify user is Pro/Pioneer
    const { data: userData } = await supabase
      .from('users')
      .select('subscription_tier')
      .eq('id', user.id)
      .single()

    if (
      userData?.subscription_tier !== 'pro' &&
      userData?.subscription_tier !== 'pioneer'
    ) {
      return NextResponse.json(
        { error: 'Template analytics are only available for Pro and Pioneer sellers' },
        { status: 403 }
      )
    }

    // Get user's custom templates with usage stats
    const { data: templates, error } = await supabase
      .from('message_templates')
      .select('*')
      .eq('seller_id', user.id)
      .eq('template_type', 'custom')
      .order('usage_count', { ascending: false })
      .order('created_at', { ascending: true })

    if (error) {
      console.error('Error fetching template analytics:', error)
      return NextResponse.json(
        { error: 'Failed to fetch template analytics' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      templates: templates || [],
    })
  } catch (error) {
    console.error('Error in GET /api/seller/messages/templates/analytics:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
