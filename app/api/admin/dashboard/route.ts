import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/middleware/admin-auth'

/**
 * GET /api/admin/dashboard
 * Get dashboard metrics for admin panel
 * 
 * Query parameters:
 * - timeRange?: 'today' | 'yesterday' | 'this_week' | 'last_7_days' | 'this_month' | 'last_30_days' | 'this_year' | 'all_time' | 'custom'
 * - startDate?: ISO date string (for custom range)
 * - endDate?: ISO date string (for custom range)
 */
export async function GET(request: NextRequest) {
  try {
    // #region agent log
    fetch('http://127.0.0.1:7248/ingest/00d5f2ca-d0b7-44d8-a520-af7d4c8e25e2',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'dashboard/route.ts:14',message:'GET request started',data:{timestamp:Date.now()},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
    // #endregion
    const authResult = await requireAdmin(request)
    // #region agent log
    fetch('http://127.0.0.1:7248/ingest/00d5f2ca-d0b7-44d8-a520-af7d4c8e25e2',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'dashboard/route.ts:17',message:'Admin auth check',data:{success:authResult.success},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
    // #endregion
    if (!authResult.success) {
      return authResult.response
    }

    const supabase = await createClient()
    const searchParams = request.nextUrl.searchParams
    const timeRange = searchParams.get('timeRange') || 'last_30_days'
    // #region agent log
    fetch('http://127.0.0.1:7248/ingest/00d5f2ca-d0b7-44d8-a520-af7d4c8e25e2',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'dashboard/route.ts:24',message:'TimeRange parsed',data:{timeRange},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
    // #endregion

    // Calculate date range
    const now = new Date()
    let startDate: Date

    switch (timeRange) {
      case 'today':
        startDate = new Date(now)
        startDate.setHours(0, 0, 0, 0)
        break
      case 'yesterday':
        startDate = new Date(now)
        startDate.setDate(startDate.getDate() - 1)
        startDate.setHours(0, 0, 0, 0)
        break
      case 'this_week':
        startDate = new Date(now)
        startDate.setDate(startDate.getDate() - now.getDay())
        startDate.setHours(0, 0, 0, 0)
        break
      case 'last_7_days':
        startDate = new Date(now)
        startDate.setDate(startDate.getDate() - 7)
        break
      case 'this_month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1)
        break
      case 'last_30_days':
        startDate = new Date(now)
        startDate.setDate(startDate.getDate() - 30)
        break
      case 'this_year':
        startDate = new Date(now.getFullYear(), 0, 1)
        break
      case 'custom':
        const startParam = searchParams.get('startDate')
        const endParam = searchParams.get('endDate')
        if (startParam) {
          startDate = new Date(startParam)
        } else {
          startDate = new Date(0) // All time
        }
        break
      default:
        startDate = new Date(now)
        startDate.setDate(startDate.getDate() - 30)
    }

    // Helper to safely get count, return 0 if table doesn't exist
    const safeCount = async (
      table: string,
      filters: { eq?: Record<string, any>; in?: Record<string, any[]>; gte?: { field: string; value: string } }
    ): Promise<number> => {
      try {
        let query = supabase.from(table).select('*', { count: 'exact', head: true })
        if (filters?.eq) {
          Object.entries(filters.eq).forEach(([key, value]) => {
            query = query.eq(key, value)
          })
        }
        if (filters?.in) {
          Object.entries(filters.in).forEach(([key, values]) => {
            query = query.in(key, values)
          })
        }
        if (filters?.gte) {
          query = query.gte(filters.gte.field, filters.gte.value)
        }
        const { count, error } = await query
        if (error) {
          // Table might not exist or other error - return 0
          if (error.code === 'PGRST205' || error.message?.includes('schema cache') || error.message?.includes('Could not find')) {
            return 0
          }
          // Log other errors but still return 0 to prevent breaking the dashboard
          console.warn(`Error querying ${table}:`, error.message)
          return 0
        }
        return count || 0
      } catch (error) {
        // If table doesn't exist or any other error, return 0
        console.warn(`Exception querying ${table}:`, error instanceof Error ? error.message : 'Unknown error')
        return 0
      }
    }

    // Helper to safely get data, return empty array if table doesn't exist
    const safeSelect = async <T>(
      table: string,
      columns: string,
      filters?: { eq?: Record<string, any>; gte?: { field: string; value: string } }
    ): Promise<T[]> => {
      try {
        let query = supabase.from(table).select(columns)
        if (filters?.eq) {
          Object.entries(filters.eq).forEach(([key, value]) => {
            query = query.eq(key, value)
          })
        }
        if (filters?.gte) {
          query = query.gte(filters.gte.field, filters.gte.value)
        }
        const { data, error } = await query
        if (error) {
          // Table might not exist or other error - return empty array
          if (error.code === 'PGRST205' || error.message?.includes('schema cache') || error.message?.includes('Could not find')) {
            return []
          }
          // Log other errors but still return empty array
          console.warn(`Error querying ${table}:`, error.message)
          return []
        }
        return (data as T[]) || []
      } catch (error) {
        // If table doesn't exist or any other error, return empty array
        console.warn(`Exception querying ${table}:`, error instanceof Error ? error.message : 'Unknown error')
        return []
      }
    }

    // #region agent log
    fetch('http://127.0.0.1:7248/ingest/00d5f2ca-d0b7-44d8-a520-af7d4c8e25e2',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'dashboard/route.ts:133',message:'Starting metrics queries',data:{startDate:startDate.toISOString()},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
    // #endregion
    // Row 1: Revenue & Growth Metrics
    // Total Revenue (commission collected)
    const revenueData = await safeSelect<{ total_commission: number }>('orders', 'total_commission', {
      eq: { payment_status: 'completed' },
      gte: { field: 'created_at', value: startDate.toISOString() },
    })
    // #region agent log
    fetch('http://127.0.0.1:7248/ingest/00d5f2ca-d0b7-44d8-a520-af7d4c8e25e2',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'dashboard/route.ts:139',message:'Revenue data fetched',data:{revenueDataCount:revenueData.length},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
    // #endregion
    const totalRevenue = (revenueData || []).reduce((sum, order) => sum + Number(order?.total_commission || 0), 0)

    // Total Orders
    const totalOrders = await safeCount('orders', {
      eq: { payment_status: 'completed' },
      gte: { field: 'created_at', value: startDate.toISOString() },
    })

    // New Signups
    const newSignups = await safeCount('users', {
      gte: { field: 'created_at', value: startDate.toISOString() },
    })

    // Products Listed
    const productsListed = await safeCount('products', {
      eq: { status: 'published' },
      gte: { field: 'created_at', value: startDate.toISOString() },
    })

    // Row 2: Platform Health Metrics
    // Active Sellers (sellers with at least 1 sale in time range)
    const activeSellersData = await safeSelect<{ seller_id: string }>('order_items', 'seller_id', {
      gte: { field: 'created_at', value: startDate.toISOString() },
    })
    const activeSellerIds = new Set(activeSellersData.map((item) => item.seller_id))
    const activeSellers = activeSellerIds.size

    // Approval Rate (approved / (approved + rejected))
    const approvedProducts = await safeCount('products', {
      eq: { status: 'published' },
      gte: { field: 'created_at', value: startDate.toISOString() },
    })

    const rejectedProducts = await safeCount('products', {
      eq: { status: 'rejected' },
      gte: { field: 'created_at', value: startDate.toISOString() },
    })

    const totalReviewed = approvedProducts + rejectedProducts
    const approvalRate = totalReviewed > 0 ? (approvedProducts / totalReviewed) * 100 : 0

    // Platform Rating (average of all product ratings)
    const reviewsData = await safeSelect<{ rating: number }>('reviews', 'rating', {
      gte: { field: 'created_at', value: startDate.toISOString() },
    })

    const platformRating =
      reviewsData.length > 0
        ? reviewsData.reduce((sum, review) => sum + review.rating, 0) / reviewsData.length
        : 0

    // Support Tickets (open + in_progress)
    const supportTickets = await safeCount('support_tickets', {
      in: { status: ['open', 'in_progress'] },
    })

    return NextResponse.json({
      metrics: {
        // Row 1: Revenue & Growth
        totalRevenue,
        totalOrders,
        newSignups,
        productsListed,
        // Row 2: Platform Health
        activeSellers,
        approvalRate: Math.round(approvalRate * 10) / 10,
        platformRating: Math.round(platformRating * 10) / 10,
        supportTickets,
      },
      timeRange,
      startDate: startDate.toISOString(),
    })
  } catch (error) {
    // #region agent log
    fetch('http://127.0.0.1:7248/ingest/00d5f2ca-d0b7-44d8-a520-af7d4c8e25e2',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'dashboard/route.ts:211',message:'Error caught',data:{errorMessage:error instanceof Error?error.message:'unknown',errorStack:error instanceof Error?error.stack:null},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
    // #endregion
    console.error('Error in GET /api/admin/dashboard:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
