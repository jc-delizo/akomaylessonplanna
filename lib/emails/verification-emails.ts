/**
 * Teacher verification email functions
 */

import { sendImmediate } from './queue-service'
import {
  buildVerificationApprovedData,
  buildVerificationRejectedData,
} from './template-data-builders'
import { renderReactEmailComponent } from './template-renderer'
import { createAdminClient } from '@/lib/supabase/admin'
import React from 'react'

/**
 * Send verification approved email to teacher
 */
export async function sendVerificationApprovedEmail(
  userId: string
): Promise<void> {
  try {
    const supabase = createAdminClient()

    // Get user info
    const { data: user } = await supabase
      .from('users')
      .select('id, first_name, last_name, email')
      .eq('id', userId)
      .single()

    if (!user) {
      console.error('User not found:', userId)
      return
    }

    // Build template data
    const userFullName = user.first_name && user.last_name
      ? `${user.first_name} ${user.last_name}`.trim()
      : user.first_name || 'Teacher'
    const templateData = buildVerificationApprovedData({
      userName: userFullName,
      userEmail: user.email,
      userId: user.id,
      dashboardUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'https://akomaylessonplanna.com'}/seller/dashboard`,
    })

    // Render email template
    const { VerificationApprovedEmail } = await import('./templates/verification-approved')
    const html = await renderReactEmailComponent(
      React.createElement(VerificationApprovedEmail, templateData)
    )

    // Send immediately (Tier 1)
    await sendImmediate({
      emailType: 'verification_approved',
      recipientEmail: user.email,
      recipientUserId: user.id,
      subject: 'Your teacher verification has been approved! 🎉',
      html,
      templateData,
    })
  } catch (error) {
    console.error('Error sending verification approved email:', error)
  }
}

/**
 * Send verification rejected email to teacher
 */
export async function sendVerificationRejectedEmail(
  userId: string,
  rejectionReason: string
): Promise<void> {
  try {
    const supabase = createAdminClient()

    // Get user info
    const { data: user } = await supabase
      .from('users')
      .select('id, name, email')
      .eq('id', userId)
      .single()

    if (!user) {
      console.error('User not found:', userId)
      return
    }

    // Build template data
    const templateData = buildVerificationRejectedData({
      userName: user.name || 'Teacher',
      userEmail: user.email,
      userId: user.id,
      rejectionReason,
      resubmitLink: `${process.env.NEXT_PUBLIC_APP_URL || 'https://akomaylessonplanna.com'}/seller/verify`,
    })

    // Render email template
    const { VerificationRejectedEmail } = await import('./templates/verification-rejected')
    const html = await renderReactEmailComponent(
      React.createElement(VerificationRejectedEmail, templateData)
    )

    // Send immediately (Tier 1)
    await sendImmediate({
      emailType: 'verification_rejected',
      recipientEmail: user.email,
      recipientUserId: user.id,
      subject: 'Action needed: Your verification needs changes',
      html,
      templateData,
    })
  } catch (error) {
    console.error('Error sending verification rejected email:', error)
  }
}
