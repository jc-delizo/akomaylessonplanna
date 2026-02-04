import { createAdminClient } from '@/lib/supabase/admin'
import { requireSuperAdmin } from '@/lib/middleware/admin-auth'
import { NextRequest, NextResponse } from 'next/server'

/**
 * GET /api/admin/catalog/product-types
 * List all product types (including inactive). Super Admin only.
 */
export async function GET(request: NextRequest) {
  const authResult = await requireSuperAdmin(request)
  if (!authResult.success) return authResult.response

  try {
    const supabase = createAdminClient()
    const { data, error } = await supabase
      .from('product_types')
      .select('*')
      .order('sort_order', { ascending: true })

    if (error) {
      console.error('Error fetching product types:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json(data || [])
  } catch (err) {
    console.error('Error in GET /api/admin/catalog/product-types:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * POST /api/admin/catalog/product-types
 * Create product type. Super Admin only.
 */
export async function POST(request: NextRequest) {
  const authResult = await requireSuperAdmin(request)
  if (!authResult.success) return authResult.response

  try {
    const body = await request.json()
    const { slug, label, sort_order = 0 } = body
    if (!slug || !label) {
      return NextResponse.json(
        { error: 'slug and label are required' },
        { status: 400 }
      )
    }

    const supabase = createAdminClient()
    const { data, error } = await supabase
      .from('product_types')
      .insert({
        slug: String(slug).trim().toLowerCase().replace(/\s+/g, '_'),
        label: String(label).trim(),
        sort_order: Number(sort_order) || 0,
      })
      .select()
      .single()

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json({ error: 'Slug already exists' }, { status: 409 })
      }
      console.error('Error creating product type:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json(data, { status: 201 })
  } catch (err) {
    console.error('Error in POST /api/admin/catalog/product-types:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
