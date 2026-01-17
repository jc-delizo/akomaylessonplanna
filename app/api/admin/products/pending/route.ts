import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/middleware/admin-auth'

/**
 * GET /api/admin/products/pending
 * Get pending products queue (oldest first - FCFS)
 * Shows first 3 products from new sellers
 */
export async function GET(request: NextRequest) {
  // #region agent log
  fetch('http://127.0.0.1:7248/ingest/00d5f2ca-d0b7-44d8-a520-af7d4c8e25e2',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'route.ts:10',message:'GET /api/admin/products/pending started',data:{url:request.nextUrl.toString(),hasCookies:!!request.cookies,headers:Object.fromEntries(request.headers.entries())},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
  // #endregion
  try {
    const authResult = await requireAdmin(request)
    // #region agent log
    fetch('http://127.0.0.1:7248/ingest/00d5f2ca-d0b7-44d8-a520-af7d4c8e25e2',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'route.ts:12',message:'requireAdmin result',data:{success:authResult.success,status:authResult.response?.status},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
    // #endregion
    if (!authResult.success) {
      // #region agent log
      fetch('http://127.0.0.1:7248/ingest/00d5f2ca-d0b7-44d8-a520-af7d4c8e25e2',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'route.ts:14',message:'Auth failed, returning response',data:{status:authResult.response?.status},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
      // #endregion
      return authResult.response
    }

    const supabase = await createClient()

    // #region agent log
    fetch('http://127.0.0.1:7248/ingest/00d5f2ca-d0b7-44d8-a520-af7d4c8e25e2',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'route.ts:17',message:'Auth successful, querying products',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
    // #endregion
    // Get pending products (oldest first)
    const { data: pendingProducts, error } = await supabase
      .from('products')
      .select(`
        *,
        seller:users!products_seller_id_fkey(
          id,
          name,
          username,
          avatar_url,
          created_at,
          is_verified_teacher
        ),
        grade:grades!products_grade_id_fkey(id, name),
        subject:subjects!products_subject_id_fkey(id, name)
      `)
      .eq('status', 'pending_review')
      .order('created_at', { ascending: true }) // Oldest first (FCFS)

    if (error) {
      // #region agent log
      fetch('http://127.0.0.1:7248/ingest/00d5f2ca-d0b7-44d8-a520-af7d4c8e25e2',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'route.ts:38',message:'Query error',data:{error:error.message,code:error.code,hint:error.hint},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
      // #endregion
      console.error('Error fetching pending products:', error)
      return NextResponse.json({ error: 'Failed to fetch pending products' }, { status: 500 })
    }
    // #region agent log
    fetch('http://127.0.0.1:7248/ingest/00d5f2ca-d0b7-44d8-a520-af7d4c8e25e2',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'route.ts:41',message:'Query successful',data:{productCount:pendingProducts?.length||0},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
    // #endregion

    // Calculate priority badges and submission counts
    const productsWithMetadata = await Promise.all(
      (pendingProducts || []).map(async (product) => {
        const submittedTime = new Date(product.created_at)
        const now = new Date()
        const hoursSinceSubmission = (now.getTime() - submittedTime.getTime()) / 3600000

        // Get seller's product count (to determine if this is one of first 3)
        const { count: sellerProductCount } = await supabase
          .from('products')
          .select('*', { count: 'exact', head: true })
          .eq('seller_id', product.seller_id)
          .in('status', ['published', 'pending_review'])

        // Get submission count (how many times this product was submitted)
        const { count: submissionCount } = await supabase
          .from('product_updates')
          .select('*', { count: 'exact', head: true })
          .eq('product_id', product.id)

        return {
          ...product,
          hoursSinceSubmission,
          priority: hoursSinceSubmission > 48 ? 'high' : hoursSinceSubmission > 24 ? 'medium' : 'low',
          productNumber: (sellerProductCount || 0) + 1, // 1 of 3
          submissionCount: (submissionCount || 0) + 1,
        }
      })
    )

    return NextResponse.json({
      products: productsWithMetadata,
      total: productsWithMetadata.length,
    })
  } catch (error) {
    console.error('Error in GET /api/admin/products/pending:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
