import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { parseBoundedInteger } from '@/lib/utils/query-params'

/**
 * GET /api/messages/conversations
 * Get user's conversations (buyer or seller)
 * Query params: status (active, archived, blocked, all), page, per_page
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') || 'active' // 'active', 'archived', 'blocked', 'all'
    const page = parseBoundedInteger(searchParams.get('page'), 1, 1, 10_000)
    const perPage = parseBoundedInteger(searchParams.get('per_page'), 20, 1, 100)
    const offset = (page - 1) * perPage

    // Build base query - get conversations where user is buyer or seller
    let query = supabase
      .from('conversations')
      .select('*', { count: 'exact' })
      .or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`)
      .order('last_message_at', { ascending: false })

    // Apply status filter
    if (status !== 'all') {
      query = query.eq('status', status)
    }

    // Get conversations with pagination
    const { data: conversations, error, count } = await query
      .range(offset, offset + perPage - 1)

    if (error) {
      console.error('Error fetching conversations:', error)
      // Check if it's a missing table error - return empty array gracefully
      if (error.code === 'PGRST205' || error.message?.includes('schema cache') || error.message?.includes('Could not find the table')) {
        console.warn('Conversations table not found. Migration 014_feature_11_messaging_system.sql may not have been applied.')
        // Return empty result instead of error for better UX during development
        return NextResponse.json({
          conversations: [],
          pagination: {
            page,
            per_page: perPage,
            total: 0,
            total_pages: 0,
          },
        })
      }
      return NextResponse.json(
        { error: 'Failed to fetch conversations', details: error.message },
        { status: 500 }
      )
    }

    // Get last message for each conversation (separate query for better performance)
    const conversationIds = conversations?.map((c) => c.id) || []
    const { data: lastMessages } = conversationIds.length > 0 ? await supabase
      .from('messages')
      .select('id, conversation_id, content, sender_id, created_at, is_read')
      .in('conversation_id', conversationIds)
      .order('created_at', { ascending: false }) : { data: [] }

    // Fetch related user and product data
    const userIds = new Set<string>()
    const productIds = new Set<string>()
    conversations?.forEach((conv) => {
      if (conv.buyer_id) userIds.add(conv.buyer_id)
      if (conv.seller_id) userIds.add(conv.seller_id)
      if (conv.product_id) productIds.add(conv.product_id)
    })

    // Fetch users
    const { data: users } = userIds.size > 0 ? await supabase
      .from('users')
      .select('id, first_name, last_name, username, avatar_url')
      .in('id', Array.from(userIds)) : { data: [] }

    // Fetch products
    const { data: products } = productIds.size > 0 ? await supabase
      .from('products')
      .select('id, title, price, cover_image_url')
      .in('id', Array.from(productIds)) : { data: [] }

    const usersMap = new Map(users?.map((u) => [u.id, u]) || [])
    const productsMap = new Map(products?.map((p) => [p.id, p]) || [])

    // Group last messages by conversation
    const lastMessagesMap = new Map()
    lastMessages?.forEach((msg) => {
      if (!lastMessagesMap.has(msg.conversation_id)) {
        lastMessagesMap.set(msg.conversation_id, msg)
      }
    })

    // Format response with last message preview
    const formattedConversations = conversations?.map((conv) => {
      const lastMessage = lastMessagesMap.get(conv.id)
      const buyer = usersMap.get(conv.buyer_id)
      const seller = usersMap.get(conv.seller_id)
      const product = conv.product_id ? productsMap.get(conv.product_id) : null
      const otherPartyRaw = conv.buyer_id === user.id ? seller : buyer
      const otherParty = otherPartyRaw ? {
        ...otherPartyRaw,
        name: otherPartyRaw.first_name && otherPartyRaw.last_name
          ? `${otherPartyRaw.first_name} ${otherPartyRaw.last_name}`.trim()
          : otherPartyRaw.first_name || '', // For backward compatibility
      } : null
      const unreadCount = lastMessages?.filter(
        (m) => m.conversation_id === conv.id && !m.is_read && m.sender_id !== user.id
      ).length || 0

      return {
        id: conv.id,
        buyer_id: conv.buyer_id,
        seller_id: conv.seller_id,
        product_id: conv.product_id,
        product: product,
        status: conv.status,
        last_message_at: conv.last_message_at,
        created_at: conv.created_at,
        other_party: otherParty,
        last_message: lastMessage
          ? {
              id: lastMessage.id,
              content: lastMessage.content?.substring(0, 50) || '',
              sender_id: lastMessage.sender_id,
              created_at: lastMessage.created_at,
              is_read: lastMessage.is_read,
            }
          : null,
        unread_count: unreadCount,
      }
    })

    return NextResponse.json({
      conversations: formattedConversations || [],
      pagination: {
        page,
        per_page: perPage,
        total: count || 0,
        total_pages: Math.ceil((count || 0) / perPage),
      },
    })
  } catch (error) {
    console.error('Error in GET /api/messages/conversations:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/messages/conversations
 * Create new conversation (buyer-initiated or seller-initiated "Contact Buyer")
 * Body (buyer): { seller_id, product_id (optional), order_id (optional), initial_message (optional) }
 * Body (seller): { buyer_id, product_id (optional, from order), order_id (optional) }
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      seller_id,
      buyer_id,
      product_id,
      order_id,
      initial_message,
    } = body

    // --- Seller-initiated: "Contact Buyer" (buyer_id provided, current user is seller) ---
    if (buyer_id) {
      if (buyer_id === user.id) {
        return NextResponse.json(
          { error: 'Cannot create conversation with yourself' },
          { status: 400 }
        )
      }

      const { data: currentUser } = await supabase
        .from('users')
        .select('id, can_sell')
        .eq('id', user.id)
        .single()

      if (!currentUser?.can_sell) {
        return NextResponse.json(
          { error: 'Only sellers can start a conversation with a buyer' },
          { status: 403 }
        )
      }

      // Find existing conversation: one per buyer-seller (any product)
      const { data: existingConvs } = await supabase
        .from('conversations')
        .select('id')
        .eq('buyer_id', buyer_id)
        .eq('seller_id', user.id)
        .order('last_message_at', { ascending: false })
        .limit(1)

      const existingConv = existingConvs?.[0]
      if (existingConv) {
        const { data: conversation } = await supabase
          .from('conversations')
          .select(
            `
            *,
            buyer:buyer_id(id, first_name, last_name, username, avatar_url),
            seller:seller_id(id, first_name, last_name, username, avatar_url),
            product:product_id(id, title, price, cover_image_url)
          `
          )
          .eq('id', existingConv.id)
          .single()

        return NextResponse.json({ conversation }, { status: 200 })
      }

      // Create new conversation (seller-initiated): buyer_id, seller_id, product_id from order
      const { data: conversation, error: convError } = await supabase
        .from('conversations')
        .insert({
          buyer_id,
          seller_id: user.id,
          product_id: product_id || null,
          order_id: order_id || null,
          status: 'active',
        })
        .select(
          `
          *,
          buyer:buyer_id(id, first_name, last_name, username, avatar_url),
          seller:seller_id(id, first_name, last_name, username, avatar_url),
          product:product_id(id, title, price, cover_image_url)
        `
        )
        .single()

      if (convError) {
        console.error('Error creating conversation (seller-initiated):', convError)
        return NextResponse.json(
          { error: 'Failed to create conversation' },
          { status: 500 }
        )
      }

      return NextResponse.json({ conversation }, { status: 201 })
    }

    // --- Buyer-initiated: "Contact Seller" (seller_id required) ---
    if (!seller_id) {
      return NextResponse.json(
        { error: 'seller_id or buyer_id is required' },
        { status: 400 }
      )
    }

    if (seller_id === user.id) {
      return NextResponse.json(
        { error: 'Cannot create conversation with yourself' },
        { status: 400 }
      )
    }

    const { data: seller, error: sellerError } = await supabase
      .from('users')
      .select('id, first_name, last_name, can_sell')
      .eq('id', seller_id)
      .single()

    if (sellerError || !seller) {
      return NextResponse.json(
        { error: 'Seller not found' },
        { status: 404 }
      )
    }

    if (!seller.can_sell) {
      return NextResponse.json(
        { error: 'User is not a seller' },
        { status: 400 }
      )
    }

    const { data: block } = await supabase
      .from('user_blocks')
      .select('id')
      .eq('blocker_id', seller_id)
      .eq('blocked_id', user.id)
      .single()

    if (block) {
      return NextResponse.json(
        { error: 'You are blocked by this seller' },
        { status: 403 }
      )
    }

    const conversationQuery: any = {
      buyer_id: user.id,
      seller_id: seller_id,
    }
    if (product_id) {
      conversationQuery.product_id = product_id
    } else {
      conversationQuery.product_id = null
    }

    const { data: existingConv } = await supabase
      .from('conversations')
      .select('id')
      .match(conversationQuery)
      .single()

    if (existingConv) {
      const { data: conversation } = await supabase
        .from('conversations')
        .select(
          `
          *,
          buyer:buyer_id(id, first_name, last_name, username, avatar_url),
          seller:seller_id(id, first_name, last_name, username, avatar_url),
          product:product_id(id, title, price, cover_image_url)
        `
        )
        .eq('id', existingConv.id)
        .single()

      return NextResponse.json({ conversation }, { status: 200 })
    }

    const { data: conversation, error: convError } = await supabase
      .from('conversations')
      .insert({
        buyer_id: user.id,
        seller_id: seller_id,
        product_id: product_id || null,
        order_id: order_id || null,
        status: 'active',
      })
      .select(
        `
        *,
        buyer:buyer_id(id, first_name, last_name, username, avatar_url),
        seller:seller_id(id, first_name, last_name, username, avatar_url),
        product:product_id(id, title, price, cover_image_url)
      `
      )
      .single()

    if (convError) {
      console.error('Error creating conversation:', convError)
      return NextResponse.json(
        { error: 'Failed to create conversation' },
        { status: 500 }
      )
    }

    if (initial_message && initial_message.trim()) {
      const { error: msgError } = await supabase.from('messages').insert({
        conversation_id: conversation.id,
        sender_id: user.id,
        content: initial_message.trim(),
        message_type: 'user',
      })

      if (msgError) {
        console.error('Error creating initial message:', msgError)
      }
    }

    return NextResponse.json({ conversation }, { status: 201 })
  } catch (error) {
    console.error('Error in POST /api/messages/conversations:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
