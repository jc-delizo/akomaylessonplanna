import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

/**
 * GET /api/messages/settings/away-message
 * Get current away message status
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

    // Note: Away message feature would require a new table or user settings field
    // For MVP, we'll return a simple response indicating it's not yet implemented
    // This can be enhanced later with a user_settings table or similar

    return NextResponse.json({
      is_active: false,
      return_date: null,
      message: null,
    })
  } catch (error) {
    console.error('Error in GET /api/messages/settings/away-message:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/messages/settings/away-message
 * Set away/auto-reply message
 * Body: { is_active, return_date, message }
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
        { error: 'Only sellers can set away messages' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { is_active, return_date, message } = body

    // Note: Away message feature would require a new table or user settings field
    // For MVP, we'll return a success response but note that it's not fully implemented
    // This can be enhanced later with a user_settings table or similar

    return NextResponse.json({
      success: true,
      message: 'Away message feature will be implemented in a future update',
    })
  } catch (error) {
    console.error('Error in PUT /api/messages/settings/away-message:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
