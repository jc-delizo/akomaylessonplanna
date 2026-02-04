'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Card } from '@/components/ui/card'
import { WEEKS_OPTIONS, SUBJECT_SELECTION } from '@/lib/config/lesson-plan-config'

interface FilterSidebarProps {
  onFilterChange: (filters: Record<string, any>) => void
  initialFilters?: Record<string, any>
  isMobile?: boolean
  onClose?: () => void
  resultCount?: number
}

const SORT_OPTIONS = [
  { value: 'relevance', label: 'Most Relevant' },
  { value: 'newest', label: 'Newest First' },
  { value: 'best_selling', label: 'Best Selling' },
  { value: 'highest_rated', label: 'Highest Rated' },
  { value: 'price_asc', label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
]

export function FilterSidebar({ 
  onFilterChange, 
  initialFilters = {},
  isMobile = false,
  onClose,
  resultCount
}: FilterSidebarProps) {
  const [filters, setFilters] = useState<Record<string, any>>(initialFilters || {})
  const [hierarchy, setHierarchy] = useState<{
    regular: { grades: { id: string; name: string; sortOrder: number }[]; strands: { id: string; name: string; code: string }[]; subjectsByGrade: Record<string, { id: string; name: string; code: string }[]>; subjectsByStrand: Record<string, { id: string; name: string; code: string }[]> }
  } | null>(null)
  const [productTypes, setProductTypes] = useState<{ id: string; slug: string; label: string; sortOrder: number }[]>([])
  const [specificTypesByProductType, setSpecificTypesByProductType] = useState<Record<string, { value: string; label: string; sortOrder: number }[]>>({})
  const [curricula, setCurricula] = useState<{ value: string; label: string; sortOrder: number }[]>([])
  const [modalities, setModalities] = useState<{ value: string; label: string; sortOrder: number }[]>([])
  const [languages, setLanguages] = useState<{ value: string; label: string; sortOrder: number }[]>([])
  const [quarters, setQuarters] = useState<{ value: string; label: string; sortOrder: number }[]>([])

  // Sync from URL/parent when initialFilters changes
  useEffect(() => {
    setFilters(initialFilters || {})
  }, [initialFilters])

  // Fetch full hierarchy and catalog from lesson-plan-config
  useEffect(() => {
    async function fetchHierarchy() {
      try {
        const response = await fetch('/api/lesson-plan-config')
        if (response.ok) {
          const data = await response.json()
          setHierarchy({
            regular: { grades: data.regular.grades, strands: data.regular.strands, subjectsByGrade: data.regular.subjectsByGrade || {}, subjectsByStrand: data.regular.subjectsByStrand || {} },
          })
          setProductTypes(data.productTypes || [])
          setSpecificTypesByProductType(data.specificTypesByProductType || {})
          setCurricula(data.curricula || [])
          setModalities(data.modalities || [])
          setLanguages(data.languages || [])
          setQuarters(data.quarters || [])
        }
      } catch (err) {
        console.error('Error fetching lesson-plan config:', err)
      }
    }
    fetchHierarchy()
  }, [])

  const grades = hierarchy?.regular?.grades ?? []
  const strands = hierarchy?.regular?.strands ?? []
  const selectedGrade = grades.find((g) => g.id === filters.grade_id)
  const isGrade11Or12 = selectedGrade && (selectedGrade.name === 'Grade 11' || selectedGrade.name === 'Grade 12')
  const subjects = filters.grade_id
    ? [
        ...(hierarchy?.regular?.subjectsByGrade?.[filters.grade_id] ?? []),
        ...(isGrade11Or12 && filters.strand_id ? (hierarchy?.regular?.subjectsByStrand?.[filters.strand_id] ?? []) : []),
      ].filter((s, i, arr) => arr.findIndex((x) => x.id === s.id) === i)
    : []

  const updateFilter = (key: string, value: any) => {
    const newFilters = { ...filters }
    const normalized = value === '' || value === null || value === undefined || value === 'all' || value === false

    if (normalized) {
      delete newFilters[key]
    } else {
      newFilters[key] = value
    }

    if (key === 'grade_id') {
      delete newFilters.subject_id
      delete newFilters.subject_ids
      if (normalized) {
        delete newFilters.strand_id
      } else {
        const g = grades.find((x) => x.id === value)
        if (!g || (g.name !== 'Grade 11' && g.name !== 'Grade 12')) {
          delete newFilters.strand_id
        }
      }
    }
    // Phase B: when strand changes (G11/12), subject list changes — clear subject selection
    if (key === 'strand_id') {
      delete newFilters.subject_id
      delete newFilters.subject_ids
    }

    setFilters(newFilters)
    onFilterChange(newFilters)
  }

  // Normalize weeks to always be an array
  const getSelectedWeeks = (): number[] => {
    if (!filters.weeks) return []
    return Array.isArray(filters.weeks) ? filters.weeks : [filters.weeks]
  }

  const toggleWeek = (week: number) => {
    const selectedWeeks = getSelectedWeeks()
    const isSelected = selectedWeeks.includes(week)
    
    const newWeeks = isSelected
      ? selectedWeeks.filter(w => w !== week)
      : [...selectedWeeks, week]
    
    updateFilter('weeks', newWeeks.length > 0 ? newWeeks : null)
  }

  const getSelectedModalities = (): string[] => {
    if (!filters.modalities) return []
    return Array.isArray(filters.modalities) ? filters.modalities : [filters.modalities]
  }

  const toggleModality = (value: string) => {
    const selected = getSelectedModalities()
    const isSelected = selected.includes(value)
    const next = isSelected ? selected.filter((m) => m !== value) : [...selected, value]
    updateFilter('modalities', next.length > 0 ? next : null)
  }

  return (
    <Card className={`p-4 ${isMobile ? 'h-full overflow-y-auto' : ''}`}>
      {/* Mobile Header */}
      {isMobile && (
        <div className="flex items-center justify-between mb-6 pb-4 border-b">
          <h3 className="font-semibold text-lg">Filters</h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Close filters"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      <div className="space-y-4">
        {/* Product Type */}
        <div>
          <Label htmlFor="product_type" className="text-sm font-medium text-gray-700 mb-2 block">
            Product Type
          </Label>
          <Select
            value={filters.product_type || 'all'}
            onValueChange={(value) => {
              updateFilter('product_type', value)
              if (value !== 'lesson_plans') updateFilter('document_type', null)
            }}
          >
            <SelectTrigger id="product_type">
              <SelectValue placeholder="All Types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              {productTypes.map((type) => (
                <SelectItem key={type.slug} value={type.slug}>
                  {type.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Document Type (Lesson Plans only) */}
        {filters.product_type === 'lesson_plans' && (
          <div>
            <Label htmlFor="document_type" className="text-sm font-medium text-gray-700 mb-2 block">
              Document Type
            </Label>
            <Select
              value={filters.document_type || filters.specific_type || 'all'}
              onValueChange={(value) => updateFilter('document_type', value === 'all' ? null : value)}
            >
              <SelectTrigger id="document_type">
                <SelectValue placeholder="All (DLL / DLP)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All (DLL / DLP)</SelectItem>
                {(specificTypesByProductType['lesson_plans'] || []).map((d) => (
                  <SelectItem key={d.value} value={d.value}>
                    {d.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Curriculum */}
        <div>
          <Label htmlFor="curriculum" className="text-sm font-medium text-gray-700 mb-2 block">
            Curriculum
          </Label>
          <Select
            value={filters.curriculum || 'all'}
            onValueChange={(value) => updateFilter('curriculum', value === 'all' ? null : value)}
          >
            <SelectTrigger id="curriculum">
              <SelectValue placeholder="All curricula" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All curricula</SelectItem>
              {curricula.map((c) => (
                <SelectItem key={c.value} value={c.value}>
                  {c.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Grade Level */}
        <div>
          <Label htmlFor="grade_id" className="text-sm font-medium text-gray-700 mb-2 block">
            Grade Level
          </Label>
            <Select
              value={filters.grade_id || 'all'}
              onValueChange={(value) => updateFilter('grade_id', value === 'all' ? null : value)}
            >
              <SelectTrigger id="grade_id">
                <SelectValue placeholder="All Grades" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Grades</SelectItem>
                {grades.map((grade) => (
                  <SelectItem key={grade.id} value={grade.id}>
                    {grade.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
        </div>

        {/* Strand — when Grade 11 or 12 */}
        {isGrade11Or12 && (
          <div>
            <Label htmlFor="strand_id" className="text-sm font-medium text-gray-700 mb-2 block">
              Strand
            </Label>
            <Select
              value={filters.strand_id || 'all'}
              onValueChange={(v) => updateFilter('strand_id', v === 'all' ? null : v)}
            >
              <SelectTrigger id="strand_id">
                <SelectValue placeholder="All strands" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All strands</SelectItem>
                {strands.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Subject: SUBJECT_SELECTION === 'multi' (Phase B) */}
        <div>
          <Label className="text-sm font-medium text-gray-700 mb-2 block">
            {SUBJECT_SELECTION === 'multi' ? 'Subjects (any of)' : 'Subject'}
          </Label>
          <div className="max-h-40 overflow-y-auto rounded-md border p-2 space-y-1.5">
            {subjects.length === 0 ? (
              <p className="text-xs text-muted-foreground">Select grade and strand first</p>
            ) : (
              subjects.map((subject) => {
                const sidList = Array.isArray(filters.subject_ids) ? filters.subject_ids : (filters.subject_id ? [filters.subject_id] : [])
                const checked = sidList.includes(subject.id)
                return (
                  <div key={subject.id} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id={`filter-subject-${subject.id}`}
                      checked={checked}
                      disabled={subjects.length === 0}
                      onChange={() => {
                        const next = checked
                          ? sidList.filter((id) => id !== subject.id)
                          : [...sidList, subject.id]
                        const newFilters = { ...filters, subject_ids: next.length ? next : undefined, subject_id: next[0] || undefined }
                        if (next.length === 0) {
                          delete newFilters.subject_ids
                          delete newFilters.subject_id
                        }
                        setFilters(newFilters)
                        onFilterChange(newFilters)
                      }}
                      className="h-4 w-4 rounded border-gray-300"
                    />
                    <label htmlFor={`filter-subject-${subject.id}`} className="text-sm cursor-pointer flex-1">
                      {subject.name}
                    </label>
                  </div>
                )
              })
            )}
          </div>
        </div>

        {/* Quarter */}
        <div>
          <Label htmlFor="quarter" className="text-sm font-medium text-gray-700 mb-2 block">
            Quarter
          </Label>
          <Select
            value={filters.quarter || 'all'}
            onValueChange={(value) => updateFilter('quarter', value)}
          >
            <SelectTrigger id="quarter">
              <SelectValue placeholder="All Quarters" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Quarters</SelectItem>
              {quarters.map((q) => (
                <SelectItem key={q.value} value={q.value}>
                  {q.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Language of instruction */}
        <div>
          <Label htmlFor="language" className="text-sm font-medium text-gray-700 mb-2 block">
            Language of instruction
          </Label>
          <Select
            value={filters.language || 'all'}
            onValueChange={(value) => updateFilter('language', value === 'all' ? null : value)}
          >
            <SelectTrigger id="language">
              <SelectValue placeholder="Select language" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All languages</SelectItem>
              {languages.map((lang) => (
                <SelectItem key={lang.value} value={lang.value}>
                  {lang.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Modality (multiselect) */}
        <div>
          <Label className="text-sm font-medium text-gray-700 mb-2 block">
            Modality
          </Label>
          <div className="flex flex-wrap gap-2">
            {modalities.map((mod) => {
              const selected = getSelectedModalities()
              const isSelected = selected.includes(mod.value)
              return (
                <button
                  key={mod.value}
                  type="button"
                  onClick={() => toggleModality(mod.value)}
                  className={`rounded-md border px-2 py-1.5 text-xs font-medium transition-all ${
                    isSelected
                      ? 'bg-purple-600 text-white border-purple-600'
                      : 'bg-white text-gray-700 border-gray-200 hover:border-purple-300 hover:bg-purple-50'
                  }`}
                >
                  {mod.label}
                </button>
              )
            })}
          </div>
        </div>

        {/* Weeks (1–9, multiselect) */}
        <div>
          <Label className="text-sm font-medium text-gray-700 mb-2 block">
            Weeks
          </Label>
          <div className="grid grid-cols-5 gap-0.5">
            {WEEKS_OPTIONS.map((week) => {
              const selectedWeeks = getSelectedWeeks()
              const isSelected = selectedWeeks.includes(week)
              
              return (
                <button
                  key={week}
                  type="button"
                  onClick={() => toggleWeek(week)}
                  className={`h-8 w-8 rounded-md border text-xs font-medium transition-all flex items-center justify-center ${
                    isSelected
                      ? 'bg-purple-600 text-white border-purple-600 shadow-sm'
                      : 'bg-white text-gray-700 border-gray-200 hover:border-purple-300 hover:bg-purple-50'
                  }`}
                >
                  {week}
                </button>
              )
            })}
          </div>
        </div>

        {/* Sort By */}
        <div>
          <Label htmlFor="sort" className="text-sm font-medium text-gray-700 mb-2 block">
            Sort By
          </Label>
          <Select
            value={filters.sort || 'relevance'}
            onValueChange={(value) => updateFilter('sort', value)}
          >
            <SelectTrigger id="sort">
              <SelectValue placeholder="Sort by..." />
            </SelectTrigger>
            <SelectContent>
              {SORT_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Mobile Footer with Apply Button */}
      {isMobile && (
        <div className="sticky bottom-0 bg-white border-t pt-4 mt-6 -mx-6 -mb-6 px-6 pb-6">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-gray-700">
              {resultCount !== undefined ? `${resultCount} results` : 'Apply filters'}
            </span>
          </div>
          <Button
            onClick={() => {
              onFilterChange(filters)
              onClose?.()
            }}
            className="w-full h-11 text-base font-medium"
          >
            Show Results
          </Button>
        </div>
      )}
    </Card>
  )
}
