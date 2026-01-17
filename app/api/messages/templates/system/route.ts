import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

/**
 * GET /api/messages/templates/system
 * Get 5 system quick reply templates
 * No auth required (all users can access)
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    const { data: templates, error } = await supabase
      .from('message_templates')
      .select('*')
      .eq('template_type', 'system')
      .eq('is_active', true)
      .order('created_at', { ascending: true })

    if (error) {
      console.error('Error fetching system templates:', error)
      return NextResponse.json(
        { error: 'Failed to fetch system templates' },
        { status: 500 }
      )
    }

    return NextResponse.json({ templates: templates || [] })
  } catch (error) {
    console.error('Error in GET /api/messages/templates/system:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
