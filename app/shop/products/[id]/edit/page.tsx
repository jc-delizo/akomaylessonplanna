'use client'

import { useState, useEffect, useRef } from 'react'
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
import { Alert, AlertDescription } from '@/registry/default/alert/alert'
import { Progress } from '@/registry/default/progress/progress'
import { toast } from 'sonner'
import {
  FileText,
  Image as ImageIcon,
  Upload,
  CheckCircle2,
  ChevronRight,
  X,
  File,
  FileSpreadsheet,
  Presentation,
  DollarSign,
  Info,
  Loader2,
  BookOpen,
  Calendar,
  FileCheck,
} from 'lucide-react'
import { WEEKS_OPTIONS } from '@/lib/config/lesson-plan-config'

const WEEKS = [...WEEKS_OPTIONS]

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
  title: string
  product_type: string
  specific_type: string
  description: string
  grade_id: string
  subject_id: string
  subject_ids: string[]
  strand_id?: string
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
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [productId, setProductId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hierarchy, setHierarchy] = useState<{
    regular: { grades: { id: string; name: string; sortOrder: number }[]; strands: { id: string; name: string; code: string }[]; subjectsByGrade: Record<string, { id: string; name: string; code: string }[]>; subjectsByStrand: Record<string, { id: string; name: string; code: string }[]> }
  } | null>(null)
  const [productTypes, setProductTypes] = useState<{ id: string; slug: string; label: string; sortOrder: number }[]>([])
  const [specificTypesByProductType, setSpecificTypesByProductType] = useState<Record<string, { value: string; label: string; sortOrder: number }[]>>({})
  const [curricula, setCurricula] = useState<{ value: string; label: string; sortOrder: number }[]>([])
  const [modalities, setModalities] = useState<{ value: string; label: string; sortOrder: number }[]>([])
  const [languages, setLanguages] = useState<{ value: string; label: string; sortOrder: number }[]>([])
  const [quarters, setQuarters] = useState<{ value: string; label: string; sortOrder: number }[]>([])
  const [teachingFrameworks, setTeachingFrameworks] = useState<{ value: string; label: string; sortOrder: number }[]>([])
  const [originalProduct, setOriginalProduct] = useState<any>(null)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [uploadingFile, setUploadingFile] = useState(false)
  const [coverImageProgress, setCoverImageProgress] = useState<{ loaded: number; total: number; percent: number } | null>(null)
  const [uploadingFiles, setUploadingFiles] = useState<Array<{ id: string; fileName: string; progress: number; size?: number }>>([])
  const [fileSizesByUrl, setFileSizesByUrl] = useState<Record<string, number>>({})

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

        // Populate form (include Phase 2 hierarchy fields and type-specific fields)
        setFormData({
          title: product.title,
          product_type: product.product_type,
          specific_type: product.specific_type || '',
          description: product.description,
          grade_id: product.grade_id || '',
          subject_id: product.subject_id || '',
          subject_ids: Array.isArray(product.subject_ids) && product.subject_ids.length > 0 ? product.subject_ids : (product.subject_id ? [product.subject_id] : []),
          strand_id: product.strand_id || undefined,
          quarter: product.quarter?.toString() || '',
          weeks: product.weeks || [],
          language: product.language || '',
          curriculum: product.curriculum || '',
          modalities: product.modalities || [],
          teaching_framework: product.teaching_framework || '',
          theme: product.theme || undefined,
          size: product.size || undefined,
          season: product.season || undefined,
          occasion: product.occasion || undefined,
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

  // Fetch lesson-plan hierarchy and catalog
  useEffect(() => {
    async function fetchHierarchy() {
      try {
        const response = await fetch('/api/lesson-plan-config')
        if (response.ok) {
          const data = await response.json()
          setHierarchy({
            regular: { grades: data.regular.grades, strands: data.regular.strands, subjectsByGrade: data.regular.subjectsByGrade || {}, subjectsByStrand: data.regular.subjectsByStrand || {} },
          })
          setProductTypes(data.productTypes ?? [])
          setSpecificTypesByProductType(data.specificTypesByProductType ?? {})
          setCurricula(data.curricula ?? [])
          setModalities(data.modalities ?? [])
          setLanguages(data.languages ?? [])
          setQuarters(data.quarters ?? [])
          setTeachingFrameworks(data.teachingFrameworks ?? [])
        }
      } catch (err) {
        console.error('Error fetching lesson-plan config:', err)
      }
    }
    fetchHierarchy()
  }, [])

  const grades = hierarchy?.regular?.grades ?? []
  const strands = hierarchy?.regular?.strands ?? []
  const selectedGrade = grades.find((g) => g.id === formData.grade_id)
  const isGrade11Or12 = selectedGrade && (selectedGrade.name === 'Grade 11' || selectedGrade.name === 'Grade 12')
  const subjects = formData.grade_id
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
    const selectedGradeVal = grades.find((g) => g.id === formData.grade_id)
    const isG11Or12 = selectedGradeVal && (selectedGradeVal.name === 'Grade 11' || selectedGradeVal.name === 'Grade 12')
    const sidCount = (formData.subject_ids ?? []).length
    if (sidCount === 0 && !formData.subject_id) {
      errors.subject_ids = 'At least one subject is required'
    }
    if (!formData.grade_id) errors.grade_id = 'Grade level is required'
    if (isG11Or12 && !formData.strand_id) {
      errors.strand_id = 'Strand is required for Grade 11/12'
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
      const payload = {
        ...formData,
        curriculum: formData.curriculum === '__none__' ? '' : (formData.curriculum ?? ''),
        teaching_framework: formData.teaching_framework === '__none__' ? '' : (formData.teaching_framework ?? ''),
      }
      const response = await fetch(`/api/products/${productId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (response.ok) {
        toast.success('Product Updated Successfully!', {
          description: 'Your changes have been saved.',
          duration: 4000,
        })
        router.push('/shop/products')
      } else {
        const { error: apiError } = await response.json()
        toast.error('Failed to Update Product', {
          description: apiError || 'Please check your connection and try again.',
          duration: 5000,
        })
        setError(apiError || 'Failed to update product')
      }
    } catch (err) {
      console.error('Error updating product:', err)
      toast.error('Failed to Update Product', {
        description: 'An unexpected error occurred. Please try again.',
        duration: 5000,
      })
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
        uploadFormData.append('productId', productId || 'draft')

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
      uploadFormData.append('productId', productId || 'draft')

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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading product...</p>
        </div>
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
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
          <Button variant="ghost" size="sm" onClick={() => router.push('/shop/products')}>
            Products
          </Button>
          <ChevronRight className="h-4 w-4" />
          <span>Edit Product</span>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Edit Product</h1>
            <p className="text-muted-foreground mt-1">
              Update your product details and republish
            </p>
          </div>
          {originalProduct?.status && (
            <Badge variant={originalProduct.status === 'published' ? 'default' : 'secondary'}>
              {originalProduct.status}
            </Badge>
          )}
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

      {originalProduct?.status === 'published' && (
        <Alert className="mb-6 border-blue-200 bg-blue-50 dark:bg-blue-950/20">
          <Info className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-800 dark:text-blue-200">
            <strong>Published Product:</strong> If you update files or content, you must provide a changelog explaining what changed. A new version will be created.
          </AlertDescription>
        </Alert>
      )}

      <div className="space-y-6">
        {/* Cover Image */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ImageIcon className="h-5 w-5" />
              Cover Image
            </CardTitle>
            <CardDescription>
              Upload a cover image for your product (JPG, PNG, WEBP - Max 10MB). Recommended: 1200x1200px (1:1 square)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
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
        </Card>

        {/* Files */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <File className="h-5 w-5" />
              Product Files
            </CardTitle>
            <CardDescription>
              Manage your product files (PDF, DOCX, PPTX, XLSX - Max 50MB per file)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              {formData.file_urls.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium">Current Files ({formData.file_urls.length})</p>
                  <div className="space-y-2">
                    {formData.file_urls.map((url, index) => {
                      const FileIcon = getFileIcon(url)
                      return (
                      <Card key={index} className="p-3">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <div className="rounded-lg bg-primary/10 p-2">
                              <FileIcon className="h-5 w-5 text-primary" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate" title={url}>
                                {getFileNameFromUrl(url)}
                              </p>
                            </div>
                            <Badge variant="outline" className="gap-1">
                              <CheckCircle2 className="h-3 w-3" />
                              Uploaded
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
                  </div>
                </div>
              )}

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
                        Uploading... {item.progress}%
                      </p>
                      <Progress
                        value={item.progress}
                        className="h-1.5 mt-1.5"
                      />
                    </div>
                  </div>
                </Card>
              )})}

              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx"
                onChange={handleFileUpload}
                className="sr-only"
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingFile}
                className="w-full"
              >
                {uploadingFile ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    Upload New File
                  </>
                )}
              </Button>
              {validation.file_urls && (
                <p className="text-sm text-destructive">{validation.file_urls}</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Pricing */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Pricing
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
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
                  onChange={(e) => updateField('price', parseFloat(e.target.value) || 0)}
                  className={`pl-8 ${validation.price ? 'border-destructive' : ''}`}
                />
              </div>
              {validation.price && (
                <p className="text-sm text-destructive">{validation.price}</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Basic Information
            </CardTitle>
            <CardDescription>
              Update your product&apos;s title, type, and description
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Product Title *
              </Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => updateField('title', e.target.value)}
                maxLength={255}
                className={validation.title ? 'border-destructive' : ''}
              />
              {validation.title && (
                <p className="text-sm text-destructive">{validation.title}</p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="product_type" className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Product Type *
                </Label>
                <Select
                  value={formData.product_type}
                  onValueChange={(value) => updateField('product_type', value)}
                >
                  <SelectTrigger id="product_type" className="w-full">
                    <SelectValue placeholder="Select product type" />
                  </SelectTrigger>
                  <SelectContent>
                    {productTypes.map((type) => (
                      <SelectItem key={type.slug} value={type.slug}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {formData.product_type && (specificTypesByProductType[formData.product_type]?.length ?? 0) > 0 && (
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
                      {specificTypesByProductType[formData.product_type].map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Description *
              </Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => updateField('description', e.target.value)}
                rows={6}
                maxLength={2000}
                className={validation.description ? 'border-destructive' : ''}
              />
              {validation.description && (
                <p className="text-sm text-destructive">{validation.description}</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Categorization */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              Categorization
            </CardTitle>
            <CardDescription>
              Help buyers find your product by updating categories
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                  <Label htmlFor="grade_id" className="flex items-center gap-2">
                    <BookOpen className="h-4 w-4" />
                    Grade Level *
                  </Label>
                  <Select
                    value={formData.grade_id}
                    onValueChange={(value) => {
                      updateField('grade_id', value)
                      updateField('subject_ids', [])
                      updateField('subject_id', '')
                      const g = grades.find((gr) => gr.id === value)
                      if (!g || (g.name !== 'Grade 11' && g.name !== 'Grade 12')) {
                        updateField('strand_id', undefined)
                      }
                    }}
                  >
                    <SelectTrigger id="grade_id" className={`w-full ${validation.grade_id ? 'border-destructive' : ''}`}>
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
                    <p className="text-sm text-destructive">{validation.grade_id}</p>
                  )}
                </div>
            </div>

            {isGrade11Or12 && (
              <div className="space-y-2">
                <Label htmlFor="strand_id" className="flex items-center gap-2">
                  <BookOpen className="h-4 w-4" />
                  Strand *
                </Label>
                <Select
                  value={formData.strand_id || ''}
                  onValueChange={(v) => {
                    updateField('strand_id', v || undefined)
                    updateField('subject_ids', [])
                    updateField('subject_id', '')
                  }}
                >
                  <SelectTrigger id="strand_id" className={`w-full ${validation.strand_id ? 'border-destructive' : ''}`}>
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
                  <p className="text-sm text-destructive">{validation.strand_id}</p>
                )}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="subject_ids" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Subjects * (at least one; select multiple for integrated teaching)
              </Label>
              <div id="subject_ids" className={`max-h-48 overflow-y-auto rounded-md border p-3 space-y-2 ${validation.subject_ids ? 'border-destructive' : ''}`}>
                {subjects.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    Select grade and strand first
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
                <p className="text-sm text-destructive">{validation.subject_ids}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="quarter" className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Quarter
              </Label>
              <Select
                value={formData.quarter}
                onValueChange={(value) => updateField('quarter', value)}
              >
                <SelectTrigger id="quarter" className="w-full">
                  <SelectValue placeholder="Select quarter" />
                </SelectTrigger>
                <SelectContent>
                  {quarters.map((q) => (
                    <SelectItem key={q.value} value={q.value}>
                      {q.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

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
            </div>

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
                  {languages.map((lang) => (
                    <SelectItem key={lang.value} value={lang.value}>
                      {lang.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="curriculum" className="flex items-center gap-2">
                <BookOpen className="h-4 w-4" />
                Curriculum
              </Label>
              <Select
                value={formData.curriculum || ''}
                onValueChange={(value) => updateField('curriculum', value)}
              >
                <SelectTrigger id="curriculum" className="w-full">
                  <SelectValue placeholder="None" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">None</SelectItem>
                  {curricula.map((c) => (
                    <SelectItem key={c.value} value={c.value}>
                      {c.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2">Modality (optional)</Label>
              <div className="flex flex-wrap gap-2">
                {modalities.map((mod) => {
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
              <div className="space-y-2">
                <Label htmlFor="teaching_framework" className="flex items-center gap-2">
                  <BookOpen className="h-4 w-4" />
                  Teaching framework
                </Label>
                <Select
                  value={formData.teaching_framework || ''}
                  onValueChange={(value) => updateField('teaching_framework', value)}
                >
                  <SelectTrigger id="teaching_framework" className="w-full">
                    <SelectValue placeholder="None" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">None</SelectItem>
                    {teachingFrameworks.map((f) => (
                      <SelectItem key={f.value} value={f.value}>
                        {f.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Type-specific fields */}
            {(formData.product_type === 'rpms' || formData.product_type === 'posters') && (
              <div className="space-y-2">
                <Label htmlFor="theme">Theme</Label>
                <Input
                  id="theme"
                  value={formData.theme || ''}
                  onChange={(e) => updateField('theme', e.target.value)}
                  placeholder="e.g., Safari, Abstract, Floral"
                />
              </div>
            )}

            {(formData.product_type === 'posters' || formData.product_type === 'tarpaulins') && (
              <div className="space-y-2">
                <Label htmlFor="size">Size</Label>
                <Input
                  id="size"
                  value={formData.size || ''}
                  onChange={(e) => updateField('size', e.target.value)}
                  placeholder="e.g., A4, 8x10, 3x5 feet"
                />
              </div>
            )}

            {formData.product_type === 'tarpaulins' && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="season">Season</Label>
                  <Input
                    id="season"
                    value={formData.season || ''}
                    onChange={(e) => updateField('season', e.target.value)}
                    placeholder="e.g., Christmas, Summer"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="occasion">Occasion</Label>
                  <Input
                    id="occasion"
                    value={formData.occasion || ''}
                    onChange={(e) => updateField('occasion', e.target.value)}
                    placeholder="e.g., Birthday, Graduation"
                  />
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Version Update - conditional */}
        {originalProduct?.status === 'published' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileCheck className="h-5 w-5" />
                Version Update
              </CardTitle>
              <CardDescription>
                Describe what changed in this version
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="changelog" className="flex items-center gap-2">
                  <FileCheck className="h-4 w-4" />
                  Changelog *
                </Label>
                <Textarea
                  id="changelog"
                  value={formData.changelog}
                  onChange={(e) => updateField('changelog', e.target.value)}
                  placeholder="What's new in this version? (min 20 characters)"
                  rows={4}
                  className={validation.changelog ? 'border-destructive' : ''}
                />
                {validation.changelog && (
                  <p className="text-sm text-destructive">{validation.changelog}</p>
                )}
              </div>

              <div className="flex items-center gap-2">
                <Checkbox
                  id="is_major_update"
                  checked={formData.is_major_update || false}
                  onCheckedChange={(checked) => updateField('is_major_update', !!checked)}
                />
                <Label htmlFor="is_major_update" className="cursor-pointer">
                  This is a major update
                </Label>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Footer Actions */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pt-6 border-t">
          <div className="space-y-1">
            <p className="text-sm font-medium">Ready to save your changes?</p>
            <p className="text-xs text-muted-foreground">
              Your updates will be saved immediately
            </p>
          </div>
          <div className="flex gap-2 w-full md:w-auto">
            <Button
              variant="outline"
              onClick={() => router.push('/shop/products')}
            >
              Cancel
            </Button>
            <Button
              onClick={saveChanges}
              disabled={saving}
              className="gap-2"
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
