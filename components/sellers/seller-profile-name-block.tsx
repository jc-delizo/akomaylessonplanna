'use client'

import { getFullName, getUserBadges, type User } from '@/lib/utils/profile'
import { BadgeDisplay } from '@/components/profiles/badge-display'

/**
 * Shared block for seller profile: display_name (Option A) above full name, then @username, then badges.
 * Used on public seller page and Customize Shop preview for consistency.
 */
export interface SellerProfileNameBlockProps {
  profile: {
    first_name: string
    last_name: string
    display_name?: string | null
    username?: string | null
    role?: string
    subscription_tier?: string
    is_pioneer?: boolean
    is_verified_teacher?: boolean
  }
  /** Optional: larger heading for public page */
  size?: 'default' | 'compact'
}

export function SellerProfileNameBlock({ profile, size = 'default' }: SellerProfileNameBlockProps) {
  const fullName = getFullName(profile)
  const badges = getUserBadges(profile as User)
  const isCompact = size === 'compact'

  return (
    <div className="space-y-1">
      {profile.display_name && (
        <p
          className={
            isCompact
              ? 'text-lg font-semibold text-muted-foreground'
              : 'text-xl md:text-2xl font-semibold text-muted-foreground mb-1'
          }
        >
          {profile.display_name}
        </p>
      )}
      <h1
        className={
          isCompact ? 'text-xl font-bold' : 'text-2xl md:text-3xl font-bold'
        }
      >
        {fullName}
      </h1>
      {profile.username && (
        <p className="text-muted-foreground">@{profile.username}</p>
      )}
      {badges.length > 0 && <BadgeDisplay badges={badges} className="mt-2" />}
    </div>
  )
}
