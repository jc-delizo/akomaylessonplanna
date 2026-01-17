import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ orderItemId: string }> }
) {
  try {
    const { orderItemId } = await params
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

    // Get order item with full details
    const { data: orderItem, error } = await supabase
      .from('order_items')
      .select(
        `
        *,
        order:orders!order_items_order_id_fkey(
          *,
          buyer:users!orders_buyer_id_fkey(
            id,
            name,
            location_region,
            created_at
          )
        ),
        product:products!order_items_product_id_fkey(
          id,
          title,
          cover_image_url
        )
      `
      )
      .eq('id', orderItemId)
      .eq('seller_id', user.id)
      .single()

    if (error || !orderItem) {
      return NextResponse.json(
        { error: 'Order not found or does not belong to you' },
        { status: 404 }
      )
    }

    return NextResponse.json({ order: orderItem })
  } catch (error) {
    console.error('Error in GET /api/seller/orders/:orderItemId:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
