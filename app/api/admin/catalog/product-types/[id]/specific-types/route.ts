import { createAdminClient } from '@/lib/supabase/admin'
import { requireSuperAdmin } from '@/lib/middleware/admin-auth'
import { NextRequest, NextResponse } from 'next/server'

/**
 * GET /api/admin/catalog/product-types/[id]/specific-types
 * List specific types for a product type. Super Admin only.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireSuperAdmin(request)
  if (!authResult.success) return authResult.response

  const { id } = await params
  try {
    const supabase = createAdminClient()
    const { data, error } = await supabase
      .from('product_type_specific_types')
      .select('*')
      .eq('product_type_id', id)
      .order('sort_order', { ascending: true })

    if (error) {
      console.error('Error fetching specific types:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json(data || [])
  } catch (err) {
    console.error('Error in GET /api/admin/catalog/product-types/[id]/specific-types:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * POST /api/admin/catalog/product-types/[id]/specific-types
 * Create specific type for a product type. Super Admin only.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireSuperAdmin(request)
  if (!authResult.success) return authResult.response

  const { id } = await params
  try {
    const body = await request.json()
    const { value, label, sort_order = 0 } = body
    if (!value || !label) {
      return NextResponse.json(
        { error: 'value and label are required' },
        { status: 400 }
      )
    }

    const supabase = createAdminClient()
    const { data, error } = await supabase
      .from('product_type_specific_types')
      .insert({
        product_type_id: id,
        value: String(value).trim().toLowerCase().replace(/\s+/g, '_'),
        label: String(label).trim(),
        sort_order: Number(sort_order) || 0,
      })
      .select()
      .single()

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json({ error: 'Value already exists for this product type' }, { status: 409 })
      }
      console.error('Error creating specific type:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json(data, { status: 201 })
  } catch (err) {
    console.error('Error in POST /api/admin/catalog/product-types/[id]/specific-types:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
