import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

/**
 * GET /api/grades/[gradeId]/subjects
 * Get all active subjects for a specific grade
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ gradeId: string }> }
) {
  try {
    const { gradeId } = await params
    const supabase = await createClient()

    // Fetch subjects for this grade through grade_subjects junction table
    const { data: gradeSubjects, error } = await supabase
      .from('grade_subjects')
      .select(`
        subject:subjects!grade_subjects_subject_id_fkey(
          id,
          name,
          code,
          is_active
        )
      `)
      .eq('grade_id', gradeId)

    if (error) {
      console.error('Error fetching subjects for grade:', error)
      return NextResponse.json(
        { error: 'Failed to fetch subjects' },
        { status: 500 }
      )
    }

    // Extract and filter active subjects
    const subjects = (gradeSubjects || [])
      .map((gs: any) => gs.subject)
      .filter((s: any) => s && s.is_active)
      .sort((a: any, b: any) => a.name.localeCompare(b.name))

    return NextResponse.json(
      { subjects },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
        },
      }
    )
  } catch (error) {
    console.error('Error in GET /api/grades/[gradeId]/subjects:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
