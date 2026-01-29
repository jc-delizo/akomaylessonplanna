import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/middleware/admin-auth'
import { getReportsData } from '@/lib/utils/admin-reports'

/**
 * GET /api/admin/reports
 * Get user reports queue
 */
export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAdmin(request)
    if (!authResult.success) return authResult.response

    const supabase = await createClient()
    const sp = request.nextUrl.searchParams
    const result = await getReportsData(supabase, {
      status: sp.get('status') || 'pending',
      severity: sp.get('severity') || undefined,
      type: sp.get('type') || undefined,
      page: parseInt(sp.get('page') || '1', 10),
      limit: parseInt(sp.get('limit') || '50', 10),
    })
    return NextResponse.json(result)
  } catch (error) {
    console.error('Error in GET /api/admin/reports:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
