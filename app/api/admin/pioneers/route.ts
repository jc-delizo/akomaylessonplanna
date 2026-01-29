import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/middleware/admin-auth'
import { getPioneersData } from '@/lib/utils/admin-pioneers'

/**
 * GET /api/admin/pioneers
 * Get current Pioneers (20-slot maximum)
 */
export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAdmin(request)
    if (!authResult.success) return authResult.response

    const supabase = await createClient()
    const result = await getPioneersData(supabase)
    return NextResponse.json(result)
  } catch (error) {
    console.error('Error in GET /api/admin/pioneers:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
