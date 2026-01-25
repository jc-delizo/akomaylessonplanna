/**
 * Checkout and payment email functions
 */

import { sendImmediate } from './queue-service'
import {
  buildPaymentSuccessfulData,
  buildDownloadReadyData,
} from './template-data-builders'
import { renderReactEmailComponent } from './template-renderer'
import { createAdminClient } from '@/lib/supabase/admin'
import React from 'react'

/**
 * Send payment successful email to buyer
 */
export async function sendPaymentSuccessfulEmail(
  buyerId: string,
  orderId: string,
  orderTotal: number,
  paymentMethod: string
): Promise<void> {
  try {
    const supabase = createAdminClient()

    // Get buyer info
    const { data: buyer } = await supabase
      .from('users')
      .select('id, first_name, last_name, email')
      .eq('id', buyerId)
      .single()

    if (!buyer) {
      console.error('Buyer not found:', buyerId)
      return
    }

    // Build template data
    const buyerFullName = buyer.first_name && buyer.last_name
      ? `${buyer.first_name} ${buyer.last_name}`.trim()
      : buyer.first_name || 'Valued Customer'
    const templateData = buildPaymentSuccessfulData({
      userName: buyerFullName,
      userEmail: buyer.email,
      userId: buyer.id,
      orderId,
      orderTotal,
      paymentMethod,
      downloadLink: `${process.env.NEXT_PUBLIC_APP_URL || 'https://akomaylessonplanna.com'}/library`,
    })

    // Render email template
    const { PaymentSuccessfulEmail } = await import('./templates/payment-successful')
    const html = await renderReactEmailComponent(
      React.createElement(PaymentSuccessfulEmail, templateData)
    )

    // Send immediately (Tier 1)
    await sendImmediate({
      emailType: 'payment_successful',
      recipientEmail: buyer.email,
      recipientUserId: buyer.id,
      subject: `✅ Payment successful! Your order is complete`,
      html,
      templateData,
    })
  } catch (error) {
    console.error('Error sending payment successful email:', error)
  }
}

/**
 * Send download ready email to buyer
 */
export async function sendDownloadReadyEmail(
  buyerId: string,
  orderId: string,
  productTitle: string
): Promise<void> {
  try {
    const supabase = createAdminClient()

    // Get buyer info
    const { data: buyer } = await supabase
      .from('users')
      .select('id, first_name, last_name, email')
      .eq('id', buyerId)
      .single()

    if (!buyer) {
      console.error('Buyer not found:', buyerId)
      return
    }

    // Build template data
    const buyerFullName = buyer.first_name && buyer.last_name
      ? `${buyer.first_name} ${buyer.last_name}`.trim()
      : buyer.first_name || 'Valued Customer'
    const templateData = buildDownloadReadyData({
      userName: buyerFullName,
      userEmail: buyer.email,
      userId: buyer.id,
      orderId,
      productTitle,
      downloadLink: `${process.env.NEXT_PUBLIC_APP_URL || 'https://akomaylessonplanna.com'}/library`,
    })

    // Render email template
    const { DownloadReadyEmail } = await import('./templates/download-ready')
    const html = await renderReactEmailComponent(
      React.createElement(DownloadReadyEmail, templateData)
    )

    // Send immediately (Tier 1)
    await sendImmediate({
      emailType: 'download_ready',
      recipientEmail: buyer.email,
      recipientUserId: buyer.id,
      subject: `📥 Your files are ready for download!`,
      html,
      templateData,
    })
  } catch (error) {
    console.error('Error sending download ready email:', error)
  }
}
