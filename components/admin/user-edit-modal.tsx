'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Loader2 } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface UserEditModalProps {
  user: {
    id: string
    first_name: string
    last_name: string
    username: string | null
    bio: string | null
    subscription_tier: string
    is_banned: boolean
    ban_reason: string | null
  }
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

export function UserEditModal({ user, open, onOpenChange, onSuccess }: UserEditModalProps) {
  const router = useRouter()
  const [first_name, setFirstName] = useState(user.first_name)
  const [last_name, setLastName] = useState(user.last_name)
  const [username, setUsername] = useState(user.username || '')
  const [bio, setBio] = useState(user.bio || '')
  const [subscription_tier, setSubscriptionTier] = useState(user.subscription_tier)
  const [is_banned, setIsBanned] = useState(user.is_banned)
  const [ban_reason, setBanReason] = useState(user.ban_reason || '')
  const [reason, setReason] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (open) {
      setFirstName(user.first_name)
      setLastName(user.last_name)
      setUsername(user.username || '')
      setBio(user.bio || '')
      setSubscriptionTier(user.subscription_tier)
      setIsBanned(user.is_banned)
      setBanReason(user.ban_reason || '')
      setReason('')
      setError(null)
    }
  }, [open, user])

  const changingBan = is_banned !== user.is_banned
  const changingTier = subscription_tier !== user.subscription_tier
  const needsReason = changingBan || changingTier

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (needsReason && !reason.trim()) {
      setError('Reason is required when changing ban status or subscription tier')
      return
    }
    setLoading(true)
    setError(null)
    try {
      const body: Record<string, unknown> = {
        first_name,
        last_name,
        username: username || null,
        bio: bio || null,
        subscription_tier,
        is_banned,
        ban_reason: is_banned ? ban_reason || null : null,
      }
      if (needsReason) body.reason = reason.trim()
      const response = await fetch(`/api/admin/users/${user.id}/edit`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error || 'Failed to update user')
      }
      onOpenChange(false)
      onSuccess?.()
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update user')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit User</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="text-sm text-red-600 bg-red-50 border border-red-200 px-3 py-2 rounded-md">
              {error}
            </div>
          )}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="first_name">First Name</Label>
              <Input
                id="first_name"
                value={first_name}
                onChange={(e) => setFirstName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="last_name">Last Name</Label>
              <Input
                id="last_name"
                value={last_name}
                onChange={(e) => setLastName(e.target.value)}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Optional"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="bio">Bio</Label>
            <Textarea
              id="bio"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={3}
              placeholder="Optional"
            />
          </div>
          <div className="space-y-2">
            <Label>Subscription Tier</Label>
            <Select value={subscription_tier} onValueChange={setSubscriptionTier}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="free">Free</SelectItem>
                <SelectItem value="pro">Pro</SelectItem>
                <SelectItem value="pioneer">Pioneer</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="is_banned"
              checked={is_banned}
              onCheckedChange={(checked) => setIsBanned(checked === true)}
            />
            <Label htmlFor="is_banned" className="font-normal cursor-pointer">
              Banned
            </Label>
          </div>
          {is_banned && (
            <div className="space-y-2">
              <Label htmlFor="ban_reason">Ban Reason</Label>
              <Textarea
                id="ban_reason"
                value={ban_reason}
                onChange={(e) => setBanReason(e.target.value)}
                rows={2}
                placeholder="Reason for ban"
              />
            </div>
          )}
          {needsReason && (
            <div className="space-y-2">
              <Label htmlFor="reason">Reason for change *</Label>
              <Textarea
                id="reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Required when changing ban status or subscription tier"
                rows={3}
                required={needsReason}
              />
            </div>
          )}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
