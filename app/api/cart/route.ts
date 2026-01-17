import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get cart items with product details
    const { data: cartItems, error } = await supabase
      .from('cart_items')
      .select(
        `
        id,
        product_id,
        created_at,
        product:products!cart_items_product_id_fkey(
          id,
          title,
          price,
          cover_image_url,
          seller:users!products_seller_id_fkey(
            id,
            name,
            username
          )
        )
      `
      )
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching cart:', error)
      return NextResponse.json({ error: 'Failed to fetch cart' }, { status: 500 })
    }

    return NextResponse.json({ items: cartItems || [] })
  } catch (error) {
    console.error('Error in GET /api/cart:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { product_id } = body

    if (!product_id) {
      return NextResponse.json({ error: 'product_id is required' }, { status: 400 })
    }

    // Check if product exists and is published
    const { data: product, error: productError } = await supabase
      .from('products')
      .select('id, status')
      .eq('id', product_id)
      .single()

    if (productError || !product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    if (product.status !== 'published') {
      return NextResponse.json({ error: 'Product is not available' }, { status: 400 })
    }

    // Insert cart item (unique constraint prevents duplicates)
    const { data: cartItem, error } = await supabase
      .from('cart_items')
      .insert({
        user_id: user.id,
        product_id: product_id,
      })
      .select()
      .single()

    if (error) {
      // If duplicate, return existing item
      if (error.code === '23505') {
        const { data: existingItem } = await supabase
          .from('cart_items')
          .select('*')
          .eq('user_id', user.id)
          .eq('product_id', product_id)
          .single()

        return NextResponse.json({ item: existingItem })
      }
      console.error('Error adding to cart:', error)
      return NextResponse.json({ error: 'Failed to add to cart' }, { status: 500 })
    }

    return NextResponse.json({ item: cartItem }, { status: 201 })
  } catch (error) {
    console.error('Error in POST /api/cart:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE() {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Clear entire cart
    const { error } = await supabase
      .from('cart_items')
      .delete()
      .eq('user_id', user.id)

    if (error) {
      console.error('Error clearing cart:', error)
      return NextResponse.json({ error: 'Failed to clear cart' }, { status: 500 })
    }

    return NextResponse.json({ message: 'Cart cleared successfully' })
  } catch (error) {
    console.error('Error in DELETE /api/cart:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
