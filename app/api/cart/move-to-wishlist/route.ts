import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

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

    // Remove from cart
    const { error: cartError } = await supabase
      .from('cart_items')
      .delete()
      .eq('user_id', user.id)
      .eq('product_id', product_id)

    if (cartError) {
      console.error('Error removing from cart:', cartError)
      return NextResponse.json({ error: 'Failed to remove from cart' }, { status: 500 })
    }

    // Add to wishlist (unique constraint prevents duplicates)
    const { error: wishlistError } = await supabase
      .from('wishlist')
      .insert({
        user_id: user.id,
        product_id: product_id,
      })

    if (wishlistError) {
      // If already in wishlist, that's fine
      if (wishlistError.code !== '23505') {
        console.error('Error adding to wishlist:', wishlistError)
        return NextResponse.json({ error: 'Failed to add to wishlist' }, { status: 500 })
      }
    }

    return NextResponse.json({ message: 'Moved to wishlist successfully' })
  } catch (error) {
    console.error('Error in POST /api/cart/move-to-wishlist:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
