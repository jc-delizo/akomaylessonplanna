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
  const [grades, setGrades] = useState<any[]>([])
  const [subjects, setSubjects] = useState<any[]>([])

  // Fetch grades on mount
  useEffect(() => {
    async function fetchGrades() {
      try {
        const response = await fetch('/api/grades')
        if (response.ok) {
          const { grades: fetchedGrades } = await response.json()
          setGrades(fetchedGrades || [])
        }
      } catch (err) {
        console.error('Error fetching grades:', err)
      }
    }

    fetchGrades()
  }, [])

  // Fetch subjects when grade_id is present
  useEffect(() => {
    async function fetchSubjects() {
      if (!filters.grade_id) {
        setSubjects([])
        return
      }

      try {
        const response = await fetch(`/api/grades/${filters.grade_id}/subjects`)
        if (response.ok) {
          const { subjects: fetchedSubjects } = await response.json()
          setSubjects(fetchedSubjects || [])
        }
      } catch (err) {
        console.error('Error fetching subjects:', err)
      }
    }

    fetchSubjects()
  }, [filters.grade_id])

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

  // Grade filter
  if (filters.grade_id) {
    chips.push({
      key: 'grade_id',
      label: 'Grade',
      value: getGradeName(filters.grade_id)
    })
  }

  // Subject filter
  if (filters.subject_id) {
    chips.push({
      key: 'subject_id',
      label: 'Subject',
      value: getSubjectName(filters.subject_id)
    })
  }

  // Product type filter
  if (filters.product_type) {
    chips.push({
      key: 'product_type',
      label: 'Type',
      value: filters.product_type.replace('_', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())
    })
  }

  // Specific type filter
  if (filters.specific_type) {
    chips.push({
      key: 'specific_type',
      label: 'Specific Type',
      value: filters.specific_type
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
    chips.push({
      key: 'language',
      label: 'Language',
      value: filters.language.charAt(0).toUpperCase() + filters.language.slice(1)
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
