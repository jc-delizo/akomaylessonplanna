import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/middleware/admin-auth'

/**
 * GET /api/admin/messages/flagged
 * Get flagged messages queue
 * Query params: status (pending, resolved, all)
 */
export async function GET(request: NextRequest) {
  // #region agent log
  fetch('http://127.0.0.1:7248/ingest/00d5f2ca-d0b7-44d8-a520-af7d4c8e25e2',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/api/admin/messages/flagged/route.ts:10',message:'GET handler entry',data:{url:request.url},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A,B,C,D,E'})}).catch(()=>{});
  // #endregion
  try {
    const authResult = await requireAdmin(request)
    // #region agent log
    fetch('http://127.0.0.1:7248/ingest/00d5f2ca-d0b7-44d8-a520-af7d4c8e25e2',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/api/admin/messages/flagged/route.ts:13',message:'Auth check result',data:{success:authResult.success},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
    // #endregion
    if (!authResult.success) {
      return authResult.response
    }

    const supabase = await createClient()
    // #region agent log
    fetch('http://127.0.0.1:7248/ingest/00d5f2ca-d0b7-44d8-a520-af7d4c8e25e2',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/api/admin/messages/flagged/route.ts:17',message:'Supabase client created',data:{hasClient:!!supabase},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
    // #endregion

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') || 'pending'
    const tableName = 'messages'
    // #region agent log
    fetch('http://127.0.0.1:7248/ingest/00d5f2ca-d0b7-44d8-a520-af7d4c8e25e2',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/api/admin/messages/flagged/route.ts:24',message:'Before query build',data:{tableName,status},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A,B'})}).catch(()=>{});
    // #endregion

    // Build query
    let query = supabase
      .from(tableName)
      .select(
        `
        *,
        sender:sender_id(id, name, username, email),
        conversation:conversation_id(
          id,
          buyer_id,
          seller_id,
          product_id,
          buyer:buyer_id(id, name, username),
          seller:seller_id(id, name, username),
          product:product_id(id, title)
        )
      `
      )
      .eq('is_flagged', true)
      .order('created_at', { ascending: false })

    // Note: status filter would be on reports, not messages
    // For now, we show all flagged messages

    // #region agent log
    fetch('http://127.0.0.1:7248/ingest/00d5f2ca-d0b7-44d8-a520-af7d4c8e25e2',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/api/admin/messages/flagged/route.ts:46',message:'Before query execution',data:{tableName},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A,B,C'})}).catch(()=>{});
    // #endregion
    const { data: messages, error } = await query.limit(100)
    // #region agent log
    fetch('http://127.0.0.1:7248/ingest/00d5f2ca-d0b7-44d8-a520-af7d4c8e25e2',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/api/admin/messages/flagged/route.ts:47',message:'After query execution',data:{hasError:!!error,errorCode:error?.code,errorMessage:error?.message,errorHint:error?.hint,hasData:!!messages,dataCount:messages?.length},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A,B,C'})}).catch(()=>{});
    // #endregion

    if (error) {
      console.error('Error fetching flagged messages:', error)
      // #region agent log
      fetch('http://127.0.0.1:7248/ingest/00d5f2ca-d0b7-44d8-a520-af7d4c8e25e2',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/api/admin/messages/flagged/route.ts:49',message:'Error handling',data:{errorCode:error.code,errorMessage:error.message,errorDetails:error.details,errorHint:error.hint,fullError:JSON.stringify(error)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A,B,C'})}).catch(()=>{});
      // #endregion
      return NextResponse.json(
        { error: 'Failed to fetch flagged messages' },
        { status: 500 }
      )
    }

    // #region agent log
    fetch('http://127.0.0.1:7248/ingest/00d5f2ca-d0b7-44d8-a520-af7d4c8e25e2',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/api/admin/messages/flagged/route.ts:56',message:'Success response',data:{messageCount:messages?.length||0},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A,B,C'})}).catch(()=>{});
    // #endregion
    return NextResponse.json({ messages: messages || [] })
  } catch (error) {
    // #region agent log
    fetch('http://127.0.0.1:7248/ingest/00d5f2ca-d0b7-44d8-a520-af7d4c8e25e2',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/api/admin/messages/flagged/route.ts:58',message:'Catch block error',data:{errorMessage:error instanceof Error?error.message:String(error),errorStack:error instanceof Error?error.stack:undefined},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A,B,C,D,E'})}).catch(()=>{});
    // #endregion
    console.error('Error in GET /api/admin/messages/flagged:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
