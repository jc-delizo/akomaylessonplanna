import { createAdminClient } from '@/lib/supabase/admin'
import { NextRequest, NextResponse } from 'next/server'
import { requirePermission } from '@/lib/middleware/admin-auth'
import { getCategoriesData } from '@/lib/utils/admin-categories'

/**
 * GET /api/admin/categories
 * Get all categories (for management)
 */
export async function GET(request: NextRequest) {
  try {
    const authResult = await requirePermission(request, 'view_catalog')
    if (!authResult.success) {
      return authResult.response
    }

    const supabase = createAdminClient()
    const result = await getCategoriesData(supabase)
    return NextResponse.json(result)
  } catch (error) {
    console.error('Error in GET /api/admin/categories:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * POST /api/admin/categories
 * Create a new category
 */
export async function POST(request: NextRequest) {
  try {
    const authResult = await requirePermission(request, 'view_catalog')
    if (!authResult.success) {
      return authResult.response
    }

    const supabase = createAdminClient()
    const body = await request.json()
    const {
      name,
      slug,
      description,
      meta_title,
      meta_description,
      hero_image_url,
      show_on_homepage,
      sort_by,
      filters,
      featured_products,
    } = body

    if (!name || !slug) {
      return NextResponse.json({ error: 'Name and slug are required' }, { status: 400 })
    }

    const { data: category, error } = await supabase
      .from('categories')
      .insert({
        name,
        slug,
        description,
        meta_title,
        meta_description,
        hero_image_url,
        show_on_homepage: show_on_homepage || false,
        sort_by: sort_by || 'relevance',
        filters: filters || [],
        featured_products: featured_products || [],
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating category:', error)
      return NextResponse.json({ error: 'Failed to create category' }, { status: 500 })
    }

    return NextResponse.json({ category }, { status: 201 })
  } catch (error) {
    console.error('Error in POST /api/admin/categories:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
