import { createAdminClient } from '@/lib/supabase/admin'
import { EmailType, isTransactionalEmail, getEmailTypeMetadata } from './email-types'

/**
 * Check if email should be sent based on user preferences and admin configuration
 */
export async function shouldSendEmail(
  userId: string | null,
  emailType: EmailType,
  recipientEmail: string
): Promise<{ shouldSend: boolean; reason?: string }> {
  const supabase = createAdminClient()

  // 1. Check suppression list
  const { data: suppressed } = await supabase
    .from('email_suppression_list')
    .select('email, reason')
    .eq('email', recipientEmail.toLowerCase())
    .single()

  if (suppressed) {
    return {
      shouldSend: false,
      reason: `Email is in suppression list: ${suppressed.reason}`,
    }
  }

  // 2. Check admin configuration
  const { data: config } = await supabase
    .from('email_configuration')
    .select('is_enabled')
    .eq('email_type', emailType)
    .single()

  if (config && !config.is_enabled) {
    return {
      shouldSend: false,
      reason: `Email type ${emailType} is disabled by admin`,
    }
  }

  // 3. Transactional emails always send (cannot be disabled by users)
  if (isTransactionalEmail(emailType)) {
    return { shouldSend: true }
  }

  // 4. Check user preferences (if userId is provided)
  if (userId) {
    const { data: preferences } = await supabase
      .from('user_email_preferences')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (preferences) {
      const metadata = getEmailTypeMetadata(emailType)

      // Check category preference
      let categoryEnabled = true
      switch (metadata.category) {
        case 'selling':
          categoryEnabled = preferences.selling_notifications
          break
        case 'buying':
          categoryEnabled = preferences.buying_notifications
          break
        case 'social':
          categoryEnabled = preferences.social_notifications
          break
        case 'announcements':
          categoryEnabled = preferences.announcements
          break
        case 'transactional':
          // Already handled above
          categoryEnabled = true
          break
      }

      if (!categoryEnabled) {
        return {
          shouldSend: false,
          reason: `User has disabled ${metadata.category} notifications`,
        }
      }
    }
  }

  return { shouldSend: true }
}

/**
 * Get user email preferences
 */
export async function getUserEmailPreferences(userId: string) {
  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from('user_email_preferences')
    .select('*')
    .eq('user_id', userId)
    .single()

  if (error && error.code !== 'PGRST116') {
    // PGRST116 = no rows returned
    throw error
  }

  // Return defaults if no preferences exist
  if (!data) {
    return {
      user_id: userId,
      selling_notifications: true,
      buying_notifications: true,
      social_notifications: true,
      announcements: true,
    }
  }

  return data
}

/**
 * Initialize user email preferences with defaults
 */
export async function initializeUserEmailPreferences(userId: string) {
  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from('user_email_preferences')
    .insert({
      user_id: userId,
      selling_notifications: true,
      buying_notifications: true,
      social_notifications: true,
      announcements: true,
    })
    .select()
    .single()

  if (error && error.code !== '23505') {
    // 23505 = unique violation (already exists)
    throw error
  }

  return data
}
