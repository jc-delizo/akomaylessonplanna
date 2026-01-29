'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription } from '@/registry/default/alert/alert'
import { Progress } from '@/registry/default/progress/progress'
import { toast } from 'sonner'
import {
  FileText,
  Image as ImageIcon,
  Upload,
  CheckCircle2,
  Circle,
  ChevronRight,
  X,
  File,
  FileSpreadsheet,
  Presentation,
  DollarSign,
  Info,
  Loader2,
  Package,
  BookOpen,
  Calendar,
  FileCheck,
} from 'lucide-react'
import {
  WEEKS_OPTIONS,
  MODALITIES,
  LANGUAGES,
  CURRICULA,
  TEACHING_FRAMEWORKS,
  CLASS_TYPES,
  LEARNER_PATHS,
  SUBJECT_SELECTION,
} from '@/lib/config/lesson-plan-config'

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

const WEEKS = [...WEEKS_OPTIONS]

const STEPS = [
  { number: 1, label: 'Basic Info', icon: FileText },
  { number: 2, label: 'Categorization', icon: BookOpen },
  { number: 3, label: 'Files & Media', icon: Upload },
  { number: 4, label: 'Pricing', icon: DollarSign },
  { number: 5, label: 'Confirmation', icon: CheckCircle2 },
]

/** Derive display filename from storage URL (path last segment, optional timestamp stripped) */
function getFileNameFromUrl(url: string): string {
  try {
    const path = new URL(url).pathname
    const segment = path.split('/').filter(Boolean).pop() || ''
    const withoutTimestamp = segment.replace(/^\d+-/, '')
    return decodeURIComponent(withoutTimestamp || segment) || url
  } catch {
    return url
  }
}

/** Icon component for file type (url or filename) */
function getFileIcon(nameOrUrl: string): typeof File {
  const name = nameOrUrl.startsWith('http') ? getFileNameFromUrl(nameOrUrl) : nameOrUrl
  const lower = name.toLowerCase()
  if (lower.endsWith('.pdf') || lower.endsWith('.doc') || lower.endsWith('.docx')) return FileText
  if (lower.endsWith('.xls') || lower.endsWith('.xlsx')) return FileSpreadsheet
  if (lower.endsWith('.ppt') || lower.endsWith('.pptx')) return Presentation
  return File
}

/** Format bytes to human-readable size (e.g. 1536 -> "1.5 KB") */
function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`
}

/** Upload file with progress via XHR (fetch does not support upload progress) */
function uploadWithProgress(
  url: string,
  formData: InstanceType<typeof globalThis.FormData>,
  onProgress: (loaded: number, total: number, percent: number) => void
): Promise<{ url: string; fileSize?: number }> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()

    xhr.upload.addEventListener('progress', (e) => {
      if (e.lengthComputable) {
        const percent = Math.round((e.loaded / e.total) * 100)
        onProgress(e.loaded, e.total, percent)
      } else {
        onProgress(e.loaded, 0, 0)
      }
    })

    xhr.addEventListener('load', () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const data = JSON.parse(xhr.responseText)
          resolve({ url: data.url, fileSize: data.fileSize })
        } catch {
          reject(new Error('Invalid response'))
        }
      } else {
        try {
          const err = JSON.parse(xhr.responseText)
          reject(new Error(err.error || 'Upload failed'))
        } catch {
          reject(new Error(`Upload failed (${xhr.status})`))
        }
      }
    })

    xhr.addEventListener('error', () => reject(new Error('Network error')))
    xhr.addEventListener('abort', () => reject(new Error('Upload cancelled')))

    xhr.open('POST', url)
    xhr.send(formData as unknown as XMLHttpRequestBodyInit)
  })
}

interface FormData {
  // Step 1: Basic Info
  title: string
  product_type: string
  specific_type: string
  description: string

  // Step 2: Categorization (Phase 2 hierarchy)
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
  const [hierarchy, setHierarchy] = useState<{
    regular: { grades: { id: string; name: string; sortOrder: number }[]; strands: { id: string; name: string; code: string }[]; subjectsByGrade: Record<string, { id: string; name: string; code: string }[]>; subjectsByStrand: Record<string, { id: string; name: string; code: string }[]> }
    sped: { levels: { id: string; name: string; sortOrder: number }[]; spedSubjects: { id: string; name: string; code: string }[] }
  } | null>(null)
  const [canSell, setCanSell] = useState<boolean | null>(null)

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
  })

  const [validation, setValidation] = useState<Record<string, string>>({})
  const [uploadingFile, setUploadingFile] = useState(false)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [uploadingFiles, setUploadingFiles] = useState<Array<{ id: string; fileName: string; progress: number; size?: number }>>([])
  const [coverImageProgress, setCoverImageProgress] = useState<{ loaded: number; total: number; percent: number } | null>(null)
  const [fileSizesByUrl, setFileSizesByUrl] = useState<Record<string, number>>({})

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

  // Fetch lesson-plan hierarchy from config API
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
      if (!formData.cover_image_url) {
        errors.cover_image_url = 'Cover image is required'
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
      const payload = {
        ...formData,
        curriculum: formData.curriculum === '__none__' ? '' : (formData.curriculum ?? ''),
        teaching_framework: formData.teaching_framework === '__none__' ? '' : (formData.teaching_framework ?? ''),
        status: 'draft',
      }
      const response = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (response.ok) {
        const { product } = await response.json()
        toast.success('Draft Saved', {
          description: 'Your product has been saved as a draft. You can continue editing later.',
          duration: 4000,
        })
        router.push(`/shop/products`)
      } else {
        const { error: apiError } = await response.json()
        toast.error('Failed to Save Draft', {
          description: apiError || 'Please check your connection and try again.',
          duration: 5000,
        })
        setError(apiError || 'Failed to save draft')
      }
    } catch (err) {
      console.error('Error saving draft:', err)
      toast.error('Failed to Save Draft', {
        description: 'An unexpected error occurred. Please try again.',
        duration: 5000,
      })
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
      const payload = {
        ...formData,
        curriculum: formData.curriculum === '__none__' ? '' : (formData.curriculum ?? ''),
        teaching_framework: formData.teaching_framework === '__none__' ? '' : (formData.teaching_framework ?? ''),
      }
      const response = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (response.ok) {
        const { product, message } = await response.json()
        
        // Show success toast
        toast.success('Product Published Successfully!', {
          description: message || 'Your product is now live and ready for teachers to discover.',
          duration: 5000,
          action: {
            label: 'View Product',
            onClick: () => router.push(`/products/${product.id}`),
          },
        })
        
        // Redirect after a short delay to let user see the toast
        setTimeout(() => {
          router.push(`/shop/products`)
        }, 1500)
      } else {
        const { error: apiError } = await response.json()
        toast.error('Failed to Publish Product', {
          description: apiError || 'Please check your connection and try again.',
          duration: 5000,
        })
        setError(apiError || 'Failed to publish product')
      }
    } catch (err) {
      console.error('Error publishing product:', err)
      toast.error('Failed to Publish Product', {
        description: 'An unexpected error occurred. Please check your connection and try again.',
        duration: 5000,
      })
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

    const fileList = Array.from(files)
    const batchId = crypto.randomUUID()
    const items = fileList.map((f, i) => ({
      id: `${batchId}-${i}`,
      fileName: f.name,
      progress: 0,
      size: f.size,
    }))
    setUploadingFiles(items)

    try {
      const uploadedUrls: string[] = []
      const newSizes: Record<string, number> = {}

      for (let i = 0; i < fileList.length; i++) {
        const file = fileList[i]
        const itemId = items[i].id

        const uploadFormData = new FormData()
        uploadFormData.append('file', file)
        uploadFormData.append('type', 'file')
        uploadFormData.append('productId', 'draft')

        const { url, fileSize } = await uploadWithProgress(
          '/api/products/upload',
          uploadFormData,
          (loaded, total, percent) => {
            setUploadingFiles((prev) =>
              prev.map((item) =>
                item.id === itemId ? { ...item, progress: percent } : item
              )
            )
          }
        )

        uploadedUrls.push(url)
        if (fileSize != null) newSizes[url] = fileSize
      }

      setFileSizesByUrl((prev) => ({ ...prev, ...newSizes }))
      updateField('file_urls', [...formData.file_urls, ...uploadedUrls])
      setUploadingFiles([])
      e.target.value = ''
    } catch (err) {
      console.error('Error uploading files:', err)
      setError(err instanceof Error ? err.message : 'Failed to upload files')
      setUploadingFiles([])
    } finally {
      setUploadingFile(false)
    }
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploadingImage(true)
    setError(null)
    setCoverImageProgress({ loaded: 0, total: file.size, percent: 0 })

    try {
      const uploadFormData = new FormData()
      uploadFormData.append('file', file)
      uploadFormData.append('type', 'image')
      uploadFormData.append('productId', 'draft')

      const { url } = await uploadWithProgress(
        '/api/products/upload',
        uploadFormData,
        (loaded, total, percent) => {
          setCoverImageProgress({ loaded, total, percent })
        }
      )

      updateField('cover_image_url', url)
      e.target.value = ''
    } catch (err) {
      console.error('Error uploading image:', err)
      setError(err instanceof Error ? err.message : 'Failed to upload image')
    } finally {
      setUploadingImage(false)
      setCoverImageProgress(null)
    }
  }

  if (canSell === null) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  if (canSell === false) {
    return (
      <div className="flex items-center justify-center min-h-screen px-4">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Info className="h-5 w-5 text-destructive" />
              Permission Required
            </CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardFooter>
            <Button onClick={() => router.push('/profile/edit')} className="w-full">
              Complete Verification
            </Button>
          </CardFooter>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Upload New Product</h1>
        <p className="text-muted-foreground">
          Follow the steps below to create and publish your product
        </p>
      </div>

      {/* Enhanced Progress Stepper */}
      <div className="mb-8">
        <div className="flex items-center justify-between relative">
          {/* Connection lines */}
          <div className="absolute top-6 left-0 right-0 h-0.5 -z-10" style={{ backgroundColor: '#d1d5db' }}>
            <div
              className="h-full transition-all duration-300"
              style={{
                width: `${((currentStep - 1) / (STEPS.length - 1)) * 100}%`,
                backgroundColor: '#ff7200',
              }}
            />
          </div>

          {/* Step indicators */}
          {STEPS.map((step, index) => {
            const StepIcon = step.icon
            const isActive = currentStep === step.number
            const isCompleted = currentStep > step.number

            return (
              <div key={step.number} className="flex flex-col items-center flex-1 relative z-10">
                <div
                  className={`flex items-center justify-center w-12 h-12 rounded-full border-2 transition-all duration-300 ${
                    isActive ? 'shadow-lg scale-110' : ''
                  }`}
                  style={
                    isActive
                      ? {
                          backgroundColor: '#ff7200',
                          borderColor: '#ff7200',
                        }
                      : {
                          backgroundColor: '#e5e7eb',
                          borderColor: '#d1d5db',
                        }
                  }
                >
                  <div 
                    className={isActive ? 'text-white' : 'text-gray-500'}
                    style={{ color: isActive ? '#ffffff' : '#6b7280' }}
                  >
                    {isCompleted ? (
                      <CheckCircle2 className="h-6 w-6" stroke="currentColor" fill="currentColor" />
                    ) : (
                      <StepIcon className="h-6 w-6" stroke="currentColor" />
                    )}
                  </div>
                </div>
                <div className="mt-2 text-center">
                  <p
                    className={`text-xs font-medium ${
                      isActive ? 'text-foreground' : 'text-muted-foreground'
                    }`}
                  >
                    {step.label}
                  </p>
                  <Badge
                    variant={isActive ? 'default' : 'outline'}
                    className="mt-1 text-[10px]"
                  >
                    Step {step.number}
                  </Badge>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {error && (
        <Alert className="mb-6 border-destructive bg-destructive/10">
          <Info className="h-4 w-4 text-destructive" />
          <AlertDescription className="text-destructive">
            {error}
          </AlertDescription>
        </Alert>
      )}

      {/* Step 1: Basic Information */}
      {currentStep === 1 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Basic Information
            </CardTitle>
            <CardDescription>
              Provide the essential details about your product
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="title" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Product Title *
              </Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => updateField('title', e.target.value)}
                placeholder="e.g., Grade 7 Math Quarter 1 DLL"
                maxLength={255}
                className={validation.title ? 'border-destructive' : ''}
              />
              {validation.title && (
                <p className="text-sm text-destructive flex items-center gap-1">
                  <X className="h-3 w-3" />
                  {validation.title}
                </p>
              )}
              <div className="flex justify-between items-center">
                <p className="text-xs text-muted-foreground">
                  {formData.title.length}/255 characters
                </p>
                {formData.title.length >= 5 && formData.title.length <= 255 && (
                  <Badge variant="outline" className="text-[10px]">
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    Valid
                  </Badge>
                )}
              </div>
            </div>

            <Separator />

            <div className="space-y-2">
              <Label htmlFor="product_type" className="flex items-center gap-2">
                <Package className="h-4 w-4" />
                Product Type *
              </Label>
              <Select
                value={formData.product_type}
                onValueChange={(value) => updateField('product_type', value)}
              >
                  <SelectTrigger
                    id="product_type"
                    className={`w-full ${validation.product_type ? 'border-destructive' : ''}`}
                  >
                  <SelectValue placeholder="Select product type" />
                </SelectTrigger>
                <SelectContent>
                  {PRODUCT_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {validation.product_type && (
                <p className="text-sm text-destructive flex items-center gap-1">
                  <X className="h-3 w-3" />
                  {validation.product_type}
                </p>
              )}
            </div>

            {formData.product_type && SPECIFIC_TYPES[formData.product_type] && (
              <>
                <Separator />
                <div className="space-y-2">
                  <Label htmlFor="specific_type" className="flex items-center gap-2">
                    <FileCheck className="h-4 w-4" />
                    Specific Type
                  </Label>
                  <Select
                    value={formData.specific_type}
                    onValueChange={(value) => updateField('specific_type', value)}
                  >
                    <SelectTrigger id="specific_type" className="w-full">
                      <SelectValue placeholder="Select specific type" />
                    </SelectTrigger>
                    <SelectContent>
                      {SPECIFIC_TYPES[formData.product_type].map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}

            <Separator />

            <div className="space-y-2">
              <Label htmlFor="description" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Description *
              </Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => updateField('description', e.target.value)}
                placeholder="Describe your product in detail. Include what makes it unique, how it can be used, and any special features..."
                rows={6}
                maxLength={2000}
                className={validation.description ? 'border-destructive' : ''}
              />
              {validation.description && (
                <p className="text-sm text-destructive flex items-center gap-1">
                  <X className="h-3 w-3" />
                  {validation.description}
                </p>
              )}
              <div className="flex justify-between items-center">
                <p className="text-xs text-muted-foreground">
                  {formData.description.length}/2000 characters
                </p>
                {formData.description.length >= 50 &&
                  formData.description.length <= 2000 && (
                    <Badge variant="outline" className="text-[10px]">
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      Valid
                    </Badge>
                  )}
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between border-t pt-4">
            <Button variant="outline" onClick={saveDraft} disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Draft'
              )}
            </Button>
            <Button onClick={nextStep} className="gap-2">
              Next Step
              <ChevronRight className="h-4 w-4" />
            </Button>
          </CardFooter>
        </Card>
      )}

      {/* Step 2: Categorization */}
      {currentStep === 2 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              Categorization
            </CardTitle>
            <CardDescription>
              Help buyers find your product by selecting the right category
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Class type — Regular | SPED */}
            <div className="space-y-2">
              <Label htmlFor="class_type" className="flex items-center gap-2">
                <BookOpen className="h-4 w-4" />
                Class type
              </Label>
              <Select
                value={formData.class_type || ''}
                onValueChange={(v) => {
                  updateField('class_type', v)
                  updateField('learner_path', '')
                  updateField('strand_id', '')
                  updateField('sped_level_id', '')
                  updateField('subject_ids', [])
                  updateField('subject_id', '')
                  updateField('grade_id', '')
                }}
              >
                <SelectTrigger id="class_type" className="w-full">
                  <SelectValue placeholder="Select class type" />
                </SelectTrigger>
                <SelectContent>
                  {CLASS_TYPES.map((c) => (
                    <SelectItem key={c.value} value={c.value}>
                      {c.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* SPED: Learner path */}
            {formData.class_type === 'sped' && (
              <div className="space-y-2">
                <Label htmlFor="learner_path" className="flex items-center gap-2">
                  <BookOpen className="h-4 w-4" />
                  Learner path
                </Label>
                <Select
                  value={formData.learner_path || ''}
                  onValueChange={(v) => {
                    updateField('learner_path', v)
                    updateField('sped_level_id', '')
                    updateField('grade_id', '')
                    updateField('subject_ids', []); updateField('subject_id', '')
                    if (v === 'graded') updateField('strand_id', '')
                  }}
                >
                  <SelectTrigger id="learner_path" className="w-full">
                    <SelectValue placeholder="Select path" />
                  </SelectTrigger>
                  <SelectContent>
                    {LEARNER_PATHS.map((p) => (
                      <SelectItem key={p.value} value={p.value}>
                        {p.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* SPED Non-Graded: Level */}
            {isSpedNonGraded && (
              <div className="space-y-2">
                <Label htmlFor="sped_level_id" className="flex items-center gap-2">
                  <BookOpen className="h-4 w-4" />
                  Level *
                </Label>
                <Select
                  value={formData.sped_level_id || ''}
                  onValueChange={(v) => updateField('sped_level_id', v)}
                >
                  <SelectTrigger
                    id="sped_level_id"
                    className={`w-full ${validation.sped_level_id ? 'border-destructive' : ''}`}
                  >
                    <SelectValue placeholder="Select level" />
                  </SelectTrigger>
                  <SelectContent>
                    {(hierarchy?.sped?.levels ?? []).map((l) => (
                      <SelectItem key={l.id} value={l.id}>
                        {l.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {validation.sped_level_id && (
                  <p className="text-sm text-destructive flex items-center gap-1">
                    <X className="h-3 w-3" />
                    {validation.sped_level_id}
                  </p>
                )}
              </div>
            )}

            {/* Grade Level — when Regular or SPED Graded */}
            {!isSpedNonGraded && (
              <div className="space-y-2">
                <Label htmlFor="grade_id" className="flex items-center gap-2">
                  <BookOpen className="h-4 w-4" />
                  Grade Level *
                </Label>
                <Select
                  value={formData.grade_id}
                  onValueChange={(value) => {
                    updateField('grade_id', value)
                    updateField('subject_ids', []); updateField('subject_id', '')
                    const g = grades.find((gr) => gr.id === value)
                    if (!g || (g.name !== 'Grade 11' && g.name !== 'Grade 12')) {
                      updateField('strand_id', '')
                    }
                  }}
                >
                  <SelectTrigger
                    id="grade_id"
                    className={`w-full ${validation.grade_id ? 'border-destructive' : ''}`}
                  >
                    <SelectValue placeholder="Select grade level" />
                  </SelectTrigger>
                  <SelectContent>
                    {grades.map((grade) => (
                      <SelectItem key={grade.id} value={grade.id}>
                        {grade.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {validation.grade_id && (
                  <p className="text-sm text-destructive flex items-center gap-1">
                    <X className="h-3 w-3" />
                    {validation.grade_id}
                  </p>
                )}
              </div>
            )}

            {/* Strand — when Regular and Grade 11 or 12 */}
            {formData.class_type === 'regular' && isGrade11Or12 && (
              <div className="space-y-2">
                <Label htmlFor="strand_id" className="flex items-center gap-2">
                  <BookOpen className="h-4 w-4" />
                  Strand *
                </Label>
                <Select
                  value={formData.strand_id || ''}
                  onValueChange={(v) => {
                    updateField('strand_id', v)
                    updateField('subject_ids', []); updateField('subject_id', '')
                  }}
                >
                  <SelectTrigger
                    id="strand_id"
                    className={`w-full ${validation.strand_id ? 'border-destructive' : ''}`}
                  >
                    <SelectValue placeholder="Select strand" />
                  </SelectTrigger>
                  <SelectContent>
                    {strands.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {validation.strand_id && (
                  <p className="text-sm text-destructive flex items-center gap-1">
                    <X className="h-3 w-3" />
                    {validation.strand_id}
                  </p>
                )}
              </div>
            )}

            {/* Subject: SUBJECT_SELECTION === 'multi' (Phase B) */}
            <div className="space-y-2">
              <Label htmlFor="subject_ids" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                {SUBJECT_SELECTION === 'multi' ? 'Subjects * (at least one; select multiple for integrated teaching)' : 'Subject *'}
              </Label>
              <div
                id="subject_ids"
                className={`max-h-48 overflow-y-auto rounded-md border p-3 space-y-2 ${validation.subject_ids ? 'border-destructive' : ''}`}
              >
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
                        <label
                          htmlFor={`subject-${subject.id}`}
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                        >
                          {subject.name}
                        </label>
                      </div>
                    )
                  })
                )}
              </div>
              {validation.subject_ids && (
                <p className="text-sm text-destructive flex items-center gap-1">
                  <X className="h-3 w-3" />
                  {validation.subject_ids}
                </p>
              )}
            </div>

            <Separator />

            <div className="space-y-2">
              <Label htmlFor="quarter" className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Quarter *
              </Label>
              <Select
                value={formData.quarter}
                onValueChange={(value) => updateField('quarter', value)}
              >
                <SelectTrigger
                  id="quarter"
                  className={`w-full ${validation.quarter ? 'border-destructive' : ''}`}
                >
                  <SelectValue placeholder="Select quarter" />
                </SelectTrigger>
                <SelectContent>
                  {QUARTERS.map((q) => (
                    <SelectItem key={q.value} value={q.value}>
                      {q.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {validation.quarter && (
                <p className="text-sm text-destructive flex items-center gap-1">
                  <X className="h-3 w-3" />
                  {validation.quarter}
                </p>
              )}
            </div>

            <Separator />

            <div className="space-y-3">
              <Label className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Weeks * (Select at least one)
              </Label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {WEEKS.map((week) => {
                  const isSelected = formData.weeks.includes(week)
                  return (
                    <label
                      key={week}
                      className={`flex items-center gap-2 p-3 rounded-lg border-2 cursor-pointer transition-all ${
                        isSelected
                          ? 'border-primary bg-primary/10'
                          : 'border-border hover:border-primary/50'
                      }`}
                    >
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={() => toggleWeek(week)}
                      />
                      <span className="text-sm font-medium">Week {week}</span>
                    </label>
                  )
                })}
              </div>
              {formData.weeks.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {formData.weeks.map((week) => (
                    <Badge key={week} variant="secondary" className="gap-1">
                      <CheckCircle2 className="h-3 w-3" />
                      Week {week}
                    </Badge>
                  ))}
                </div>
              )}
              {validation.weeks && (
                <p className="text-sm text-destructive flex items-center gap-1">
                  <X className="h-3 w-3" />
                  {validation.weeks}
                </p>
              )}
            </div>

            <Separator />

            <div className="space-y-2">
              <Label htmlFor="language" className="flex items-center gap-2">
                <BookOpen className="h-4 w-4" />
                Language of instruction
              </Label>
              <Select
                value={formData.language || ''}
                onValueChange={(value) => updateField('language', value)}
              >
                <SelectTrigger id="language" className="w-full">
                  <SelectValue placeholder="Select language" />
                </SelectTrigger>
                <SelectContent>
                  {LANGUAGES.map((lang) => (
                    <SelectItem key={lang.value} value={lang.value}>
                      {lang.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Separator />
            <div className="space-y-2">
              <Label htmlFor="curriculum" className="flex items-center gap-2">
                <BookOpen className="h-4 w-4" />
                Curriculum (optional)
              </Label>
              <Select
                value={formData.curriculum || ''}
                onValueChange={(value) => updateField('curriculum', value)}
              >
                <SelectTrigger id="curriculum" className="w-full">
                  <SelectValue placeholder="Select curriculum" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">None</SelectItem>
                  {CURRICULA.map((c) => (
                    <SelectItem key={c.value} value={c.value}>
                      {c.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Separator />
            <div className="space-y-2">
              <Label className="flex items-center gap-2">Modality (optional)</Label>
              <div className="flex flex-wrap gap-2">
                {MODALITIES.map((mod) => {
                  const selected = formData.modalities ?? []
                  const isSelected = selected.includes(mod.value)
                  return (
                    <label
                      key={mod.value}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg border-2 cursor-pointer transition-all text-sm ${
                        isSelected ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/50'
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
              <>
                <Separator />
                <div className="space-y-2">
                  <Label htmlFor="teaching_framework" className="flex items-center gap-2">
                    <BookOpen className="h-4 w-4" />
                    Teaching framework (optional)
                  </Label>
                  <Select
                    value={formData.teaching_framework || ''}
                    onValueChange={(value) => updateField('teaching_framework', value)}
                  >
                    <SelectTrigger id="teaching_framework" className="w-full">
                      <SelectValue placeholder="Select framework" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">None</SelectItem>
                      {TEACHING_FRAMEWORKS.map((f) => (
                        <SelectItem key={f.value} value={f.value}>
                          {f.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}
          </CardContent>
          <CardFooter className="flex justify-between border-t pt-4">
            <Button variant="outline" onClick={prevStep} className="gap-2">
              <ChevronRight className="h-4 w-4 rotate-180" />
              Previous
            </Button>
            <div className="flex gap-2">
              <Button variant="outline" onClick={saveDraft} disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Save Draft'
                )}
              </Button>
              <Button onClick={nextStep} className="gap-2">
                Next Step
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </CardFooter>
        </Card>
      )}

      {/* Step 3: Files & Media */}
      {currentStep === 3 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Files & Media
            </CardTitle>
            <CardDescription>
              Upload your product files and cover image
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-3">
              <Label htmlFor="product_files" className="flex items-center gap-2">
                <File className="h-4 w-4" />
                Product Files *
              </Label>
              <p className="text-sm text-muted-foreground">
                Upload your product files (PDF, DOCX, PPTX, XLSX - Max 50MB per
                file)
              </p>

              <label htmlFor="product_files">
                <Card
                  className={`border-2 border-dashed transition-colors cursor-pointer ${
                    uploadingFile
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  <CardContent className="p-6">
                    <div className="flex flex-col items-center justify-center gap-4 relative">
                      <div
                        className={`rounded-full p-4 ${
                          uploadingFile ? 'bg-primary/10' : 'bg-muted'
                        }`}
                      >
                        {uploadingFile && uploadingFiles.length > 0 ? (
                          <Upload className="h-8 w-8 text-primary" />
                        ) : uploadingFile ? (
                          <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        ) : (
                          <Upload className="h-8 w-8 text-muted-foreground" />
                        )}
                      </div>
                      <div className="text-center w-full">
                        <p className="text-sm font-medium">
                          {uploadingFile && uploadingFiles.length > 0
                            ? `Uploading ${uploadingFiles.length} file(s)...`
                            : uploadingFile
                              ? 'Uploading files...'
                              : 'Click to upload or drag and drop'}
                        </p>
                        {uploadingFile && uploadingFiles.length > 0 && (
                          <div className="mt-2 w-full max-w-xs mx-auto">
                            <Progress
                              value={
                                uploadingFiles.length > 0
                                  ? uploadingFiles.reduce((a, f) => a + f.progress, 0) /
                                    uploadingFiles.length
                                  : 0
                              }
                              className="h-2"
                            />
                          </div>
                        )}
                        <p className="text-xs text-muted-foreground mt-1">
                          Multiple files supported
                        </p>
                      </div>
                      <Input
                        id="product_files"
                        type="file"
                        multiple
                        accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx"
                        onChange={handleFileUpload}
                        disabled={uploadingFile}
                        className="sr-only"
                      />
                    </div>
                  </CardContent>
                </Card>
              </label>

              {validation.file_urls && (
                <Alert className="border-destructive bg-destructive/10">
                  <X className="h-4 w-4 text-destructive" />
                  <AlertDescription className="text-destructive">
                    {validation.file_urls}
                  </AlertDescription>
                </Alert>
              )}

              {(formData.file_urls.length > 0 || uploadingFiles.length > 0) && (
                <div className="space-y-2">
                  <p className="text-sm font-medium">
                    Uploaded Files (
                    {formData.file_urls.length + uploadingFiles.length})
                  </p>
                  <div className="space-y-2">
                    {formData.file_urls.map((url, index) => {
                      const FileIcon = getFileIcon(url)
                      return (
                      <Card key={`done-${index}`} className="p-3">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <div className="rounded-lg bg-primary/10 p-2">
                              <FileIcon className="h-5 w-5 text-primary" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate" title={url}>
                                {getFileNameFromUrl(url)}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {fileSizesByUrl[url] != null ? formatFileSize(fileSizesByUrl[url]) : '—'} · Uploaded successfully
                              </p>
                            </div>
                            <Badge variant="outline" className="gap-1">
                              <CheckCircle2 className="h-3 w-3" />
                              Ready
                            </Badge>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              const removedUrl = formData.file_urls[index]
                              updateField(
                                'file_urls',
                                formData.file_urls.filter((_, i) => i !== index)
                              )
                              if (removedUrl) setFileSizesByUrl((prev) => { const next = { ...prev }; delete next[removedUrl]; return next })
                            }}
                            className="text-destructive hover:text-destructive hover:bg-destructive/10"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </Card>
                    )})}
                    {uploadingFiles.map((item) => {
                      const FileIcon = getFileIcon(item.fileName)
                      return (
                      <Card key={item.id} className="p-3">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <div className="rounded-lg bg-primary/10 p-2">
                            <FileIcon className="h-5 w-5 text-primary" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">
                              {item.fileName}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {item.size != null ? formatFileSize(item.size) : ''}{item.size != null ? ' · ' : ''}Uploading... {item.progress}%
                            </p>
                            <Progress
                              value={item.progress}
                              className="h-1.5 mt-1.5"
                            />
                          </div>
                        </div>
                      </Card>
                    )})}
                  </div>
                </div>
              )}
            </div>

            <Separator />

            <div className="space-y-3">
              <Label htmlFor="cover_image" className="flex items-center gap-2">
                <ImageIcon className="h-4 w-4" />
                Cover Image *
              </Label>
              <p className="text-sm text-muted-foreground">
                Upload a cover image for your product (JPG, PNG, WEBP - Max
                10MB). Recommended: 1200x1200px (1:1 square, matches product
                cards)
              </p>

              {validation.cover_image_url && (
                <Alert className="border-destructive bg-destructive/10">
                  <X className="h-4 w-4 text-destructive" />
                  <AlertDescription className="text-destructive">
                    {validation.cover_image_url}
                  </AlertDescription>
                </Alert>
              )}

              {formData.cover_image_url ? (
                <Card>
                  <CardContent className="p-4">
                    <div className="relative group">
                      <img
                        src={formData.cover_image_url}
                        alt="Cover preview"
                        className="w-48 aspect-square object-cover rounded-lg border"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        onClick={() => updateField('cover_image_url', '')}
                        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <label htmlFor="cover_image">
                  <Card
                    className={`border-2 border-dashed transition-colors cursor-pointer ${
                      uploadingImage
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    <CardContent className="p-6">
                      <div className="flex flex-col items-center justify-center gap-4 relative">
                        <div
                          className={`rounded-full p-4 ${
                            uploadingImage ? 'bg-primary/10' : 'bg-muted'
                          }`}
                        >
                          {uploadingImage && coverImageProgress ? (
                            <span className="text-lg font-semibold text-primary">
                              {coverImageProgress.percent}%
                            </span>
                          ) : uploadingImage ? (
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                          ) : (
                            <ImageIcon className="h-8 w-8 text-muted-foreground" />
                          )}
                        </div>
                        <div className="text-center w-full">
                          <p className="text-sm font-medium">
                            {uploadingImage && coverImageProgress
                              ? `Uploading... ${coverImageProgress.percent}%`
                              : uploadingImage
                                ? 'Uploading image...'
                                : 'Click to upload cover image'}
                          </p>
                          {uploadingImage && coverImageProgress && (
                            <div className="mt-2 w-full max-w-xs mx-auto">
                              <Progress
                                value={coverImageProgress.percent}
                                className="h-2"
                              />
                            </div>
                          )}
                          <p className="text-xs text-muted-foreground mt-1">
                            Recommended: 1200x1200px (1:1 square)
                          </p>
                        </div>
                        <Input
                          id="cover_image"
                          type="file"
                          accept="image/jpeg,image/png,image/webp,image/gif"
                          onChange={handleImageUpload}
                          disabled={uploadingImage}
                          className="sr-only"
                        />
                      </div>
                    </CardContent>
                  </Card>
                </label>
              )}
            </div>
          </CardContent>
          <CardFooter className="flex justify-between border-t pt-4">
            <Button variant="outline" onClick={prevStep} className="gap-2">
              <ChevronRight className="h-4 w-4 rotate-180" />
              Previous
            </Button>
            <div className="flex gap-2">
              <Button variant="outline" onClick={saveDraft} disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Save Draft'
                )}
              </Button>
              <Button onClick={nextStep} className="gap-2">
                Next Step
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </CardFooter>
        </Card>
      )}

      {/* Step 4: Pricing & Publishing */}
      {currentStep === 4 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Pricing & Publishing
            </CardTitle>
            <CardDescription>
              Set your product price and review publishing information
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-3">
              <Label htmlFor="price" className="flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Price (₱) *
              </Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  ₱
                </span>
                <Input
                  id="price"
                  type="number"
                  min="50"
                  max="50000"
                  value={formData.price}
                  onChange={(e) =>
                    updateField('price', parseFloat(e.target.value) || 0)
                  }
                  className={`pl-8 ${
                    validation.price ? 'border-destructive' : ''
                  }`}
                />
              </div>
              {validation.price && (
                <p className="text-sm text-destructive flex items-center gap-1">
                  <X className="h-3 w-3" />
                  {validation.price}
                </p>
              )}
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground">
                  Minimum: ₱50, Maximum: ₱50,000
                </p>
                {formData.price >= 50 && formData.price <= 50000 && (
                  <Badge variant="outline" className="text-[10px] gap-1">
                    <CheckCircle2 className="h-3 w-3" />
                    Valid
                  </Badge>
                )}
              </div>
            </div>

            <Separator />

            <Alert className="border-blue-200 bg-blue-50 dark:bg-blue-950/20">
              <Info className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-blue-800 dark:text-blue-200">
                <strong>Publishing Note:</strong> Your first 3 products will be
                reviewed by our team before being published (24-48 hours).
                Subsequent products will be published immediately.
              </AlertDescription>
            </Alert>
          </CardContent>
          <CardFooter className="flex justify-between border-t pt-4">
            <Button variant="outline" onClick={prevStep} className="gap-2">
              <ChevronRight className="h-4 w-4 rotate-180" />
              Previous
            </Button>
            <div className="flex gap-2">
              <Button variant="outline" onClick={saveDraft} disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Save Draft'
                )}
              </Button>
              <Button onClick={nextStep} className="gap-2">
                Next Step
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </CardFooter>
        </Card>
      )}

      {/* Step 5: Confirmation */}
      {currentStep === 5 && (
        <Card>
          <CardHeader className="bg-gradient-to-r from-primary/10 to-primary/5 border-b-2 border-primary/20">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-primary/20 p-2">
                <CheckCircle2 className="h-6 w-6 text-primary" />
              </div>
              <div>
                <CardTitle className="text-xl">Almost There! Review & Confirm</CardTitle>
                <CardDescription className="text-base mt-1">
                  Your product looks great! Review the details below and publish when ready.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Product Overview */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">Product Overview</CardTitle>
                  <Badge variant="default" className="gap-1 bg-green-600 hover:bg-green-700">
                    <CheckCircle2 className="h-3 w-3" />
                    Ready to Publish
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {formData.cover_image_url && (
                  <div className="w-64 aspect-square mx-auto md:mx-0">
                    <img
                      src={formData.cover_image_url}
                      alt="Product cover"
                      className="w-full h-full object-cover rounded-lg border shadow-md"
                    />
                  </div>
                )}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Title</Label>
                    <p className="text-sm font-medium">{formData.title}</p>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Type</Label>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">
                        {PRODUCT_TYPES.find((t) => t.value === formData.product_type)
                          ?.label || formData.product_type}
                      </Badge>
                      {formData.specific_type && (
                        <Badge variant="outline">
                          {SPECIFIC_TYPES[formData.product_type]?.find(
                            (t) => t.value === formData.specific_type
                          )?.label || formData.specific_type}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Price</Label>
                    <p className="text-lg font-bold text-primary">
                      ₱{formData.price.toFixed(2)}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Files</Label>
                    <div className="flex items-center gap-2">
                      <File className="h-4 w-4 text-muted-foreground" />
                      <p className="text-sm font-medium">
                        {formData.file_urls.length} file(s) uploaded
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Categorization — Phase 2: Class type, Learner path, Level, Strand, N/A Grade for SPED non-graded */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Categorization</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {formData.class_type && (
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">Class type</Label>
                      <p className="text-sm font-medium">
                        {CLASS_TYPES.find((c) => c.value === formData.class_type)?.label ?? formData.class_type}
                      </p>
                    </div>
                  )}
                  {formData.class_type === 'sped' && formData.learner_path && (
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">Learner path</Label>
                      <p className="text-sm font-medium">
                        {LEARNER_PATHS.find((l) => l.value === formData.learner_path)?.label ?? formData.learner_path}
                      </p>
                    </div>
                  )}
                  {isSpedNonGraded && formData.sped_level_id && (
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">Level</Label>
                      <p className="text-sm font-medium">
                        {hierarchy?.sped?.levels.find((l) => l.id === formData.sped_level_id)?.name ?? '—'}
                      </p>
                    </div>
                  )}
                  {formData.class_type === 'regular' && isGrade11Or12 && formData.strand_id && (
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">Strand</Label>
                      <p className="text-sm font-medium">
                        {strands.find((s) => s.id === formData.strand_id)?.name ?? '—'}
                      </p>
                    </div>
                  )}
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Grade</Label>
                    <p className="text-sm font-medium">
                      {isSpedNonGraded ? 'N/A' : (grades.find((g) => g.id === formData.grade_id)?.name ?? 'N/A')}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Subjects</Label>
                    <p className="text-sm font-medium">
                      {(formData.subject_ids ?? []).length > 0
                        ? (formData.subject_ids ?? [])
                            .map((id) => subjects.find((s) => s.id === id)?.name)
                            .filter(Boolean)
                            .join(', ') || 'N/A'
                        : subjects.find((s) => s.id === formData.subject_id)?.name || 'N/A'}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Quarter</Label>
                    <p className="text-sm font-medium">
                      {QUARTERS.find((q) => q.value === formData.quarter)?.label ||
                        'N/A'}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Weeks</Label>
                    <div className="flex flex-wrap gap-1">
                      {formData.weeks.map((week) => (
                        <Badge key={week} variant="secondary">
                          Week {week}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  {formData.language && (
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">Language</Label>
                      <p className="text-sm font-medium">
                        {LANGUAGES.find((l) => l.value === formData.language)?.label || formData.language}
                      </p>
                    </div>
                  )}
                  {formData.curriculum && formData.curriculum !== '__none__' && (
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">Curriculum</Label>
                      <p className="text-sm font-medium">
                        {CURRICULA.find((c) => c.value === formData.curriculum)?.label || formData.curriculum}
                      </p>
                    </div>
                  )}
                  {formData.modalities && formData.modalities.length > 0 && (
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">Modality</Label>
                      <div className="flex flex-wrap gap-1">
                        {formData.modalities.map((mod) => (
                          <Badge key={mod} variant="secondary">
                            {MODALITIES.find((m) => m.value === mod)?.label || mod}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  {formData.product_type === 'lesson_plans' && formData.teaching_framework && formData.teaching_framework !== '__none__' && (
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">Teaching Framework</Label>
                      <p className="text-sm font-medium">
                        {TEACHING_FRAMEWORKS.find((f) => f.value === formData.teaching_framework)?.label || formData.teaching_framework}
                      </p>
                    </div>
                  )}
                  {(formData.product_type === 'rpms' || formData.product_type === 'posters') && formData.theme && (
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">Theme</Label>
                      <p className="text-sm font-medium">{formData.theme}</p>
                    </div>
                  )}
                  {(formData.product_type === 'posters' || formData.product_type === 'tarpaulins') && formData.size && (
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">Size</Label>
                      <p className="text-sm font-medium">{formData.size}</p>
                    </div>
                  )}
                  {formData.product_type === 'tarpaulins' && formData.season && (
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">Season</Label>
                      <p className="text-sm font-medium">{formData.season}</p>
                    </div>
                  )}
                  {formData.product_type === 'tarpaulins' && formData.occasion && (
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">Occasion</Label>
                      <p className="text-sm font-medium">{formData.occasion}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Description */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">Description</CardTitle>
                  <Badge variant="outline" className="text-xs">
                    {formData.description.length} characters
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">
                  {formData.description}
                </p>
              </CardContent>
            </Card>
          </CardContent>
          <CardFooter className="bg-muted/30 border-t-2 pt-6">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between w-full gap-4">
              <div className="space-y-1">
                <p className="text-sm font-medium">Ready to share your work?</p>
                <p className="text-xs text-muted-foreground">
                  Once published, teachers can discover and purchase your product
                </p>
              </div>
              <div className="flex gap-2 w-full md:w-auto">
                <Button variant="outline" onClick={prevStep} className="gap-2">
                  <ChevronRight className="h-4 w-4 rotate-180" />
                  Edit Details
                </Button>
                <Button variant="outline" onClick={saveDraft} disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    'Save Draft'
                  )}
                </Button>
                <Button onClick={publish} disabled={loading} className="gap-2 bg-primary hover:bg-primary/90">
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Publishing...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="h-4 w-4" />
                      Publish Product
                    </>
                  )}
                </Button>
              </div>
            </div>
          </CardFooter>
        </Card>
      )}
    </div>
  )
}
