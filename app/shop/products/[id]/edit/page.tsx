'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { Card } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import {
  WEEKS_OPTIONS,
  MODALITIES,
  LANGUAGES,
  CURRICULA,
  TEACHING_FRAMEWORKS,
  CLASS_TYPES,
  LEARNER_PATHS,
} from '@/lib/config/lesson-plan-config'

const PRODUCT_TYPES = [
  { value: 'exams', label: 'Exams' },
  { value: 'lesson_plans', label: 'Lesson Plans' },
  { value: 'rpms', label: 'RPMS' },
  { value: 'posters', label: 'Posters' },
  { value: 'tarpaulins', label: 'Tarpaulins' },
]

const SPECIFIC_TYPES: Record<string, Array<{ value: string; label: string }>> = {
  exams: [
    { value: 'periodical_exam', label: 'Periodical Exam' },
    { value: 'summative_test', label: 'Summative Test' },
  ],
  lesson_plans: [
    { value: 'dll', label: 'DLL (Daily Lesson Log)' },
    { value: 'dlp', label: 'DLP (Detailed Lesson Plan)' },
  ],
}

const QUARTERS = [
  { value: '1', label: 'Quarter 1' },
  { value: '2', label: 'Quarter 2' },
  { value: '3', label: 'Quarter 3' },
  { value: '4', label: 'Quarter 4' },
]

const WEEKS = [...WEEKS_OPTIONS]

interface FormData {
  title: string
  product_type: string
  specific_type: string
  description: string
  class_type?: string
  learner_path?: string
  grade_id: string
  subject_id: string
  subject_ids: string[]
  strand_id?: string
  sped_level_id?: string
  quarter: string
  weeks: number[]
  language?: string
  curriculum?: string
  modalities?: string[]
  teaching_framework?: string
  file_urls: string[]
  cover_image_url?: string
  price: number
  changelog?: string
  is_major_update?: boolean
}

interface PageProps {
  params: Promise<{ id: string }>
}

export default function EditProductPage({ params }: PageProps) {
  const router = useRouter()
  const [productId, setProductId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hierarchy, setHierarchy] = useState<{
    regular: { grades: { id: string; name: string; sortOrder: number }[]; strands: { id: string; name: string; code: string }[]; subjectsByGrade: Record<string, { id: string; name: string; code: string }[]>; subjectsByStrand: Record<string, { id: string; name: string; code: string }[]> }
    sped: { levels: { id: string; name: string; sortOrder: number }[]; spedSubjects: { id: string; name: string; code: string }[] }
  } | null>(null)
  const [originalProduct, setOriginalProduct] = useState<any>(null)

  const [formData, setFormData] = useState<FormData>({
    title: '',
    product_type: '',
    specific_type: '',
    description: '',
    grade_id: '',
    subject_id: '',
    subject_ids: [],
    quarter: '',
    weeks: [],
    language: '',
    curriculum: '',
    modalities: [],
    teaching_framework: '',
    file_urls: [],
    price: 50,
    changelog: '',
  })

  const [validation, setValidation] = useState<Record<string, string>>({})

  // Unwrap params
  useEffect(() => {
    params.then((p) => setProductId(p.id))
  }, [params])

  // Fetch product data
  useEffect(() => {
    if (!productId) return

    async function fetchProduct() {
      try {
        const response = await fetch(`/api/products/${productId}`)
        
        if (response.status === 404) {
          setError('Product not found')
          return
        }

        if (!response.ok) {
          throw new Error('Failed to fetch product')
        }

        const { product } = await response.json()
        setOriginalProduct(product)

        // Populate form (include Phase 2 hierarchy fields)
        setFormData({
          title: product.title,
          product_type: product.product_type,
          specific_type: product.specific_type || '',
          description: product.description,
          class_type: product.class_type || undefined,
          learner_path: product.learner_path || undefined,
          grade_id: product.grade_id || '',
          subject_id: product.subject_id || '',
          subject_ids: Array.isArray(product.subject_ids) && product.subject_ids.length > 0 ? product.subject_ids : (product.subject_id ? [product.subject_id] : []),
          strand_id: product.strand_id || undefined,
          sped_level_id: product.sped_level_id || undefined,
          quarter: product.quarter?.toString() || '',
          weeks: product.weeks || [],
          language: product.language || '',
          curriculum: product.curriculum || '',
          modalities: product.modalities || [],
          teaching_framework: product.teaching_framework || '',
          file_urls: product.file_urls || [],
          cover_image_url: product.cover_image_url || '',
          price: product.price,
          changelog: '',
        })

        setLoading(false)
      } catch (err) {
        console.error('Error fetching product:', err)
        setError('Failed to load product')
        setLoading(false)
      }
    }

    fetchProduct()
  }, [productId])

  // Fetch lesson-plan hierarchy
  useEffect(() => {
    async function fetchHierarchy() {
      try {
        const response = await fetch('/api/lesson-plan-config')
        if (response.ok) {
          const data = await response.json()
          setHierarchy({
            regular: { grades: data.regular.grades, strands: data.regular.strands, subjectsByGrade: data.regular.subjectsByGrade || {}, subjectsByStrand: data.regular.subjectsByStrand || {} },
            sped: { levels: data.sped.levels, spedSubjects: data.sped.spedSubjects || [] },
          })
        }
      } catch (err) {
        console.error('Error fetching lesson-plan config:', err)
      }
    }
    fetchHierarchy()
  }, [])

  const grades = hierarchy?.regular?.grades ?? []
  const strands = hierarchy?.regular?.strands ?? []
  const isSpedNonGraded = formData.class_type === 'sped' && formData.learner_path === 'non_graded'
  const selectedGrade = grades.find((g) => g.id === formData.grade_id)
  const isGrade11Or12 = selectedGrade && (selectedGrade.name === 'Grade 11' || selectedGrade.name === 'Grade 12')
  const subjects = isSpedNonGraded
    ? (hierarchy?.sped?.spedSubjects ?? [])
    : formData.grade_id
      ? [
          ...(hierarchy?.regular?.subjectsByGrade?.[formData.grade_id] ?? []),
          ...(isGrade11Or12 && formData.strand_id ? (hierarchy?.regular?.subjectsByStrand?.[formData.strand_id] ?? []) : []),
        ].filter((s, i, arr) => arr.findIndex((x) => x.id === s.id) === i)
      : []

  const updateField = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    if (validation[field]) {
      setValidation((prev) => {
        const newValidation = { ...prev }
        delete newValidation[field]
        return newValidation
      })
    }
  }

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {}

    if (!formData.title || formData.title.length < 5) {
      errors.title = 'Title must be at least 5 characters'
    }
    if (!formData.description || formData.description.length < 50) {
      errors.description = 'Description must be at least 50 characters'
    }
    if (!formData.price || formData.price < 50) {
      errors.price = 'Price must be at least ₱50'
    }
    const isSpedNonGradedVal = formData.class_type === 'sped' && formData.learner_path === 'non_graded'
    const selectedGradeVal = grades.find((g) => g.id === formData.grade_id)
    const isG11Or12 = selectedGradeVal && (selectedGradeVal.name === 'Grade 11' || selectedGradeVal.name === 'Grade 12')
    const sidCount = (formData.subject_ids ?? []).length
    if (sidCount === 0 && !formData.subject_id) {
      errors.subject_ids = 'At least one subject is required'
    }
    if (isSpedNonGradedVal) {
      if (!formData.sped_level_id) errors.sped_level_id = 'Level is required for SPED Non-Graded'
    } else {
      if (!formData.grade_id) errors.grade_id = 'Grade level is required'
      if (formData.class_type === 'regular' && isG11Or12 && !formData.strand_id) {
        errors.strand_id = 'Strand is required for Grade 11/12'
      }
    }
    if (formData.file_urls.length === 0) {
      errors.file_urls = 'At least one file is required'
    }

    // If product is published and files are being updated, require changelog
    if (
      originalProduct?.status === 'published' &&
      (formData.file_urls.join(',') !== originalProduct.file_urls.join(','))
    ) {
      if (!formData.changelog || formData.changelog.length < 20) {
        errors.changelog = 'Changelog (min 20 characters) is required when updating published products'
      }
    }

    setValidation(errors)
    return Object.keys(errors).length === 0
  }

  const saveChanges = async () => {
    if (!validateForm()) {
      return
    }

    setSaving(true)
    setError(null)

    try {
      const response = await fetch(`/api/products/${productId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        alert('Product updated successfully!')
        router.push('/shop/products')
      } else {
        const { error: apiError } = await response.json()
        setError(apiError || 'Failed to update product')
      }
    } catch (err) {
      console.error('Error updating product:', err)
      setError('Failed to update product')
    } finally {
      setSaving(false)
    }
  }

  const toggleWeek = (week: number) => {
    setFormData((prev) => ({
      ...prev,
      weeks: prev.weeks.includes(week)
        ? prev.weeks.filter((w) => w !== week)
        : [...prev.weeks, week].sort(),
    }))
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Loading product...</p>
      </div>
    )
  }

  if (error && !originalProduct) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="p-8 max-w-md">
          <h1 className="text-2xl font-bold mb-4">Error</h1>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button onClick={() => router.push('/shop/products')}>
            Back to Products
          </Button>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">Edit Product</h1>
        <Button variant="outline" onClick={() => router.push('/shop/products')}>
          Cancel
        </Button>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded text-red-600">
          {error}
        </div>
      )}

      {originalProduct?.status === 'published' && (
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded">
          <p className="text-sm text-blue-800">
            <strong>Note:</strong> This product is published. If you update files or content,
            you must provide a changelog explaining what changed. A new version will be created.
          </p>
        </div>
      )}

      <Card className="p-6 space-y-6">
        {/* Basic Information */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Basic Information</h2>

          <div className="space-y-4">
            <div>
              <Label htmlFor="title">Product Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => updateField('title', e.target.value)}
                maxLength={255}
              />
              {validation.title && (
                <p className="text-sm text-red-600 mt-1">{validation.title}</p>
              )}
            </div>

            <div>
              <Label htmlFor="product_type">Product Type *</Label>
              <Select
                value={formData.product_type}
                onValueChange={(value) => updateField('product_type', value)}
              >
                <option value="">Select product type</option>
                {PRODUCT_TYPES.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </Select>
            </div>

            {formData.product_type && SPECIFIC_TYPES[formData.product_type] && (
              <div>
                <Label htmlFor="specific_type">Specific Type</Label>
                <Select
                  value={formData.specific_type}
                  onValueChange={(value) => updateField('specific_type', value)}
                >
                  <option value="">Select specific type</option>
                  {SPECIFIC_TYPES[formData.product_type].map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </Select>
              </div>
            )}

            <div>
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => updateField('description', e.target.value)}
                rows={6}
                maxLength={2000}
              />
              {validation.description && (
                <p className="text-sm text-red-600 mt-1">{validation.description}</p>
              )}
            </div>
          </div>
        </div>

        {/* Categorization */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Categorization</h2>

          <div className="space-y-4">
            <div>
              <Label htmlFor="class_type">Class type</Label>
              <Select
                value={formData.class_type || ''}
                onValueChange={(v) => {
                  updateField('class_type', v || undefined)
                  updateField('learner_path', undefined)
                  updateField('strand_id', undefined)
                  updateField('sped_level_id', undefined)
                  updateField('grade_id', '')
                  updateField('subject_ids', []); updateField('subject_id', '')
                }}
              >
                <option value="">Select class type</option>
                {CLASS_TYPES.map((c) => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </Select>
            </div>

            {formData.class_type === 'sped' && (
              <div>
                <Label htmlFor="learner_path">Learner path</Label>
                <Select
                  value={formData.learner_path || ''}
                  onValueChange={(v) => {
                    updateField('learner_path', v || undefined)
                    updateField('sped_level_id', undefined)
                    updateField('grade_id', '')
                    updateField('subject_ids', []); updateField('subject_id', '')
                    if (v === 'graded') updateField('strand_id', undefined)
                  }}
                >
                  <option value="">Select path</option>
                  {LEARNER_PATHS.map((p) => (
                    <option key={p.value} value={p.value}>{p.label}</option>
                  ))}
                </Select>
              </div>
            )}

            {isSpedNonGraded && (
              <div>
                <Label htmlFor="sped_level_id">Level *</Label>
                <Select
                  value={formData.sped_level_id || ''}
                  onValueChange={(v) => updateField('sped_level_id', v || undefined)}
                >
                  <option value="">Select level</option>
                  {(hierarchy?.sped?.levels ?? []).map((l) => (
                    <option key={l.id} value={l.id}>{l.name}</option>
                  ))}
                </Select>
                {validation.sped_level_id && (
                  <p className="text-sm text-red-600 mt-1">{validation.sped_level_id}</p>
                )}
              </div>
            )}

            {!isSpedNonGraded && (
              <div>
                <Label htmlFor="grade_id">Grade Level *</Label>
                <Select
                  value={formData.grade_id}
                  onValueChange={(value) => {
                    updateField('grade_id', value)
                    updateField('subject_ids', []); updateField('subject_id', '')
                    const g = grades.find((gr) => gr.id === value)
                    if (!g || (g.name !== 'Grade 11' && g.name !== 'Grade 12')) {
                      updateField('strand_id', undefined)
                    }
                  }}
                >
                  <option value="">Select grade level</option>
                  {grades.map((grade) => (
                    <option key={grade.id} value={grade.id}>
                      {grade.name}
                    </option>
                  ))}
                </Select>
                {validation.grade_id && (
                  <p className="text-sm text-red-600 mt-1">{validation.grade_id}</p>
                )}
              </div>
            )}

            {formData.class_type === 'regular' && isGrade11Or12 && (
              <div>
                <Label htmlFor="strand_id">Strand *</Label>
                <Select
                  value={formData.strand_id || ''}
                  onValueChange={(v) => {
                    updateField('strand_id', v || undefined)
                    updateField('subject_ids', []); updateField('subject_id', '')
                  }}
                >
                  <option value="">Select strand</option>
                  {strands.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </Select>
                {validation.strand_id && (
                  <p className="text-sm text-red-600 mt-1">{validation.strand_id}</p>
                )}
              </div>
            )}

            <div>
              <Label htmlFor="subject_ids">Subjects * (at least one; select multiple for integrated teaching)</Label>
              <div id="subject_ids" className={`max-h-48 overflow-y-auto rounded-md border p-3 space-y-2 mt-1 ${validation.subject_ids ? 'border-red-500' : ''}`}>
                {subjects.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    {isSpedNonGraded ? 'Select level first' : 'Select grade and strand first'}
                  </p>
                ) : (
                  subjects.map((subject) => {
                    const sidList = formData.subject_ids ?? []
                    const checked = sidList.includes(subject.id)
                    return (
                      <div key={subject.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={`subject-${subject.id}`}
                          checked={checked}
                          disabled={subjects.length === 0}
                          onCheckedChange={(checked) => {
                            const next = checked
                              ? [...sidList, subject.id]
                              : sidList.filter((id) => id !== subject.id)
                            updateField('subject_ids', next)
                            updateField('subject_id', next[0] ?? '')
                          }}
                        />
                        <label htmlFor={`subject-${subject.id}`} className="text-sm font-medium leading-none peer-disabled:opacity-70 cursor-pointer">
                          {subject.name}
                        </label>
                      </div>
                    )
                  })
                )}
              </div>
              {validation.subject_ids && (
                <p className="text-sm text-red-600 mt-1">{validation.subject_ids}</p>
              )}
            </div>

            <div>
              <Label htmlFor="quarter">Quarter</Label>
              <Select
                value={formData.quarter}
                onValueChange={(value) => updateField('quarter', value)}
              >
                <option value="">Select quarter</option>
                {QUARTERS.map((q) => (
                  <option key={q.value} value={q.value}>
                    {q.label}
                  </option>
                ))}
              </Select>
            </div>

            <div>
              <Label>Weeks</Label>
              <div className="grid grid-cols-5 gap-2 mt-2">
                {WEEKS.map((week) => (
                  <button
                    key={week}
                    type="button"
                    onClick={() => toggleWeek(week)}
                    className={`px-4 py-2 rounded border ${
                      formData.weeks.includes(week)
                        ? 'bg-purple-600 text-white border-purple-600'
                        : 'bg-white text-gray-700 border-gray-300'
                    }`}
                  >
                    Week {week}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <Label htmlFor="language">Language of instruction</Label>
              <Select
                value={formData.language || ''}
                onValueChange={(value) => updateField('language', value)}
              >
                <option value="">Select language</option>
                {LANGUAGES.map((lang) => (
                  <option key={lang.value} value={lang.value}>
                    {lang.label}
                  </option>
                ))}
              </Select>
            </div>

            <div>
              <Label htmlFor="curriculum">Curriculum</Label>
              <Select
                value={formData.curriculum || ''}
                onValueChange={(value) => updateField('curriculum', value)}
              >
                <option value="">None</option>
                {CURRICULA.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </Select>
            </div>

            <div>
              <Label>Modality (optional)</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {MODALITIES.map((mod) => {
                  const selected = formData.modalities ?? []
                  const isSelected = selected.includes(mod.value)
                  return (
                    <label
                      key={mod.value}
                      className={`flex items-center gap-2 px-3 py-2 rounded border cursor-pointer text-sm ${
                        isSelected ? 'border-purple-600 bg-purple-50' : 'border-gray-300'
                      }`}
                    >
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={() => {
                          const next = isSelected
                            ? (formData.modalities ?? []).filter((m) => m !== mod.value)
                            : [...(formData.modalities ?? []), mod.value]
                          updateField('modalities', next.length > 0 ? next : [])
                        }}
                      />
                      <span>{mod.label}</span>
                    </label>
                  )
                })}
              </div>
            </div>

            {formData.product_type === 'lesson_plans' && (
              <div>
                <Label htmlFor="teaching_framework">Teaching framework</Label>
                <Select
                  value={formData.teaching_framework || ''}
                  onValueChange={(value) => updateField('teaching_framework', value)}
                >
                  <option value="">None</option>
                  {TEACHING_FRAMEWORKS.map((f) => (
                    <option key={f.value} value={f.value}>
                      {f.label}
                    </option>
                  ))}
                </Select>
              </div>
            )}
          </div>
        </div>

        {/* Files & Media */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Files & Media</h2>

          <div className="space-y-4">
            <div>
              <Label>Product Files *</Label>
              <div className="mt-2 space-y-1">
                {formData.file_urls.map((url, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <span className="text-sm truncate">{url}</span>
                    <button
                      type="button"
                      onClick={() => {
                        updateField(
                          'file_urls',
                          formData.file_urls.filter((_, i) => i !== index)
                        )
                      }}
                      className="text-red-600 hover:text-red-800 text-sm"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
              {validation.file_urls && (
                <p className="text-sm text-red-600 mt-1">{validation.file_urls}</p>
              )}
            </div>

            <div>
              <Label htmlFor="cover_image_url">Cover Image URL</Label>
              <Input
                id="cover_image_url"
                type="text"
                value={formData.cover_image_url || ''}
                onChange={(e) => updateField('cover_image_url', e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Pricing */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Pricing</h2>

          <div>
            <Label htmlFor="price">Price (₱) *</Label>
            <Input
              id="price"
              type="number"
              min="50"
              max="50000"
              value={formData.price}
              onChange={(e) => updateField('price', parseFloat(e.target.value))}
            />
            {validation.price && (
              <p className="text-sm text-red-600 mt-1">{validation.price}</p>
            )}
          </div>
        </div>

        {/* Changelog (if published) */}
        {originalProduct?.status === 'published' && (
          <div>
            <h2 className="text-xl font-semibold mb-4">Version Update</h2>

            <div className="space-y-4">
              <div>
                <Label htmlFor="changelog">Changelog *</Label>
                <Textarea
                  id="changelog"
                  value={formData.changelog}
                  onChange={(e) => updateField('changelog', e.target.value)}
                  placeholder="What's new in this version? (min 20 characters)"
                  rows={4}
                />
                {validation.changelog && (
                  <p className="text-sm text-red-600 mt-1">{validation.changelog}</p>
                )}
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="is_major_update"
                  checked={formData.is_major_update || false}
                  onChange={(e) => updateField('is_major_update', e.target.checked)}
                  className="mr-2"
                />
                <Label htmlFor="is_major_update">This is a major update</Label>
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-between pt-4 border-t">
          <Button
            variant="outline"
            onClick={() => router.push('/shop/products')}
          >
            Cancel
          </Button>
          <Button
            onClick={saveChanges}
            disabled={saving}
            className="bg-purple-600 hover:bg-purple-700"
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </Card>
    </div>
  )
}
