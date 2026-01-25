import { createClient } from '@/lib/supabase/server'
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

    // Verify user is a seller
    const { data: userData } = await supabase
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
    const updates: any = {}
    if (gcash_number !== undefined) {
      updates.gcash_number = gcash_number?.trim() || null
    }
    if (maya_number !== undefined) {
      updates.maya_number = maya_number?.trim() || null
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: 'No fields to update' },
        { status: 400 }
      )
    }

    // Validate PH phone format (09XX-XXX-XXXX or 09XXXXXXXXX)
    const phoneRegex = /^09\d{2}[\s-]?\d{3}[\s-]?\d{4}$|^09\d{9}$/
    
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
    const { data: updated, error: updateError } = await supabase
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
