import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextRequest, NextResponse } from 'next/server'

/**
 * PUT /api/seller/settings/shop
 * Update shop preferences
 * Body: { shop_name, shop_description, auto_publish }
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
        { error: 'Only sellers can update shop preferences' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { shop_name, shop_description, auto_publish } = body

    // Build update object
    const updates: {
      shop_name?: string | null
      shop_description?: string | null
      auto_publish?: boolean
      updated_at?: string
    } = {}
    if (shop_name !== undefined) {
      if (shop_name !== null && typeof shop_name !== 'string') {
        return NextResponse.json({ error: 'shop_name must be a string' }, { status: 400 })
      }
      updates.shop_name = shop_name?.trim() || null
    }
    if (shop_description !== undefined) {
      if (shop_description !== null && typeof shop_description !== 'string') {
        return NextResponse.json({ error: 'shop_description must be a string' }, { status: 400 })
      }
      updates.shop_description = shop_description?.trim() || null
    }
    if (auto_publish !== undefined) {
      if (typeof auto_publish !== 'boolean') {
        return NextResponse.json({ error: 'auto_publish must be a boolean' }, { status: 400 })
      }
      updates.auto_publish = auto_publish
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: 'No fields to update' },
        { status: 400 }
      )
    }

    // Validate shop name
    if (updates.shop_name && updates.shop_name.length > 255) {
      return NextResponse.json(
        { error: 'Shop name must be less than 255 characters' },
        { status: 400 }
      )
    }

    // Validate shop description
    if (updates.shop_description && updates.shop_description.length > 2000) {
      return NextResponse.json(
        { error: 'Shop description must be less than 2000 characters' },
        { status: 400 }
      )
    }

    updates.updated_at = new Date().toISOString()

    // Update user
    const { data: updated, error: updateError } = await createAdminClient()
      .from('users')
      .update(updates)
      .eq('id', user.id)
      .select('shop_name, shop_description, auto_publish')
      .single()

    if (updateError) {
      console.error('Error updating shop preferences:', updateError)
      return NextResponse.json(
        { error: 'Failed to update shop preferences' },
        { status: 500 }
      )
    }

    return NextResponse.json({ shop: updated })
  } catch (error) {
    console.error('Error in PUT /api/seller/settings/shop:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
