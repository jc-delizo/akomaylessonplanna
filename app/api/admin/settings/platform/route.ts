import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { requireSuperAdmin, logAdminAction } from '@/lib/middleware/admin-auth'
import { getPlatformSettingsData } from '@/lib/utils/admin-platform-settings'
import { getMarketplaceClosed } from '@/lib/utils/marketplace-status'

/**
 * GET /api/admin/settings/platform
 * Get platform settings (Super Admin only). Includes marketplaceClosed from DB.
 */
export async function GET(request: NextRequest) {
  try {
    const authResult = await requireSuperAdmin(request)
    if (!authResult.success) {
      return authResult.response
    }

    const supabase = await createClient()
    const staticSettings = getPlatformSettingsData()
    const marketplaceClosed = await getMarketplaceClosed(supabase)
    return NextResponse.json({ ...staticSettings, marketplaceClosed })
  } catch (error) {
    console.error('Error in GET /api/admin/settings/platform:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * PUT /api/admin/settings/platform
 * Update platform settings (Super Admin only, immediate effect)
 */
export async function PUT(request: NextRequest) {
  try {
    const authResult = await requireSuperAdmin(request)
    if (!authResult.success) {
      return authResult.response
    }

    const body = await request.json()
    const supabase = await createClient()

    if (typeof body.marketplaceClosed === 'boolean') {
      const { error } = await supabase
        .from('platform_settings')
        .upsert(
          {
            key: 'marketplace_closed',
            value: body.marketplaceClosed,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'key' }
        )

      if (error) {
        console.error('Error upserting platform_settings:', error)
        return NextResponse.json({ error: 'Failed to update marketplace setting' }, { status: 500 })
      }
    }

    await logAdminAction(
      authResult.admin.userId,
      'platform_settings_updated',
      'settings',
      'platform',
      body,
      'Platform settings updated'
    )

    const staticSettings = getPlatformSettingsData()
    const marketplaceClosed = await getMarketplaceClosed(supabase)
    return NextResponse.json({
      success: true,
      message: 'Platform settings updated',
      settings: { ...staticSettings, marketplaceClosed },
    })
  } catch (error) {
    console.error('Error in PUT /api/admin/settings/platform:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
