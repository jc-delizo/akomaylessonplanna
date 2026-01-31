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

    // Get library items with product details
    const { data: libraryItems, error } = await supabase
      .from('user_library')
      .select(
        `
        id,
        product_id,
        order_item_id,
        purchased_at,
        download_count,
        last_downloaded_at,
        product:products!user_library_product_id_fkey(
          id,
          title,
          cover_image_url,
          seller:users!products_seller_id_fkey(
            id,
            first_name,
            last_name,
            username
          )
        )
      `
      )
      .eq('user_id', user.id)
      .order('purchased_at', { ascending: false })

    if (error) {
      console.error('Error fetching library:', error)
      return NextResponse.json({ error: 'Failed to fetch library' }, { status: 500 })
    }

    // TODO: Get ratings for products (from reviews table - Feature 05)
    // For now, we'll add rating as null

    const itemsWithRating = (libraryItems || []).map((item) => ({
      ...item,
      rating: null, // Will be populated when Feature 05 is implemented
    }))

    return NextResponse.json({ items: itemsWithRating })
  } catch (error) {
    console.error('Error in GET /api/library:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
