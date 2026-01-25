/**
 * Notification Integration
 * Create notifications for new messages
 */

import { createClient } from '@/lib/supabase/server'
import { createNotification } from '@/lib/notifications/create-notification'
import { getRelation } from '@/lib/utils/supabase-relations'

/**
 * Create notification when new message arrives
 * Note: No email notifications for messages (in-app bell only per design)
 * Uses 'system_announcement' type as fallback since 'new_message' not in NotificationType enum
 */
export async function createMessageNotification(
  conversationId: string,
  messageId: string,
  senderId: string,
  recipientId: string
): Promise<void> {
  const supabase = await createClient()

  // Get sender info
  const { data: sender } = await supabase
    .from('users')
    .select('first_name, last_name, username')
    .eq('id', senderId)
    .single()

  // Get conversation info
  const { data: conversation } = await supabase
    .from('conversations')
    .select('product_id, product:product_id(title)')
    .eq('id', conversationId)
    .single()

  const senderName = sender
    ? `${sender.first_name} ${sender.last_name || ''}`.trim() || sender.username || 'Someone'
    : 'Someone'
  const product = getRelation(conversation?.product)
  const productTitle = product?.title

  // Create notification title
  let title = `Message from ${senderName}`
  if (productTitle) {
    title = `Message from ${senderName} about ${productTitle}`
  }

  // Create notification
  await createNotification({
    user_id: recipientId,
    type: 'new_message',
    title,
    message: 'You have a new message',
    action_url: `/messages/${conversationId}`,
  })
}

/**
 * Get unread message count for notification badge
 */
export async function getUnreadMessageCountForBadge(
  userId: string
): Promise<number> {
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
