/**
 * Template Utilities (Server-only)
 * Helper functions for message templates that require server-side Supabase client
 */

import { createClient } from '@/lib/supabase/server'

/**
 * Get system templates (available to all sellers)
 */
export async function getSystemTemplates() {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('message_templates')
    .select('*')
    .eq('template_type', 'system')
    .eq('is_active', true)
    .order('created_at', { ascending: true })

  if (error) {
    throw new Error(`Failed to fetch system templates: ${error.message}`)
  }

  return data || []
}

/**
 * Get user's custom templates (Pro/Pioneer only)
 */
export async function getUserTemplates(userId: string) {
  const supabase = await createClient()

  // Verify user is Pro/Pioneer
  const { data: userData } = await supabase
    .from('users')
    .select('subscription_tier')
    .eq('id', userId)
    .single()

  if (
    userData?.subscription_tier !== 'pro' &&
    userData?.subscription_tier !== 'pioneer'
  ) {
    return []
  }

  const { data, error } = await supabase
    .from('message_templates')
    .select('*')
    .eq('seller_id', userId)
    .eq('template_type', 'custom')
    .eq('is_active', true)
    .order('usage_count', { ascending: false })
    .order('created_at', { ascending: true })

  if (error) {
    throw new Error(`Failed to fetch user templates: ${error.message}`)
  }

  return data || []
}

/**
 * Increment template usage count
 */
export async function incrementTemplateUsage(templateId: string) {
  const supabase = await createClient()

  // Get current usage count
  const { data: template } = await supabase
    .from('message_templates')
    .select('usage_count')
    .eq('id', templateId)
    .single()

  if (!template) {
    return
  }

  // Increment
  await supabase
    .from('message_templates')
    .update({
      usage_count: (template.usage_count || 0) + 1,
    })
    .eq('id', templateId)
}
