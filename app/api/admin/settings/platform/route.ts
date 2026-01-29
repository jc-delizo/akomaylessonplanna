import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { requireSuperAdmin, logAdminAction } from '@/lib/middleware/admin-auth'
import { getPlatformSettingsData } from '@/lib/utils/admin-platform-settings'

/**
 * GET /api/admin/settings/platform
 * Get platform settings (Super Admin only)
 */
export async function GET(request: NextRequest) {
  try {
    const authResult = await requireSuperAdmin(request)
    if (!authResult.success) {
      return authResult.response
    }

    return NextResponse.json(getPlatformSettingsData())
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

    // TODO: Store settings in database (create settings table if needed)
    // For now, log the changes

    // Log action
    await logAdminAction(
      authResult.admin.userId,
      'platform_settings_updated',
      'settings',
      'platform',
      body,
      'Platform settings updated'
    )

    return NextResponse.json({
      success: true,
      message: 'Platform settings updated',
      settings: body,
    })
  } catch (error) {
    console.error('Error in PUT /api/admin/settings/platform:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
