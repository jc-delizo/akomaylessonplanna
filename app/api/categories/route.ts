import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

/**
 * GET /api/categories
 * List all product categories
 * 
 * Returns categories grouped by type (product_type, grade, subject)
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Get all product types
    const { data: productTypes } = await supabase
      .from('products')
      .select('product_type')
      .eq('status', 'published')
      .not('product_type', 'is', null)

    // Get unique product types
    const uniqueTypes = Array.from(new Set((productTypes || []).map((p: any) => p.product_type)))
      .map(type => ({
        slug: type.replace('_', '-'),
        name: type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()),
        type: 'product_type',
        count: productTypes?.filter((p: any) => p.product_type === type).length || 0
      }))

    // Get all grades
    const { data: grades } = await supabase
      .from('grades')
      .select('id, name, sort_order')
      .eq('is_active', true)
      .order('sort_order', { ascending: true })

    // Get product counts per grade
    const gradeCounts = await Promise.all(
      (grades || []).map(async (grade: any) => {
        const { count } = await supabase
          .from('products')
          .select('id', { count: 'exact', head: true })
          .eq('grade_id', grade.id)
          .eq('status', 'published')
        
        return {
          slug: `grade-${grade.name.toLowerCase().replace(' ', '-')}`,
          name: grade.name,
          type: 'grade',
          id: grade.id,
          count: count || 0
        }
      })
    )

    return NextResponse.json({
      categories: [
        ...uniqueTypes,
        ...gradeCounts.filter(g => g.count > 0)
      ]
    }, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
      },
    })
  } catch (error) {
    console.error('Error in GET /api/categories:', error)
    return NextResponse.json(
      { error: 'Internal server error', categories: [] },
      { status: 500 }
    )
  }
}
