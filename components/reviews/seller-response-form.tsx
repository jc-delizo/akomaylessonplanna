'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'

interface SellerResponseFormProps {
  reviewId: string
  initialResponse?: string | null
  onSuccess?: () => void
  onCancel?: () => void
}

export function SellerResponseForm({
  reviewId,
  initialResponse,
  onSuccess,
  onCancel,
}: SellerResponseFormProps) {
  const [response, setResponse] = useState(initialResponse || '')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const remainingChars = 500 - response.length

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (response.trim().length === 0) {
      setError('Response cannot be empty')
      return
    }

    if (response.length > 500) {
      setError('Response must be 500 characters or less')
      return
    }

    setIsSubmitting(true)

    try {
      const res = await fetch(`/api/reviews/${reviewId}/response`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ response: response.trim() }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to submit response')
      }

      if (onSuccess) {
        onSuccess()
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit response')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="response" className="mb-2 block">
          Respond to this review
        </Label>
        <Textarea
          id="response"
          value={response}
          onChange={(e) => setResponse(e.target.value)}
          placeholder="Thank the buyer for their feedback..."
          maxLength={500}
          rows={4}
          className="resize-none"
        />
        <div className="flex justify-between items-center mt-1">
          <p className="text-xs text-gray-500">
            {remainingChars} characters remaining
          </p>
          <p className="text-xs text-gray-500">
            {response.length} / 500
          </p>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
          {error}
        </div>
      )}

      <div className="flex gap-3">
        <Button
          type="submit"
          disabled={isSubmitting || response.trim().length === 0}
          className="flex-1"
        >
          {isSubmitting ? 'Submitting...' : initialResponse ? 'Update Response' : 'Submit Response'}
        </Button>
        {onCancel && (
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
        )}
      </div>
    </form>
  )
}
