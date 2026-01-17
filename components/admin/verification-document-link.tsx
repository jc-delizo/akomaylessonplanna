'use client'

import { useState, useEffect } from 'react'
import { FileText, Loader2 } from 'lucide-react'

interface VerificationDocumentLinkProps {
  verificationId: string
  documentUrl: string
}

export function VerificationDocumentLink({
  verificationId,
  documentUrl,
}: VerificationDocumentLinkProps) {
  const [signedUrl, setSignedUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchSignedUrl = async () => {
      try {
        const response = await fetch(`/api/admin/verifications/${verificationId}/document-url`)
        if (response.ok) {
          const data = await response.json()
          setSignedUrl(data.url)
        } else {
          setError('Failed to load document')
        }
      } catch (err) {
        console.error('Error fetching signed URL:', err)
        setError('Failed to load document')
      } finally {
        setLoading(false)
      }
    }

    fetchSignedUrl()
  }, [verificationId])

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span>Loading document...</span>
      </div>
    )
  }

  if (error || !signedUrl) {
    return (
      <div className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-md">
        {error || 'Document not available'}
      </div>
    )
  }

  return (
    <a
      href={signedUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-2 px-4 py-2.5 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-md transition-colors font-medium text-sm border border-purple-200"
    >
      <FileText className="h-4 w-4" />
      <span>View PRC License Document</span>
      <span className="text-purple-500">→</span>
    </a>
  )
}
