import { createAdminClient } from '@/lib/supabase/admin'
import { createNotification, type NotificationType } from './create-notification'
import { sendEmailNotification } from './send-email-notification'

/**
 * Create notification when order is completed (new sale for seller)
 */
export async function createNewSaleNotification(
  sellerId: string,
  orderId: string,
  productTitle: string,
  buyerName: string,
  amount: number
): Promise<void> {
  const notification = await createNotification({
    user_id: sellerId,
    type: 'new_sale',
    title: 'You made a sale! 🎉',
    message: `${buyerName} purchased your ${productTitle} for ₱${amount.toFixed(2)}`,
    action_url: `/seller/orders/${orderId}`,
  })

  if (notification) {
    // Send email notification
    await sendEmailNotification(notification.id, sellerId, 'new_sale', {
      productTitle,
      buyerName,
      amount,
      orderId,
    })
  }
}

/**
 * Create notification when buyer submits a review
 */
export async function createNewReviewNotification(
  sellerId: string,
  productId: string,
  productTitle: string,
  buyerName: string,
  rating: number,
  comment?: string
): Promise<void> {
  const ratingStars = '⭐'.repeat(rating)
  const message = comment
    ? `${ratingStars} "${comment.substring(0, 100)}${comment.length > 100 ? '...' : ''}" - ${buyerName}`
    : `${ratingStars} ${buyerName} left a ${rating}-star review`

  const notification = await createNotification({
    user_id: sellerId,
    type: 'new_review',
    title: `New review on ${productTitle}`,
    message,
    action_url: `/products/${productId}#reviews`,
  })

  if (notification) {
    await sendEmailNotification(notification.id, sellerId, 'new_review', {
      productTitle,
      productId,
      buyerName,
      rating,
      comment,
    })
  }
}

/**
 * Create notification when user follows a seller
 */
export async function createNewFollowerNotification(
  sellerId: string,
  followerId: string,
  followerName: string
): Promise<void> {
  // In-app only, no email
  await createNotification({
    user_id: sellerId,
    type: 'new_follower',
    title: 'New follower',
    message: `${followerName} started following you`,
    action_url: `/sellers/${followerId}`,
  })
}

/**
 * Create notification when admin approves a product
 * 
 * NOTE: This will be called from the admin panel (Feature 09) when:
 * - Admin approves a product in pending_review status
 * - Product status changes from pending_review to published
 */
export async function createProductApprovedNotification(
  sellerId: string,
  productId: string,
  productTitle: string
): Promise<void> {
  const notification = await createNotification({
    user_id: sellerId,
    type: 'product_approved',
    title: `Your product was approved! 🎉`,
    message: `${productTitle} has been approved and is now live on the marketplace`,
    action_url: `/products/${productId}`,
  })

  if (notification) {
    await sendEmailNotification(notification.id, sellerId, 'product_approved', {
      productTitle,
      productId,
    })
  }
}

/**
 * Create notification when admin rejects a product
 * 
 * NOTE: This will be called from the admin panel (Feature 09) when:
 * - Admin rejects a product in pending_review status
 * - Product status changes from pending_review to rejected
 */
export async function createProductRejectedNotification(
  sellerId: string,
  productId: string,
  productTitle: string,
  rejectionReason: string
): Promise<void> {
  const notification = await createNotification({
    user_id: sellerId,
    type: 'product_rejected',
    title: 'Action needed: Your product needs changes',
    message: `${productTitle} was rejected. Reason: ${rejectionReason}`,
    action_url: `/seller/products/${productId}/edit`,
  })

  if (notification) {
    await sendEmailNotification(notification.id, sellerId, 'product_rejected', {
      productTitle,
      productId,
      rejectionReason,
    })
  }
}

/**
 * Create notification when price drops on a wishlisted product
 */
export async function createPriceDropNotification(
  buyerId: string,
  productId: string,
  productTitle: string,
  oldPrice: number,
  newPrice: number
): Promise<void> {
  const savings = oldPrice - newPrice
  const notification = await createNotification({
    user_id: buyerId,
    type: 'price_drop',
    title: `Price drop! ${productTitle} is now ₱${newPrice.toFixed(2)}`,
    message: `Was: ₱${oldPrice.toFixed(2)}, Now: ₱${newPrice.toFixed(2)}. You save: ₱${savings.toFixed(2)} 💰`,
    action_url: `/products/${productId}`,
  })

  if (notification) {
    await sendEmailNotification(notification.id, buyerId, 'price_drop', {
      productTitle,
      productId,
      oldPrice,
      newPrice,
      savings,
    })
  }
}

/**
 * Create notifications for all followers when seller publishes a new product
 */
export async function createNewProductNotification(
  sellerId: string,
  productId: string,
  productTitle: string,
  sellerName: string
): Promise<void> {
  const supabase = createAdminClient()

  // Get all followers of this seller
  const { data: followers, error } = await supabase
    .from('followers')
    .select('follower_id')
    .eq('following_id', sellerId)

  if (error || !followers || followers.length === 0) {
    return
  }

  // Create notifications for all followers (in-app only, no email)
  const notifications = followers.map((f) => ({
    user_id: f.follower_id,
    type: 'new_product' as NotificationType,
    title: `${sellerName} uploaded a new product`,
    message: productTitle,
    action_url: `/products/${productId}`,
  }))

  // Use bulk insert for efficiency
  const { data: notificationsData } = await supabase
    .from('notifications')
    .insert(
      notifications.map((n) => ({
        user_id: n.user_id,
        type: n.type,
        title: n.title,
        message: n.message,
        action_url: n.action_url,
        is_read: false,
        email_sent: false,
      }))
    )
    .select('id')

  // No email notifications for new_product (avoids spam)
}

/**
 * Create system announcement notifications for all users (or filtered audience)
 */
export async function createSystemAnnouncement(
  title: string,
  message: string,
  actionUrl?: string,
  targetAudience?: 'all' | 'sellers' | 'buyers'
): Promise<number> {
  const supabase = createAdminClient()

  // Get target users
  let query = supabase.from('users').select('id')

  if (targetAudience === 'sellers') {
    query = query.eq('role', 'seller')
  } else if (targetAudience === 'buyers') {
    query = query.eq('role', 'buyer')
  }
  // 'all' or undefined means all users

  const { data: users, error } = await query

  if (error || !users || users.length === 0) {
    return 0
  }

  // Create notifications for all target users
  const notifications = users.map((user) => ({
    user_id: user.id,
    type: 'system_announcement' as NotificationType,
    title,
    message,
    action_url: actionUrl || null,
  }))

  // Bulk insert
  const { data: notificationsData } = await supabase
    .from('notifications')
    .insert(
      notifications.map((n) => ({
        user_id: n.user_id,
        type: n.type,
        title: n.title,
        message: n.message,
        action_url: n.action_url,
        is_read: false,
        email_sent: false,
      }))
    )
    .select('id')

  // Send email notifications (batch)
  if (notificationsData) {
    // Mark for email sending (will be processed by email queue)
    for (const notification of notificationsData) {
      await sendEmailNotification(
        notification.id,
        notifications.find((n) => n.user_id === notification.user_id)?.user_id || '',
        'system_announcement',
        {
          title,
          message,
          actionUrl,
        }
      )
    }
  }

  return notificationsData?.length || 0
}
