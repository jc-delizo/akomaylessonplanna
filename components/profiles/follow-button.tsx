'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'

interface FollowButtonProps {
  username: string
  initialFollowersCount: number
  initialIsFollowing?: boolean
  className?: string
  hideFollowerCount?: boolean
  buttonClassName?: string
}

/**
 * FollowButton Component
 * 
 * Follow/Unfollow button with optimistic UI updates
 * Shows follower count
 * 
 * Reference: docs/brainstorming/3-feature-02-user-profiles-and-profile-management.md lines 265-272
 */
export function FollowButton({
  username,
  initialFollowersCount,
  initialIsFollowing = false,
  className,
  hideFollowerCount = false,
  buttonClassName,
}: FollowButtonProps) {
  const [isFollowing, setIsFollowing] = useState(initialIsFollowing)
  const [followersCount, setFollowersCount] = useState(initialFollowersCount)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  // Check if user is authenticated and following status
  useEffect(() => {
    const checkFollowingStatus = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        setIsFollowing(false)
        return
      }

      // Get seller by username to get their ID
      const { data: seller } = await supabase
        .from('users')
        .select('id')
        .eq('username', username)
        .single()

      if (!seller) {
        return
      }

      const { data: follow } = await supabase
        .from('followers')
        .select('id')
        .eq('follower_id', user.id)
        .eq('following_id', seller.id)
        .single()

      setIsFollowing(!!follow)
    }

    checkFollowingStatus()
  }, [username, supabase])

  const handleFollow = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      // Redirect to login
      window.location.href = '/login'
      return
    }

    setLoading(true)
    setError(null)

    try {
      if (isFollowing) {
        // Unfollow
        const response = await fetch(`/api/sellers/${username}/follow`, {
          method: 'DELETE',
        })

        if (!response.ok) {
          throw new Error('Failed to unfollow')
        }

        const data = await response.json()
        setIsFollowing(false)
        setFollowersCount(data.followers_count)
      } else {
        // Follow
        const response = await fetch(`/api/sellers/${username}/follow`, {
          method: 'POST',
        })

        if (!response.ok) {
          throw new Error('Failed to follow')
        }

        const data = await response.json()
        setIsFollowing(true)
        setFollowersCount(data.followers_count)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
      // Revert optimistic update
      setIsFollowing(!isFollowing)
      setFollowersCount(initialFollowersCount)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={`flex items-center gap-2 ${className || ''}`}>
      <Button
        onClick={handleFollow}
        disabled={loading}
        variant={isFollowing ? 'outline' : 'default'}
        size="default"
        className={buttonClassName}
      >
        {loading ? '...' : isFollowing ? 'Following' : 'Follow'}
      </Button>
      {!hideFollowerCount && followersCount > 0 && (
        <span className="text-sm text-muted-foreground">
          {followersCount} {followersCount === 1 ? 'follower' : 'followers'}
        </span>
      )}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  )
}
