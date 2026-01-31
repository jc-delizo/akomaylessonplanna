import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

const TRAFFIC_SOURCE_VALUES = ['search', 'marketplace', 'direct', 'profile', 'category', 'other'] as const

function normalizeSource(raw: string | null): string {
  if (!raw || typeof raw !== 'string') return 'direct'
  const lower = raw.trim().toLowerCase()
  if (TRAFFIC_SOURCE_VALUES.includes(lower as (typeof TRAFFIC_SOURCE_VALUES)[number])) return lower
  return 'other'
}

/**
 * POST /api/products/[id]/view
 * Track product view (called when user visits product page)
 * Auth required (logged-in users only)
 * Body: { source?: string } for traffic analytics (search, marketplace, direct, profile, category, other)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: productId } = await params
    const supabase = await createClient()
    let source = 'direct'
    try {
      const body = await request.json().catch(() => ({}))
      source = normalizeSource(body?.source ?? null)
    } catch {
      // ignore body parse errors
    }
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
      .select('id, status, views_count')
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

    // Handle missing table gracefully (PGRST205 = table not found)
    if (existingViewError?.code === 'PGRST205') {
      console.warn('recently_viewed table does not exist. Please run migration 009_feature_06_social_features.sql')
      return NextResponse.json({ message: 'View tracking unavailable (table not found)' })
    }

    // Record in product_views for seller traffic analytics
    const { error: viewInsertError } = await supabase
      .from('product_views')
      .insert({
        product_id: productId,
        user_id: user.id,
        source,
      })
    if (viewInsertError) {
      console.error('Error inserting product_views:', viewInsertError)
    }
    // Increment views_count on product
    await supabase
      .from('products')
      .update({ views_count: (product.views_count || 0) + 1 })
      .eq('id', productId)

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
