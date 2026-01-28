import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { SPED_SUBJECT_CODES } from '@/lib/config/lesson-plan-config'

/**
 * GET /api/lesson-plan-config
 * Returns full lesson-plan hierarchy: class types, grades, strands, subjects by grade/strand, SPED levels/subjects.
 * Used by filter sidebar and product form for Class type, Strand (G11/12), SPED path/level/subject options.
 *
 * Response shape:
 *   classTypes: ['regular','sped']
 *   regular: { grades, strands, subjectsByGrade, subjectsByStrand }
 *   sped: { paths: ['graded','non_graded'], levels, spedSubjects }
 *
 * SHS rule (enforced in UI): specialized subjects for Grade 11/12 are only valid after a strand is selected.
 * See docs/implementationplan/LESSON-PLAN-HIERARCHY-SPEC.md.
 */
export async function GET() {
  try {
    const supabase = await createClient()

    const [gradesRes, strandsRes, gradeSubjectsRes, strandSubjectsRes, spedLevelsRes, spedSubjectsRes] =
      await Promise.all([
        supabase
          .from('grades')
          .select('id, name, sort_order')
          .eq('is_active', true)
          .order('sort_order', { ascending: true }),
        supabase
          .from('strands')
          .select('id, name, code')
          .eq('is_active', true)
          .order('sort_order', { ascending: true }),
        supabase
          .from('grade_subjects')
          .select('grade_id, subject:subjects!grade_subjects_subject_id_fkey(id, name, code)'),
        supabase
          .from('strand_subjects')
          .select('strand_id, subject:subjects!strand_subjects_subject_id_fkey(id, name, code)'),
        supabase
          .from('sped_levels')
          .select('id, name, sort_order')
          .order('sort_order', { ascending: true }),
        supabase
          .from('subjects')
          .select('id, name, code')
          .in('code', [...SPED_SUBJECT_CODES]),
      ])

    if (gradesRes.error) {
      console.error('Error fetching grades:', gradesRes.error)
      return NextResponse.json({ error: 'Failed to fetch hierarchy' }, { status: 500 })
    }
    if (strandsRes.error) {
      console.error('Error fetching strands:', strandsRes.error)
      return NextResponse.json({ error: 'Failed to fetch hierarchy' }, { status: 500 })
    }
    if (gradeSubjectsRes.error) {
      console.error('Error fetching grade_subjects:', gradeSubjectsRes.error)
      return NextResponse.json({ error: 'Failed to fetch hierarchy' }, { status: 500 })
    }
    if (strandSubjectsRes.error) {
      console.error('Error fetching strand_subjects:', strandSubjectsRes.error)
      return NextResponse.json({ error: 'Failed to fetch hierarchy' }, { status: 500 })
    }
    if (spedLevelsRes.error) {
      console.error('Error fetching sped_levels:', spedLevelsRes.error)
      return NextResponse.json({ error: 'Failed to fetch hierarchy' }, { status: 500 })
    }
    if (spedSubjectsRes.error) {
      console.error('Error fetching SPED subjects:', spedSubjectsRes.error)
      return NextResponse.json({ error: 'Failed to fetch hierarchy' }, { status: 500 })
    }

    const grades = (gradesRes.data || []) as { id: string; name: string; sort_order: number }[]
    const strands = (strandsRes.data || []) as { id: string; name: string; code: string }[]
    type SubjectRow = { id: string; name: string; code: string }
    const gradeSubjectsRows = (gradeSubjectsRes.data || []) as Array<{ grade_id: string; subject: SubjectRow | SubjectRow[] | null }>
    const strandSubjectsRows = (strandSubjectsRes.data || []) as Array<{ strand_id: string; subject: SubjectRow | SubjectRow[] | null }>
    const spedLevels = (spedLevelsRes.data || []) as { id: string; name: string; sort_order: number }[]
    const spedSubjects = (spedSubjectsRes.data || []) as { id: string; name: string; code: string }[]

    const norm = (s: SubjectRow | SubjectRow[] | null): SubjectRow | null =>
      Array.isArray(s) ? (s[0] ?? null) : s ?? null

    const subjectsByGrade: Record<string, { id: string; name: string; code: string }[]> = {}
    for (const row of gradeSubjectsRows) {
      const sub = norm(row.subject)
      if (!sub) continue
      if (!subjectsByGrade[row.grade_id]) subjectsByGrade[row.grade_id] = []
      subjectsByGrade[row.grade_id].push(sub)
    }
    for (const gradeId of Object.keys(subjectsByGrade)) {
      subjectsByGrade[gradeId].sort((a, b) => a.name.localeCompare(b.name))
    }

    const subjectsByStrand: Record<string, { id: string; name: string; code: string }[]> = {}
    for (const row of strandSubjectsRows) {
      const sub = norm(row.subject)
      if (!sub) continue
      if (!subjectsByStrand[row.strand_id]) subjectsByStrand[row.strand_id] = []
      subjectsByStrand[row.strand_id].push(sub)
    }
    for (const strandId of Object.keys(subjectsByStrand)) {
      subjectsByStrand[strandId].sort((a, b) => a.name.localeCompare(b.name))
    }

    const response = {
      classTypes: ['regular', 'sped'] as const,
      regular: {
        grades: grades.map((g) => ({ id: g.id, name: g.name, sortOrder: g.sort_order })),
        strands: strands.map((s) => ({ id: s.id, name: s.name, code: s.code })),
        subjectsByGrade,
        subjectsByStrand,
      },
      sped: {
        paths: ['graded', 'non_graded'] as const,
        levels: spedLevels.map((l) => ({ id: l.id, name: l.name, sortOrder: l.sort_order })),
        spedSubjects,
      },
    }

    return NextResponse.json(response, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
      },
    })
  } catch (error) {
    console.error('Error in GET /api/lesson-plan-config:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
