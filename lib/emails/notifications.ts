/**
 * Email Notifications for Feature 04
 * 
 * Integrated with Feature 10 email system
 */

import { sendImmediate, scheduleEmail } from './queue-service'
import {
  buildOrderConfirmationData,
  buildPaymentFailedData,
  buildNewSaleData,
  buildRefundProcessedData,
  buildCartAbandonmentData,
} from './template-data-builders'
import { renderReactEmailComponent } from './template-renderer'
import { OrderConfirmationEmail } from './templates/order-confirmation'
import { createAdminClient } from '@/lib/supabase/admin'
import * as React from 'react'

/**
 * Send order confirmation email to buyer
 */
export async function sendOrderConfirmationEmail(
  buyerEmail: string,
  orderId: string,
  orderItems: Array<{ title: string; price: number }>,
  totalAmount: number
): Promise<void> {
  try {
    const supabase = createAdminClient()

    // Get buyer info
    const { data: buyer } = await supabase
      .from('users')
      .select('id, name, email')
      .eq('email', buyerEmail)
      .single()

    if (!buyer) {
      console.error('Buyer not found for email:', buyerEmail)
      return
    }

    // Get order details
    const { data: order } = await supabase
      .from('orders')
      .select('id, created_at, payment_method')
      .eq('id', orderId)
      .single()

    if (!order) {
      console.error('Order not found:', orderId)
      return
    }

    // Build template data
    const templateData = buildOrderConfirmationData({
      userName: buyer.name || 'Valued Customer',
      userEmail: buyer.email,
      userId: buyer.id,
      orderId,
      orderDate: new Date(order.created_at).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }),
      orderTotal: totalAmount,
      orderItems,
      paymentMethod: order.payment_method || 'GCash',
      downloadLink: `${process.env.NEXT_PUBLIC_APP_URL || 'https://akomaylessonplanna.com'}/library`,
    })

    // Render email template
    const html = await renderReactEmailComponent(
      React.createElement(OrderConfirmationEmail, templateData)
    )

    // Send immediately (Tier 1)
    await sendImmediate({
      emailType: 'order_confirmation',
      recipientEmail: buyerEmail,
      recipientUserId: buyer.id,
      subject: `Order Confirmation - Order #${orderId}`,
      html,
      templateData,
    })
  } catch (error) {
    console.error('Error sending order confirmation email:', error)
    // Don't throw - email failures shouldn't break order processing
  }
}

/**
 * Send payment failed notification to buyer
 */
export async function sendPaymentFailedEmail(
  buyerEmail: string,
  orderId: string
): Promise<void> {
  try {
    const supabase = createAdminClient()

    // Get buyer info
    const { data: buyer } = await supabase
      .from('users')
      .select('id, name, email')
      .eq('email', buyerEmail)
      .single()

    if (!buyer) {
      console.error('Buyer not found for email:', buyerEmail)
      return
    }

    // Get order details
    const { data: order } = await supabase
      .from('orders')
      .select('id, total_amount, payment_method')
      .eq('id', orderId)
      .single()

    if (!order) {
      console.error('Order not found:', orderId)
      return
    }

    // Build template data
    const templateData = buildPaymentFailedData({
      userName: buyer.name || 'Valued Customer',
      userEmail: buyer.email,
      userId: buyer.id,
      orderId,
      orderTotal: parseFloat(order.total_amount.toString()),
      paymentMethod: order.payment_method || 'GCash',
      retryLink: `${process.env.NEXT_PUBLIC_APP_URL || 'https://akomaylessonplanna.com'}/checkout?order=${orderId}`,
    })

    // Render email template
    const { PaymentFailedEmail } = await import('./templates/payment-failed')
    const html = await renderReactEmailComponent(
      React.createElement(PaymentFailedEmail, templateData)
    )

    // Send immediately (Tier 1)
    await sendImmediate({
      emailType: 'payment_failed',
      recipientEmail: buyerEmail,
      recipientUserId: buyer.id,
      subject: `Payment Failed - Order #${orderId}`,
      html,
      templateData,
    })
  } catch (error) {
    console.error('Error sending payment failed email:', error)
  }
}

/**
 * Send new sale notification to seller
 */
export async function sendNewSaleEmail(
  sellerEmail: string,
  productTitle: string,
  price: number,
  earnings: number,
  buyerName: string
): Promise<void> {
  try {
    const supabase = createAdminClient()

    // Get seller info
    const { data: seller } = await supabase
      .from('users')
      .select('id, name, email')
      .eq('email', sellerEmail)
      .single()

    if (!seller) {
      console.error('Seller not found for email:', sellerEmail)
      return
    }

    // Build template data
    const templateData = buildNewSaleData({
      userName: seller.name || 'Seller',
      userEmail: seller.email,
      userId: seller.id,
      productTitle,
      saleAmount: price,
      earnings,
      buyerName,
    })

    // Render email template
    const { NewSaleEmail } = await import('./templates/new-sale')
    const html = await renderReactEmailComponent(
      React.createElement(NewSaleEmail, templateData)
    )

    // Send immediately (Tier 1)
    await sendImmediate({
      emailType: 'new_sale',
      recipientEmail: sellerEmail,
      recipientUserId: seller.id,
      subject: `You made a sale! 🎉 ₱${price.toFixed(2)}`,
      html,
      templateData,
    })
  } catch (error) {
    console.error('Error sending new sale email:', error)
  }
}

/**
 * Send refund requested notification to seller
 * Note: This is an in-app notification, not an email
 */
export async function sendRefundRequestedEmail(
  sellerEmail: string,
  orderId: string,
  productTitle: string,
  buyerName: string
): Promise<void> {
  // This is handled by in-app notifications
  // No email needed for refund requests
  console.log('Refund requested (in-app only):', {
    to: sellerEmail,
    orderId,
    productTitle,
    buyerName,
  })
}

/**
 * Send refund approved notification to buyer
 */
export async function sendRefundApprovedEmail(
  buyerEmail: string,
  orderId: string,
  refundAmount: number
): Promise<void> {
  try {
    const supabase = createAdminClient()

    // Get buyer info
    const { data: buyer } = await supabase
      .from('users')
      .select('id, name, email')
      .eq('email', buyerEmail)
      .single()

    if (!buyer) {
      console.error('Buyer not found for email:', buyerEmail)
      return
    }

    // Get order details for product title
    const { data: orderItem } = await supabase
      .from('order_items')
      .select('product_title')
      .eq('order_id', orderId)
      .limit(1)
      .single()

    // Build template data
    const templateData = buildRefundProcessedData({
      userName: buyer.name || 'Valued Customer',
      userEmail: buyer.email,
      userId: buyer.id,
      orderId,
      refundAmount,
      productTitle: orderItem?.product_title,
    })

    // Render email template
    const { RefundProcessedEmail } = await import('./templates/refund-processed')
    const html = await renderReactEmailComponent(
      React.createElement(RefundProcessedEmail, templateData)
    )

    // Send immediately (Tier 1)
    await sendImmediate({
      emailType: 'refund_processed',
      recipientEmail: buyerEmail,
      recipientUserId: buyer.id,
      subject: `Refund Processed - Order #${orderId}`,
      html,
      templateData,
    })
  } catch (error) {
    console.error('Error sending refund approved email:', error)
  }
}

/**
 * Send withdrawal complete notification to seller
 * Note: This can be added later if needed
 */
export async function sendWithdrawalCompleteEmail(
  sellerEmail: string,
  amount: number,
  paymentMethod: string
): Promise<void> {
  // TODO: Create withdrawal email template if needed
  console.log('Withdrawal complete (email not implemented yet):', {
    to: sellerEmail,
    amount,
    paymentMethod,
  })
}

/**
 * Send abandoned cart reminder email
 */
export async function sendAbandonedCartEmail(
  buyerEmail: string,
  buyerName: string,
  cartItems: Array<{ title: string; price: number; cover_image_url?: string }>,
  totalAmount: number
): Promise<void> {
  try {
    const supabase = createAdminClient()

    // Get buyer info
    const { data: buyer } = await supabase
      .from('users')
      .select('id, name, email')
      .eq('email', buyerEmail)
      .single()

    if (!buyer) {
      console.error('Buyer not found for email:', buyerEmail)
      return
    }

    // Build template data
    const templateData = buildCartAbandonmentData({
      userName: buyerName || buyer.name || 'Valued Customer',
      userEmail: buyer.email,
      userId: buyer.id,
      cartItems,
      totalAmount,
      cartLink: `${process.env.NEXT_PUBLIC_APP_URL || 'https://akomaylessonplanna.com'}/cart`,
    })

    // Render email template
    const { CartAbandonmentEmail } = await import('./templates/cart-abandonment')
    const html = await renderReactEmailComponent(
      React.createElement(CartAbandonmentEmail, templateData)
    )

    // Schedule email (Tier 2: Scheduled - already scheduled 24h after cart creation)
    const { scheduleEmail } = await import('./queue-service')
    await scheduleEmail({
      emailType: 'cart_abandonment',
      recipientEmail: buyerEmail,
      recipientUserId: buyer.id,
      templateData,
      priority: 6, // Lower priority for reminders
      sendAfter: new Date(), // Should already be scheduled, but this is a fallback
    })
  } catch (error) {
    console.error('Error sending abandoned cart email:', error)
  }
}
