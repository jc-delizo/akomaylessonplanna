/**
 * Conversation Utilities
 * Helper functions for managing conversations
 */

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export interface CreateConversationParams {
  buyerId: string
  sellerId: string
  productId?: string
  orderId?: string
  initialMessage?: string
}

/**
 * Create or find existing conversation
 * Returns existing conversation if one exists for buyer-seller-product pair
 */
export async function createOrFindConversation(
  params: CreateConversationParams
): Promise<{ conversation: any; created: boolean }> {
  const supabase = await createClient()

  // Check if conversation already exists
  const conversationQuery: any = {
    buyer_id: params.buyerId,
    seller_id: params.sellerId,
  }

  if (params.productId) {
    conversationQuery.product_id = params.productId
  } else {
    conversationQuery.product_id = null
  }

  const { data: existing } = await supabase
    .from('conversations')
    .select('*')
    .match(conversationQuery)
    .single()

  if (existing) {
    return { conversation: existing, created: false }
  }

  // Create new conversation
  const { data: conversation, error } = await supabase
    .from('conversations')
    .insert({
      buyer_id: params.buyerId,
      seller_id: params.sellerId,
      product_id: params.productId || null,
      order_id: params.orderId || null,
      status: 'active',
    })
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to create conversation: ${error.message}`)
  }

  // If initial message provided, create it
  if (params.initialMessage && conversation) {
    await supabase.from('messages').insert({
      conversation_id: conversation.id,
      sender_id: params.buyerId,
      content: params.initialMessage.trim(),
      message_type: 'user',
    })
  }

  return { conversation, created: true }
}

/**
 * Check if user is blocked by another user
 */
export async function isUserBlocked(
  blockerId: string,
  blockedId: string
): Promise<boolean> {
  const supabase = await createClient()

  const { data } = await supabase
    .from('user_blocks')
    .select('id')
    .eq('blocker_id', blockerId)
    .eq('blocked_id', blockedId)
    .single()

  return !!data
}

/**
 * Check if conversation is blocked
 */
export async function isConversationBlocked(
  conversationId: string
): Promise<boolean> {
  const supabase = await createClient()

  const { data: conversation } = await supabase
    .from('conversations')
    .select('status')
    .eq('id', conversationId)
    .single()

  return conversation?.status === 'blocked'
}

/**
 * Get conversation participants
 */
export async function getConversationParticipants(conversationId: string) {
  const supabase = await createClient()

  const { data: conversation } = await supabase
    .from('conversations')
    .select('buyer_id, seller_id')
    .eq('id', conversationId)
    .single()

  if (!conversation) {
    return null
  }

  return {
    buyerId: conversation.buyer_id,
    sellerId: conversation.seller_id,
  }
}

/**
 * Verify user is participant in conversation
 */
export async function isConversationParticipant(
  conversationId: string,
  userId: string
): Promise<boolean> {
  const participants = await getConversationParticipants(conversationId)
  if (!participants) {
    return false
  }

  return (
    participants.buyerId === userId || participants.sellerId === userId
  )
}
