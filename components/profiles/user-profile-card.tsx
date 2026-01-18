'use client'

import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { BadgeDisplay } from './badge-display'
import { FollowButton } from './follow-button'
import { getUserBadges } from '@/lib/utils/profile'
import type { User } from '@/lib/utils/profile'
import { Avatar, AvatarImage, AvatarFallback } from '@/registry/default/avatar/avatar'

interface UserProfileCardProps {
  user: User
  showFollowButton?: boolean
  className?: string
}

/**
 * UserProfileCard Component
 * 
 * Reusable profile card component for search results, "Similar Sellers", Featured Sellers
 * Shows: Avatar, Name, Username, Badges, Rating, Products count, Follow button
 * 
 * Reference: docs/brainstorming/3-feature-02-user-profiles-and-profile-management.md
 */
export function UserProfileCard({ user, showFollowButton = true, className }: UserProfileCardProps) {
  const badges = getUserBadges(user)
  const profileUrl = `/sellers/${user.username || user.id}`

  // Get initials for avatar fallback
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-start gap-4">
          <Link href={profileUrl}>
            <Avatar className="h-16 w-16">
              {user.avatar_url && <AvatarImage src={user.avatar_url} alt={user.name} />}
              <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
            </Avatar>
          </Link>
          <div className="flex-1 min-w-0">
            <CardTitle>
              <Link href={profileUrl} className="hover:underline">
                {user.name}
              </Link>
            </CardTitle>
            {user.username && (
              <p className="text-xs text-muted-foreground">@{user.username}</p>
            )}
            {badges.length > 0 && <BadgeDisplay badges={badges} className="mt-2" />}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {user.bio && (
          <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{user.bio}</p>
        )}
        <div className="flex flex-wrap gap-2 mb-3">
          {user.subjects_taught && user.subjects_taught.length > 0 && (
            <div className="text-xs">
              <span className="font-medium">Subjects: </span>
              <span className="text-muted-foreground">
                {user.subjects_taught.slice(0, 3).join(', ')}
                {user.subjects_taught.length > 3 && ` +${user.subjects_taught.length - 3}`}
              </span>
            </div>
          )}
          {user.grade_levels_taught && user.grade_levels_taught.length > 0 && (
            <div className="text-xs">
              <span className="font-medium">Grades: </span>
              <span className="text-muted-foreground">
                {user.grade_levels_taught.slice(0, 3).join(', ')}
                {user.grade_levels_taught.length > 3 && ` +${user.grade_levels_taught.length - 3}`}
              </span>
            </div>
          )}
        </div>
        <div className="flex items-center justify-between">
          <div className="text-xs text-muted-foreground">
            {user.followers_count} {user.followers_count === 1 ? 'follower' : 'followers'}
          </div>
          {showFollowButton && user.username && (
            <FollowButton
              username={user.username}
              initialFollowersCount={user.followers_count}
            />
          )}
        </div>
      </CardContent>
    </Card>
  )
}
