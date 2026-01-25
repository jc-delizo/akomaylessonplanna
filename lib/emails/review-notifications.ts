/**
 * Review-related Email Notifications
 * Feature 05: Reviews & Ratings
 * 
 * Integrated with Feature 10 email system
 */

import { scheduleEmail } from './queue-service'
import { buildReviewReminderData } from './template-data-builders'
import { renderReactEmailComponent } from './template-renderer'
import { createAdminClient } from '@/lib/supabase/admin'
import React from 'react'

interface ReviewReminderEmailData {
  buyerName: string
  buyerEmail: string
  productTitle: string
  productCoverImage?: string
  sellerName: string
  reviewLink: string
}

interface SellerResponseEmailData {
  buyerName: string
  buyerEmail: string
  sellerName: string
  productTitle: string
  buyerReviewComment?: string
  sellerResponse: string
  productLink: string
}

/**
 * Send review reminder email (24 hours after download)
 * 
 * Subject: "How was your purchase? Leave a review!"
 * 
 * This is a ONE-TIME email sent 24 hours after the user downloads the product.
 * Even if user unsubscribes from marketing emails, this is transactional and should still be sent.
 */
export async function sendReviewReminderEmail(
  data: ReviewReminderEmailData
): Promise<void> {
  try {
    const supabase = createAdminClient()

    // Get buyer info
    const { data: buyer } = await supabase
      .from('users')
      .select('id, first_name, last_name, email')
      .eq('email', data.buyerEmail)
      .single()

    if (!buyer) {
      console.error('Buyer not found for email:', data.buyerEmail)
      return
    }

    // Build template data
    const buyerFullName = data.buyerName || (buyer.first_name && buyer.last_name
      ? `${buyer.first_name} ${buyer.last_name}`.trim()
      : buyer.first_name || 'Valued Customer')
    const templateData = buildReviewReminderData({
      userName: buyerFullName,
      userEmail: buyer.email,
      userId: buyer.id,
      productTitle: data.productTitle,
      productUrl: data.reviewLink.replace('/review', ''),
      reviewLink: data.reviewLink,
    })

    // Render email template
    const { ReviewReminderEmail } = await import('./templates/review-reminder')
    const html = await renderReactEmailComponent(
      React.createElement(ReviewReminderEmail, templateData)
    )

    // Schedule email for 24 hours from now (Tier 2: Scheduled)
    await scheduleEmail({
      emailType: 'review_reminder',
      recipientEmail: buyer.email,
      recipientUserId: buyer.id,
      templateData,
      priority: 6, // Lower priority for reminders
      sendAfter: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours after download
    })
  } catch (error) {
    console.error('Error sending review reminder email:', error)
  }
}

/**
 * Send seller response notification email
 * 
 * Subject: "[Seller Name] responded to your review"
 * 
 * Sent when a seller responds to a buyer's review.
 * Includes both in-app and email notification.
 */
export async function sendSellerResponseNotificationEmail(
  data: SellerResponseEmailData
): Promise<void> {
  // TODO: Integrate with Feature 12 email system
  // For now, log to console
  console.log('Seller response notification email:', {
    to: data.buyerEmail,
    subject: `${data.sellerName} responded to your review`,
    productTitle: data.productTitle,
    sellerName: data.sellerName,
    buyerReviewComment: data.buyerReviewComment,
    sellerResponse: data.sellerResponse,
    productLink: data.productLink,
  })

  // Future implementation:
  // await addToEmailQueue({
  //   to: data.buyerEmail,
  //   subject: `${data.sellerName} responded to your review`,
  //   template: 'seller_response_notification',
  //   data: {
  //     buyerName: data.buyerName,
  //     sellerName: data.sellerName,
  //     productTitle: data.productTitle,
  //     buyerReviewComment: data.buyerReviewComment,
  //     sellerResponse: data.sellerResponse,
  //     productLink: data.productLink,
  //   },
  //   priority: 4, // Medium-high priority
  // })
}

/**
 * Send review removed notification email
 * 
 * Subject: "Your review was removed"
 * 
 * Sent when admin deletes a review due to policy violation.
 */
export async function sendReviewRemovedEmail(
  buyerEmail: string,
  buyerName: string,
  productTitle: string,
  reason?: string
): Promise<void> {
  // TODO: Integrate with Feature 12 email system
  console.log('Review removed email:', {
    to: buyerEmail,
    subject: 'Your review was removed',
    productTitle,
    reason,
  })

  // Future implementation:
  // await addToEmailQueue({
  //   to: buyerEmail,
  //   subject: 'Your review was removed',
  //   template: 'review_removed',
  //   data: {
  //     buyerName,
  //     productTitle,
  //     reason: reason || 'violation of our review policy',
  //   },
  //   priority: 3, // High priority (user needs to know)
  // })
}
