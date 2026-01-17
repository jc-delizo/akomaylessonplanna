/**
 * Moderation Utilities
 * Auto-flagging logic for external links, profanity, spam patterns
 */

import { createClient } from '@/lib/supabase/server'

// Common external link patterns
const EXTERNAL_LINK_PATTERNS = [
  /https?:\/\//gi, // HTTP/HTTPS URLs
  /www\./gi, // www. links
  /gcash/i, // GCash mentions
  /maya/i, // Maya mentions
  /paypal/i, // PayPal mentions
  /0\d{10}/, // Phone numbers (Philippines format)
  /\+63\d{10}/, // Phone numbers with country code
  /[\w.-]+@[\w.-]+\.\w+/gi, // Email addresses
]

// Profanity words (Tagalog + English) - basic list
const PROFANITY_WORDS = [
  // English
  'fuck',
  'shit',
  'damn',
  'bitch',
  'asshole',
  'bastard',
  // Tagalog (common)
  'putang',
  'tangina',
  'gago',
  'bobo',
  'tanga',
  // Add more as needed
]

/**
 * Check if message contains external links
 */
export function containsExternalLinks(content: string): boolean {
  return EXTERNAL_LINK_PATTERNS.some((pattern) => pattern.test(content))
}

/**
 * Check if message contains profanity
 */
export function containsProfanity(content: string): boolean {
  const lowerContent = content.toLowerCase()
  return PROFANITY_WORDS.some((word) => lowerContent.includes(word))
}

/**
 * Check if message is spam (same message sent multiple times)
 */
export async function isSpamPattern(
  conversationId: string,
  senderId: string,
  content: string
): Promise<boolean> {
  const supabase = await createClient()

  // Check last 10 messages from same sender in this conversation
  const { data: recentMessages } = await supabase
    .from('messages')
    .select('content')
    .eq('conversation_id', conversationId)
    .eq('sender_id', senderId)
    .eq('is_deleted', false)
    .order('created_at', { ascending: false })
    .limit(10)

  if (!recentMessages || recentMessages.length < 5) {
    return false
  }

  // Check if same content appears 5+ times
  const normalizedContent = content.trim().toLowerCase()
  const sameContentCount = recentMessages.filter(
    (msg) => msg.content.trim().toLowerCase() === normalizedContent
  ).length

  return sameContentCount >= 5
}

/**
 * Auto-flag message based on content
 * Returns flag reason or null if no flag needed
 */
export async function autoFlagMessage(
  conversationId: string,
  senderId: string,
  content: string
): Promise<string | null> {
  // Check external links
  if (containsExternalLinks(content)) {
    return 'external_link'
  }

  // Check profanity
  if (containsProfanity(content)) {
    return 'profanity'
  }

  // Check spam pattern
  const isSpam = await isSpamPattern(conversationId, senderId, content)
  if (isSpam) {
    return 'spam'
  }

  return null
}

/**
 * Flag a message (called after message is created)
 */
export async function flagMessage(
  messageId: string,
  flagReason: string
): Promise<void> {
  const supabase = await createClient()

  const { error } = await supabase
    .from('messages')
    .update({
      is_flagged: true,
      flag_reason: flagReason,
    })
    .eq('id', messageId)

  if (error) {
    console.error('Error flagging message:', error)
    // Don't throw - flagging is non-critical
  }
}
