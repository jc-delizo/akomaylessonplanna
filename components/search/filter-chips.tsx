'use client'

import { useState, useEffect } from 'react'
import { X, XCircle } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

interface FilterChip {
  key: string
  label: string
  value: string
}

interface FilterChipsProps {
  filters: Record<string, any>
  onRemove: (key: string) => void
  onClearAll: () => void
  resultCount?: number
}

export function FilterChips({ filters, onRemove, onClearAll, resultCount }: FilterChipsProps) {
  const [grades, setGrades] = useState<{ id: string; name: string }[]>([])
  const [subjects, setSubjects] = useState<{ id: string; name: string }[]>([])
  const [strands, setStrands] = useState<{ id: string; name: string }[]>([])
  const [productTypes, setProductTypes] = useState<{ slug: string; label: string }[]>([])
  const [specificTypesByProductType, setSpecificTypesByProductType] = useState<Record<string, { value: string; label: string }[]>>({})
  const [curricula, setCurricula] = useState<{ value: string; label: string }[]>([])
  const [modalities, setModalities] = useState<{ value: string; label: string }[]>([])
  const [languages, setLanguages] = useState<{ value: string; label: string }[]>([])

  // Fetch lesson-plan config once (grades, strands, subjectsByGrade, productTypes, curricula, modalities, languages)
  useEffect(() => {
    async function fetchConfig() {
      try {
        const response = await fetch('/api/lesson-plan-config')
        if (response.ok) {
          const data = await response.json()
          setGrades(data.regular?.grades ?? [])
          setStrands(data.regular?.strands ?? [])
          setProductTypes(data.productTypes ?? [])
          setSpecificTypesByProductType(data.specificTypesByProductType ?? {})
          setCurricula(data.curricula ?? [])
          setModalities(data.modalities ?? [])
          setLanguages(data.languages ?? [])
        }
      } catch (err) {
        console.error('Error fetching lesson-plan config:', err)
      }
    }
    fetchConfig()
  }, [])

  // Resolve subjects from config when grade_id
  useEffect(() => {
    if (!filters.grade_id && !filters.subject_id) {
      setSubjects([])
      return
    }
    async function fetchConfig() {
      try {
        const response = await fetch('/api/lesson-plan-config')
        if (response.ok) {
          const data = await response.json()
          if (filters.grade_id) {
            const byGrade = (data.regular?.subjectsByGrade ?? {})[filters.grade_id] ?? []
            const strandId = filters.strand_id
            const byStrand = strandId ? ((data.regular?.subjectsByStrand ?? {})[strandId] ?? []) : []
            setSubjects([...byGrade, ...byStrand].filter((s: { id: string }, i: number, arr: { id: string }[]) => arr.findIndex((x) => x.id === s.id) === i))
          } else {
            setSubjects([])
          }
        }
      } catch (err) {
        console.error('Error fetching lesson-plan config:', err)
      }
    }
    fetchConfig()
  }, [filters.grade_id, filters.strand_id, filters.subject_id])

  // Helper function to resolve grade name
  const getGradeName = (gradeId: string): string => {
    if (filters.grade_name) {
      return filters.grade_name
    }
    const grade = grades.find((g) => g.id === gradeId)
    return grade?.name || gradeId
  }

  // Helper function to resolve subject name
  const getSubjectName = (subjectId: string): string => {
    if (filters.subject_name) {
      return filters.subject_name
    }
    const subject = subjects.find((s) => s.id === subjectId)
    return subject?.name || subjectId
  }

  // Convert filters to chips
  const chips: FilterChip[] = []

  // Strand filter
  if (filters.strand_id) {
    const strandName = strands.find((s) => s.id === filters.strand_id)?.name ?? filters.strand_id
    chips.push({ key: 'strand_id', label: 'Strand', value: strandName })
  }

  // Grade filter
  if (filters.grade_id) {
    chips.push({
      key: 'grade_id',
      label: 'Grade',
      value: getGradeName(filters.grade_id)
    })
  }

  // Subject filter (Phase B: subject_ids multiselect; label "Subject(s)" per Todo 12)
  const subjectIds = (filters.subject_ids && Array.isArray(filters.subject_ids) ? filters.subject_ids : filters.subject_id ? [filters.subject_id] : []) as string[]
  if (subjectIds.length > 0) {
    const value = subjectIds.map((id) => getSubjectName(id)).filter(Boolean).join(', ')
    chips.push({
      key: 'subject_ids',
      label: 'Subject(s)',
      value
    })
  }

  // Product type filter
  if (filters.product_type) {
    const ptLabel = productTypes.find((pt) => pt.slug === filters.product_type)?.label ?? filters.product_type.replace('_', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())
    chips.push({
      key: 'product_type',
      label: 'Type',
      value: ptLabel
    })
  }

  // Document type / specific type (any product type with specific types)
  const documentType = filters.document_type || filters.specific_type
  if (documentType) {
    const productTypeSlug = filters.product_type || 'lesson_plans'
    const specificTypes = specificTypesByProductType[productTypeSlug] ?? []
    const docLabel = specificTypes.find((d) => d.value === documentType)?.label ?? documentType.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())
    chips.push({
      key: 'document_type',
      label: 'Document type',
      value: docLabel
    })
  }

  // Quarter filter
  if (filters.quarter) {
    chips.push({
      key: 'quarter',
      label: 'Quarter',
      value: `Q${filters.quarter}`
    })
  }

  // Weeks filter (array shown as "1, 2, 3")
  if (filters.weeks && Array.isArray(filters.weeks) && filters.weeks.length > 0) {
    chips.push({
      key: 'weeks',
      label: 'Weeks',
      value: filters.weeks.slice().sort((a: number, b: number) => a - b).join(', ')
    })
  }

  // Modalities filter (array of values -> labels)
  if (filters.modalities && Array.isArray(filters.modalities) && filters.modalities.length > 0) {
    const labels = filters.modalities
      .map((v: string) => modalities.find((m) => m.value === v)?.label ?? v)
      .join(', ')
    chips.push({
      key: 'modalities',
      label: 'Modality',
      value: labels
    })
  }

  // Curriculum filter
  if (filters.curriculum) {
    const curLabel = curricula.find((c) => c.value === filters.curriculum)?.label ?? filters.curriculum
    chips.push({
      key: 'curriculum',
      label: 'Curriculum',
      value: curLabel
    })
  }

  // Price range filter
  if (filters.min_price || filters.max_price) {
    const min = filters.min_price ? `₱${parseFloat(filters.min_price).toFixed(0)}` : ''
    const max = filters.max_price ? `₱${parseFloat(filters.max_price).toFixed(0)}` : ''
    chips.push({
      key: 'price_range',
      label: 'Price',
      value: min && max ? `${min} - ${max}` : min || max
    })
  }

  // Language filter
  if (filters.language) {
    const langLabel = languages.find((l) => l.value === filters.language)?.label ?? filters.language
    chips.push({
      key: 'language',
      label: 'Language',
      value: langLabel
    })
  }

  // Verified seller filter
  if (filters.verified_seller_only === 'true' || filters.verified_seller_only === true) {
    chips.push({
      key: 'verified_seller_only',
      label: 'Verified Sellers',
      value: 'Only'
    })
  }

  // Date added filter
  if (filters.date_added) {
    const dateLabels: Record<string, string> = {
      last_7_days: 'Last 7 Days',
      last_30_days: 'Last 30 Days',
      last_3_months: 'Last 3 Months'
    }
    chips.push({
      key: 'date_added',
      label: 'Date Added',
      value: dateLabels[filters.date_added] || filters.date_added
    })
  }

  if (chips.length === 0) {
    return null
  }

  return (
    <div className="flex flex-wrap items-center gap-2 mb-4">
      <span className="text-sm text-gray-600 mr-2">
        {resultCount !== undefined && `${resultCount} results`}
      </span>
      {chips.map((chip) => (
        <Badge
          key={chip.key}
          variant="secondary"
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-purple-50 text-purple-900 border border-purple-200 hover:bg-purple-100 transition-colors"
        >
          <span className="font-medium">{chip.label}:</span>
          <span>{chip.value}</span>
          <button
            onClick={() => onRemove(chip.key)}
            className="ml-1.5 group relative flex items-center justify-center w-4 h-4 rounded-full hover:bg-purple-200 active:bg-purple-300 transition-all duration-200 hover:scale-110 active:scale-95"
            aria-label={`Remove ${chip.label} filter`}
          >
            <X className="w-3.5 h-3.5 text-purple-700 group-hover:text-purple-900 transition-colors" strokeWidth={2.5} />
          </button>
        </Badge>
      ))}
      {chips.length > 0 && (
        <Button
          onClick={onClearAll}
          variant="outline"
          size="sm"
          className="text-sm font-medium text-purple-600 border-purple-200 hover:bg-purple-50 hover:border-purple-300 hover:text-purple-700 transition-all duration-200 h-8 px-3"
        >
          <XCircle className="w-3.5 h-3.5 mr-1.5" />
          Clear all
        </Button>
      )}
    </div>
  )
}
