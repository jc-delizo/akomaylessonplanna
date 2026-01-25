import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

/**
 * PUT /api/seller/settings/messaging
 * Update messaging settings (away message)
 * Body: { away_message_enabled, away_message_return_date, away_message_text }
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
        { error: 'Only sellers can update messaging settings' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { away_message_enabled, away_message_return_date, away_message_text } = body

    // Check if settings exist
    const { data: existing } = await supabase
      .from('seller_messaging_settings')
      .select('id')
      .eq('seller_id', user.id)
      .single()

    const settingsData = {
      seller_id: user.id,
      away_message_enabled: away_message_enabled || false,
      away_message_return_date: away_message_return_date || null,
      away_message_text: away_message_text?.trim() || null,
      updated_at: new Date().toISOString(),
    }

    let result
    if (existing) {
      // Update existing
      const { data: updated, error: updateError } = await supabase
        .from('seller_messaging_settings')
        .update(settingsData)
        .eq('seller_id', user.id)
        .select()
        .single()

      if (updateError) {
        console.error('Error updating messaging settings:', updateError)
        return NextResponse.json(
          { error: 'Failed to update messaging settings' },
          { status: 500 }
        )
      }
      result = updated
    } else {
      // Create new
      const { data: created, error: createError } = await supabase
        .from('seller_messaging_settings')
        .insert(settingsData)
        .select()
        .single()

      if (createError) {
        console.error('Error creating messaging settings:', createError)
        return NextResponse.json(
          { error: 'Failed to create messaging settings' },
          { status: 500 }
        )
      }
      result = created
    }

    return NextResponse.json({ messaging: result })
  } catch (error) {
    console.error('Error in PUT /api/seller/settings/messaging:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
