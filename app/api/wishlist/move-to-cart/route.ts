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

    // Remove from wishlist
    const { error: wishlistError } = await supabase
      .from('wishlist')
      .delete()
      .eq('user_id', user.id)
      .eq('product_id', product_id)

    if (wishlistError) {
      console.error('Error removing from wishlist:', wishlistError)
      return NextResponse.json({ error: 'Failed to remove from wishlist' }, { status: 500 })
    }

    // Add to cart (unique constraint prevents duplicates)
    const { error: cartError } = await supabase
      .from('cart_items')
      .insert({
        user_id: user.id,
        product_id: product_id,
      })

    if (cartError) {
      // If already in cart, that's fine
      if (cartError.code !== '23505') {
        console.error('Error adding to cart:', cartError)
        return NextResponse.json({ error: 'Failed to add to cart' }, { status: 500 })
      }
    }

    return NextResponse.json({ message: 'Moved to cart successfully' })
  } catch (error) {
    console.error('Error in POST /api/wishlist/move-to-cart:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
