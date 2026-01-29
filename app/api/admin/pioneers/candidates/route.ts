import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/middleware/admin-auth'
import { getPioneersCandidatesData } from '@/lib/utils/admin-pioneers'

/**
 * GET /api/admin/pioneers/candidates
 * Get Pioneer candidates with Quality Score
 */
export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAdmin(request)
    if (!authResult.success) return authResult.response

    const supabase = await createClient()
    const result = await getPioneersCandidatesData(supabase)
    return NextResponse.json(result)
  } catch (error) {
    console.error('Error in GET /api/admin/pioneers/candidates:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
