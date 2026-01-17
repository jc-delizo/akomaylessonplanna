import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

/**
 * GET /api/categories/[slug]/products
 * Get products in a category
 * 
 * Query params:
 * - page: number (default: 1)
 * - limit: number (default: 24)
 * - sort: string (relevance, newest, price_asc, price_desc, best_selling, highest_rated)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params
    const { searchParams } = new URL(request.url)
    const supabase = await createClient()

    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '24')
    const sort = searchParams.get('sort') || 'newest'

    // Determine category type from slug
    let categoryType: 'product_type' | 'grade' | null = null
    let categoryValue: string | null = null

    // Check if it's a product type
    const productTypes: Record<string, string> = {
      'lesson-plans': 'lesson_plans',
      'exams': 'exams',
      'rpms': 'rpms',
      'posters': 'posters',
      'tarpaulins': 'tarpaulins'
    }
    
    if (productTypes[slug]) {
      categoryType = 'product_type'
      categoryValue = productTypes[slug]
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

    // Build query
    let query = supabase
      .from('products')
      .select(`
        *,
        seller:users!products_seller_id_fkey(
          id,
          name,
          username,
          avatar_url,
          is_verified_teacher
        ),
        grade:grades!products_grade_id_fkey(
          id,
          name
        ),
        subject:subjects!products_subject_id_fkey(
          id,
          name,
          code
        )
      `, { count: 'exact' })
      .eq('status', 'published')

    if (categoryType === 'product_type') {
      query = query.eq('product_type', categoryValue)
    } else if (categoryType === 'grade') {
      query = query.eq('grade_id', categoryValue)
    }

    // Apply sorting
    switch (sort) {
      case 'newest':
        query = query.order('published_at', { ascending: false, nullsFirst: false })
          .order('created_at', { ascending: false })
        break
      case 'price_asc':
        query = query.order('price', { ascending: true })
        break
      case 'price_desc':
        query = query.order('price', { ascending: false })
        break
      case 'best_selling':
        query = query.order('sales_count', { ascending: false })
        break
      case 'highest_rated':
        query = query.order('avg_rating', { ascending: false, nullsFirst: false })
        break
      default:
        query = query.order('created_at', { ascending: false })
    }

    // Apply pagination
    const from = (page - 1) * limit
    const to = from + limit - 1
    query = query.range(from, to)

    const { data: products, error, count } = await query

    if (error) {
      throw error
    }

    return NextResponse.json({
      products: products || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    })
  } catch (error) {
    console.error('Error in GET /api/categories/[slug]/products:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
