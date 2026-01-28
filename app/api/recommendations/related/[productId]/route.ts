import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

/**
 * GET /api/recommendations/related/[productId]
 * Get related products for a product
 * 
 * Strategy: 70% same grade/subject, 30% same seller
 * Returns 8 products, excluding the current product
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ productId: string }> }
) {
  try {
    const { productId } = await params
    const supabase = await createClient()

    // Get the current product
    const { data: currentProduct, error: productError } = await supabase
      .from('products')
      .select('grade_id, subject_id, seller_id')
      .eq('id', productId)
      .eq('status', 'published')
      .single()

    if (productError || !currentProduct) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      )
    }

    const productSelect = `
        *,
        seller:users!products_seller_id_fkey(
          id,
          first_name,
          last_name,
          username,
          avatar_url,
          is_verified_teacher
        ),
        grade:grades!products_grade_id_fkey(
          id,
          name
        ),
        subject:subjects!products_subject_id_fkey(
          id,
          name,
          code
        ),
        strand:strands!products_strand_id_fkey(
          id,
          name,
          code
        ),
        sped_level:sped_levels!products_sped_level_id_fkey(
          id,
          name
        )
      `
    // Strategy: 70% same grade/subject, 30% same seller
    // Get 6 products with same grade/subject (70% = ~6 out of 8)
    let sameCategoryQuery = supabase
      .from('products')
      .select(productSelect)
      .eq('status', 'published')
      .eq('subject_id', currentProduct.subject_id)
      .neq('id', productId)
    if (currentProduct.grade_id) {
      sameCategoryQuery = sameCategoryQuery.eq('grade_id', currentProduct.grade_id)
    } else {
      sameCategoryQuery = sameCategoryQuery.is('grade_id', null)
    }
    const { data: sameCategoryProducts } = await sameCategoryQuery
      .order('sales_count', { ascending: false })
      .order('avg_rating', { ascending: false, nullsFirst: false })
      .limit(6)

    // Get 2 products from same seller (30% = ~2 out of 8)
    const { data: sameSellerProducts } = await supabase
      .from('products')
      .select(productSelect)
      .eq('status', 'published')
      .eq('seller_id', currentProduct.seller_id)
      .neq('id', productId)
      .order('sales_count', { ascending: false })
      .limit(2)

    // Combine and deduplicate
    const allProducts = [
      ...(sameCategoryProducts || []),
      ...(sameSellerProducts || [])
    ]

    // Remove duplicates (in case same seller product also matches grade/subject)
    const uniqueProducts = Array.from(
      new Map(allProducts.map(p => [p.id, p])).values()
    ).slice(0, 8)

    return NextResponse.json({
      products: uniqueProducts
    }, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
      },
    })
  } catch (error) {
    console.error('Error in GET /api/recommendations/related/[productId]:', error)
    return NextResponse.json(
      { error: 'Internal server error', products: [] },
      { status: 500 }
    )
  }
}
