import { createAdminClient } from '@/lib/supabase/admin'
import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/middleware/admin-auth'

/**
 * GET /api/admin/users/[id]/admin-notes
 * Get admin notes for a user
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await requireAdmin(request)
    if (!authResult.success) {
      return authResult.response
    }

    const { id: userId } = await params
    const supabase = createAdminClient()

    const { data: notes, error } = await supabase
      .from('admin_notes')
      .select(`
        *,
        admin:users!admin_notes_admin_id_fkey(id, first_name, last_name, email, avatar_url),
        mentioned_admin:users!admin_notes_mentioned_admin_fkey(id, first_name, last_name, email)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching admin notes:', error)
      return NextResponse.json({ error: 'Failed to fetch admin notes' }, { status: 500 })
    }

    return NextResponse.json({ notes: notes || [] })
  } catch (error) {
    console.error('Error in GET /api/admin/users/[id]/admin-notes:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * POST /api/admin/users/[id]/admin-notes
 * Add admin note to a user
 * 
 * Body:
 * - note: string (1-500 chars)
 * - mentioned_admin_id?: string (if @mention)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await requireAdmin(request)
    if (!authResult.success) {
      return authResult.response
    }

    const { id: userId } = await params
    const supabase = createAdminClient()
    const body = await request.json()
    const { note, mentioned_admin_id } = body

    if (!note || note.trim().length === 0 || note.length > 500) {
      return NextResponse.json(
        { error: 'Note must be between 1 and 500 characters' },
        { status: 400 }
      )
    }

    // Check for @mentions in note text
    const mentionPattern = /@(\w+)/g
    const mentions = note.match(mentionPattern) || []
    const isMention = mentions.length > 0 || mentioned_admin_id

    // Insert admin note
    const { data: adminNote, error } = await supabase
      .from('admin_notes')
      .insert({
        user_id: userId,
        admin_id: authResult.admin.userId,
        note: note.trim(),
        is_mention: isMention,
        mentioned_admin: mentioned_admin_id || null,
      })
      .select(`
        *,
        admin:users!admin_notes_admin_id_fkey(id, first_name, last_name, email, avatar_url)
      `)
      .single()

    if (error) {
      console.error('Error creating admin note:', error)
      return NextResponse.json({ error: 'Failed to create admin note' }, { status: 500 })
    }

    // TODO: Send notification to mentioned admin if applicable

    return NextResponse.json({ note: adminNote }, { status: 201 })
  } catch (error) {
    console.error('Error in POST /api/admin/users/[id]/admin-notes:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
