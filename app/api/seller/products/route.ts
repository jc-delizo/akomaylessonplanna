import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { getRelation } from '@/lib/utils/supabase-relations'

export async function GET(request: Request) {
  try {
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

    // Parse query parameters
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const sortBy = searchParams.get('sort_by') || 'created_at'
    const sortOrder = searchParams.get('sort_order') || 'desc'

    // Get seller's products with stats
    let query = supabase
      .from('products')
      .select(
        `
        id,
        title,
        price,
        status,
        views_count,
        sales_count,
        avg_rating,
        reviews_count,
        conversion_rate,
        created_at,
        grade:grades!products_grade_id_fkey(name),
        subject:subjects!products_subject_id_fkey(name)
      `
      )
      .eq('seller_id', user.id)

    // Filter by status
    if (status && status !== 'all') {
      query = query.eq('status', status)
    }

    // Sort
    query = query.order(sortBy, { ascending: sortOrder === 'asc' })

    const { data: products, error } = await query

    if (error) {
      console.error('Error fetching seller products:', error)
      return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 })
    }

    // Per-product revenue from order_items (completed orders only)
    const productIds = (products || []).map((p) => p.id)
    const revenueByProduct: Record<string, number> = {}
    if (productIds.length > 0) {
      const { data: orderItems } = await supabase
        .from('order_items')
        .select('product_id, net_earnings, order:orders!order_items_order_id_fkey(payment_status)')
        .eq('seller_id', user.id)
        .in('product_id', productIds)

      orderItems?.forEach((item) => {
        const order = getRelation(item.order)
        if (order?.payment_status === 'completed') {
          const pid = item.product_id
          revenueByProduct[pid] = (revenueByProduct[pid] || 0) + parseFloat(item.net_earnings.toString())
        }
      })
    }

    const productsWithRevenue = (products || []).map((p) => {
      const views = p.views_count ?? 0
      const sales = p.sales_count ?? 0
      const conversionRate =
        views > 0 ? Math.round((sales / views) * 100 * 100) / 100 : 0
      return {
        ...p,
        revenue: revenueByProduct[p.id] ?? 0,
        conversion_rate: conversionRate,
      }
    })

    return NextResponse.json({ products: productsWithRevenue })
  } catch (error) {
    console.error('Error in GET /api/seller/products:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
