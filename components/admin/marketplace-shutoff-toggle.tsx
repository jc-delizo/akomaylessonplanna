'use client'

import { useState, useEffect } from 'react'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'

interface MarketplaceShutoffToggleProps {
  isSuperAdmin: boolean
}

/**
 * Toggle for marketplace open/closed. Only visible to Super Admin.
 * Renders left of Create Announcement on /admin/announcements.
 * Checked = marketplace open; unchecked = closed (blur overlay on marketplace + browse).
 */
export function MarketplaceShutoffToggle({ isSuperAdmin }: MarketplaceShutoffToggleProps) {
  const [checked, setChecked] = useState<boolean>(true)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)

  useEffect(() => {
    if (!isSuperAdmin) {
      setLoading(false)
      return
    }
    let cancelled = false
    fetch('/api/admin/settings/platform', { credentials: 'include' })
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error('Unauthorized'))))
      .then((data) => {
        if (!cancelled) {
          const closed = data.marketplaceClosed === true
          setChecked(!closed)
        }
      })
      .catch(() => {
        if (!cancelled) setChecked(true)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [isSuperAdmin])

  const handleCheckedChange = async (next: boolean) => {
    if (!isSuperAdmin || updating) return
    const previous = checked
    setChecked(next)
    setUpdating(true)
    try {
      const res = await fetch('/api/admin/settings/platform', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ marketplaceClosed: !next }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || 'Failed to update')
      }
    } catch (e) {
      setChecked(previous)
      toast.error(e instanceof Error ? e.message : 'Failed to update marketplace setting')
    } finally {
      setUpdating(false)
    }
  }

  if (!isSuperAdmin) return null
  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <span className="h-6 w-11 rounded-full bg-muted animate-pulse" />
        <span>Marketplace open</span>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2">
      <Switch
        id="marketplace-open"
        checked={checked}
        onCheckedChange={handleCheckedChange}
        disabled={updating}
      />
      <Label htmlFor="marketplace-open" className="text-sm font-medium cursor-pointer">
        Marketplace open
      </Label>
    </div>
  )
}
