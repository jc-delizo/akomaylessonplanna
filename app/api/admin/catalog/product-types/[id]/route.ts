import { createAdminClient } from '@/lib/supabase/admin'
import { requireSuperAdmin } from '@/lib/middleware/admin-auth'
import { NextRequest, NextResponse } from 'next/server'

/**
 * GET /api/admin/catalog/product-types/[id]
 * Get single product type. Super Admin only.
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
      .from('product_types')
      .select('*')
      .eq('id', id)
      .single()

    if (error || !data) {
      return NextResponse.json({ error: 'Product type not found' }, { status: 404 })
    }
    return NextResponse.json(data)
  } catch (err) {
    console.error('Error in GET /api/admin/catalog/product-types/[id]:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * PUT /api/admin/catalog/product-types/[id]
 * Update product type. Super Admin only. Soft-delete via is_active.
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireSuperAdmin(request)
  if (!authResult.success) return authResult.response

  const { id } = await params
  try {
    const body = await request.json()
    const updates: Record<string, unknown> = {}
    if (body.slug !== undefined) updates.slug = String(body.slug).trim().toLowerCase().replace(/\s+/g, '_')
    if (body.label !== undefined) updates.label = String(body.label).trim()
    if (body.sort_order !== undefined) updates.sort_order = Number(body.sort_order) ?? 0
    if (body.is_active !== undefined) updates.is_active = Boolean(body.is_active)

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 })
    }

    const supabase = createAdminClient()
    const { data, error } = await supabase
      .from('product_types')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json({ error: 'Slug already exists' }, { status: 409 })
      }
      console.error('Error updating product type:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json(data)
  } catch (err) {
    console.error('Error in PUT /api/admin/catalog/product-types/[id]:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * DELETE /api/admin/catalog/product-types/[id]
 * Hard delete (use PUT with is_active: false for soft-delete). Super Admin only.
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireSuperAdmin(request)
  if (!authResult.success) return authResult.response

  const { id } = await params
  try {
    const supabase = createAdminClient()
    const { error } = await supabase.from('product_types').delete().eq('id', id)

    if (error) {
      console.error('Error deleting product type:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Error in DELETE /api/admin/catalog/product-types/[id]:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
