import { createAdminClient } from '@/lib/supabase/admin'

/**
 * Rate limiting configuration
 */
export const RATE_LIMITS = {
  // Per user limits
  perUser: {
    maxPerHour: 10,
    maxPerDay: 50,
  },
  // Platform limits
  platform: {
    maxPerMinute: 100,
    maxPerHour: 3000,
  },
  // Batch sending limits
  batch: {
    announcements: {
      batchSize: 500,
      delayBetweenBatches: 60000, // 1 minute
    },
  },
} as const

/**
 * Check if user has exceeded rate limits
 */
export async function checkUserRateLimit(
  userId: string,
  emailType: string
): Promise<{ allowed: boolean; reason?: string }> {
  const supabase = createAdminClient()
  const now = new Date()
  const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000)
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000)

  // Check hourly limit
  const { count: hourlyCount } = await supabase
    .from('email_queue')
    .select('*', { count: 'exact', head: true })
    .eq('recipient_user_id', userId)
    .gte('created_at', oneHourAgo.toISOString())
    .in('status', ['sent', 'processing', 'pending'])

  if (hourlyCount && hourlyCount >= RATE_LIMITS.perUser.maxPerHour) {
    return {
      allowed: false,
      reason: `User has exceeded hourly limit of ${RATE_LIMITS.perUser.maxPerHour} emails`,
    }
  }

  // Check daily limit
  const { count: dailyCount } = await supabase
    .from('email_queue')
    .select('*', { count: 'exact', head: true })
    .eq('recipient_user_id', userId)
    .gte('created_at', oneDayAgo.toISOString())
    .in('status', ['sent', 'processing', 'pending'])

  if (dailyCount && dailyCount >= RATE_LIMITS.perUser.maxPerDay) {
    return {
      allowed: false,
      reason: `User has exceeded daily limit of ${RATE_LIMITS.perUser.maxPerDay} emails`,
    }
  }

  return { allowed: true }
}

/**
 * Check if platform has exceeded rate limits
 */
export async function checkPlatformRateLimit(): Promise<{
  allowed: boolean
  reason?: string
}> {
  const supabase = createAdminClient()
  const now = new Date()
  const oneMinuteAgo = new Date(now.getTime() - 60 * 1000)
  const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000)

  // Check per-minute limit
  const { count: minuteCount } = await supabase
    .from('email_queue')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', oneMinuteAgo.toISOString())
    .in('status', ['sent', 'processing'])

  if (minuteCount && minuteCount >= RATE_LIMITS.platform.maxPerMinute) {
    return {
      allowed: false,
      reason: `Platform has exceeded per-minute limit of ${RATE_LIMITS.platform.maxPerMinute} emails`,
    }
  }

  // Check per-hour limit
  const { count: hourCount } = await supabase
    .from('email_queue')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', oneHourAgo.toISOString())
    .in('status', ['sent', 'processing'])

  if (hourCount && hourCount >= RATE_LIMITS.platform.maxPerHour) {
    return {
      allowed: false,
      reason: `Platform has exceeded per-hour limit of ${RATE_LIMITS.platform.maxPerHour} emails`,
    }
  }

  return { allowed: true }
}

/**
 * Check if email can be sent based on rate limits
 */
export async function checkRateLimits(
  userId: string | null,
  emailType: string
): Promise<{ allowed: boolean; reason?: string }> {
  // Check platform limits first
  const platformCheck = await checkPlatformRateLimit()
  if (!platformCheck.allowed) {
    return platformCheck
  }

  // Check user limits if userId is provided
  if (userId) {
    const userCheck = await checkUserRateLimit(userId, emailType)
    if (!userCheck.allowed) {
      return userCheck
    }
  }

  return { allowed: true }
}
