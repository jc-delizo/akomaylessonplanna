import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

/**
 * GET /api/messages/templates
 * Get user's templates (system + custom)
 * Returns: List of templates (5 system + user's custom templates)
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

    // Get system templates
    const { data: systemTemplates, error: systemError } = await supabase
      .from('message_templates')
      .select('*')
      .eq('template_type', 'system')
      .eq('is_active', true)
      .order('created_at', { ascending: true })

    if (systemError) {
      console.error('Error fetching system templates:', systemError)
    }

    // Get user's custom templates (if Pro/Pioneer)
    const { data: userData } = await supabase
      .from('users')
      .select('subscription_tier')
      .eq('id', user.id)
      .single()

    let customTemplates: any[] = []
    if (userData?.subscription_tier === 'pro' || userData?.subscription_tier === 'pioneer') {
      const { data: custom, error: customError } = await supabase
        .from('message_templates')
        .select('*')
        .eq('seller_id', user.id)
        .eq('template_type', 'custom')
        .eq('is_active', true)
        .order('usage_count', { ascending: false })
        .order('created_at', { ascending: true })

      if (customError) {
        console.error('Error fetching custom templates:', customError)
      } else {
        customTemplates = custom || []
      }
    }

    return NextResponse.json({
      templates: [
        ...(systemTemplates || []),
        ...customTemplates,
      ],
    })
  } catch (error) {
    console.error('Error in GET /api/messages/templates:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/messages/templates
 * Create custom template (Pro/Pioneer only)
 * Body: { name, content }
 * Validates: Max 5 custom templates
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { name, content } = body

    if (!name || !content) {
      return NextResponse.json(
        { error: 'Name and content are required' },
        { status: 400 }
      )
    }

    if (content.length > 500) {
      return NextResponse.json(
        { error: 'Template content exceeds 500 characters' },
        { status: 400 }
      )
    }

    // Check if user is Pro/Pioneer
    const { data: userData } = await supabase
      .from('users')
      .select('subscription_tier, can_sell')
      .eq('id', user.id)
      .single()

    if (!userData) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    if (userData.subscription_tier !== 'pro' && userData.subscription_tier !== 'pioneer') {
      return NextResponse.json(
        { error: 'Custom templates are only available for Pro and Pioneer sellers' },
        { status: 403 }
      )
    }

    if (!userData.can_sell) {
      return NextResponse.json(
        { error: 'Only sellers can create templates' },
        { status: 403 }
      )
    }

    // Check existing custom templates count (max 5)
    const { count: existingCount } = await supabase
      .from('message_templates')
      .select('id', { count: 'exact', head: true })
      .eq('seller_id', user.id)
      .eq('template_type', 'custom')
      .eq('is_active', true)

    if (existingCount && existingCount >= 5) {
      return NextResponse.json(
        { error: 'Maximum 5 custom templates allowed' },
        { status: 400 }
      )
    }

    // Create template
    const { data: template, error: createError } = await supabase
      .from('message_templates')
      .insert({
        seller_id: user.id,
        name: name.trim(),
        content: content.trim(),
        template_type: 'custom',
        is_active: true,
        usage_count: 0,
      })
      .select()
      .single()

    if (createError) {
      console.error('Error creating template:', createError)
      return NextResponse.json(
        { error: 'Failed to create template' },
        { status: 500 }
      )
    }

    return NextResponse.json({ template }, { status: 201 })
  } catch (error) {
    console.error('Error in POST /api/messages/templates:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
