import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

/**
 * POST /api/cart/guest-products
 * 
 * Fetches product details for guest cart items.
 * No authentication required - used to display guest cart.
 * 
 * Body: { productIds: string[] }
 */
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { productIds } = body

    if (!Array.isArray(productIds)) {
      return NextResponse.json(
        { error: 'productIds must be an array' },
        { status: 400 }
      )
    }

    if (productIds.length === 0) {
      return NextResponse.json({ products: [] })
    }

    const supabase = await createClient()

    // Fetch product details (only published products)
    const { data: products, error } = await supabase
      .from('products')
      .select(
        `
        id,
        title,
        price,
        cover_image_url,
        seller:users!products_seller_id_fkey(
          id,
          name,
          username
        )
      `
      )
      .in('id', productIds)
      .eq('status', 'published')

    if (error) {
      console.error('Error fetching guest cart products:', error)
      return NextResponse.json(
        { error: 'Failed to fetch products' },
        { status: 500 }
      )
    }

    // Return products in the same order as requested (if possible)
    // Filter out any products that don't exist or aren't published
    const productMap = new Map(
      products?.map((p) => [p.id, p]) || []
    )

    const orderedProducts = productIds
      .map((id) => productMap.get(id))
      .filter((p) => p !== undefined)

    return NextResponse.json({ products: orderedProducts })
  } catch (error) {
    console.error('Error in POST /api/cart/guest-products:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
