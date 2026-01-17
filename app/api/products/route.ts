import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

/**
 * GET /api/products
 * List products with filtering, sorting, and pagination
 * 
 * Query params:
 * - page: number (default: 1)
 * - limit: number (default: 24)
 * - status: string (default: 'published')
 * - grade_id: UUID
 * - subject_id: UUID
 * - product_type: string
 * - sort: string (newest, best_selling, price_asc, price_desc, highest_rated)
 * - search: string
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)

    // Parse query parameters
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '24')
    const status = searchParams.get('status') || 'published'
    const gradeId = searchParams.get('grade_id')
    const subjectId = searchParams.get('subject_id')
    const productType = searchParams.get('product_type')
    const sort = searchParams.get('sort') || 'newest'
    const search = searchParams.get('search')

    // Start building query
    let query = supabase
      .from('products')
      .select(`
        *,
        seller:users!products_seller_id_fkey(
          id,
          name,
          username,
          avatar_url,
          is_verified_teacher,
          subscription_tier,
          avg_rating
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

    // Apply status filter (default to published for public)
    query = query.eq('status', status)

    // Apply filters
    if (gradeId) {
      query = query.eq('grade_id', gradeId)
    }

    if (subjectId) {
      query = query.eq('subject_id', subjectId)
    }

    if (productType) {
      query = query.eq('product_type', productType)
    }

    // Apply search (full-text search)
    if (search) {
      query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`)
    }

    // Apply sorting
    switch (sort) {
      case 'newest':
        query = query.order('created_at', { ascending: false })
        break
      case 'best_selling':
        query = query.order('sales_count', { ascending: false })
        break
      case 'price_asc':
        query = query.order('price', { ascending: true })
        break
      case 'price_desc':
        query = query.order('price', { ascending: false })
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

    // Execute query
    const { data: products, error, count } = await query

    if (error) {
      console.error('Error fetching products:', error)
      return NextResponse.json(
        { error: 'Failed to fetch products' },
        { status: 500 }
      )
    }

    // Return paginated results
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
    console.error('Error in GET /api/products:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/products
 * Create a new product
 * 
 * Body:
 * - title: string (required)
 * - description: string (required)
 * - price: number (required, >= 50)
 * - grade_id: UUID (required)
 * - subject_id: UUID (required)
 * - quarter: number (optional, 1-4)
 * - weeks: number[] (optional)
 * - product_type: string (required)
 * - specific_type: string (optional)
 * - theme, size, season, occasion: string (optional, type-specific)
 * - file_urls: string[] (required)
 * - cover_image_url: string (optional)
 * - preview_images: string[] (optional)
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Check authentication
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user can sell
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('can_sell, role')
      .eq('id', user.id)
      .single()

    if (userError || !userData) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    if (!userData.can_sell) {
      return NextResponse.json(
        { error: 'User does not have permission to sell' },
        { status: 403 }
      )
    }

    // Parse and validate request body
    const body = await request.json()

    // Basic validation
    if (!body.title || body.title.length < 5 || body.title.length > 255) {
      return NextResponse.json(
        { error: 'Title must be between 5 and 255 characters' },
        { status: 400 }
      )
    }

    if (!body.description || body.description.length < 50 || body.description.length > 2000) {
      return NextResponse.json(
        { error: 'Description must be between 50 and 2000 characters' },
        { status: 400 }
      )
    }

    if (!body.price || body.price < 50) {
      return NextResponse.json(
        { error: 'Price must be at least ₱50' },
        { status: 400 }
      )
    }

    if (!body.grade_id || !body.subject_id || !body.product_type) {
      return NextResponse.json(
        { error: 'Missing required fields: grade_id, subject_id, product_type' },
        { status: 400 }
      )
    }

    if (!body.file_urls || !Array.isArray(body.file_urls) || body.file_urls.length === 0) {
      return NextResponse.json(
        { error: 'At least one file is required' },
        { status: 400 }
      )
    }

    // Generate unique slug from title
    const baseSlug = body.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')

    // Check if slug exists and make it unique
    let slug = baseSlug
    let slugCounter = 1
    let slugExists = true

    while (slugExists) {
      const { data: existingProduct } = await supabase
        .from('products')
        .select('id')
        .eq('slug', slug)
        .single()

      if (!existingProduct) {
        slugExists = false
      } else {
        slug = `${baseSlug}-${slugCounter}`
        slugCounter++
      }
    }

    // Check seller's published product count to determine status
    // First 3 products go to pending_review, rest go to published
    const { data: publishedProducts, error: countError } = await supabase
      .from('products')
      .select('id')
      .eq('seller_id', user.id)
      .eq('status', 'published')

    if (countError) {
      console.error('Error counting products:', countError)
    }

    const publishedCount = publishedProducts?.length || 0
    const initialStatus = publishedCount < 3 ? 'pending_review' : 'published'

    // Insert product
    const { data: product, error: insertError } = await supabase
      .from('products')
      .insert({
        seller_id: user.id,
        title: body.title,
        description: body.description,
        slug,
        price: body.price,
        grade_id: body.grade_id,
        subject_id: body.subject_id,
        quarter: body.quarter || null,
        weeks: body.weeks || null,
        product_type: body.product_type,
        specific_type: body.specific_type || null,
        theme: body.theme || null,
        size: body.size || null,
        season: body.season || null,
        occasion: body.occasion || null,
        language: body.language || 'english',
        file_urls: body.file_urls,
        cover_image_url: body.cover_image_url || null,
        preview_images: body.preview_images || null,
        watermark_enabled: body.watermark_enabled !== false,
        status: initialStatus,
        published_at: initialStatus === 'published' ? new Date().toISOString() : null,
      })
      .select(`
        *,
        seller:users!products_seller_id_fkey(
          id,
          name,
          username,
          avatar_url
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
      `)
      .single()

    if (insertError) {
      console.error('Error creating product:', insertError)
      return NextResponse.json(
        { error: 'Failed to create product', details: insertError.message },
        { status: 500 }
      )
    }

    // If product was published immediately, notify followers
    if (initialStatus === 'published') {
      try {
        const { createNewProductNotification } = await import('@/lib/notifications/notification-triggers')
        const { data: sellerData } = await supabase
          .from('users')
          .select('name')
          .eq('id', user.id)
          .single()

        if (sellerData) {
          await createNewProductNotification(
            user.id,
            product.id,
            product.title,
            sellerData.name
          )
        }
      } catch (notificationError) {
        console.error('Error creating new product notifications:', notificationError)
      }
    }

    return NextResponse.json(
      { 
        product,
        message: initialStatus === 'pending_review' 
          ? 'Product created and submitted for review'
          : 'Product created and published successfully'
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error in POST /api/products:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
