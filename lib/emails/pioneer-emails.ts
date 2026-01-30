/**
 * Pioneer program email functions
 */

import { sendImmediate } from './queue-service'
import {
  buildPioneerWelcomeData,
  buildPioneerRemovedData,
} from './template-data-builders'
import { renderReactEmailComponent } from './template-renderer'
import { createAdminClient } from '@/lib/supabase/admin'
import React from 'react'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://akomaylessonplanna.com'

/**
 * Send pioneer welcome email when a seller is added as Pioneer
 */
export async function sendPioneerWelcomeEmail(userId: string): Promise<void> {
  try {
    const supabase = createAdminClient()

    const { data: user } = await supabase
      .from('users')
      .select('id, first_name, last_name, email')
      .eq('id', userId)
      .single()

    if (!user) {
      console.error('User not found:', userId)
      return
    }

    const userFullName =
      [user.first_name, user.last_name].filter(Boolean).join(' ').trim() ||
      user.first_name ||
      'Seller'
    const templateData = buildPioneerWelcomeData({
      userName: userFullName,
      userEmail: user.email,
      userId: user.id,
      dashboardUrl: `${APP_URL}/shop`,
    })

    const { PioneerWelcomeEmail } = await import('./templates/pioneer-welcome')
    const html = await renderReactEmailComponent(
      React.createElement(PioneerWelcomeEmail, templateData)
    )

    await sendImmediate({
      emailType: 'pioneer_welcome',
      recipientEmail: user.email,
      recipientUserId: user.id,
      subject: "Welcome to the Pioneer Program!",
      html,
      templateData,
    })
  } catch (error) {
    console.error('Error sending pioneer welcome email:', error)
  }
}

/**
 * Send pioneer removed email when Pioneer status is removed
 */
export async function sendPioneerRemovedEmail(
  userId: string,
  reason: string
): Promise<void> {
  try {
    const supabase = createAdminClient()

    const { data: user } = await supabase
      .from('users')
      .select('id, first_name, last_name, email')
      .eq('id', userId)
      .single()

    if (!user) {
      console.error('User not found:', userId)
      return
    }

    const userFullName =
      [user.first_name, user.last_name].filter(Boolean).join(' ').trim() ||
      user.first_name ||
      'Seller'
    const templateData = buildPioneerRemovedData({
      userName: userFullName,
      userEmail: user.email,
      userId: user.id,
      reason,
    })

    const { PioneerRemovedEmail } = await import('./templates/pioneer-removed')
    const html = await renderReactEmailComponent(
      React.createElement(PioneerRemovedEmail, templateData)
    )

    await sendImmediate({
      emailType: 'pioneer_removed',
      recipientEmail: user.email,
      recipientUserId: user.id,
      subject: 'Changes to your Pioneer status',
      html,
      templateData,
    })
  } catch (error) {
    console.error('Error sending pioneer removed email:', error)
  }
}
