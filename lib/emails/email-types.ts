/**
 * Email Type Definitions
 * Maps email types to their categories and metadata
 */

export type EmailType =
  // Transactional (10)
  | 'auth_welcome'
  | 'auth_email_verification'
  | 'auth_password_reset'
  | 'auth_password_reset_confirmation'
  | 'order_confirmation'
  | 'payment_successful'
  | 'payment_failed'
  | 'download_ready'
  | 'refund_processed'
  | 'review_flagged'
  // Selling Notifications (9)
  | 'product_submitted'
  | 'product_approved'
  | 'product_rejected'
  | 'product_suspended'
  | 'product_version_update'
  | 'new_sale'
  | 'new_review'
  | 'verification_approved'
  | 'verification_rejected'
  // Buying Notifications (5)
  | 'cart_abandonment'
  | 'review_reminder'
  | 'price_drop'
  | 'review_response'
  | 'product_version_update_buyer'
  // Social Notifications (2)
  | 'new_follower'
  | 'new_product_followed_seller'
  // Platform Announcements (2)
  | 'system_announcement'
  | 'account_banned'

export type EmailCategory =
  | 'transactional'
  | 'selling'
  | 'buying'
  | 'social'
  | 'announcements'

export interface EmailTypeMetadata {
  type: EmailType
  category: EmailCategory
  name: string
  description: string
  isTransactional: boolean // Cannot be disabled by users
  priority: number // 1 = highest, 10 = lowest
  defaultEnabled: boolean
}

/**
 * Email type metadata mapping
 */
export const EMAIL_TYPES: Record<EmailType, EmailTypeMetadata> = {
  // Transactional Emails
  auth_welcome: {
    type: 'auth_welcome',
    category: 'transactional',
    name: 'Welcome Email',
    description: 'Sent when user signs up',
    isTransactional: true,
    priority: 1,
    defaultEnabled: true,
  },
  auth_email_verification: {
    type: 'auth_email_verification',
    category: 'transactional',
    name: 'Email Verification',
    description: 'Sent when user needs to verify email (sellers only)',
    isTransactional: true,
    priority: 1,
    defaultEnabled: true,
  },
  auth_password_reset: {
    type: 'auth_password_reset',
    category: 'transactional',
    name: 'Password Reset Request',
    description: 'Sent when user requests password reset',
    isTransactional: true,
    priority: 1,
    defaultEnabled: true,
  },
  auth_password_reset_confirmation: {
    type: 'auth_password_reset_confirmation',
    category: 'transactional',
    name: 'Password Reset Confirmation',
    description: 'Sent after password is successfully reset',
    isTransactional: true,
    priority: 1,
    defaultEnabled: true,
  },
  order_confirmation: {
    type: 'order_confirmation',
    category: 'transactional',
    name: 'Order Confirmation',
    description: 'Sent when order is created',
    isTransactional: true,
    priority: 2,
    defaultEnabled: true,
  },
  payment_successful: {
    type: 'payment_successful',
    category: 'transactional',
    name: 'Payment Successful',
    description: 'Sent when payment is successful',
    isTransactional: true,
    priority: 2,
    defaultEnabled: true,
  },
  payment_failed: {
    type: 'payment_failed',
    category: 'transactional',
    name: 'Payment Failed',
    description: 'Sent when payment fails',
    isTransactional: true,
    priority: 2,
    defaultEnabled: true,
  },
  download_ready: {
    type: 'download_ready',
    category: 'transactional',
    name: 'Download Ready',
    description: 'Sent when order is completed and download is ready',
    isTransactional: true,
    priority: 2,
    defaultEnabled: true,
  },
  refund_processed: {
    type: 'refund_processed',
    category: 'transactional',
    name: 'Refund Processed',
    description: 'Sent when refund is processed',
    isTransactional: true,
    priority: 3,
    defaultEnabled: true,
  },
  review_flagged: {
    type: 'review_flagged',
    category: 'transactional',
    name: 'Review Flagged',
    description: 'Sent when review is flagged for moderation',
    isTransactional: true,
    priority: 3,
    defaultEnabled: true,
  },
  // Selling Notifications
  product_submitted: {
    type: 'product_submitted',
    category: 'selling',
    name: 'Product Submitted',
    description: 'Sent when product is submitted for review',
    isTransactional: false,
    priority: 4,
    defaultEnabled: true,
  },
  product_approved: {
    type: 'product_approved',
    category: 'selling',
    name: 'Product Approved',
    description: 'Sent when product is approved',
    isTransactional: false,
    priority: 3,
    defaultEnabled: true,
  },
  product_rejected: {
    type: 'product_rejected',
    category: 'selling',
    name: 'Product Rejected',
    description: 'Sent when product is rejected',
    isTransactional: false,
    priority: 3,
    defaultEnabled: true,
  },
  product_suspended: {
    type: 'product_suspended',
    category: 'selling',
    name: 'Product Suspended',
    description: 'Sent when product is suspended',
    isTransactional: false,
    priority: 3,
    defaultEnabled: true,
  },
  product_version_update: {
    type: 'product_version_update',
    category: 'selling',
    name: 'Product Version Update',
    description: 'Sent to seller when product version is updated',
    isTransactional: false,
    priority: 5,
    defaultEnabled: true,
  },
  new_sale: {
    type: 'new_sale',
    category: 'selling',
    name: 'New Sale',
    description: 'Sent to seller when they make a sale',
    isTransactional: false,
    priority: 2,
    defaultEnabled: true,
  },
  new_review: {
    type: 'new_review',
    category: 'selling',
    name: 'New Review',
    description: 'Sent to seller when they receive a new review',
    isTransactional: false,
    priority: 4,
    defaultEnabled: true,
  },
  verification_approved: {
    type: 'verification_approved',
    category: 'selling',
    name: 'Verification Approved',
    description: 'Sent when teacher verification is approved',
    isTransactional: false,
    priority: 2,
    defaultEnabled: true,
  },
  verification_rejected: {
    type: 'verification_rejected',
    category: 'selling',
    name: 'Verification Rejected',
    description: 'Sent when teacher verification is rejected',
    isTransactional: false,
    priority: 2,
    defaultEnabled: true,
  },
  // Buying Notifications
  cart_abandonment: {
    type: 'cart_abandonment',
    category: 'buying',
    name: 'Cart Abandonment',
    description: 'Sent 24 hours after cart is created',
    isTransactional: false,
    priority: 6,
    defaultEnabled: true,
  },
  review_reminder: {
    type: 'review_reminder',
    category: 'buying',
    name: 'Review Reminder',
    description: 'Sent 24 hours after download',
    isTransactional: false,
    priority: 6,
    defaultEnabled: true,
  },
  price_drop: {
    type: 'price_drop',
    category: 'buying',
    name: 'Price Drop',
    description: 'Sent when wishlisted item price drops',
    isTransactional: false,
    priority: 7,
    defaultEnabled: true,
  },
  review_response: {
    type: 'review_response',
    category: 'buying',
    name: 'Review Response',
    description: 'Sent when seller responds to review',
    isTransactional: false,
    priority: 5,
    defaultEnabled: true,
  },
  product_version_update_buyer: {
    type: 'product_version_update_buyer',
    category: 'buying',
    name: 'Product Version Update (Buyer)',
    description: 'Sent to buyer when purchased product is updated',
    isTransactional: false,
    priority: 4,
    defaultEnabled: true,
  },
  // Social Notifications
  new_follower: {
    type: 'new_follower',
    category: 'social',
    name: 'New Follower',
    description: 'Sent when user gains a new follower',
    isTransactional: false,
    priority: 7,
    defaultEnabled: true,
  },
  new_product_followed_seller: {
    type: 'new_product_followed_seller',
    category: 'social',
    name: 'New Product from Followed Seller',
    description: 'Sent when followed seller publishes new product',
    isTransactional: false,
    priority: 7,
    defaultEnabled: true,
  },
  // Platform Announcements
  system_announcement: {
    type: 'system_announcement',
    category: 'announcements',
    name: 'System Announcement',
    description: 'Platform-wide announcements',
    isTransactional: false,
    priority: 8,
    defaultEnabled: true,
  },
  account_banned: {
    type: 'account_banned',
    category: 'announcements',
    name: 'Account Banned',
    description: 'Sent when account is banned',
    isTransactional: false,
    priority: 3,
    defaultEnabled: true,
  },
}

/**
 * Get email type metadata
 */
export function getEmailTypeMetadata(type: EmailType): EmailTypeMetadata {
  return EMAIL_TYPES[type]
}

/**
 * Get all email types by category
 */
export function getEmailTypesByCategory(
  category: EmailCategory
): EmailTypeMetadata[] {
  return Object.values(EMAIL_TYPES).filter((meta) => meta.category === category)
}

/**
 * Get transactional email types
 */
export function getTransactionalEmailTypes(): EmailType[] {
  return Object.values(EMAIL_TYPES)
    .filter((meta) => meta.isTransactional)
    .map((meta) => meta.type)
}

/**
 * Check if email type is transactional
 */
export function isTransactionalEmail(type: EmailType): boolean {
  return EMAIL_TYPES[type].isTransactional
}
