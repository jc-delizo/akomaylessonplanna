import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

const SOURCE_LABELS: Record<string, string> = {
  search: 'Search',
  marketplace: 'Marketplace',
  direct: 'Direct',
  profile: 'Profile',
  category: 'Category',
  other: 'Other',
}

export async function GET() {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

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

    // Seller's product IDs (RLS allows sellers to read product_views for their products)
    const { data: sellerProducts } = await supabase
      .from('products')
      .select('id')
      .eq('seller_id', user.id)

    const productIds = (sellerProducts || []).map((p) => p.id)
    if (productIds.length === 0) {
      return NextResponse.json({ trafficSources: [] })
    }

    // Fetch product_views for seller's products (source may be null for older rows)
    const { data: views } = await supabase
      .from('product_views')
      .select('source')
      .in('product_id', productIds)

    const bySource: Record<string, number> = {}
    let total = 0
    for (const row of views || []) {
      const source = row.source && row.source.trim() ? row.source : 'direct'
      bySource[source] = (bySource[source] || 0) + 1
      total += 1
    }

    const trafficSources = Object.entries(bySource)
      .map(([source, count]) => ({
        source: SOURCE_LABELS[source] || source,
        count,
        percentage: total > 0 ? (count / total) * 100 : 0,
      }))
      .sort((a, b) => b.count - a.count)

    return NextResponse.json({ trafficSources })
  } catch (error) {
    console.error('Error in GET /api/seller/analytics/traffic:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
