import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

/**
 * GET /api/seller/settings
 * Get seller settings (account, payment methods, messaging, shop preferences)
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify user is a seller
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select(
        'id, name, username, avatar_url, bio, gcash_number, maya_number, shop_name, shop_description, auto_publish, subscription_tier, can_sell'
      )
      .eq('id', user.id)
      .single()

    if (userError || !userData) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    if (!userData.can_sell) {
      return NextResponse.json(
        { error: 'User is not a seller' },
        { status: 403 }
      )
    }

    // Get messaging settings
    const { data: messagingSettings } = await supabase
      .from('seller_messaging_settings')
      .select('*')
      .eq('seller_id', user.id)
      .single()

    return NextResponse.json({
      account: {
        name: userData.name,
        username: userData.username,
        avatar_url: userData.avatar_url,
        bio: userData.bio,
      },
      payment_methods: {
        gcash_number: userData.gcash_number,
        maya_number: userData.maya_number,
      },
      messaging: messagingSettings || {
        away_message_enabled: false,
        away_message_return_date: null,
        away_message_text: null,
      },
      shop: {
        shop_name: userData.shop_name,
        shop_description: userData.shop_description,
        auto_publish: userData.auto_publish || false,
      },
      subscription_tier: userData.subscription_tier,
    })
  } catch (error) {
    console.error('Error in GET /api/seller/settings:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
