'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Loader2, ChevronDown, ChevronUp, ChevronRight } from 'lucide-react'
import { MappingTreeSection } from '@/components/admin/catalog/mapping-tree-section'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/registry/default/collapsible/collapsible'
import { cn } from '@/lib/utils'

interface Grade {
  id: string
  name: string
  sort_order: number
}

interface Strand {
  id: string
  name: string
  code: string
  sort_order: number
}

interface Subject {
  id: string
  name: string
  code: string
}

const GRADE_11_12_NAMES = ['Grade 11', 'Grade 12']

function isGrade11Or12(grade: Grade) {
  return GRADE_11_12_NAMES.includes(grade.name)
}

export default function HierarchyMappingsPage() {
  const [grades, setGrades] = useState<Grade[]>([])
  const [strands, setStrands] = useState<Strand[]>([])
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [gradeMappings, setGradeMappings] = useState<{ grade_id: string; subject_id: string }[]>([])
  const [strandMappings, setStrandMappings] = useState<{ strand_id: string; subject_id: string }[]>([])
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set())
  const [savingKey, setSavingKey] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      setLoading(true)
      try {
        const [gRes, stRes, sRes, gmRes, smRes] = await Promise.all([
          fetch('/api/admin/catalog/grades'),
          fetch('/api/admin/catalog/strands'),
          fetch('/api/admin/catalog/subjects'),
          fetch('/api/admin/catalog/grade-subjects'),
          fetch('/api/admin/catalog/strand-subjects'),
        ])
        if (gRes.ok) setGrades(await gRes.json())
        if (stRes.ok) setStrands(await stRes.json())
        if (sRes.ok) setSubjects(await sRes.json())
        if (gmRes.ok) setGradeMappings(await gmRes.json())
        if (smRes.ok) setStrandMappings(await smRes.json())
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const getSubjectIdsForGrade = useCallback(
    (gradeId: string) =>
      gradeMappings.filter((m) => m.grade_id === gradeId).map((m) => m.subject_id),
    [gradeMappings]
  )

  const getSubjectIdsForStrand = useCallback(
    (strandId: string) =>
      strandMappings.filter((m) => m.strand_id === strandId).map((m) => m.subject_id),
    [strandMappings]
  )

  const toggleGradeSubject = (gradeId: string, subjectId: string) => {
    const current = getSubjectIdsForGrade(gradeId)
    const isSelected = current.includes(subjectId)
    const next = isSelected
      ? current.filter((id) => id !== subjectId)
      : [...current, subjectId]
    setGradeMappings((prev) => [
      ...prev.filter((m) => m.grade_id !== gradeId),
      ...next.map((subject_id) => ({ grade_id: gradeId, subject_id })),
    ])
  }

  const toggleStrandSubject = (strandId: string, subjectId: string) => {
    const current = getSubjectIdsForStrand(strandId)
    const isSelected = current.includes(subjectId)
    const next = isSelected
      ? current.filter((id) => id !== subjectId)
      : [...current, subjectId]
    setStrandMappings((prev) => [
      ...prev.filter((m) => m.strand_id !== strandId),
      ...next.map((subject_id) => ({ strand_id: strandId, subject_id })),
    ])
  }

  const saveGrade = async (gradeId: string) => {
    const key = `grade:${gradeId}`
    setSavingKey(key)
    try {
      const subjectIds = getSubjectIdsForGrade(gradeId)
      const res = await fetch('/api/admin/catalog/grade-subjects', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ grade_id: gradeId, subject_ids: subjectIds }),
      })
      if (res.ok) {
        const data = await res.json()
        setGradeMappings((prev) => [
          ...prev.filter((m) => m.grade_id !== gradeId),
          ...data,
        ])
      } else {
        const err = await res.json()
        alert(err.error || 'Failed to save')
      }
    } catch (err) {
      console.error(err)
    } finally {
      setSavingKey(null)
    }
  }

  const saveStrand = async (strandId: string) => {
    const key = `strand:${strandId}`
    setSavingKey(key)
    try {
      const subjectIds = getSubjectIdsForStrand(strandId)
      const res = await fetch('/api/admin/catalog/strand-subjects', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ strand_id: strandId, subject_ids: subjectIds }),
      })
      if (res.ok) {
        const data = await res.json()
        setStrandMappings((prev) => [
          ...prev.filter((m) => m.strand_id !== strandId),
          ...data,
        ])
      } else {
        const err = await res.json()
        alert(err.error || 'Failed to save')
      }
    } catch (err) {
      console.error(err)
    } finally {
      setSavingKey(null)
    }
  }

  const allExpandKeys = (): string[] => {
    const keys: string[] = []
    grades.forEach((g) => {
      keys.push(`grade:${g.id}`)
      if (isGrade11Or12(g)) {
        keys.push(`grade:${g.id}:core`)
        strands.forEach((st) => keys.push(`grade:${g.id}:strand:${st.id}`))
      }
    })
    return keys
  }

  const expandAll = () => setExpandedIds(new Set(allExpandKeys()))
  const collapseAll = () => setExpandedIds(new Set())

  const toggleExpand = (key: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" />
        Loading...
      </div>
    )
  }

  const sortedGrades = [...grades].sort((a, b) => a.sort_order - b.sort_order)
  const sortedStrands = [...strands].sort((a, b) => a.sort_order - b.sort_order)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Hierarchy Mappings</h1>
        <p className="text-muted-foreground mt-1">
          Assign subjects per grade. For Grade 11/12, Core subjects and strand-specific subjects are managed separately.
        </p>
      </div>

      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Button variant="outline" size="sm" onClick={expandAll}>
            <ChevronDown className="h-4 w-4 mr-1" />
            Expand all
          </Button>
          <Button variant="outline" size="sm" onClick={collapseAll}>
            <ChevronUp className="h-4 w-4 mr-1" />
            Collapse all
          </Button>
        </div>

        <div className="space-y-2">
          {sortedGrades.map((grade) => {
            if (isGrade11Or12(grade)) {
              const gradeKey = `grade:${grade.id}`
              const isGradeExpanded = expandedIds.has(gradeKey)
              return (
                <Collapsible
                  key={grade.id}
                  open={isGradeExpanded}
                  onOpenChange={(open) => open !== isGradeExpanded && toggleExpand(gradeKey)}
                >
                  <div className="border rounded-lg overflow-hidden">
                    <CollapsibleTrigger
                      className={cn(
                        'flex w-full items-center gap-2 px-4 py-3 text-left hover:bg-muted/50 transition-colors',
                        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2'
                      )}
                    >
                      <ChevronRight
                        className={cn(
                          'h-4 w-4 shrink-0 text-muted-foreground transition-transform',
                          isGradeExpanded && 'rotate-90'
                        )}
                      />
                      <span className="font-medium flex-1">{grade.name}</span>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <div className="border-t bg-muted/10 space-y-2 p-2">
                        {/* Core section */}
                        <div>
                          <MappingTreeSection
                            id={`${grade.id}:core`}
                            label="Core"
                            indentLevel={1}
                            subjects={subjects}
                            selectedSubjectIds={getSubjectIdsForGrade(grade.id)}
                            onToggle={(subjectId) => toggleGradeSubject(grade.id, subjectId)}
                            onSave={() => saveGrade(grade.id)}
                            isExpanded={expandedIds.has(`grade:${grade.id}:core`)}
                            onToggleExpand={() => toggleExpand(`grade:${grade.id}:core`)}
                            saving={savingKey === `grade:${grade.id}`}
                          />
                        </div>
                        {/* Strand sections */}
                        {sortedStrands.map((strand) => (
                          <div key={strand.id}>
                            <MappingTreeSection
                              id={`${grade.id}:strand:${strand.id}`}
                              label={strand.name}
                              indentLevel={1}
                              subLabel={strand.code}
                              subjects={subjects}
                              selectedSubjectIds={getSubjectIdsForStrand(strand.id)}
                              onToggle={(subjectId) => toggleStrandSubject(strand.id, subjectId)}
                              onSave={() => saveStrand(strand.id)}
                              isExpanded={expandedIds.has(`grade:${grade.id}:strand:${strand.id}`)}
                              onToggleExpand={() => toggleExpand(`grade:${grade.id}:strand:${strand.id}`)}
                              saving={savingKey === `strand:${strand.id}`}
                            />
                          </div>
                        ))}
                      </div>
                    </CollapsibleContent>
                  </div>
                </Collapsible>
              )
            }

            return (
              <MappingTreeSection
                key={grade.id}
                id={grade.id}
                label={grade.name}
                subjects={subjects}
                selectedSubjectIds={getSubjectIdsForGrade(grade.id)}
                onToggle={(subjectId) => toggleGradeSubject(grade.id, subjectId)}
                onSave={() => saveGrade(grade.id)}
                isExpanded={expandedIds.has(`grade:${grade.id}`)}
                onToggleExpand={() => toggleExpand(`grade:${grade.id}`)}
                saving={savingKey === `grade:${grade.id}`}
              />
            )
          })}
        </div>
      </Card>
    </div>
  )
}
