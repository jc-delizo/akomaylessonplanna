import { render } from '@react-email/render'
import * as React from 'react'

/**
 * Template data interface
 */
export interface TemplateData {
  // User data
  user_name?: string
  user_email?: string
  user_username?: string

  // Platform data
  platform_name?: string
  platform_url?: string
  logo_url?: string
  preferences_link?: string
  unsubscribe_link?: string
  support_email?: string
  current_date?: string
  current_year?: number

  // Product data (for product emails)
  product_title?: string
  product_cover_image?: string
  product_url?: string
  product_price?: string
  product_type?: string
  grade_level?: string
  subject?: string

  // Order data (for checkout emails)
  order_id?: string
  order_date?: string
  order_total?: string
  order_items?: Array<{ title: string; price: string }>
  payment_method?: string
  download_link?: string

  // Custom data
  [key: string]: any
}

/**
 * Replace template variables in a string
 * Supports {{variable}} syntax
 */
export function replaceTemplateVariables(
  template: string,
  data: TemplateData
): string {
  let result = template

  // Replace all {{variable}} occurrences
  const variableRegex = /\{\{(\w+)\}\}/g
  result = result.replace(variableRegex, (match, variable) => {
    const value = data[variable]
    return value !== undefined && value !== null ? String(value) : match
  })

  return result
}

/**
 * Render email template from HTML string with variable substitution
 */
export async function renderEmailTemplate(
  htmlTemplate: string,
  data: TemplateData
): Promise<string> {
  // Replace variables in HTML template
  const renderedHtml = replaceTemplateVariables(htmlTemplate, data)

  return renderedHtml
}

/**
 * Render React Email component to HTML string
 */
export async function renderReactEmailComponent(
  component: React.ReactElement,
  data?: TemplateData
): Promise<string> {
  const html = await render(component)
  return html
}

/**
 * Generate unsubscribe link with token
 */
export function generateUnsubscribeLink(
  userId: string,
  email: string,
  baseUrl: string = process.env.NEXT_PUBLIC_APP_URL || 'https://akomaylessonplanna.com'
): string {
  // In production, generate a secure token
  // For now, use a simple approach (should be improved with JWT or similar)
  const token = Buffer.from(`${userId}:${email}`).toString('base64')
  return `${baseUrl}/unsubscribe?token=${token}`
}

/**
 * Generate preferences link
 */
export function generatePreferencesLink(
  baseUrl: string = process.env.NEXT_PUBLIC_APP_URL || 'https://akomaylessonplanna.com'
): string {
  return `${baseUrl}/settings/notifications`
}

/**
 * Prepare template data with defaults
 */
export function prepareTemplateData(
  customData: Partial<TemplateData> = {}
): TemplateData {
  const now = new Date()

  return {
    // Platform defaults
    platform_name: 'AKOMAYLESSONPLANNA',
    platform_url: process.env.NEXT_PUBLIC_APP_URL || 'https://akomaylessonplanna.com',
    logo_url: `${process.env.NEXT_PUBLIC_APP_URL || 'https://akomaylessonplanna.com'}/logo.png`,
    support_email: 'support@akomaylessonplanna.com',
    current_date: now.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }),
    current_year: now.getFullYear(),

    // Merge custom data
    ...customData,
  }
}
