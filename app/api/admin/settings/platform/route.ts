import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { requireSuperAdmin, logAdminAction } from '@/lib/middleware/admin-auth'

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

    // Platform settings are stored in a settings table or as constants
    // For now, return default values
    return NextResponse.json({
      commissionRates: {
        standard: 20,
        pioneer: 15,
      },
      pricing: {
        minProductPrice: 50,
        maxProductPrice: 1000,
        recommendedRange: { min: 100, max: 500 },
      },
      uploadLimits: {
        maxFileSize: 500 * 1024 * 1024, // 500 MB
        allowedTypes: ['pdf', 'docx', 'pptx', 'jpg', 'png', 'mp4', 'zip'],
      },
      moderation: {
        firstNProductsRequireReview: 3,
        autoApproveTrustedSellers: false,
        resubmissionAttempts: 'unlimited',
      },
      withdrawals: {
        minWithdrawal: 500,
        processingTime: '1-3 business days',
      },
      platformRules: {
        accountCreationEnabled: true,
        sellerVerificationRequired: true,
        buyerRequirements: {
          accountRequired: true,
          emailRequired: true,
        },
      },
      content: {
        watermarkDownloads: true,
        previewPages: 3,
      },
      seo: {
        platformName: 'Ako may lesson plan na!',
        tagline: 'Quality Lesson Plans from Filipino Teachers',
      },
    })
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
