import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

/**
 * GET /api/grades
 * Get all active grades sorted by sort_order
 */
export async function GET() {
  try {
    const supabase = await createClient()

    const { data: grades, error } = await supabase
      .from('grades')
      .select('id, name, sort_order')
      .eq('is_active', true)
      .order('sort_order', { ascending: true })

    if (error) {
      console.error('Error fetching grades:', error)
      return NextResponse.json(
        { error: 'Failed to fetch grades' },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { grades: grades || [] },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
        },
      }
    )
  } catch (error) {
    console.error('Error in GET /api/grades:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
