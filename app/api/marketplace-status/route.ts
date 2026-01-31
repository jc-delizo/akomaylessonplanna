import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { getMarketplaceClosed } from '@/lib/utils/marketplace-status'

/**
 * GET /api/marketplace-status
 * Public, no auth. Returns whether the marketplace is closed (products hidden behind blur overlay).
 */
export async function GET() {
  try {
    const supabase = await createClient()
    const marketplaceClosed = await getMarketplaceClosed(supabase)
    return NextResponse.json({ marketplaceClosed })
  } catch (error) {
    console.error('Error in GET /api/marketplace-status:', error)
    return NextResponse.json({ marketplaceClosed: false }, { status: 200 })
  }
}
