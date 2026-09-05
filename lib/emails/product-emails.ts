/**
 * Product-related email functions
 */

import { sendImmediate } from './queue-service'
import {
  buildProductApprovedData,
  buildProductRejectedData,
} from './template-data-builders'
import { renderReactEmailComponent } from './template-renderer'
import { createAdminClient } from '@/lib/supabase/admin'
import React from 'react'

/**
 * Send product approved email to seller
 */
export async function sendProductApprovedEmail(
  sellerId: string,
  productId: string,
  productTitle: string
): Promise<void> {
  try {
    const supabase = createAdminClient()

    // Get seller info
    const { data: seller } = await supabase
      .from('users')
      .select('id, first_name, last_name, email')
      .eq('id', sellerId)
      .single()

    if (!seller) {
      console.error('Seller not found:', sellerId)
      return
    }

    // Build template data
    const sellerFullName = seller.first_name && seller.last_name
      ? `${seller.first_name} ${seller.last_name}`.trim()
      : seller.first_name || 'Seller'
    const templateData = buildProductApprovedData({
      userName: sellerFullName,
      userEmail: seller.email,
      userId: seller.id,
      productTitle,
      productUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'https://akomaylessonplanna.com'}/products/${productId}`,
    })

    // Render email template
    const { ProductApprovedEmail } = await import('./templates/product-approved')
    const html = await renderReactEmailComponent(
      React.createElement(ProductApprovedEmail, templateData)
    )

    // Send immediately (Tier 1)
    await sendImmediate({
      emailType: 'product_approved',
      recipientEmail: seller.email,
      recipientUserId: seller.id,
      subject: `Your product "${productTitle}" was approved! 🎉`,
      html,
      templateData,
    })
  } catch (error) {
    console.error('Error sending product approved email:', error)
  }
}

/**
 * Send product rejected email to seller
 */
export async function sendProductRejectedEmail(
  sellerId: string,
  productId: string,
  productTitle: string,
  rejectionReason: string
): Promise<void> {
  try {
    const supabase = createAdminClient()

    // Get seller info
    const { data: seller } = await supabase
      .from('users')
      .select('id, first_name, last_name, email')
      .eq('id', sellerId)
      .single()

    if (!seller) {
      console.error('Seller not found:', sellerId)
      return
    }

    // Build template data
    const sellerFullName = [seller.first_name, seller.last_name]
      .filter(Boolean)
      .join(' ')
      .trim()
    const templateData = buildProductRejectedData({
      userName: sellerFullName || 'Seller',
      userEmail: seller.email,
      userId: seller.id,
      productTitle,
      rejectionReason,
      editLink: `${process.env.NEXT_PUBLIC_APP_URL || 'https://akomaylessonplanna.com'}/seller/products/${productId}/edit`,
    })

    // Render email template
    const { ProductRejectedEmail } = await import('./templates/product-rejected')
    const html = await renderReactEmailComponent(
      React.createElement(ProductRejectedEmail, templateData)
    )

    // Send immediately (Tier 1)
    await sendImmediate({
      emailType: 'product_rejected',
      recipientEmail: seller.email,
      recipientUserId: seller.id,
      subject: `Action needed: Your product "${productTitle}" needs changes`,
      html,
      templateData,
    })
  } catch (error) {
    console.error('Error sending product rejected email:', error)
  }
}
