import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

/**
 * POST /api/products/[id]/view
 * Track product view (called when user visits product page)
 * Auth required (logged-in users only)
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

    if (!user) {
      // Not an error - just don't track for anonymous users
      return NextResponse.json({ message: 'View not tracked (not logged in)' })
    }

    // Verify product exists and is published
    const { data: product, error: productError } = await supabase
      .from('products')
      .select('id, status')
      .eq('id', productId)
      .single()

    if (productError || !product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      )
    }

    // Only track views for published products
    if (product.status !== 'published') {
      return NextResponse.json({ message: 'View not tracked (product not published)' })
    }

    // Check if product already in recently_viewed for this user
    const { data: existingView, error: existingViewError } = await supabase
      .from('recently_viewed')
      .select('id')
      .eq('user_id', user.id)
      .eq('product_id', productId)
      .single()

    // #region agent log
    await fetch('http://127.0.0.1:7248/ingest/00d5f2ca-d0b7-44d8-a520-af7d4c8e25e2',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'route.ts:45',message:'Checking existing view',data:{productId,userId:user.id,existingView:existingView?.id,existingViewError:existingViewError?.message},timestamp:Date.now(),sessionId:'debug-session',runId:'post-fix',hypothesisId:'D'})}).catch(()=>{});
    // #endregion

    // Handle missing table gracefully (PGRST205 = table not found)
    if (existingViewError?.code === 'PGRST205') {
      console.warn('recently_viewed table does not exist. Please run migration 009_feature_06_social_features.sql')
      return NextResponse.json({ message: 'View tracking unavailable (table not found)' })
    }

    if (existingView && !existingViewError) {
      // Update viewed_at timestamp (move to top)
      const { error: updateError } = await supabase
        .from('recently_viewed')
        .update({ viewed_at: new Date().toISOString() })
        .eq('id', existingView.id)

      if (updateError) {
        console.error('Error updating recently viewed:', updateError)
        return NextResponse.json(
          { error: 'Failed to update recently viewed' },
          { status: 500 }
        )
      }

      return NextResponse.json({ message: 'Recently viewed updated' })
    } else {
      // Insert new row
      const { error: insertError } = await supabase
        .from('recently_viewed')
        .insert({
          user_id: user.id,
          product_id: productId,
          viewed_at: new Date().toISOString(),
        })

      if (insertError) {
        // Handle missing table gracefully (PGRST205 = table not found)
        if (insertError.code === 'PGRST205') {
          console.warn('recently_viewed table does not exist. Please run migration 009_feature_06_social_features.sql')
          return NextResponse.json({ message: 'View tracking unavailable (table not found)' })
        }
        // Handle unique constraint violation (race condition)
        if (insertError.code === '23505') {
          // Try update instead
          const { error: updateError } = await supabase
            .from('recently_viewed')
            .update({ viewed_at: new Date().toISOString() })
            .eq('user_id', user.id)
            .eq('product_id', productId)

          if (updateError) {
            console.error('Error updating recently viewed:', updateError)
            return NextResponse.json(
              { error: 'Failed to track view' },
              { status: 500 }
            )
          }

          return NextResponse.json({ message: 'Recently viewed updated' })
        }

        console.error('Error inserting recently viewed:', insertError)
        return NextResponse.json(
          { error: 'Failed to track view' },
          { status: 500 }
        )
      }

      return NextResponse.json({ message: 'View tracked successfully' })
    }
  } catch (error) {
    console.error('Error in POST /api/products/[id]/view:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
