import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextRequest, NextResponse } from 'next/server'

/**
 * PUT /api/seller/settings/payment-methods
 * Update payment methods (GCash/Maya numbers)
 * Body: { gcash_number, maya_number }
 * Validates: PH phone format
 */
export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const adminClient = createAdminClient()

    // Verify user is a seller
    const { data: userData } = await adminClient
      .from('users')
      .select('can_sell')
      .eq('id', user.id)
      .single()

    if (!userData?.can_sell) {
      return NextResponse.json(
        { error: 'Only sellers can update payment methods' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { gcash_number, maya_number } = body

    // Build update object
    const updates: {
      gcash_number?: string | null
      maya_number?: string | null
      updated_at?: string
    } = {}
    if (gcash_number !== undefined) {
      if (gcash_number !== null && typeof gcash_number !== 'string') {
        return NextResponse.json({ error: 'gcash_number must be a string' }, { status: 400 })
      }
      updates.gcash_number = gcash_number?.replace(/[\s-]/g, '') || null
    }
    if (maya_number !== undefined) {
      if (maya_number !== null && typeof maya_number !== 'string') {
        return NextResponse.json({ error: 'maya_number must be a string' }, { status: 400 })
      }
      updates.maya_number = maya_number?.replace(/[\s-]/g, '') || null
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: 'No fields to update' },
        { status: 400 }
      )
    }

    // Store a canonical PH mobile number so payout validation uses one format.
    const phoneRegex = /^09\d{9}$/
    
    if (updates.gcash_number && !phoneRegex.test(updates.gcash_number)) {
      return NextResponse.json(
        { error: 'Invalid GCash number format. Use format: 09XX-XXX-XXXX or 09XXXXXXXXX' },
        { status: 400 }
      )
    }

    if (updates.maya_number && !phoneRegex.test(updates.maya_number)) {
      return NextResponse.json(
        { error: 'Invalid Maya number format. Use format: 09XX-XXX-XXXX or 09XXXXXXXXX' },
        { status: 400 }
      )
    }

    updates.updated_at = new Date().toISOString()

    // Update user
    const { data: updated, error: updateError } = await adminClient
      .from('users')
      .update(updates)
      .eq('id', user.id)
      .select('gcash_number, maya_number')
      .single()

    if (updateError) {
      console.error('Error updating payment methods:', updateError)
      return NextResponse.json(
        { error: 'Failed to update payment methods' },
        { status: 500 }
      )
    }

    return NextResponse.json({ payment_methods: updated })
  } catch (error) {
    console.error('Error in PUT /api/seller/settings/payment-methods:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
