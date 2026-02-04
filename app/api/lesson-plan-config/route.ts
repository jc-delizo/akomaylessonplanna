import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import {
  DOCUMENT_TYPES,
  CURRICULA,
  MODALITIES,
  LANGUAGES,
  TEACHING_FRAMEWORKS,
  QUARTERS,
} from '@/lib/config/lesson-plan-config'

/**
 * GET /api/lesson-plan-config
 * Returns lesson-plan hierarchy: grades, strands, subjects by grade/strand.
 * Also returns dynamic catalog: productTypes, specificTypesByProductType, curricula,
 * modalities, languages, teachingFrameworks, quarters.
 * Used by filter sidebar, product form, profile teaching tab.
 * SPED removed.
 *
 * Response shape:
 *   classTypes: ['regular']
 *   regular: { grades, strands, subjectsByGrade, subjectsByStrand }
 *   productTypes: [{ id, slug, label, sortOrder }]
 *   specificTypesByProductType: { [slug]: [{ value, label, sortOrder }] }
 *   curricula, modalities, languages, teachingFrameworks, quarters: [{ value, label, sortOrder }]
 *
 * SHS rule (enforced in UI): specialized subjects for Grade 11/12 are only valid after a strand is selected.
 * See docs/implementationplan/LESSON-PLAN-HIERARCHY-SPEC.md.
 */
export async function GET() {
  try {
    const supabase = await createClient()

    const [
      gradesRes,
      strandsRes,
      gradeSubjectsRes,
      strandSubjectsRes,
      productTypesRes,
      specificTypesRes,
      curriculaRes,
      modalitiesRes,
      languagesRes,
      teachingFrameworksRes,
      quartersRes,
    ] = await Promise.all([
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
        .from('product_types')
        .select('id, slug, label, sort_order')
        .eq('is_active', true)
        .order('sort_order', { ascending: true }),
      supabase
        .from('product_type_specific_types')
        .select('product_type_id, value, label, sort_order')
        .eq('is_active', true)
        .order('sort_order', { ascending: true }),
      supabase
        .from('curricula')
        .select('value, label, sort_order')
        .eq('is_active', true)
        .order('sort_order', { ascending: true }),
      supabase
        .from('modalities')
        .select('value, label, sort_order')
        .eq('is_active', true)
        .order('sort_order', { ascending: true }),
      supabase
        .from('languages')
        .select('value, label, sort_order')
        .eq('is_active', true)
        .order('sort_order', { ascending: true }),
      supabase
        .from('teaching_frameworks')
        .select('value, label, sort_order')
        .eq('is_active', true)
        .order('sort_order', { ascending: true }),
      supabase
        .from('quarters')
        .select('value, label, sort_order')
        .eq('is_active', true)
        .order('sort_order', { ascending: true }),
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

    const grades = (gradesRes.data || []) as { id: string; name: string; sort_order: number }[]
    const strands = (strandsRes.data || []) as { id: string; name: string; code: string }[]
    type SubjectRow = { id: string; name: string; code: string }
    const gradeSubjectsRows = (gradeSubjectsRes.data || []) as Array<{ grade_id: string; subject: SubjectRow | SubjectRow[] | null }>
    const strandSubjectsRows = (strandSubjectsRes.data || []) as Array<{ strand_id: string; subject: SubjectRow | SubjectRow[] | null }>

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

    // Build productTypes and specificTypesByProductType (fallback to hardcoded if tables don't exist yet)
    const useDynamicCatalog =
      !productTypesRes.error &&
      !curriculaRes.error

    const PRODUCT_TYPES_FALLBACK = [
      { id: 'exams', slug: 'exams', label: 'Exams', sortOrder: 1 },
      { id: 'lesson_plans', slug: 'lesson_plans', label: 'Lesson Plans', sortOrder: 2 },
      { id: 'rpms', slug: 'rpms', label: 'RPMS', sortOrder: 3 },
      { id: 'posters', slug: 'posters', label: 'Posters', sortOrder: 4 },
      { id: 'tarpaulins', slug: 'tarpaulins', label: 'Tarpaulins', sortOrder: 5 },
    ]
    const productTypes = useDynamicCatalog
      ? ((productTypesRes.data || []) as { id: string; slug: string; label: string; sort_order: number }[]).map(
          (pt) => ({ id: pt.id, slug: pt.slug, label: pt.label, sort_order: pt.sort_order })
        )
      : PRODUCT_TYPES_FALLBACK.map((pt) => ({
          id: pt.id,
          slug: pt.slug,
          label: pt.label,
          sort_order: pt.sortOrder,
        }))

    const specificTypesRows = useDynamicCatalog
      ? ((specificTypesRes.data || []) as { product_type_id: string; value: string; label: string; sort_order: number }[])
      : []
    const slugById = Object.fromEntries(productTypes.map((pt) => [pt.id, pt.slug]))
    const specificTypesByProductType: Record<string, { value: string; label: string; sortOrder: number }[]> = {}
    if (useDynamicCatalog) {
      for (const st of specificTypesRows) {
        const slug = slugById[st.product_type_id]
        if (!slug) continue
        if (!specificTypesByProductType[slug]) specificTypesByProductType[slug] = []
        specificTypesByProductType[slug].push({
          value: st.value,
          label: st.label,
          sortOrder: st.sort_order,
        })
      }
      for (const slug of Object.keys(specificTypesByProductType)) {
        specificTypesByProductType[slug].sort((a, b) => a.sortOrder - b.sortOrder)
      }
    } else {
      specificTypesByProductType.exams = [
        { value: 'periodical_exam', label: 'Periodical Exam', sortOrder: 1 },
        { value: 'summative_test', label: 'Summative Test', sortOrder: 2 },
      ]
      specificTypesByProductType.lesson_plans = DOCUMENT_TYPES.map((d, i) => ({
        value: d.value,
        label: d.label,
        sortOrder: i + 1,
      }))
    }

    const toOption = (r: { value: string; label: string; sort_order?: number }, i?: number) => ({
      value: r.value,
      label: r.label,
      sortOrder: r.sort_order ?? i ?? 0,
    })
    const curricula = useDynamicCatalog
      ? ((curriculaRes.data || []) as { value: string; label: string; sort_order: number }[]).map(toOption)
      : CURRICULA.map((c, i) => toOption({ ...c, sort_order: i + 1 }, i + 1))
    const modalities = useDynamicCatalog
      ? ((modalitiesRes.data || []) as { value: string; label: string; sort_order: number }[]).map(toOption)
      : MODALITIES.map((m, i) => toOption({ ...m, sort_order: i + 1 }, i + 1))
    const languages = useDynamicCatalog
      ? ((languagesRes.data || []) as { value: string; label: string; sort_order: number }[]).map(toOption)
      : LANGUAGES.map((l, i) => toOption({ ...l, sort_order: i + 1 }, i + 1))
    const teachingFrameworks = useDynamicCatalog
      ? ((teachingFrameworksRes.data || []) as { value: string; label: string; sort_order: number }[]).map(toOption)
      : TEACHING_FRAMEWORKS.map((t, i) => toOption({ ...t, sort_order: i + 1 }, i + 1))
    const quarters = useDynamicCatalog
      ? ((quartersRes.data || []) as { value: string; label: string; sort_order: number }[]).map(toOption)
      : QUARTERS.map((q, i) => toOption({ ...q, sort_order: i + 1 }, i + 1))

    const response = {
      classTypes: ['regular'] as const,
      regular: {
        grades: grades.map((g) => ({ id: g.id, name: g.name, sortOrder: g.sort_order })),
        strands: strands.map((s) => ({ id: s.id, name: s.name, code: s.code })),
        subjectsByGrade,
        subjectsByStrand,
      },
      productTypes: productTypes.map((pt) => ({ id: pt.id, slug: pt.slug, label: pt.label, sortOrder: pt.sort_order })),
      specificTypesByProductType,
      curricula,
      modalities,
      languages,
      teachingFrameworks,
      quarters,
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
