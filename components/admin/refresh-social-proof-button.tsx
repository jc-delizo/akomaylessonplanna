'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { RefreshCw } from 'lucide-react'
import { toast } from 'sonner'

export function RefreshSocialProofButton() {
  const [loading, setLoading] = useState(false)

  const handleClick = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/refresh-social-proof', {
        method: 'POST',
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        toast.error(data.error ?? data.message ?? 'Failed to refresh social proof')
        return
      }
      toast.success('Social proof refreshed')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to refresh social proof')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button
      variant="outline"
      onClick={handleClick}
      disabled={loading}
      aria-busy={loading}
      aria-label={loading ? 'Refreshing social proof…' : 'Refresh social proof'}
    >
      {loading ? (
        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
      ) : (
        <RefreshCw className="h-4 w-4 mr-2" />
      )}
      Refresh social proof
    </Button>
  )
}
