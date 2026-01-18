import { createAdminClient } from '@/lib/supabase/admin'
import type { NotificationType } from './create-notification'
import { addToQueue } from '@/lib/emails/queue-service'
import { prepareTemplateData } from '@/lib/emails/template-renderer'
import { initializeUserEmailPreferences } from '@/lib/emails/preference-checker'

/**
 * Map notification types to email types
 */
function getEmailTypeForNotification(type: NotificationType): string | null {
  const mapping: Record<NotificationType, string | null> = {
    new_message: 'new_message',
    new_sale: 'new_sale',
    new_review: 'new_review',
    price_drop: 'price_drop',
    product_approved: 'product_approved',
    product_rejected: 'product_rejected',
    system_announcement: 'system_announcement',
    new_follower: null, // In-app only
    new_product: null, // In-app only
  }

  return mapping[type] || null
}

/**
 * Send email notification for a notification
 * Checks user's email preferences before sending
 * 
 * Integrated with Feature 10 email system
 */
export async function sendEmailNotification(
  notificationId: string,
  userId: string,
  type: NotificationType,
  data: Record<string, any>
): Promise<void> {
  try {
    const supabase = createAdminClient()

    // Get user info
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, email, name')
      .eq('id', userId)
      .single()

    if (userError || !user) {
      console.error('Error fetching user for email notification:', userError)
      return
    }

    // Some notification types are in-app only (per design)
    const inAppOnlyTypes: NotificationType[] = ['new_follower', 'new_product']
    if (inAppOnlyTypes.includes(type)) {
      // Mark as email_sent = false (in-app only)
      await supabase
        .from('notifications')
        .update({ email_sent: false })
        .eq('id', notificationId)
      return
    }

    // Get email type for this notification
    const emailType = getEmailTypeForNotification(type)
    if (!emailType) {
      // No email type mapped - mark as not sent
      await supabase
        .from('notifications')
        .update({ email_sent: false })
        .eq('id', notificationId)
      return
    }

    // Ensure user email preferences exist
    await initializeUserEmailPreferences(userId).catch(() => {
      // Ignore if already exists
    })

    // Prepare template data
    const templateData = prepareTemplateData({
      user_name: user.name || 'User',
      user_email: user.email,
      user_username: user.name?.toLowerCase().replace(/\s+/g, '_') || '',
      ...data,
    })

    // Add to email queue
    try {
      await addToQueue({
        emailType: emailType as any,
        recipientEmail: user.email,
        recipientUserId: userId,
        templateData,
        priority: 5, // Default priority
      })

      // Mark as email_sent = true (will be updated by queue processor)
      await supabase
        .from('notifications')
        .update({ email_sent: true })
        .eq('id', notificationId)
    } catch (queueError) {
      // If queue fails (e.g., user opted out), mark as not sent
      console.error('Error adding email to queue:', queueError)
      await supabase
        .from('notifications')
        .update({ email_sent: false })
        .eq('id', notificationId)
    }
  } catch (error) {
    console.error('Error in sendEmailNotification:', error)
    // Don't throw - email failures shouldn't break notification creation
  }
}

/**
 * Get email subject for notification type
 * (Will be used when Feature 12 is implemented)
 */
function getEmailSubject(type: NotificationType, data: Record<string, any>): string {
  switch (type) {
    case 'new_sale':
      return `You made a sale! 🎉 ₱${data.amount?.toFixed(2) || '0.00'}`
    case 'new_review':
      return `New review on ${data.productTitle || 'your product'}`
    case 'price_drop':
      return `Price drop! ${data.productTitle || 'Product'} is now ₱${data.newPrice?.toFixed(2) || '0.00'}`
    case 'product_approved':
      return `Your product was approved! 🎉`
    case 'product_rejected':
      return `Action needed: Your product needs changes`
    case 'system_announcement':
      return data.title || 'Platform Announcement'
    default:
      return 'Notification from AKOMAYLESSONPLANNA'
  }
}

/**
 * Get email template name for notification type
 * (Will be used when Feature 12 is implemented)
 */
function getEmailTemplate(type: NotificationType): string {
  switch (type) {
    case 'new_sale':
      return 'notification-new-sale'
    case 'new_review':
      return 'notification-new-review'
    case 'price_drop':
      return 'notification-price-drop'
    case 'product_approved':
      return 'notification-product-approved'
    case 'product_rejected':
      return 'notification-product-rejected'
    case 'system_announcement':
      return 'notification-system-announcement'
    default:
      return 'notification-default'
  }
}
