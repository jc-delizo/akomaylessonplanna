import type { SupabaseClient } from '@supabase/supabase-js'

export interface ReportsParams {
  status?: string
  severity?: string
  type?: string
  page?: number
  limit?: number
}

/**
 * Get reports list with reported item details. Safe to call from server components or API routes.
 */
export async function getReportsData(
  supabase: SupabaseClient,
  params: ReportsParams = {}
) {
  const status = params.status || 'pending'
  const page = params.page ?? 1
  const limit = params.limit ?? 50
  const offset = (page - 1) * limit

  let query = supabase
    .from('reports')
    .select(
      `*,
      reporter:users!reports_reporter_id_fkey(id, first_name, last_name, email, avatar_url)`,
      { count: 'exact' }
    )
    .eq('status', status)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (params.severity) query = query.eq('severity', params.severity)
  if (params.type) query = query.eq('report_type', params.type)

  const { data: reports, error, count } = await query
  if (error) {
    console.error('Error fetching reports:', error)
    throw new Error('Failed to fetch reports')
  }

  const reportsWithDetails = await Promise.all(
    (reports || []).map(async (report: any) => {
      let reportedItem = null
      if (report.report_type === 'product') {
        const { data: product } = await supabase
          .from('products')
          .select('id, title, seller_id')
          .eq('id', report.reported_item_id)
          .single()
        reportedItem = product
      } else if (report.report_type === 'user') {
        const { data: user } = await supabase
          .from('users')
          .select('id, first_name, last_name, email')
          .eq('id', report.reported_item_id)
          .single()
        reportedItem = user
      } else if (report.report_type === 'review') {
        const { data: review } = await supabase
          .from('reviews')
          .select('id, rating, comment, product_id')
          .eq('id', report.reported_item_id)
          .single()
        reportedItem = review
      }
      return { ...report, reportedItem }
    })
  )

  return {
    reports: reportsWithDetails,
    pagination: {
      page,
      limit,
      total: count || 0,
      totalPages: Math.ceil((count || 0) / limit),
    },
  }
}
