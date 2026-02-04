import { createAdminClient } from '@/lib/supabase/admin'
import { requireSuperAdmin } from '@/lib/middleware/admin-auth'
import { NextRequest, NextResponse } from 'next/server'

/**
 * PUT /api/admin/catalog/product-types/[id]/specific-types/[stId]
 * Update specific type. Super Admin only.
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; stId: string }> }
) {
  const authResult = await requireSuperAdmin(request)
  if (!authResult.success) return authResult.response

  const { stId } = await params
  try {
    const body = await request.json()
    const updates: Record<string, unknown> = {}
    if (body.value !== undefined) updates.value = String(body.value).trim().toLowerCase().replace(/\s+/g, '_')
    if (body.label !== undefined) updates.label = String(body.label).trim()
    if (body.sort_order !== undefined) updates.sort_order = Number(body.sort_order) ?? 0
    if (body.is_active !== undefined) updates.is_active = Boolean(body.is_active)

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 })
    }

    const supabase = createAdminClient()
    const { data, error } = await supabase
      .from('product_type_specific_types')
      .update(updates)
      .eq('id', stId)
      .select()
      .single()

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json({ error: 'Value already exists for this product type' }, { status: 409 })
      }
      console.error('Error updating specific type:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json(data)
  } catch (err) {
    console.error('Error in PUT /api/admin/catalog/product-types/[id]/specific-types/[stId]:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * DELETE /api/admin/catalog/product-types/[id]/specific-types/[stId]
 * Delete specific type. Super Admin only.
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; stId: string }> }
) {
  const authResult = await requireSuperAdmin(request)
  if (!authResult.success) return authResult.response

  const { stId } = await params
  try {
    const supabase = createAdminClient()
    const { error } = await supabase
      .from('product_type_specific_types')
      .delete()
      .eq('id', stId)

    if (error) {
      console.error('Error deleting specific type:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Error in DELETE /api/admin/catalog/product-types/[id]/specific-types/[stId]:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
