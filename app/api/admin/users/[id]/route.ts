import { createAdminClient } from '@/lib/supabase/admin'
import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/middleware/admin-auth'

/**
 * GET /api/admin/users/[id]
 * Get user detail for admin modal
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await requireAdmin(request)
    if (!authResult.success) {
      return authResult.response
    }

    const { id: userId } = await params
    const supabase = createAdminClient()

    // Get user data
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single()

    if (userError || !user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Get additional stats
    const [products, orders, sales, reviews, activityLog, adminNotes] = await Promise.all([
      // Products
      supabase
        .from('products')
        .select('id, title, status, created_at, price')
        .eq('seller_id', userId)
        .order('created_at', { ascending: false }),

      // Orders (as buyer)
      supabase
        .from('orders')
        .select('id, total_amount, payment_status, created_at')
        .eq('buyer_id', userId)
        .order('created_at', { ascending: false })
        .limit(10),

      // Sales (as seller)
      supabase
        .from('order_items')
        .select(`
          id,
          order_id,
          product_id,
          price:price_at_purchase,
          commission:commission_amount,
          net_earnings,
          created_at,
          order:orders!order_items_order_id_fkey(id, buyer_id, payment_status)
        `)
        .eq('seller_id', userId)
        .order('created_at', { ascending: false })
        .limit(10),

      // Reviews (given and received)
      supabase
        .from('reviews')
        .select('id, rating, comment, created_at, product_id')
        .eq('buyer_id', userId)
        .order('created_at', { ascending: false })
        .limit(10),

      // Activity log
      supabase
        .from('audit_log')
        .select('*')
        .eq('entity_id', userId)
        .eq('entity_type', 'user')
        .order('created_at', { ascending: false })
        .limit(20),

      // Admin notes
      supabase
        .from('admin_notes')
        .select(`
          *,
          admin:users!admin_notes_admin_id_fkey(id, first_name, last_name, email)
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false }),
    ])

    return NextResponse.json({
      user,
      stats: {
        products: products.data || [],
        orders: orders.data || [],
        sales: sales.data || [],
        reviews: reviews.data || [],
        activityLog: activityLog.data || [],
        adminNotes: adminNotes.data || [],
      },
    })
  } catch (error) {
    console.error('Error in GET /api/admin/users/[id]:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
