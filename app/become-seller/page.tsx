'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  Upload,
  FileText,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Clock,
  X,
  Info,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertTitle, AlertDescription } from '@/registry/default/alert/alert'
import { Badge } from '@/registry/default/badge/badge'
import { Skeleton } from '@/registry/default/skeleton/skeleton'

interface VerificationStatus {
  id: string
  status: 'pending' | 'approved' | 'rejected'
  prc_license_number: string
  prc_license_expiry: string
  rejection_reason: string | null
  created_at: string
  attempt_count?: number
}

export default function BecomeSellerPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [verificationStatus, setVerificationStatus] = useState<VerificationStatus | null>(null)

  // Form state
  const [documentFile, setDocumentFile] = useState<File | null>(null)
  const [documentPreview, setDocumentPreview] = useState<string | null>(null)
  const [prcLicenseNumber, setPrcLicenseNumber] = useState('')
  const [prcLicenseExpiry, setPrcLicenseExpiry] = useState('')

  // Load verification status
  useEffect(() => {
    const loadVerificationStatus = async () => {
      try {
        const response = await fetch('/api/me/verification-status')
        if (response.ok) {
          const data = await response.json()
          if (data.verification) {
            setVerificationStatus(data.verification)
          }
        } else if (response.status === 401) {
          router.push('/login')
          return
        }
      } catch (err) {
        console.error('Error loading verification status:', err)
      } finally {
        setLoading(false)
      }
    }

    loadVerificationStatus()
  }, [router])

  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png']
    if (!allowedTypes.includes(file.type)) {
      setError('Invalid file type. Please upload a PDF, JPG, or PNG file.')
      return
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024 // 10MB
    if (file.size > maxSize) {
      setError('File size must be less than 10MB.')
      return
    }

    setDocumentFile(file)
    setError(null)

    // Create preview for images
    if (file.type.startsWith('image/')) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setDocumentPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    } else {
      setDocumentPreview(null)
    }
  }

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(false)

    // Validation
    if (!documentFile) {
      setError('Please upload your PRC License document.')
      return
    }

    if (!prcLicenseNumber.trim()) {
      setError('Please enter your PRC License Number.')
      return
    }

    if (!prcLicenseExpiry) {
      setError('Please enter your PRC License Expiration Date.')
      return
    }

    // Validate expiration date is in the future
    const expiryDate = new Date(prcLicenseExpiry)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    if (expiryDate <= today) {
      setError('License expiration date must be in the future.')
      return
    }

    setSubmitting(true)

    try {
      const formData = new FormData()
      formData.append('document', documentFile)
      formData.append('prc_license_number', prcLicenseNumber.trim())
      formData.append('prc_license_expiry', prcLicenseExpiry)

      const response = await fetch('/api/me/verify-teacher', {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit verification')
      }

      setSuccess(true)
      // Reload verification status
      const statusResponse = await fetch('/api/me/verification-status')
      if (statusResponse.ok) {
        const statusData = await statusResponse.json()
        if (statusData.verification) {
          setVerificationStatus(statusData.verification)
        }
      }
      // Reset form
      setDocumentFile(null)
      setDocumentPreview(null)
      setPrcLicenseNumber('')
      setPrcLicenseExpiry('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit verification')
    } finally {
      setSubmitting(false)
    }
  }

  // Get status badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return (
          <Badge variant="secondary" className="gap-1.5">
            <Clock className="h-3 w-3" />
            Under Review
          </Badge>
        )
      case 'approved':
        return (
          <Badge className="bg-green-600 gap-1.5">
            <CheckCircle2 className="h-3 w-3" />
            Approved
          </Badge>
        )
      case 'rejected':
        return (
          <Badge variant="destructive" className="gap-1.5">
            <X className="h-3 w-3" />
            Rejected
          </Badge>
        )
      default:
        return null
    }
  }

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  // Format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <Skeleton className="h-10 w-64 mb-6" />
        <Skeleton className="h-96 w-full" />
      </div>
    )
  }

  // If approved, show success message
  if (verificationStatus?.status === 'approved') {
    return (
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <Card className="border-green-200 bg-green-50">
          <CardHeader>
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-8 w-8 text-green-600" />
              <div>
                <CardTitle className="text-green-900">Verification Approved!</CardTitle>
                <CardDescription className="text-green-700">
                  You can now start selling on Ako may lesson plan na!
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-white rounded-lg">
                <div>
                  <p className="text-sm text-gray-600">PRC License Number</p>
                  <p className="font-medium">{verificationStatus.prc_license_number}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Expires</p>
                  <p className="font-medium">{formatDate(verificationStatus.prc_license_expiry)}</p>
                </div>
              </div>
              <Button onClick={() => router.push('/shop/products/new')} className="w-full">
                Upload Your First Product
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-3">Become a Seller</h1>
        <p className="text-gray-600 text-base">
          Verify your teacher credentials to start selling educational resources on Ako may lesson plan na!
        </p>
      </div>

      {/* Current Status */}
      {verificationStatus && (
        <Card className="mb-6">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl">Verification Status</CardTitle>
              {getStatusBadge(verificationStatus.status)}
            </div>
          </CardHeader>
          <CardContent>
            {verificationStatus.status === 'pending' && (
              <Alert>
                <Clock className="h-4 w-4" />
                <AlertTitle>Under Review</AlertTitle>
                <AlertDescription>
                  Your verification request was submitted on {formatDate(verificationStatus.created_at)}.
                  Our team will review your application within 24-48 hours.
                </AlertDescription>
              </Alert>
            )}
            {verificationStatus.status === 'rejected' && (
              <div className="space-y-4">
                <Alert className="border-destructive bg-destructive/10 text-destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Verification Rejected</AlertTitle>
                  <AlertDescription>
                    {verificationStatus.rejection_reason || 'Your verification request was rejected. Please review your submission and try again.'}
                  </AlertDescription>
                </Alert>
                {verificationStatus.attempt_count && verificationStatus.attempt_count >= 3 && (
                  <Alert>
                    <Info className="h-4 w-4" />
                    <AlertTitle>Maximum Attempts Reached</AlertTitle>
                    <AlertDescription>
                      You have reached the maximum number of verification attempts. Please contact support for assistance.
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Verification Form */}
      {(!verificationStatus || verificationStatus.status === 'rejected') && (
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-xl">Teacher Verification</CardTitle>
            <CardDescription className="mt-1.5">
              Upload your PRC License to verify your teacher credentials. Only PRC Licenses are accepted.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Error/Success Messages */}
              {error && (
                <Alert className="mb-1 border-destructive bg-destructive/10 text-destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {success && (
                <Alert className="border-green-500 bg-green-50 mb-1">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <AlertTitle className="text-green-800">Success</AlertTitle>
                  <AlertDescription className="text-green-700">
                    Your verification request has been submitted successfully. We'll review it within 24-48 hours.
                  </AlertDescription>
                </Alert>
              )}

              {/* Document Upload */}
              <div className="space-y-2.5">
                <Label htmlFor="document" className="text-base font-medium">PRC License Document *</Label>
                <div className="space-y-2">
                  <Input
                    id="document"
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={handleFileChange}
                    className="cursor-pointer file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-[#ff7200] file:text-white hover:file:bg-[#e66500] file:cursor-pointer"
                  />
                  <p className="text-xs text-gray-500">
                    Accepted formats: PDF, JPG, PNG. Maximum file size: 10MB
                  </p>
                  {documentPreview && (
                    <div className="mt-3 space-y-2">
                      <img
                        src={documentPreview}
                        alt="Document preview"
                        className="max-w-full h-auto max-h-64 rounded-lg border border-gray-200"
                      />
                      {documentFile && (
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <FileText className="h-4 w-4" />
                          <span className="font-medium">{documentFile.name}</span>
                          <span className="text-gray-500">({formatFileSize(documentFile.size)})</span>
                        </div>
                      )}
                    </div>
                  )}
                  {documentFile && !documentPreview && (
                    <div className="mt-3 flex items-center gap-2 p-3 bg-gray-50 rounded-lg border border-gray-200">
                      <FileText className="h-5 w-5 text-gray-400" />
                      <div className="flex-1">
                        <span className="text-sm font-medium text-gray-700">{documentFile.name}</span>
                        <span className="text-xs text-gray-500 ml-2">({formatFileSize(documentFile.size)})</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* PRC License Number and Expiration Date */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="prc_license_number">PRC License Number *</Label>
                  <Input
                    id="prc_license_number"
                    type="text"
                    value={prcLicenseNumber}
                    onChange={(e) => setPrcLicenseNumber(e.target.value)}
                    placeholder="Enter your PRC License Number"
                    required
                    maxLength={50}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="prc_license_expiry">License Expiration Date *</Label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="prc_license_expiry"
                      type="date"
                      value={prcLicenseExpiry}
                      onChange={(e) => setPrcLicenseExpiry(e.target.value)}
                      required
                      className="pl-9"
                      min={new Date().toISOString().split('T')[0]}
                    />
                  </div>
                </div>
              </div>
              <p className="text-xs text-gray-500 -mt-2">
                Your license must be valid (not expired)
              </p>

              {/* Info Alert */}
              <Alert className="bg-blue-50 border-blue-200">
                <Info className="h-4 w-4 text-blue-600" />
                <AlertTitle className="text-blue-900">What happens next?</AlertTitle>
                <AlertDescription className="text-blue-800">
                  After submission, our team will review your verification request within 24-48 hours.
                  You can continue browsing the marketplace while waiting for approval. Once approved,
                  you'll be able to upload and sell your educational resources.
                </AlertDescription>
              </Alert>

              {/* Submit Button */}
              <div className="flex gap-4 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.back()}
                  className="flex-1 h-9"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={submitting || !documentFile || !prcLicenseNumber || !prcLicenseExpiry}
                  className="flex-1 h-9"
                >
                  {submitting ? (
                    <>
                      <div className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-current border-t-transparent" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4 mr-2" />
                      Submit Verification
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
