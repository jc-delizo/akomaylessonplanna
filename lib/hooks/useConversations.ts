'use client'

/**
 * useConversations Hook
 * Manage conversations list with polling for updates
 */

import { useEffect, useState, useCallback } from 'react'
import { useMessages } from './useMessages'

export interface Conversation {
  id: string
  buyer_id: string
  seller_id: string
  product_id?: string
  product?: {
    id: string
    title: string
    price: number
    cover_image_url?: string
  }
  status: 'active' | 'archived' | 'blocked'
  last_message_at: string
  created_at: string
  other_party: {
    id: string
    name: string
    username: string
    avatar_url?: string
  }
  last_message?: {
    id: string
    content: string
    sender_id: string
    created_at: string
    is_read: boolean
  }
  unread_count: number
}

export interface UseConversationsOptions {
  status?: 'active' | 'archived' | 'blocked' | 'all'
  page?: number
  perPage?: number
  autoRefresh?: boolean
}

export function useConversations(options: UseConversationsOptions = {}) {
  const { status = 'active', page = 1, perPage = 20, autoRefresh = true } = options

  const [conversations, setConversations] = useState<Conversation[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const [pagination, setPagination] = useState({
    page: 1,
    per_page: 20,
    total: 0,
    total_pages: 0,
  })

  // Use messages polling to detect new messages
  const { messages: newMessages } = useMessages({
    enabled: autoRefresh,
    onNewMessage: () => {
      // Refresh conversations when new message arrives
      fetchConversations()
    },
  })

  // Fetch conversations
  const fetchConversations = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const params = new URLSearchParams()
      params.append('status', status)
      params.append('page', page.toString())
      params.append('per_page', perPage.toString())

      const response = await fetch(`/api/messages/conversations?${params.toString()}`)
      if (!response.ok) {
        throw new Error('Failed to fetch conversations')
      }

      const data = await response.json()
      setConversations(data.conversations || [])
      setPagination(data.pagination || pagination)
    } catch (err) {
      console.error('Error fetching conversations:', err)
      setError(err instanceof Error ? err : new Error('Fetch error'))
    } finally {
      setLoading(false)
    }
  }, [status, page, perPage])

  // Initial fetch
  useEffect(() => {
    fetchConversations()
  }, [fetchConversations])

  // Refresh conversations
  const refresh = useCallback(() => {
    fetchConversations()
  }, [fetchConversations])

  return {
    conversations,
    loading,
    error,
    pagination,
    refresh,
  }
}
