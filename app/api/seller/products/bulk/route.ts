import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function PUT(request: Request) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify user is a seller
    const { data: userData } = await supabase
      .from('users')
      .select('role, can_sell')
      .eq('id', user.id)
      .single()

    if (!userData || userData.role !== 'seller' || !userData.can_sell) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { product_ids, action } = body

    if (!Array.isArray(product_ids) || product_ids.length === 0) {
      return NextResponse.json(
        { error: 'product_ids must be a non-empty array' },
        { status: 400 }
      )
    }

    if (!['unpublish', 'delete', 'publish', 'draft'].includes(action)) {
      return NextResponse.json(
        { error: 'Invalid action. Must be: unpublish, delete, publish, or draft' },
        { status: 400 }
      )
    }

    // Verify all products belong to this seller
    const { data: products } = await supabase
      .from('products')
      .select('id, status')
      .eq('seller_id', user.id)
      .in('id', product_ids)

    if (!products || products.length !== product_ids.length) {
      return NextResponse.json(
        { error: 'Some products not found or do not belong to you' },
        { status: 403 }
      )
    }

    let updateData: { status: string } | null = null
    let deleteProducts = false

    switch (action) {
      case 'publish':
        updateData = { status: 'published' }
        break
      case 'unpublish':
        updateData = { status: 'draft' }
        break
      case 'draft':
        updateData = { status: 'draft' }
        break
      case 'delete':
        deleteProducts = true
        break
    }

    if (deleteProducts) {
      // Soft delete: set status to 'deleted'
      const { error } = await supabase
        .from('products')
        .update({ status: 'deleted' })
        .eq('seller_id', user.id)
        .in('id', product_ids)

      if (error) {
        console.error('Error deleting products:', error)
        return NextResponse.json(
          { error: 'Failed to delete products' },
          { status: 500 }
        )
      }

      return NextResponse.json({
        success: true,
        affected: product_ids.length,
        message: `Successfully deleted ${product_ids.length} product(s)`,
      })
    } else if (updateData) {
      const { error } = await supabase
        .from('products')
        .update(updateData)
        .eq('seller_id', user.id)
        .in('id', product_ids)

      if (error) {
        console.error('Error updating products:', error)
        return NextResponse.json(
          { error: 'Failed to update products' },
          { status: 500 }
        )
      }

      return NextResponse.json({
        success: true,
        affected: product_ids.length,
        message: `Successfully ${action}ed ${product_ids.length} product(s)`,
      })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error) {
    console.error('Error in PUT /api/seller/products/bulk:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
