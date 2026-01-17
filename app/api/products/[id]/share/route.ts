import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

/**
 * POST /api/products/[id]/share
 * Track when user shares a product
 * Body: { platform: 'facebook' | 'messenger' | 'copy_link' }
 * Auth optional (track if logged in)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: productId } = await params
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    const body = await request.json()
    const { platform } = body

    if (!platform || !['facebook', 'messenger', 'copy_link'].includes(platform)) {
      return NextResponse.json(
        { error: 'Invalid platform. Must be facebook, messenger, or copy_link' },
        { status: 400 }
      )
    }

    // Verify product exists
    const { data: product, error: productError } = await supabase
      .from('products')
      .select('id, title')
      .eq('id', productId)
      .single()

    if (productError || !product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      )
    }

    // Track share (fire and forget - don't block response)
    supabase
      .from('product_shares')
      .insert({
        product_id: productId,
        platform,
        shared_by: user?.id || null,
      })
      .then(({ error: shareError }) => {
        if (shareError) {
          console.error('Error tracking share:', shareError)
        }
      })
      .catch((err) => {
        console.error('Error tracking share:', err)
      })

    // Build share URL with referral link if user is logged in
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    let shareUrl = `${baseUrl}/products/${productId}`

    if (user) {
      // Get user's username for referral link
      const { data: userData } = await supabase
        .from('users')
        .select('username')
        .eq('id', user.id)
        .single()

      if (userData?.username) {
        shareUrl += `?ref=${userData.username}`
      }
    }

    return NextResponse.json({
      success: true,
      share_url: shareUrl,
    })
  } catch (error) {
    console.error('Error in POST /api/products/[id]/share:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
