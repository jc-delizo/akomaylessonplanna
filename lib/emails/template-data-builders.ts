import type { TemplateData } from './template-renderer'
import { generateUnsubscribeLink, generatePreferencesLink } from './template-renderer'

/**
 * Build template data for order confirmation email
 */
export function buildOrderConfirmationData(params: {
  userName: string
  userEmail: string
  userId: string
  orderId: string
  orderDate: string
  orderTotal: number
  orderItems: Array<{ title: string; price: number }>
  paymentMethod: string
  downloadLink?: string
}): TemplateData {
  return {
    user_name: params.userName,
    user_email: params.userEmail,
    order_id: params.orderId,
    order_date: params.orderDate,
    order_total: `₱${params.orderTotal.toFixed(2)}`,
    order_items: params.orderItems.map((item) => ({
      title: item.title,
      price: `₱${item.price.toFixed(2)}`,
    })),
    payment_method: params.paymentMethod,
    download_link: params.downloadLink,
    unsubscribe_link: generateUnsubscribeLink(params.userId, params.userEmail),
    preferences_link: generatePreferencesLink(),
  }
}

/**
 * Build template data for payment successful email
 */
export function buildPaymentSuccessfulData(params: {
  userName: string
  userEmail: string
  userId: string
  orderId: string
  orderTotal: number
  paymentMethod: string
  downloadLink?: string
}): TemplateData {
  return {
    user_name: params.userName,
    user_email: params.userEmail,
    order_id: params.orderId,
    order_total: `₱${params.orderTotal.toFixed(2)}`,
    payment_method: params.paymentMethod,
    download_link: params.downloadLink,
    unsubscribe_link: generateUnsubscribeLink(params.userId, params.userEmail),
    preferences_link: generatePreferencesLink(),
  }
}

/**
 * Build template data for payment failed email
 */
export function buildPaymentFailedData(params: {
  userName: string
  userEmail: string
  userId: string
  orderId: string
  orderTotal: number
  paymentMethod: string
  retryLink?: string
}): TemplateData {
  return {
    user_name: params.userName,
    user_email: params.userEmail,
    order_id: params.orderId,
    order_total: `₱${params.orderTotal.toFixed(2)}`,
    payment_method: params.paymentMethod,
    retry_link: params.retryLink,
    unsubscribe_link: generateUnsubscribeLink(params.userId, params.userEmail),
    preferences_link: generatePreferencesLink(),
  }
}

/**
 * Build template data for download ready email
 */
export function buildDownloadReadyData(params: {
  userName: string
  userEmail: string
  userId: string
  orderId: string
  productTitle: string
  downloadLink: string
}): TemplateData {
  return {
    user_name: params.userName,
    user_email: params.userEmail,
    order_id: params.orderId,
    product_title: params.productTitle,
    download_link: params.downloadLink,
    unsubscribe_link: generateUnsubscribeLink(params.userId, params.userEmail),
    preferences_link: generatePreferencesLink(),
  }
}

/**
 * Build template data for product approved email
 */
export function buildProductApprovedData(params: {
  userName: string
  userEmail: string
  userId: string
  productTitle: string
  productUrl: string
}): TemplateData {
  return {
    user_name: params.userName,
    user_email: params.userEmail,
    product_title: params.productTitle,
    product_url: params.productUrl,
    unsubscribe_link: generateUnsubscribeLink(params.userId, params.userEmail),
    preferences_link: generatePreferencesLink(),
  }
}

/**
 * Build template data for product rejected email
 */
export function buildProductRejectedData(params: {
  userName: string
  userEmail: string
  userId: string
  productTitle: string
  rejectionReason?: string
  editLink?: string
}): TemplateData {
  return {
    user_name: params.userName,
    user_email: params.userEmail,
    product_title: params.productTitle,
    rejection_reason: params.rejectionReason,
    edit_link: params.editLink,
    unsubscribe_link: generateUnsubscribeLink(params.userId, params.userEmail),
    preferences_link: generatePreferencesLink(),
  }
}

/**
 * Build template data for cart abandonment email
 */
export function buildCartAbandonmentData(params: {
  userName: string
  userEmail: string
  userId: string
  cartItems: Array<{ title: string; price: number }>
  totalAmount: number
  cartLink: string
}): TemplateData {
  return {
    user_name: params.userName,
    user_email: params.userEmail,
    cart_items: params.cartItems.map((item) => ({
      title: item.title,
      price: `₱${item.price.toFixed(2)}`,
    })),
    total_amount: `₱${params.totalAmount.toFixed(2)}`,
    cart_link: params.cartLink,
    unsubscribe_link: generateUnsubscribeLink(params.userId, params.userEmail),
    preferences_link: generatePreferencesLink(),
  }
}

/**
 * Build template data for new sale email
 */
export function buildNewSaleData(params: {
  userName: string
  userEmail: string
  userId: string
  productTitle: string
  saleAmount: number
  earnings: number
  buyerName?: string
  productUrl?: string
}): TemplateData {
  return {
    user_name: params.userName,
    user_email: params.userEmail,
    product_title: params.productTitle,
    sale_amount: `₱${params.saleAmount.toFixed(2)}`,
    earnings: `₱${params.earnings.toFixed(2)}`,
    buyer_name: params.buyerName,
    product_url: params.productUrl,
    unsubscribe_link: generateUnsubscribeLink(params.userId, params.userEmail),
    preferences_link: generatePreferencesLink(),
  }
}

/**
 * Build template data for verification approved email
 */
export function buildVerificationApprovedData(params: {
  userName: string
  userEmail: string
  userId: string
  dashboardUrl?: string
}): TemplateData {
  return {
    user_name: params.userName,
    user_email: params.userEmail,
    dashboard_url: params.dashboardUrl,
    unsubscribe_link: generateUnsubscribeLink(params.userId, params.userEmail),
    preferences_link: generatePreferencesLink(),
  }
}

/**
 * Build template data for verification rejected email
 */
export function buildVerificationRejectedData(params: {
  userName: string
  userEmail: string
  userId: string
  rejectionReason?: string
  resubmitLink?: string
}): TemplateData {
  return {
    user_name: params.userName,
    user_email: params.userEmail,
    rejection_reason: params.rejectionReason,
    resubmit_link: params.resubmitLink,
    unsubscribe_link: generateUnsubscribeLink(params.userId, params.userEmail),
    preferences_link: generatePreferencesLink(),
  }
}

/**
 * Build template data for pioneer welcome email
 */
export function buildPioneerWelcomeData(params: {
  userName: string
  userEmail: string
  userId: string
  dashboardUrl?: string
}): TemplateData {
  return {
    user_name: params.userName,
    user_email: params.userEmail,
    dashboard_url: params.dashboardUrl,
    unsubscribe_link: generateUnsubscribeLink(params.userId, params.userEmail),
    preferences_link: generatePreferencesLink(),
  }
}

/**
 * Build template data for pioneer removed email
 */
export function buildPioneerRemovedData(params: {
  userName: string
  userEmail: string
  userId: string
  reason?: string
}): TemplateData {
  return {
    user_name: params.userName,
    user_email: params.userEmail,
    reason: params.reason,
    unsubscribe_link: generateUnsubscribeLink(params.userId, params.userEmail),
    preferences_link: generatePreferencesLink(),
  }
}

/**
 * Build template data for refund processed email
 */
export function buildRefundProcessedData(params: {
  userName: string
  userEmail: string
  userId: string
  orderId: string
  refundAmount: number
  productTitle?: string
}): TemplateData {
  return {
    user_name: params.userName,
    user_email: params.userEmail,
    order_id: params.orderId,
    refund_amount: `₱${params.refundAmount.toFixed(2)}`,
    product_title: params.productTitle,
    unsubscribe_link: generateUnsubscribeLink(params.userId, params.userEmail),
    preferences_link: generatePreferencesLink(),
  }
}

/**
 * Build template data for review reminder email
 */
export function buildReviewReminderData(params: {
  userName: string
  userEmail: string
  userId: string
  productTitle: string
  productUrl?: string
  reviewLink: string
}): TemplateData {
  return {
    user_name: params.userName,
    user_email: params.userEmail,
    product_title: params.productTitle,
    product_url: params.productUrl,
    review_link: params.reviewLink,
    unsubscribe_link: generateUnsubscribeLink(params.userId, params.userEmail),
    preferences_link: generatePreferencesLink(),
  }
}
