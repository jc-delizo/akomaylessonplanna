import { createAdminClient } from '@/lib/supabase/admin'

export type NotificationType =
  | 'new_sale'
  | 'new_review'
  | 'new_follower'
  | 'product_approved'
  | 'product_rejected'
  | 'price_drop'
  | 'new_product'
  | 'system_announcement'
  | 'new_message'

export interface CreateNotificationParams {
  user_id: string
  type: NotificationType
  title: string
  message: string
  action_url?: string
}

/**
 * Create a notification in the database
 * Uses admin client to bypass RLS (notifications are created by system)
 */
export async function createNotification(
  params: CreateNotificationParams
): Promise<{ id: string } | null> {
  try {
    const supabase = createAdminClient()

    const { data, error } = await supabase
      .from('notifications')
      .insert({
        user_id: params.user_id,
        type: params.type,
        title: params.title,
        message: params.message,
        action_url: params.action_url || null,
        is_read: false,
        email_sent: false,
      })
      .select('id')
      .single()

    if (error) {
      console.error('Error creating notification:', error)
      return null
    }

    return data
  } catch (error) {
    console.error('Error in createNotification:', error)
    return null
  }
}

/**
 * Create multiple notifications (for bulk operations like system announcements)
 */
export async function createNotifications(
  notifications: CreateNotificationParams[]
): Promise<number> {
  try {
    const supabase = createAdminClient()

    const notificationsData = notifications.map((n) => ({
      user_id: n.user_id,
      type: n.type,
      title: n.title,
      message: n.message,
      action_url: n.action_url || null,
      is_read: false,
      email_sent: false,
    }))

    const { data, error } = await supabase
      .from('notifications')
      .insert(notificationsData)
      .select('id')

    if (error) {
      console.error('Error creating notifications:', error)
      return 0
    }

    return data?.length || 0
  } catch (error) {
    console.error('Error in createNotifications:', error)
    return 0
  }
}
