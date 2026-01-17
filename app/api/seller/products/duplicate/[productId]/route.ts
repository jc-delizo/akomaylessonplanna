import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ productId: string }> }
) {
  try {
    const { productId } = await params
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

    // Get the original product
    const { data: originalProduct, error: fetchError } = await supabase
      .from('products')
      .select('*')
      .eq('id', productId)
      .eq('seller_id', user.id)
      .single()

    if (fetchError || !originalProduct) {
      return NextResponse.json(
        { error: 'Product not found or does not belong to you' },
        { status: 404 }
      )
    }

    // Create duplicate with "[Copy]" appended to title
    const duplicateData = {
      seller_id: user.id,
      title: `${originalProduct.title} [Copy]`,
      description: originalProduct.description,
      price: originalProduct.price,
      product_type: originalProduct.product_type,
      specific_type: originalProduct.specific_type,
      grade_id: originalProduct.grade_id,
      subject_id: originalProduct.subject_id,
      quarter: originalProduct.quarter,
      weeks: originalProduct.weeks,
      language: originalProduct.language,
      cover_image_url: originalProduct.cover_image_url,
      preview_images: originalProduct.preview_images,
      file_urls: originalProduct.file_urls,
      tags: originalProduct.tags,
      watermark_enabled: originalProduct.watermark_enabled,
      status: 'draft', // Always create as draft
      current_version: 1,
      views_count: 0,
      sales_count: 0,
      reviews_count: 0,
      avg_rating: null,
      conversion_rate: 0,
    }

    const { data: newProduct, error: insertError } = await supabase
      .from('products')
      .insert(duplicateData)
      .select()
      .single()

    if (insertError) {
      console.error('Error duplicating product:', insertError)
      return NextResponse.json(
        { error: 'Failed to duplicate product' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      product: newProduct,
      message: 'Product duplicated successfully',
    })
  } catch (error) {
    console.error('Error in POST /api/seller/products/duplicate:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
