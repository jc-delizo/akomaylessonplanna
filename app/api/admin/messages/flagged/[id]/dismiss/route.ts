import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/middleware/admin-auth'

/**
 * PUT /api/admin/messages/flagged/[id]/dismiss
 * Dismiss flag (no action needed)
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authResult = await requireAdmin(request)
    if (!authResult.success) {
      return authResult.response
    }

    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    const messageId = params.id

    // Unflag message
    const { data: updated, error: updateError } = await supabase
      .from('messages')
      .update({
        is_flagged: false,
        flag_reason: null,
      })
      .eq('id', messageId)
      .select()
      .single()

    if (updateError) {
      console.error('Error dismissing flag:', updateError)
      return NextResponse.json(
        { error: 'Failed to dismiss flag' },
        { status: 500 }
      )
    }

    return NextResponse.json({ message: updated })
  } catch (error) {
    console.error('Error in PUT /api/admin/messages/flagged/[id]/dismiss:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
