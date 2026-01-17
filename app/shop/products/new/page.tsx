'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Card } from '@/components/ui/card'

// Product types as per design
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

const WEEKS = [1, 2, 3, 4, 5, 6, 7, 8]

interface FormData {
  // Step 1: Basic Info
  title: string
  product_type: string
  specific_type: string
  description: string

  // Step 2: Categorization
  grade_id: string
  subject_id: string
  quarter: string
  weeks: number[]
  theme?: string
  size?: string
  season?: string
  occasion?: string

  // Step 3: Files & Media
  file_urls: string[]
  cover_image_url?: string
  preview_images?: string[]

  // Step 4: Pricing
  price: number
}

export default function NewProductPage() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [grades, setGrades] = useState<any[]>([])
  const [subjects, setSubjects] = useState<any[]>([])
  const [canSell, setCanSell] = useState<boolean | null>(null)

  const [formData, setFormData] = useState<FormData>({
    title: '',
    product_type: '',
    specific_type: '',
    description: '',
    grade_id: '',
    subject_id: '',
    quarter: '',
    weeks: [],
    file_urls: [],
    price: 50,
  })

  const [validation, setValidation] = useState<Record<string, string>>({})
  const [uploadingFile, setUploadingFile] = useState(false)
  const [uploadingImage, setUploadingImage] = useState(false)

  // Check if user can sell
  useEffect(() => {
    async function checkPermissions() {
      try {
        const response = await fetch('/api/me/profile')
        if (response.ok) {
          const { profile } = await response.json()
          setCanSell(profile.can_sell)
          if (!profile.can_sell) {
            setError('You do not have permission to sell. Please complete your seller verification.')
          }
        } else {
          router.push('/login')
        }
      } catch (err) {
        console.error('Error checking permissions:', err)
        setError('Failed to verify permissions')
      }
    }

    checkPermissions()
  }, [router])

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
      if (!formData.grade_id) {
        setSubjects([])
        return
      }

      try {
        const response = await fetch(`/api/grades/${formData.grade_id}/subjects`)
        if (response.ok) {
          const { subjects: fetchedSubjects } = await response.json()
          setSubjects(fetchedSubjects)
        }
      } catch (err) {
        console.error('Error fetching subjects:', err)
      }
    }

    fetchSubjects()
  }, [formData.grade_id])

  const updateField = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    // Clear validation error for this field
    if (validation[field]) {
      setValidation((prev) => {
        const newValidation = { ...prev }
        delete newValidation[field]
        return newValidation
      })
    }
  }

  const validateStep = (step: number): boolean => {
    const errors: Record<string, string> = {}

    if (step === 1) {
      if (!formData.title || formData.title.length < 5) {
        errors.title = 'Title must be at least 5 characters'
      }
      if (formData.title.length > 255) {
        errors.title = 'Title must not exceed 255 characters'
      }
      if (!formData.product_type) {
        errors.product_type = 'Product type is required'
      }
      if (!formData.description || formData.description.length < 50) {
        errors.description = 'Description must be at least 50 characters'
      }
      if (formData.description.length > 2000) {
        errors.description = 'Description must not exceed 2000 characters'
      }
    }

    if (step === 2) {
      if (!formData.grade_id) {
        errors.grade_id = 'Grade level is required'
      }
      if (!formData.subject_id) {
        errors.subject_id = 'Subject is required'
      }
      if (!formData.quarter) {
        errors.quarter = 'Quarter is required'
      }
      if (formData.weeks.length === 0) {
        errors.weeks = 'At least one week must be selected'
      }
    }

    if (step === 3) {
      if (formData.file_urls.length === 0) {
        errors.file_urls = 'At least one file is required'
      }
    }

    if (step === 4) {
      if (!formData.price || formData.price < 50) {
        errors.price = 'Price must be at least ₱50'
      }
      if (formData.price > 50000) {
        errors.price = 'Price must not exceed ₱50,000'
      }
    }

    setValidation(errors)
    return Object.keys(errors).length === 0
  }

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => Math.min(prev + 1, 5))
    }
  }

  const prevStep = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1))
  }

  const saveDraft = async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          status: 'draft',
        }),
      })

      if (response.ok) {
        const { product } = await response.json()
        router.push(`/shop/products`)
      } else {
        const { error: apiError } = await response.json()
        setError(apiError || 'Failed to save draft')
      }
    } catch (err) {
      console.error('Error saving draft:', err)
      setError('Failed to save draft')
    } finally {
      setLoading(false)
    }
  }

  const publish = async () => {
    if (!validateStep(1) || !validateStep(2) || !validateStep(3) || !validateStep(4)) {
      setError('Please complete all required fields')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        const { product, message } = await response.json()
        // Show success and redirect
        alert(message || 'Product published successfully!')
        router.push(`/shop/products`)
      } else {
        const { error: apiError } = await response.json()
        setError(apiError || 'Failed to publish product')
      }
    } catch (err) {
      console.error('Error publishing product:', err)
      setError('Failed to publish product')
    } finally {
      setLoading(false)
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

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    setUploadingFile(true)
    setError(null)

    try {
      const uploadedUrls: string[] = []

      for (const file of Array.from(files)) {
        const uploadFormData = new FormData()
        uploadFormData.append('file', file)
        uploadFormData.append('type', 'file')
        uploadFormData.append('productId', 'draft')

        const response = await fetch('/api/products/upload', {
          method: 'POST',
          body: uploadFormData,
        })

        if (!response.ok) {
          const error = await response.json()
          throw new Error(error.error || 'Failed to upload file')
        }

        const { url } = await response.json()
        uploadedUrls.push(url)
      }

      updateField('file_urls', [...formData.file_urls, ...uploadedUrls])
      e.target.value = '' // Reset input
    } catch (err) {
      console.error('Error uploading files:', err)
      setError(err instanceof Error ? err.message : 'Failed to upload files')
    } finally {
      setUploadingFile(false)
    }
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploadingImage(true)
    setError(null)

    try {
      const uploadFormData = new FormData()
      uploadFormData.append('file', file)
      uploadFormData.append('type', 'image')
      uploadFormData.append('productId', 'draft')

      const response = await fetch('/api/products/upload', {
        method: 'POST',
        body: uploadFormData,
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to upload image')
      }

      const { url } = await response.json()
      updateField('cover_image_url', url)
      e.target.value = '' // Reset input
    } catch (err) {
      console.error('Error uploading image:', err)
      setError(err instanceof Error ? err.message : 'Failed to upload image')
    } finally {
      setUploadingImage(false)
    }
  }

  if (canSell === null) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Loading...</p>
      </div>
    )
  }

  if (canSell === false) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="p-8 max-w-md">
          <h1 className="text-2xl font-bold mb-4">Permission Required</h1>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button onClick={() => router.push('/profile/edit')}>
            Complete Verification
          </Button>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <h1 className="text-3xl font-bold mb-8">Upload New Product</h1>

      {/* Progress indicator */}
      <div className="mb-8">
        <div className="flex justify-between mb-2">
          {[1, 2, 3, 4, 5].map((step) => (
            <div
              key={step}
              className={`flex-1 h-2 mx-1 rounded ${
                step <= currentStep ? 'bg-purple-600' : 'bg-gray-200'
              }`}
            />
          ))}
        </div>
        <p className="text-sm text-gray-600 text-center">
          Step {currentStep} of 5
        </p>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded text-red-600">
          {error}
        </div>
      )}

      {/* Step 1: Basic Information */}
      {currentStep === 1 && (
        <Card className="p-6 space-y-6">
          <h2 className="text-2xl font-semibold">Step 1: Basic Information</h2>

          <div>
            <Label htmlFor="title">Product Title *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => updateField('title', e.target.value)}
              placeholder="e.g., Grade 7 Math Quarter 1 DLL"
              maxLength={255}
            />
            {validation.title && (
              <p className="text-sm text-red-600 mt-1">{validation.title}</p>
            )}
            <p className="text-sm text-gray-500 mt-1">
              {formData.title.length}/255 characters
            </p>
          </div>

          <div>
            <Label htmlFor="product_type">Product Type *</Label>
            <select
              id="product_type"
              value={formData.product_type}
              onChange={(e) => updateField('product_type', e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <option value="">Select product type</option>
              {PRODUCT_TYPES.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
            {validation.product_type && (
              <p className="text-sm text-red-600 mt-1">{validation.product_type}</p>
            )}
          </div>

          {formData.product_type && SPECIFIC_TYPES[formData.product_type] && (
            <div>
              <Label htmlFor="specific_type">Specific Type</Label>
              <select
                id="specific_type"
                value={formData.specific_type}
                onChange={(e) => updateField('specific_type', e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="">Select specific type</option>
                {SPECIFIC_TYPES[formData.product_type].map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => updateField('description', e.target.value)}
              placeholder="Describe your product in detail..."
              rows={6}
              maxLength={2000}
            />
            {validation.description && (
              <p className="text-sm text-red-600 mt-1">{validation.description}</p>
            )}
            <p className="text-sm text-gray-500 mt-1">
              {formData.description.length}/2000 characters
            </p>
          </div>

          <div className="flex justify-between">
            <Button variant="outline" onClick={saveDraft} disabled={loading}>
              Save Draft
            </Button>
            <Button onClick={nextStep}>Next</Button>
          </div>
        </Card>
      )}

      {/* Step 2: Categorization */}
      {currentStep === 2 && (
        <Card className="p-6 space-y-6">
          <h2 className="text-2xl font-semibold">Step 2: Categorization</h2>

          <div>
            <Label htmlFor="grade_id">Grade Level *</Label>
            <select
              id="grade_id"
              value={formData.grade_id}
              onChange={(e) => {
                updateField('grade_id', e.target.value)
                updateField('subject_id', '') // Reset subject when grade changes
              }}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <option value="">Select grade level</option>
              {grades.map((grade) => (
                <option key={grade.id} value={grade.id}>
                  {grade.name}
                </option>
              ))}
            </select>
            {validation.grade_id && (
              <p className="text-sm text-red-600 mt-1">{validation.grade_id}</p>
            )}
          </div>

          <div>
            <Label htmlFor="subject_id">Subject *</Label>
            <select
              id="subject_id"
              value={formData.subject_id}
              onChange={(e) => updateField('subject_id', e.target.value)}
              disabled={!formData.grade_id}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <option value="">Select subject</option>
              {subjects.map((subject) => (
                <option key={subject.id} value={subject.id}>
                  {subject.name}
                </option>
              ))}
            </select>
            {validation.subject_id && (
              <p className="text-sm text-red-600 mt-1">{validation.subject_id}</p>
            )}
          </div>

          <div>
            <Label htmlFor="quarter">Quarter *</Label>
            <select
              id="quarter"
              value={formData.quarter}
              onChange={(e) => updateField('quarter', e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <option value="">Select quarter</option>
              {QUARTERS.map((q) => (
                <option key={q.value} value={q.value}>
                  {q.label}
                </option>
              ))}
            </select>
            {validation.quarter && (
              <p className="text-sm text-red-600 mt-1">{validation.quarter}</p>
            )}
          </div>

          <div>
            <Label>Weeks * (Select at least one)</Label>
            <div className="grid grid-cols-4 gap-2 mt-2">
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
            {validation.weeks && (
              <p className="text-sm text-red-600 mt-1">{validation.weeks}</p>
            )}
          </div>

          <div className="flex justify-between">
            <Button variant="outline" onClick={prevStep}>
              Previous
            </Button>
            <div className="space-x-2">
              <Button variant="outline" onClick={saveDraft} disabled={loading}>
                Save Draft
              </Button>
              <Button onClick={nextStep}>Next</Button>
            </div>
          </div>
        </Card>
      )}

      {/* Step 3: Files & Media */}
      {currentStep === 3 && (
        <Card className="p-6 space-y-6">
          <h2 className="text-2xl font-semibold">Step 3: Files & Media</h2>

          <div>
            <Label htmlFor="product_files">Product Files *</Label>
            <p className="text-sm text-gray-600 mb-2">
              Upload your product files (PDF, DOCX, PPTX, XLSX - Max 50MB per file)
            </p>
            <Input
              id="product_files"
              type="file"
              multiple
              accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx"
              onChange={handleFileUpload}
              disabled={uploadingFile}
              className="cursor-pointer"
            />
            {uploadingFile && (
              <p className="text-sm text-blue-600 mt-1">Uploading files...</p>
            )}
            {validation.file_urls && (
              <p className="text-sm text-red-600 mt-1">{validation.file_urls}</p>
            )}
            <div className="mt-2 space-y-1">
              {formData.file_urls.map((url, index) => (
                <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <svg
                      className="w-5 h-5 text-gray-600 flex-shrink-0"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                    <span className="text-sm truncate">
                      File {index + 1} uploaded ✓
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      updateField(
                        'file_urls',
                        formData.file_urls.filter((_, i) => i !== index)
                      )
                    }}
                    className="text-red-600 hover:text-red-800 text-sm ml-2 flex-shrink-0"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div>
            <Label htmlFor="cover_image">Cover Image (Optional)</Label>
            <p className="text-sm text-gray-600 mb-2">
              Upload a cover image for your product (JPG, PNG, WEBP - Max 10MB)
            </p>
            <Input
              id="cover_image"
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              onChange={handleImageUpload}
              disabled={uploadingImage}
              className="cursor-pointer"
            />
            {uploadingImage && (
              <p className="text-sm text-blue-600 mt-1">Uploading image...</p>
            )}
            {formData.cover_image_url && (
              <div className="mt-2">
                <img
                  src={formData.cover_image_url}
                  alt="Cover preview"
                  className="w-full max-w-sm h-auto rounded border"
                />
                <button
                  type="button"
                  onClick={() => updateField('cover_image_url', '')}
                  className="text-sm text-red-600 hover:text-red-800 mt-1"
                >
                  Remove image
                </button>
              </div>
            )}
            <p className="text-sm text-gray-500 mt-1">
              Recommended size: 1200x800px
            </p>
          </div>

          <div className="flex justify-between">
            <Button variant="outline" onClick={prevStep}>
              Previous
            </Button>
            <div className="space-x-2">
              <Button variant="outline" onClick={saveDraft} disabled={loading}>
                Save Draft
              </Button>
              <Button onClick={nextStep}>Next</Button>
            </div>
          </div>
        </Card>
      )}

      {/* Step 4: Pricing & Publishing */}
      {currentStep === 4 && (
        <Card className="p-6 space-y-6">
          <h2 className="text-2xl font-semibold">Step 4: Pricing & Publishing</h2>

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
            <p className="text-sm text-gray-500 mt-1">
              Minimum: ₱50, Maximum: ₱50,000
            </p>
          </div>

          <div className="bg-blue-50 p-4 rounded border border-blue-200">
            <p className="text-sm text-blue-800">
              <strong>Note:</strong> Your first 3 products will be reviewed by our team before being published (24-48 hours).
              Subsequent products will be published immediately.
            </p>
          </div>

          <div className="flex justify-between">
            <Button variant="outline" onClick={prevStep}>
              Previous
            </Button>
            <div className="space-x-2">
              <Button variant="outline" onClick={saveDraft} disabled={loading}>
                Save Draft
              </Button>
              <Button onClick={nextStep}>Next</Button>
            </div>
          </div>
        </Card>
      )}

      {/* Step 5: Confirmation */}
      {currentStep === 5 && (
        <Card className="p-6 space-y-6">
          <h2 className="text-2xl font-semibold">Step 5: Confirmation</h2>

          <div className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">Product Details</h3>
              <dl className="grid grid-cols-2 gap-2 text-sm">
                <dt className="text-gray-600">Title:</dt>
                <dd className="font-medium">{formData.title}</dd>

                <dt className="text-gray-600">Type:</dt>
                <dd className="font-medium">{formData.product_type}</dd>

                <dt className="text-gray-600">Price:</dt>
                <dd className="font-medium">₱{formData.price.toFixed(2)}</dd>

                <dt className="text-gray-600">Grade:</dt>
                <dd className="font-medium">
                  {grades.find((g) => g.id === formData.grade_id)?.name}
                </dd>

                <dt className="text-gray-600">Subject:</dt>
                <dd className="font-medium">
                  {subjects.find((s) => s.id === formData.subject_id)?.name}
                </dd>

                <dt className="text-gray-600">Quarter:</dt>
                <dd className="font-medium">Quarter {formData.quarter}</dd>

                <dt className="text-gray-600">Weeks:</dt>
                <dd className="font-medium">{formData.weeks.join(', ')}</dd>

                <dt className="text-gray-600">Files:</dt>
                <dd className="font-medium">{formData.file_urls.length} file(s)</dd>
              </dl>
            </div>

            <div>
              <h3 className="font-semibold mb-2">Description</h3>
              <p className="text-sm text-gray-700 whitespace-pre-wrap">
                {formData.description}
              </p>
            </div>
          </div>

          <div className="flex justify-between">
            <Button variant="outline" onClick={prevStep}>
              Edit
            </Button>
            <div className="space-x-2">
              <Button variant="outline" onClick={saveDraft} disabled={loading}>
                Save Draft
              </Button>
              <Button onClick={publish} disabled={loading}>
                {loading ? 'Publishing...' : 'Publish Product'}
              </Button>
            </div>
          </div>
        </Card>
      )}
    </div>
  )
}
