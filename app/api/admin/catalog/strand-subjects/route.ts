import { createAdminClient } from '@/lib/supabase/admin'
import { requireSuperAdmin } from '@/lib/middleware/admin-auth'
import { NextRequest, NextResponse } from 'next/server'

/**
 * GET /api/admin/catalog/strand-subjects
 * Get all strand-subject mappings. Optional ?strand_id= to filter by strand.
 */
export async function GET(request: NextRequest) {
  const authResult = await requireSuperAdmin(request)
  if (!authResult.success) return authResult.response
  try {
    const { searchParams } = new URL(request.url)
    const strandId = searchParams.get('strand_id')
    const supabase = createAdminClient()
    let query = supabase
      .from('strand_subjects')
      .select('strand_id, subject_id')
    if (strandId) query = query.eq('strand_id', strandId)
    const { data, error } = await query
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data || [])
  } catch (err) {
    console.error('Error in GET /api/admin/catalog/strand-subjects:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * PUT /api/admin/catalog/strand-subjects
 * Bulk update mappings for a strand. Body: { strand_id, subject_ids: string[] }
 * Replaces all existing mappings for that strand.
 */
export async function PUT(request: NextRequest) {
  const authResult = await requireSuperAdmin(request)
  if (!authResult.success) return authResult.response
  try {
    const body = await request.json()
    const { strand_id, subject_ids } = body
    if (!strand_id || !Array.isArray(subject_ids)) {
      return NextResponse.json(
        { error: 'strand_id and subject_ids (array) are required' },
        { status: 400 }
      )
    }
    const supabase = createAdminClient()
    await supabase.from('strand_subjects').delete().eq('strand_id', strand_id)
    if (subject_ids.length > 0) {
      const rows = subject_ids.map((subject_id: string) => ({ strand_id, subject_id }))
      const { error } = await supabase.from('strand_subjects').insert(rows)
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    }
    const { data } = await supabase
      .from('strand_subjects')
      .select('strand_id, subject_id')
      .eq('strand_id', strand_id)
    return NextResponse.json(data || [])
  } catch (err) {
    console.error('Error in PUT /api/admin/catalog/strand-subjects:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
