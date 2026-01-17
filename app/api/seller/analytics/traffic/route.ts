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

    // Verify user is Pro/Pioneer seller
    const { data: userData } = await supabase
      .from('users')
      .select('role, can_sell, subscription_tier')
      .eq('id', user.id)
      .single()

    if (!userData || userData.role !== 'seller' || !userData.can_sell) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const isProOrPioneer =
      userData.subscription_tier === 'pro' || userData.subscription_tier === 'pioneer'

    if (!isProOrPioneer) {
      return NextResponse.json({ error: 'Pro/Pioneer subscription required' }, { status: 403 })
    }

    // Simplified traffic sources (in production, this would come from product_views table with source tracking)
    // For now, return mock data structure
    const trafficSources = [
      { source: 'Search', percentage: 45, count: 450 },
      { source: 'Homepage', percentage: 25, count: 250 },
      { source: 'Direct Link', percentage: 20, count: 200 },
      { source: 'Profile', percentage: 10, count: 100 },
    ]

    return NextResponse.json({ trafficSources })
  } catch (error) {
    console.error('Error in GET /api/seller/analytics/traffic:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
