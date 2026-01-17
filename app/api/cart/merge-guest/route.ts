import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

/**
 * POST /api/cart/merge-guest
 * 
 * Merges guest cart (from localStorage) into authenticated user's cart.
 * Called after user logs in or signs up.
 * 
 * Body: { productIds: string[] }
 */
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
    const { productIds } = body

    if (!Array.isArray(productIds)) {
      return NextResponse.json(
        { error: 'productIds must be an array' },
        { status: 400 }
      )
    }

    if (productIds.length === 0) {
      // No items to merge, return empty cart
      const { data: cartItems } = await supabase
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

      return NextResponse.json({ items: cartItems || [] })
    }

    // Validate products exist and are published
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('id, status')
      .in('id', productIds)
      .eq('status', 'published')

    if (productsError) {
      console.error('Error validating products:', productsError)
      return NextResponse.json(
        { error: 'Failed to validate products' },
        { status: 500 }
      )
    }

    const validProductIds = products?.map((p) => p.id) || []

    if (validProductIds.length === 0) {
      // No valid products to add, return existing cart
      const { data: cartItems } = await supabase
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

      return NextResponse.json({ items: cartItems || [] })
    }

    // Get existing cart items to avoid duplicates
    const { data: existingCartItems } = await supabase
      .from('cart_items')
      .select('product_id')
      .eq('user_id', user.id)
      .in('product_id', validProductIds)

    const existingProductIds = new Set(
      existingCartItems?.map((item) => item.product_id) || []
    )

    // Filter out products already in cart
    const newProductIds = validProductIds.filter(
      (id) => !existingProductIds.has(id)
    )

    if (newProductIds.length === 0) {
      // All products already in cart, return existing cart
      const { data: cartItems } = await supabase
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

      return NextResponse.json({ items: cartItems || [] })
    }

    // Insert new cart items
    const itemsToInsert = newProductIds.map((productId) => ({
      user_id: user.id,
      product_id: productId,
    }))

    const { error: insertError } = await supabase
      .from('cart_items')
      .insert(itemsToInsert)

    if (insertError) {
      console.error('Error inserting cart items:', insertError)
      return NextResponse.json(
        { error: 'Failed to merge cart items' },
        { status: 500 }
      )
    }

    // Return merged cart
    const { data: cartItems, error: fetchError } = await supabase
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

    if (fetchError) {
      console.error('Error fetching merged cart:', fetchError)
      return NextResponse.json(
        { error: 'Failed to fetch merged cart' },
        { status: 500 }
      )
    }

    return NextResponse.json({ items: cartItems || [] })
  } catch (error) {
    console.error('Error in POST /api/cart/merge-guest:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
