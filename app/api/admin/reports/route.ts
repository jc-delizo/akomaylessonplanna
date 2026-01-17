import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/middleware/admin-auth'

/**
 * GET /api/admin/reports
 * Get user reports queue
 * 
 * Query parameters:
 * - status?: 'pending' | 'under_review' | 'resolved' | 'dismissed'
 * - severity?: 'high' | 'medium' | 'low'
 * - type?: 'product' | 'user' | 'review' | 'message'
 * - page?: number (default: 1)
 * - limit?: number (default: 50)
 */
export async function GET(request: NextRequest) {
  // #region agent log
  fetch('http://127.0.0.1:7248/ingest/00d5f2ca-d0b7-44d8-a520-af7d4c8e25e2',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'route.ts:16',message:'GET request started',data:{hasCookies:!!request.headers.get('cookie'),url:request.url},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
  // #endregion
  try {
    const authResult = await requireAdmin(request)
    // #region agent log
    fetch('http://127.0.0.1:7248/ingest/00d5f2ca-d0b7-44d8-a520-af7d4c8e25e2',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'route.ts:20',message:'requireAdmin result',data:{success:authResult.success,status:!authResult.success?authResult.response.status:null},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
    // #endregion
    if (!authResult.success) {
      return authResult.response
    }

    const supabase = await createClient()
    const searchParams = request.nextUrl.searchParams

    const status = searchParams.get('status') || 'pending'
    const severity = searchParams.get('severity')
    const type = searchParams.get('type')
    const page = parseInt(searchParams.get('page') || '1', 10)
    const limit = parseInt(searchParams.get('limit') || '50', 10)
    const offset = (page - 1) * limit

    // Build query
    let query = supabase
      .from('reports')
      .select(`
        *,
        reporter:users!reports_reporter_id_fkey(id, name, email, avatar_url)
      `, { count: 'exact' })
      .eq('status', status)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (severity) {
      query = query.eq('severity', severity)
    }

    if (type) {
      query = query.eq('report_type', type)
    }

    const { data: reports, error, count } = await query
    // #region agent log
    fetch('http://127.0.0.1:7248/ingest/00d5f2ca-d0b7-44d8-a520-af7d4c8e25e2',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'route.ts:54',message:'Query result',data:{hasError:!!error,errorMessage:error?.message,reportsCount:reports?.length,count},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
    // #endregion

    if (error) {
      console.error('Error fetching reports:', error)
      return NextResponse.json({ error: 'Failed to fetch reports' }, { status: 500 })
    }

    // Get reported items details
    const reportsWithDetails = await Promise.all(
      (reports || []).map(async (report) => {
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
            .select('id, name, email')
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

        return {
          ...report,
          reportedItem,
        }
      })
    )

    // #region agent log
    fetch('http://127.0.0.1:7248/ingest/00d5f2ca-d0b7-44d8-a520-af7d4c8e25e2',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'route.ts:96',message:'Before return success',data:{reportsWithDetailsCount:reportsWithDetails?.length},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
    // #endregion
    return NextResponse.json({
      reports: reportsWithDetails,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    })
  } catch (error) {
    // #region agent log
    fetch('http://127.0.0.1:7248/ingest/00d5f2ca-d0b7-44d8-a520-af7d4c8e25e2',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'route.ts:105',message:'Catch block error',data:{errorMessage:error instanceof Error?error.message:String(error),errorStack:error instanceof Error?error.stack:null},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
    // #endregion
    console.error('Error in GET /api/admin/reports:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
