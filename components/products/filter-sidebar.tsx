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

interface FilterSidebarProps {
  onFilterChange: (filters: Record<string, any>) => void
  initialFilters?: Record<string, any>
  isMobile?: boolean
  onClose?: () => void
  resultCount?: number
}

const PRODUCT_TYPES = [
  { value: 'exams', label: 'Exams' },
  { value: 'lesson_plans', label: 'Lesson Plans' },
  { value: 'rpms', label: 'RPMS' },
  { value: 'posters', label: 'Posters' },
  { value: 'tarpaulins', label: 'Tarpaulins' },
]

const QUARTERS = [
  { value: '1', label: 'Quarter 1' },
  { value: '2', label: 'Quarter 2' },
  { value: '3', label: 'Quarter 3' },
  { value: '4', label: 'Quarter 4' },
]

const WEEKS = [1, 2, 3, 4, 5, 6, 7, 8]

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
  const [filters, setFilters] = useState<Record<string, any>>(initialFilters)
  const [grades, setGrades] = useState<any[]>([])
  const [subjects, setSubjects] = useState<any[]>([])

  // Fetch grades
  useEffect(() => {
    async function fetchGrades() {
      try {
        const response = await fetch('/api/grades')
        if (response.ok) {
          const { grades: fetchedGrades } = await response.json()
          setGrades(fetchedGrades)
        }
      } catch (err) {
        console.error('Error fetching grades:', err)
      }
    }

    fetchGrades()
  }, [])

  // Fetch subjects when grade changes
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
          setSubjects(fetchedSubjects)
        }
      } catch (err) {
        console.error('Error fetching subjects:', err)
      }
    }

    fetchSubjects()
  }, [filters.grade_id])

  const updateFilter = (key: string, value: any) => {
    const newFilters = { ...filters }
    
    if (value === '' || value === null || value === undefined || value === 'all' || value === false) {
      delete newFilters[key]
    } else {
      newFilters[key] = value
    }

    // If grade changes, clear subject
    if (key === 'grade_id') {
      delete newFilters.subject_id
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
            onValueChange={(value) => updateFilter('product_type', value)}
          >
            <SelectTrigger id="product_type">
              <SelectValue placeholder="All Types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              {PRODUCT_TYPES.map((type) => (
                <SelectItem key={type.value} value={type.value}>
                  {type.label}
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
            onValueChange={(value) => updateFilter('grade_id', value)}
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

        {/* Subject */}
        <div>
          <Label htmlFor="subject_id" className="text-sm font-medium text-gray-700 mb-2 block">
            Subject
          </Label>
          <Select
            value={filters.subject_id || 'all'}
            onValueChange={(value) => updateFilter('subject_id', value)}
            disabled={!filters.grade_id}
          >
            <SelectTrigger id="subject_id">
              <SelectValue placeholder="All Subjects" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Subjects</SelectItem>
              {subjects.map((subject) => (
                <SelectItem key={subject.id} value={subject.id}>
                  {subject.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
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
              {QUARTERS.map((q) => (
                <SelectItem key={q.value} value={q.value}>
                  {q.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Weeks */}
        <div>
          <Label className="text-sm font-medium text-gray-700 mb-2 block">
            Weeks
          </Label>
          <div className="grid grid-cols-4 gap-0.5">
            {WEEKS.map((week) => {
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
