import type { SupabaseClient } from '@supabase/supabase-js'

export interface DashboardMetricsResult {
  metrics: {
    totalRevenue: number
    totalOrders: number
    newSignups: number
    productsListed: number
    activeSellers: number
    approvalRate: number
    platformRating: number
    supportTickets: number
  }
  timeRange: string
  startDate: string
}

type CountFilters = {
  eq?: Record<string, unknown>
  in?: Record<string, unknown[]>
  gte?: { field: string; value: string }
}

type SelectFilters = {
  eq?: Record<string, unknown>
  gte?: { field: string; value: string }
}

/**
 * Get admin dashboard metrics. Safe to call from server components or API routes.
 * Returns same shape as GET /api/admin/dashboard.
 */
export async function getDashboardMetricsData(
  supabase: SupabaseClient,
  timeRange: string = 'last_30_days',
  options?: { startDate?: string; endDate?: string }
): Promise<DashboardMetricsResult> {
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
      if (options?.startDate) {
        startDate = new Date(options.startDate)
      } else {
        startDate = new Date(0)
      }
      break
    default:
      startDate = new Date(now)
      startDate.setDate(startDate.getDate() - 30)
  }

  const safeCount = async (
    table: string,
    filters: CountFilters
  ): Promise<number> => {
    try {
      let query = supabase.from(table).select('*', { count: 'exact', head: true })
      if (filters?.eq) {
        for (const [key, value] of Object.entries(filters.eq)) {
          query = query.eq(key, value)
        }
      }
      if (filters?.in) {
        for (const [key, values] of Object.entries(filters.in)) {
          query = query.in(key, values)
        }
      }
      if (filters?.gte) {
        query = query.gte(filters.gte.field, filters.gte.value)
      }
      const { count, error } = await query
      if (error) {
        if (
          error.code === 'PGRST205' ||
          error.message?.includes('schema cache') ||
          error.message?.includes('Could not find')
        ) {
          return 0
        }
        console.warn(`Error querying ${table}:`, error.message)
        return 0
      }
      return count ?? 0
    } catch (err) {
      console.warn(`Exception querying ${table}:`, err instanceof Error ? err.message : 'Unknown error')
      return 0
    }
  }

  const safeSelect = async <T>(
    table: string,
    columns: string,
    filters?: SelectFilters
  ): Promise<T[]> => {
    try {
      let query = supabase.from(table).select(columns)
      if (filters?.eq) {
        for (const [key, value] of Object.entries(filters.eq)) {
          query = query.eq(key, value)
        }
      }
      if (filters?.gte) {
        query = query.gte(filters.gte.field, filters.gte.value)
      }
      const { data, error } = await query
      if (error) {
        if (
          error.code === 'PGRST205' ||
          error.message?.includes('schema cache') ||
          error.message?.includes('Could not find')
        ) {
          return []
        }
        console.warn(`Error querying ${table}:`, error.message)
        return []
      }
      return (data as T[]) ?? []
    } catch (err) {
      console.warn(`Exception querying ${table}:`, err instanceof Error ? err.message : 'Unknown error')
      return []
    }
  }

  const startIso = startDate.toISOString()

  const revenueData = await safeSelect<{ total_commission: number }>(
    'orders',
    'total_commission',
    {
      eq: { payment_status: 'completed' },
      gte: { field: 'created_at', value: startIso },
    }
  )
  const totalRevenue = (revenueData || []).reduce(
    (sum, order) => sum + Number(order?.total_commission || 0),
    0
  )

  const totalOrders = await safeCount('orders', {
    eq: { payment_status: 'completed' },
    gte: { field: 'created_at', value: startIso },
  })

  const newSignups = await safeCount('users', {
    gte: { field: 'created_at', value: startIso },
  })

  const productsListed = await safeCount('products', {
    eq: { status: 'published' },
    gte: { field: 'created_at', value: startIso },
  })

  const activeSellersData = await safeSelect<{ seller_id: string }>(
    'order_items',
    'seller_id',
    { gte: { field: 'created_at', value: startIso } }
  )
  const activeSellerIds = new Set(activeSellersData.map((item) => item.seller_id))
  const activeSellers = activeSellerIds.size

  const approvedProducts = await safeCount('products', {
    eq: { status: 'published' },
    gte: { field: 'created_at', value: startIso },
  })

  const rejectedProducts = await safeCount('products', {
    eq: { status: 'rejected' },
    gte: { field: 'created_at', value: startIso },
  })

  const totalReviewed = approvedProducts + rejectedProducts
  const approvalRate = totalReviewed > 0 ? (approvedProducts / totalReviewed) * 100 : 0

  const reviewsData = await safeSelect<{ rating: number }>(
    'reviews',
    'rating',
    { gte: { field: 'created_at', value: startIso } }
  )
  const platformRating =
    reviewsData.length > 0
      ? reviewsData.reduce((sum, review) => sum + review.rating, 0) / reviewsData.length
      : 0

  const supportTickets = await safeCount('support_tickets', {
    in: { status: ['open', 'in_progress'] },
  })

  return {
    metrics: {
      totalRevenue,
      totalOrders,
      newSignups,
      productsListed,
      activeSellers,
      approvalRate: Math.round(approvalRate * 10) / 10,
      platformRating: Math.round(platformRating * 10) / 10,
      supportTickets,
    },
    timeRange,
    startDate: startDate.toISOString(),
  }
}
