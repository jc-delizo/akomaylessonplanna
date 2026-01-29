/**
 * Profile utility functions for Feature 02: User Profiles & Profile Management
 * 
 * Reference:
 * - docs/brainstorming/3-feature-02-user-profiles-and-profile-management.md
 * Updated: 2026-01-14 - Fixed social links calculation & location points (20 pts)
 * - docs/implementationplan/database-schema-complete.md
 */

// User type based on database schema
export type User = {
  id: string
  email: string
  first_name: string
  last_name: string
  display_name?: string | null
  username: string | null
  avatar_url: string | null
  bio: string | null
  subjects_taught: string[] | null
  grade_levels_taught: string[] | null
  location_city: string | null
  location_region: string | null
  social_links: {
    facebook?: string
    instagram?: string
    youtube?: string
  } | null
  banner_url: string | null
  custom_accent_color: string | null
  profile_completion_percent: number
  followers_count: number
  response_time_hours: number | null
  role: 'buyer' | 'seller' | 'admin'
  is_verified_teacher: boolean
  can_sell: boolean
  subscription_tier: 'free' | 'pro' | 'pioneer'
  is_pioneer: boolean
  created_at: string
}

/**
 * Get full name from first_name and last_name
 */
export function getFullName(user: { first_name: string; last_name: string }): string {
  const firstName = (user.first_name || '').trim()
  const lastName = (user.last_name || '').trim()
  if (lastName) {
    return `${firstName} ${lastName}`.trim()
  }
  return firstName
}

/**
 * Get initials from first_name and last_name
 */
export function getInitials(firstName: string, lastName: string): string {
  const first = (firstName || '').trim()
  const last = (lastName || '').trim()
  if (last) {
    return `${first[0] || ''}${last[0] || ''}`.toUpperCase()
  }
  return first[0]?.toUpperCase() || ''
}

// Badge type
export type Badge = {
  type: 'pioneer' | 'pro' | 'verified' | 'top_seller' | 'fast_responder' | 'rising_star'
  label: string
  color: string
  order: number
}

/**
 * Calculate profile completion percentage based on point system
 * 
 * Point System (from brainstorming doc line 236-262):
 * - Display Name: 10 points
 * - Avatar: 15 points
 * - Bio (50+ chars): 15 points
 * - Subjects Taught (1+): 15 points
 * - Grade Levels (1+): 15 points
 * - Location: 20 points
 * - Social Link (1+): 10 points (bonus)
 * - Banner (Pro/Pioneer): 10 points (bonus)
 * 
 * Total: 100 points (90 required + 10 bonus + 10 bonus)
 */
export function calculateProfileCompletion(user: User): number {
  let points = 0

  // Display Name (10 points) - Required
  const fullName = getFullName(user)
  if (fullName && fullName.trim().length >= 3) {
    points += 10
  }

  // Avatar (15 points) - Required
  if (user.avatar_url) {
    points += 15
  }

  // Bio 50+ chars (15 points) - Required
  if (user.bio && user.bio.trim().length >= 50) {
    points += 15
  }

  // Subjects Taught 1+ (15 points) - Required
  if (user.subjects_taught && user.subjects_taught.length > 0) {
    points += 15
  }

  // Grade Levels 1+ (15 points) - Required
  if (user.grade_levels_taught && user.grade_levels_taught.length > 0) {
    points += 15
  }

  // Location (20 points) - Required
  if (user.location_city && user.location_region) {
    points += 20
  }

  // Social Link 1+ (10 points) - Bonus
  if (user.social_links && typeof user.social_links === 'object') {
    const links = user.social_links as { facebook?: string; instagram?: string; youtube?: string }
    const hasSocialLink =
      (links.facebook && links.facebook.trim().length > 0) ||
      (links.instagram && links.instagram.trim().length > 0) ||
      (links.youtube && links.youtube.trim().length > 0)
    if (hasSocialLink) {
      points += 10
    }
  }

  // Banner (Pro/Pioneer only) (10 points) - Bonus
  if (
    (user.subscription_tier === 'pro' || user.subscription_tier === 'pioneer') &&
    user.banner_url
  ) {
    points += 10
  }

  // Return percentage (0-100)
  return Math.min(100, Math.round((points / 100) * 100))
}

/**
 * Get user badges in display order
 * 
 * Badge Display Order (from brainstorming doc line 125-152):
 * 1. Pioneer Seller (gold/special styling - highest tier)
 * 2. Pro Seller (silver/special styling)
 * 3. Verified Teacher (baseline for all sellers)
 * 4. Top Seller (50+ sales) - TODO: Implement when products exist
 * 5. Fast Responder (responds within 24h)
 * 6. Rising Star (new seller with 4.5+ rating) - TODO: Implement when reviews exist
 */
export function getUserBadges(user: User): Badge[] {
  const badges: Badge[] = []

  // Only show badges for sellers
  if (user.role !== 'seller' && user.role !== 'admin') {
    return badges
  }

  // 1. Pioneer Seller (highest priority)
  if (user.is_pioneer || user.subscription_tier === 'pioneer') {
    badges.push({
      type: 'pioneer',
      label: 'Pioneer Seller',
      color: 'gold',
      order: 1,
    })
  }

  // 2. Pro Seller
  if (user.subscription_tier === 'pro') {
    badges.push({
      type: 'pro',
      label: 'Pro Seller',
      color: 'silver',
      order: 2,
    })
  }

  // 3. Verified Teacher (all sellers have this)
  if (user.is_verified_teacher && user.can_sell) {
    badges.push({
      type: 'verified',
      label: 'Verified Teacher',
      color: 'blue',
      order: 3,
    })
  }

  // 4. Top Seller (50+ sales) - TODO: Implement when products/orders exist
  // This will be calculated from product sales_count or order_items
  // For now, we'll skip this badge

  // 5. Fast Responder (responds within 24h)
  if (user.response_time_hours !== null && user.response_time_hours <= 24) {
    badges.push({
      type: 'fast_responder',
      label: 'Fast Responder',
      color: 'green',
      order: 5,
    })
  }

  // 6. Rising Star (new seller with 4.5+ rating) - TODO: Implement when reviews exist
  // This will be calculated from reviews avg_rating
  // For now, we'll skip this badge

  // Sort by order
  return badges.sort((a, b) => a.order - b.order)
}

/**
 * Format profile URL from username
 * 
 * Returns: /sellers/[username]
 * 
 * Reference: brainstorming doc line 155-174
 */
export function formatProfileUrl(username: string | null): string {
  if (!username) {
    return '/sellers'
  }
  return `/sellers/${username}`
}

/**
 * Validate username format and uniqueness
 * 
 * Rules (from brainstorming doc line 155-174):
 * - 3-20 characters
 * - Alphanumeric + underscores only
 * - Must be unique
 * 
 * Note: Uniqueness check should be done server-side via API
 */
export function validateUsername(username: string): { valid: boolean; error?: string } {
  // Check length
  if (username.length < 3) {
    return { valid: false, error: 'Username must be at least 3 characters' }
  }

  if (username.length > 20) {
    return { valid: false, error: 'Username must be at most 20 characters' }
  }

  // Check format: alphanumeric + underscores only
  const usernameRegex = /^[a-zA-Z0-9_]+$/
  if (!usernameRegex.test(username)) {
    return {
      valid: false,
      error: 'Username can only contain letters, numbers, and underscores',
    }
  }

  // Check if starts with underscore (optional, but good practice)
  if (username.startsWith('_')) {
    return { valid: false, error: 'Username cannot start with an underscore' }
  }

  return { valid: true }
}

/**
 * Get profile completion level and message
 * 
 * Completion Levels (from brainstorming doc line 236-262):
 * - 0-49%: "Complete your profile" (red warning)
 * - 50-79%: "Almost there!" (yellow)
 * - 80-99%: "Looking good!" (blue)
 * - 100%: "All set!" (green confetti animation)
 */
export function getProfileCompletionLevel(
  percentage: number
): { level: 'incomplete' | 'partial' | 'good' | 'complete'; message: string; color: string } {
  if (percentage < 50) {
    return {
      level: 'incomplete',
      message: 'Complete your profile',
      color: 'red',
    }
  } else if (percentage < 80) {
    return {
      level: 'partial',
      message: 'Almost there!',
      color: 'yellow',
    }
  } else if (percentage < 100) {
    return {
      level: 'good',
      message: 'Looking good!',
      color: 'blue',
    }
  } else {
    return {
      level: 'complete',
      message: 'All set!',
      color: 'green',
    }
  }
}

/**
 * Check if user can sell (minimum profile requirements)
 * 
 * Minimum Profile for Selling (from brainstorming doc line 259-261):
 * - Must have: Display Name, Avatar, Bio, 1+ Subject, 1+ Grade Level
 */
export function canUserSell(user: User): { canSell: boolean; missingFields: string[] } {
  const missingFields: string[] = []

  const fullName = getFullName(user)
  if (!fullName || fullName.trim().length < 3) {
    missingFields.push('Display Name')
  }

  if (!user.avatar_url) {
    missingFields.push('Avatar')
  }

  if (!user.bio || user.bio.trim().length < 50) {
    missingFields.push('Bio (at least 50 characters)')
  }

  if (!user.subjects_taught || user.subjects_taught.length === 0) {
    missingFields.push('At least one Subject')
  }

  if (!user.grade_levels_taught || user.grade_levels_taught.length === 0) {
    missingFields.push('At least one Grade Level')
  }

  return {
    canSell: missingFields.length === 0,
    missingFields,
  }
}
