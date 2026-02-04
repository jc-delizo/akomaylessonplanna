import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

/**
 * GET /api/categories/[slug]
 * Get category details
 * 
 * Returns category information including name, description, product count
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params
    const supabase = await createClient()

    // Determine category type from slug
    let categoryType: 'product_type' | 'grade' | 'subject' | null = null
    let categoryValue: string | null = null

    // Check if it's a product type - resolve from product_types table (dynamic) or fallback
    const slugAsProductType = slug.replace(/-/g, '_')
    const fallbackTypes: Record<string, string> = {
      'lesson-plans': 'lesson_plans',
      'exams': 'exams',
      'rpms': 'rpms',
      'posters': 'posters',
      'tarpaulins': 'tarpaulins',
    }

    const { data: ptRow, error: ptError } = await supabase
      .from('product_types')
      .select('slug, label')
      .eq('slug', slugAsProductType)
      .eq('is_active', true)
      .maybeSingle()

    if (!ptError && ptRow) {
      categoryType = 'product_type'
      categoryValue = ptRow.slug
    } else if (fallbackTypes[slug]) {
      categoryType = 'product_type'
      categoryValue = fallbackTypes[slug]
    } else if (slug.startsWith('grade-')) {
      // It's a grade
      categoryType = 'grade'
      const gradeName = slug.replace('grade-', '').replace('-', ' ')
      const { data: grade } = await supabase
        .from('grades')
        .select('id, name')
        .ilike('name', `%${gradeName}%`)
        .eq('is_active', true)
        .single()
      
      if (grade) {
        categoryValue = grade.id
      }
    }

    if (!categoryType || !categoryValue) {
      return NextResponse.json(
        { error: 'Category not found' },
        { status: 404 }
      )
    }

    // Get product count
    let query = supabase
      .from('products')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'published')

    if (categoryType === 'product_type') {
      query = query.eq('product_type', categoryValue)
    } else if (categoryType === 'grade') {
      query = query.eq('grade_id', categoryValue)
    }

    const { count, error: countError } = await query

    if (countError) {
      throw countError
    }

    // Get category name
    let categoryName = ''
    if (categoryType === 'product_type') {
      categoryName = ptRow?.label ?? categoryValue.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())
    } else if (categoryType === 'grade') {
      const { data: grade } = await supabase
        .from('grades')
        .select('name')
        .eq('id', categoryValue)
        .single()
      categoryName = grade?.name || ''
    }

    return NextResponse.json({
      slug,
      name: categoryName,
      type: categoryType,
      product_count: count || 0
    }, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
      },
    })
  } catch (error) {
    console.error('Error in GET /api/categories/[slug]:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
