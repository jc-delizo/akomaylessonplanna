import { createAdminClient } from '@/lib/supabase/admin'
import { requireSuperAdmin } from '@/lib/middleware/admin-auth'
import { NextRequest, NextResponse } from 'next/server'

/**
 * GET /api/admin/catalog/grade-subjects
 * Get all grade-subject mappings. Optional ?grade_id= to filter by grade.
 */
export async function GET(request: NextRequest) {
  const authResult = await requireSuperAdmin(request)
  if (!authResult.success) return authResult.response
  try {
    const { searchParams } = new URL(request.url)
    const gradeId = searchParams.get('grade_id')
    const supabase = createAdminClient()
    let query = supabase
      .from('grade_subjects')
      .select('grade_id, subject_id')
    if (gradeId) query = query.eq('grade_id', gradeId)
    const { data, error } = await query
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data || [])
  } catch (err) {
    console.error('Error in GET /api/admin/catalog/grade-subjects:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * PUT /api/admin/catalog/grade-subjects
 * Bulk update mappings for a grade. Body: { grade_id, subject_ids: string[] }
 * Replaces all existing mappings for that grade.
 */
export async function PUT(request: NextRequest) {
  const authResult = await requireSuperAdmin(request)
  if (!authResult.success) return authResult.response
  try {
    const body = await request.json()
    const { grade_id, subject_ids } = body
    if (!grade_id || !Array.isArray(subject_ids)) {
      return NextResponse.json(
        { error: 'grade_id and subject_ids (array) are required' },
        { status: 400 }
      )
    }
    const supabase = createAdminClient()
    await supabase.from('grade_subjects').delete().eq('grade_id', grade_id)
    if (subject_ids.length > 0) {
      const rows = subject_ids.map((subject_id: string) => ({ grade_id, subject_id }))
      const { error } = await supabase.from('grade_subjects').insert(rows)
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    }
    const { data } = await supabase
      .from('grade_subjects')
      .select('grade_id, subject_id')
      .eq('grade_id', grade_id)
    return NextResponse.json(data || [])
  } catch (err) {
    console.error('Error in PUT /api/admin/catalog/grade-subjects:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
