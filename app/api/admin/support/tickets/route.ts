import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/middleware/admin-auth'
import { getSupportTicketsData } from '@/lib/utils/admin-support-tickets'

/**
 * GET /api/admin/support/tickets
 * Get support tickets (email-only support)
 * 
 * Query parameters:
 * - status?: 'open' | 'in_progress' | 'resolved' | 'closed'
 * - priority?: 'high' | 'medium' | 'low'
 * - category?: 'technical' | 'billing' | 'content' | 'account'
 * - assigned_to?: string (admin user ID)
 * - page?: number (default: 1)
 * - limit?: number (default: 50)
 */
export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAdmin(request)
    if (!authResult.success) {
      return authResult.response
    }

    const supabase = await createClient()
    const searchParams = request.nextUrl.searchParams

    const sp = request.nextUrl.searchParams
    const result = await getSupportTicketsData(supabase, {
      status: sp.get('status') || undefined,
      priority: sp.get('priority') || undefined,
      category: sp.get('category') || undefined,
      assigned_to: sp.get('assigned_to') || undefined,
      page: parseInt(sp.get('page') || '1', 10),
      limit: parseInt(sp.get('limit') || '50', 10),
    })
    return NextResponse.json(result)
  } catch (error) {
    console.error('Error in GET /api/admin/support/tickets:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * POST /api/admin/support/tickets
 * Create ticket from email (manual creation by admin)
 */
export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAdmin(request)
    if (!authResult.success) {
      return authResult.response
    }

    const supabase = await createClient()
    const body = await request.json()
    const {
      user_id,
      subject,
      description,
      category,
      priority,
      attachments,
    } = body

    if (!subject || !description || !category) {
      return NextResponse.json(
        { error: 'Subject, description, and category are required' },
        { status: 400 }
      )
    }

    const { data: ticket, error } = await supabase
      .from('support_tickets')
      .insert({
        user_id,
        subject: subject.trim(),
        description: description.trim(),
        category,
        priority: priority || 'medium',
        status: 'open',
        attachments: attachments || null,
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating ticket:', error)
      return NextResponse.json({ error: 'Failed to create ticket' }, { status: 500 })
    }

    // TODO: Send email notification to user

    return NextResponse.json({ ticket }, { status: 201 })
  } catch (error) {
    console.error('Error in POST /api/admin/support/tickets:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
