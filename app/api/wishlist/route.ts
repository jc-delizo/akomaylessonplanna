import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if checking for specific product
    const { searchParams } = new URL(request.url)
    const productId = searchParams.get('product_id')

    if (productId) {
      // Check if product is in wishlist
      const { data: wishlistItem } = await supabase
        .from('wishlist')
        .select('id')
        .eq('user_id', user.id)
        .eq('product_id', productId)
        .single()

      return NextResponse.json({ isInWishlist: !!wishlistItem })
    }

    // Get wishlist items with product details
    const { data: wishlistItems, error } = await supabase
      .from('wishlist')
      .select(
        `
        id,
        product_id,
        created_at,
        product:products!wishlist_product_id_fkey(
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
      console.error('Error fetching wishlist:', error)
      return NextResponse.json({ error: 'Failed to fetch wishlist' }, { status: 500 })
    }

    return NextResponse.json({ items: wishlistItems || [] })
  } catch (error) {
    console.error('Error in GET /api/wishlist:', error)
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

    // Insert wishlist item (unique constraint prevents duplicates)
    const { data: wishlistItem, error } = await supabase
      .from('wishlist')
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
          .from('wishlist')
          .select('*')
          .eq('user_id', user.id)
          .eq('product_id', product_id)
          .single()

        return NextResponse.json({ item: existingItem })
      }
      console.error('Error adding to wishlist:', error)
      return NextResponse.json({ error: 'Failed to add to wishlist' }, { status: 500 })
    }

    return NextResponse.json({ item: wishlistItem }, { status: 201 })
  } catch (error) {
    console.error('Error in POST /api/wishlist:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
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
    const { error } = await supabase
      .from('wishlist')
      .delete()
      .eq('user_id', user.id)
      .eq('product_id', product_id)

    if (error) {
      console.error('Error removing from wishlist:', error)
      return NextResponse.json({ error: 'Failed to remove from wishlist' }, { status: 500 })
    }

    return NextResponse.json({ message: 'Removed from wishlist successfully' })
  } catch (error) {
    console.error('Error in DELETE /api/wishlist:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
