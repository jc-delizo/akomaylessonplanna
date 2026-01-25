import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

interface RouteParams {
  params: Promise<{ productId: string }>
}

export async function GET(request: Request, { params }: RouteParams) {
  try {
    const { productId } = await params
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify user owns this product
    const { data: libraryItem, error: libraryError } = await supabase
      .from('user_library')
      .select('id, user_id, product_id, order_item_id, download_count')
      .eq('user_id', user.id)
      .eq('product_id', productId)
      .single()

    if (libraryError || !libraryItem) {
      return NextResponse.json(
        { error: 'Product not found in your library' },
        { status: 404 }
      )
    }

    // Get product file URLs
    const { data: product, error: productError } = await supabase
      .from('products')
      .select('file_urls, title, watermark_enabled')
      .eq('id', productId)
      .single()

    if (productError || !product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    if (!product.file_urls || product.file_urls.length === 0) {
      return NextResponse.json({ error: 'Product files not available' }, { status: 404 })
    }

    // Get user data for watermarking and email notifications
    const { data: userData } = await supabase
      .from('users')
      .select('email, first_name, last_name')
      .eq('id', user.id)
      .single()

    const userEmail = userData?.email || ''

    // TODO: Implement watermarking
    // For now, we'll return the first file URL
    // In production, you would:
    // 1. Check if watermarked file exists in cache (24-hour cache)
    // 2. If not, generate watermarked file using pdf-lib, docx, or PptxGenJS
    // 3. Cache the watermarked file
    // 4. Return the file

    // For MVP, we'll return a signed URL to the original file
    // In production, this should be the watermarked file
    const filePath = product.file_urls[0]
    
    // Extract file path from URL (assuming Supabase Storage URL format)
    // Format: https://[project].supabase.co/storage/v1/object/public/product-files/[path]
    // Or: https://[project].supabase.co/storage/v1/object/sign/product-files/[path]
    let storagePath = filePath
    
    // Try to extract path from URL
    const urlMatch = filePath.match(/product-files\/(.+)/)
    if (urlMatch) {
      storagePath = urlMatch[1]
    } else if (!filePath.startsWith('/')) {
      // If it's already a path, use it directly
      storagePath = filePath
    }

    // Get signed URL (valid for 1 hour)
    // Note: For private buckets, use createSignedUrl
    // For public buckets, you can use getPublicUrl
    const { data: signedUrlData, error: urlError } = await supabase.storage
      .from('product-files')
      .createSignedUrl(storagePath, 3600)

    if (urlError || !signedUrlData) {
      console.error('Error creating signed URL:', urlError)
      // Fallback: try to use the URL directly if it's already a full URL
      if (filePath.startsWith('http')) {
        // Update download count before redirecting
        await supabase
          .from('user_library')
          .update({
            download_count: (libraryItem.download_count || 0) + 1,
            last_downloaded_at: new Date().toISOString(),
          })
          .eq('id', libraryItem.id)

        return NextResponse.redirect(filePath)
      }
      return NextResponse.json({ error: 'Failed to generate download link' }, { status: 500 })
    }

    // Update download count
    await supabase
      .from('user_library')
      .update({
        download_count: (libraryItem.download_count || 0) + 1,
        last_downloaded_at: new Date().toISOString(),
      })
      .eq('id', libraryItem.id)

    // Also update order_item download count
    if (libraryItem.order_item_id) {
      const { data: orderItem } = await supabase
        .from('order_items')
        .select('id, download_count, product_id')
        .eq('id', libraryItem.order_item_id)
        .single()

      if (orderItem) {
        const newDownloadCount = (orderItem.download_count || 0) + 1
        await supabase
          .from('order_items')
          .update({
            download_count: newDownloadCount,
            last_downloaded_at: new Date().toISOString(),
          })
          .eq('id', orderItem.id)

        // Schedule review reminder email if this is the first download
        // (24 hours after download)
        if (newDownloadCount === 1) {
          const { sendReviewReminderEmail } = await import('@/lib/emails/review-notifications')
          
          // Get product and seller info
          const { data: productData } = await supabase
            .from('products')
            .select(`
              id,
              title,
              cover_image_url,
              seller:users!products_seller_id_fkey(
                id,
                first_name,
                last_name
              )
            `)
            .eq('id', orderItem.product_id)
            .single()

          if (productData && userData?.email) {
            // Schedule email for 24 hours from now
            // In production, this would be added to email_queue with send_after timestamp
            const seller = Array.isArray(productData.seller) ? productData.seller[0] : productData.seller
            await sendReviewReminderEmail({
              buyerName: userData ? `${userData.first_name} ${userData.last_name || ''}`.trim() || 'Teacher' : 'Teacher',
              buyerEmail: userData.email,
              productTitle: productData.title,
              productCoverImage: productData.cover_image_url || undefined,
              sellerName: seller ? `${seller.first_name} ${seller.last_name || ''}`.trim() || 'Seller' : 'Seller',
              reviewLink: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/library/${orderItem.product_id}/review`,
            })
          }
        }
      }
    }

    // Redirect to signed URL
    return NextResponse.redirect(signedUrlData.signedUrl)
  } catch (error) {
    console.error('Error in GET /api/library/[productId]/download:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
