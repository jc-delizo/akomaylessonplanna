import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { parseBoundedInteger } from '@/lib/utils/query-params'

/**
 * GET /api/sellers/[username]/products
 * Get seller's products with pagination and sorting
 * 
 * Query parameters:
 * - page: page number (default: 1)
 * - limit: items per page (default: 12)
 * - sort: newest | best-selling | price-low | price-high | highest-rated
 * - subject: filter by subject
 * - grade: filter by grade
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  try {
    const { username } = await params
    const supabase = await createClient()
    const searchParams = request.nextUrl.searchParams

    // Get user by username
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('username', username)
      .single()

    if (userError || !user) {
      return NextResponse.json({ error: 'Seller not found' }, { status: 404 })
    }

    // Parse query parameters
    const page = parseBoundedInteger(searchParams.get('page'), 1, 1, 10_000)
    const limit = parseBoundedInteger(searchParams.get('limit'), 12, 1, 100)
    const sort = searchParams.get('sort') || 'newest'
    const subject = searchParams.get('subject')
    const grade = searchParams.get('grade')

    const offset = (page - 1) * limit

    // Build query
    let query = supabase
      .from('products')
      .select('*', { count: 'exact' })
      .eq('seller_id', user.id)
      .eq('status', 'published') // Only published products

    // Apply filters
    if (subject) {
      query = query.eq('subject_id', subject)
    }
    if (grade) {
      query = query.eq('grade_id', grade)
    }

    // Apply sorting
    switch (sort) {
      case 'newest':
        query = query.order('created_at', { ascending: false })
        break
      case 'best-selling':
        query = query.order('sales_count', { ascending: false })
        break
      case 'price-low':
        query = query.order('price', { ascending: true })
        break
      case 'price-high':
        query = query.order('price', { ascending: false })
        break
      case 'highest-rated':
        query = query.order('avg_rating', { ascending: false })
        break
      default:
        query = query.order('created_at', { ascending: false })
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1)

    const { data: products, error: productsError, count } = await query

    if (productsError) {
      console.error('Error fetching products:', productsError)
      return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 })
    }

    // For now, return empty array since products table doesn't exist yet
    // This will work once Feature 03 is implemented
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
    console.error('Error fetching seller products:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
