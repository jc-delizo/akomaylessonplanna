import { createAdminClient } from '@/lib/supabase/admin'
import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/middleware/admin-auth'

/**
 * DELETE /api/admin/messages/[id]
 * Delete any message (Super Admin only)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await requireAdmin(request)
    if (!authResult.success) {
      return authResult.response
    }

    const { id: messageId } = await params
    const supabase = createAdminClient()

    // Check if Super Admin (not just any admin)
    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('id', authResult.admin.userId)
      .single()

    if (userData?.role !== 'admin') {
      return NextResponse.json(
        { error: 'Super Admin access required' },
        { status: 403 }
      )
    }

    // Soft delete message
    const { error: updateError } = await supabase
      .from('messages')
      .update({
        is_deleted: true,
        deleted_by: authResult.admin.userId,
        deleted_at: new Date().toISOString(),
      })
      .eq('id', messageId)

    if (updateError) {
      console.error('Error deleting message:', updateError)
      return NextResponse.json(
        { error: 'Failed to delete message' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in DELETE /api/admin/messages/[id]:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
