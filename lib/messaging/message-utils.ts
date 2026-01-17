/**
 * Message Utilities
 * Helper functions for managing messages
 */

import { createClient } from '@/lib/supabase/server'

export interface SendMessageParams {
  conversationId: string
  senderId: string
  content: string
  attachments?: string[]
  messageType?: 'user' | 'system' | 'admin'
}

/**
 * Send a message
 */
export async function sendMessage(params: SendMessageParams) {
  const supabase = await createClient()

  // Validate content
  if (!params.content || !params.content.trim()) {
    throw new Error('Message content is required')
  }

  if (params.content.length > 1000) {
    throw new Error('Message content exceeds 1000 characters')
  }

  // Validate attachments (max 3)
  if (params.attachments && params.attachments.length > 3) {
    throw new Error('Maximum 3 attachments allowed')
  }

  // Create message
  const { data: message, error } = await supabase
    .from('messages')
    .insert({
      conversation_id: params.conversationId,
      sender_id: params.senderId,
      content: params.content.trim(),
      message_type: params.messageType || 'user',
      attachments: params.attachments || [],
      is_read: false,
    })
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to send message: ${error.message}`)
  }

  return message
}

/**
 * Mark message as read
 */
export async function markMessageAsRead(messageId: string, userId: string) {
  const supabase = await createClient()

  // Verify user is recipient (not sender)
  const { data: message } = await supabase
    .from('messages')
    .select('sender_id')
    .eq('id', messageId)
    .single()

  if (!message) {
    throw new Error('Message not found')
  }

  if (message.sender_id === userId) {
    throw new Error('Cannot mark own message as read')
  }

  const { error } = await supabase
    .from('messages')
    .update({
      is_read: true,
      read_at: new Date().toISOString(),
    })
    .eq('id', messageId)

  if (error) {
    throw new Error(`Failed to mark message as read: ${error.message}`)
  }
}

/**
 * Mark all messages in conversation as read
 */
export async function markAllMessagesAsRead(
  conversationId: string,
  userId: string
) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('messages')
    .update({
      is_read: true,
      read_at: new Date().toISOString(),
    })
    .eq('conversation_id', conversationId)
    .eq('is_read', false)
    .neq('sender_id', userId)
    .eq('is_deleted', false)

  if (error) {
    throw new Error(`Failed to mark messages as read: ${error.message}`)
  }
}

/**
 * Get unread message count for user
 */
export async function getUnreadMessageCount(userId: string): Promise<number> {
  const supabase = await createClient()

  // Get all conversations user is part of
  const { data: conversations } = await supabase
    .from('conversations')
    .select('id')
    .or(`buyer_id.eq.${userId},seller_id.eq.${userId}`)

  if (!conversations || conversations.length === 0) {
    return 0
  }

  const conversationIds = conversations.map((c) => c.id)

  // Count unread messages (not sent by user)
  const { count } = await supabase
    .from('messages')
    .select('id', { count: 'exact', head: true })
    .in('conversation_id', conversationIds)
    .eq('is_read', false)
    .neq('sender_id', userId)
    .eq('is_deleted', false)

  return count || 0
}
