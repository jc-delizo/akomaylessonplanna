import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
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

    // Entitlement is verified above; use the service client for product files
    // so a later moderation status change does not revoke an existing purchase.
    const adminClient = createAdminClient()
    const { data: product, error: productError } = await adminClient
      .from('products')
      .select(`
        file_urls,
        title,
        watermark_enabled,
        cover_image_url,
        seller:users!products_seller_id_fkey(first_name, last_name)
      `)
      .eq('id', productId)
      .single()

    if (productError || !product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    if (!product.file_urls || product.file_urls.length === 0) {
      return NextResponse.json({ error: 'Product files not available' }, { status: 404 })
    }

    // Get user data for watermarking and email notifications
    const { data: userData } = await adminClient
      .from('users')
      .select('email, first_name, last_name')
      .eq('id', user.id)
      .single()

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
    let storagePath = filePath.replace(/^\/+/, '')
    try {
      const parsedFileUrl = new URL(filePath)
      const bucketMarker = '/product-files/'
      const markerIndex = parsedFileUrl.pathname.indexOf(bucketMarker)
      if (markerIndex === -1) {
        return NextResponse.json({ error: 'Product file is not configured correctly' }, { status: 500 })
      }
      storagePath = decodeURIComponent(
        parsedFileUrl.pathname.slice(markerIndex + bucketMarker.length)
      )
    } catch {
      // Stored values may already be bucket-relative paths.
    }

    // Get signed URL (valid for 1 hour)
    // Note: For private buckets, use createSignedUrl
    // For public buckets, you can use getPublicUrl
    const { data: signedUrlData, error: urlError } = await adminClient.storage
      .from('product-files')
      .createSignedUrl(storagePath, 3600)

    if (urlError || !signedUrlData) {
      console.error('Error creating signed URL:', urlError)
      return NextResponse.json({ error: 'Failed to generate download link' }, { status: 500 })
    }

    const { data: downloadRecords, error: downloadError } = await adminClient.rpc(
      'record_library_download',
      { p_user_id: user.id, p_product_id: productId }
    )
    const downloadRecord = Array.isArray(downloadRecords) ? downloadRecords[0] : null

    if (downloadError || !downloadRecord) {
      console.error('Error recording library download:', downloadError)
      return NextResponse.json({ error: 'Failed to record download' }, { status: 500 })
    }

    // Send the one-time review reminder without blocking a purchased download
    // if the email provider is temporarily unavailable.
    if (downloadRecord.new_download_count === 1 && userData?.email) {
      try {
        const { sendReviewReminderEmail } = await import('@/lib/emails/review-notifications')
        const seller = Array.isArray(product.seller) ? product.seller[0] : product.seller
        await sendReviewReminderEmail({
          buyerName: `${userData.first_name} ${userData.last_name || ''}`.trim() || 'Teacher',
          buyerEmail: userData.email,
          productTitle: product.title,
          productCoverImage: product.cover_image_url || undefined,
          sellerName: seller
            ? `${seller.first_name} ${seller.last_name || ''}`.trim() || 'Seller'
            : 'Seller',
          reviewLink: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/library/${productId}/review`,
        })
      } catch (emailError) {
        console.error('Error scheduling review reminder:', emailError)
      }
    }

    // Redirect to signed URL
    return NextResponse.redirect(signedUrlData.signedUrl)
  } catch (error) {
    console.error('Error in GET /api/library/[productId]/download:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
