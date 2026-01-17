'use client'

/**
 * useMessages Hook
 * Polling hook for real-time message updates (30-second intervals)
 * Smart polling: pauses when tab is inactive, resumes when active
 */

import { useEffect, useRef, useState, useCallback } from 'react'

const POLLING_INTERVAL = 30000 // 30 seconds

export interface Message {
  id: string
  conversation_id: string
  sender_id: string
  content: string
  message_type: 'user' | 'system' | 'admin'
  attachments?: string[]
  is_read: boolean
  created_at: string
  sender?: {
    id: string
    name: string
    username: string
    avatar_url?: string
  }
}

export interface UseMessagesOptions {
  conversationId?: string // Optional: poll for specific conversation
  enabled?: boolean // Enable/disable polling
  onNewMessage?: (message: Message) => void // Callback for new messages
}

export function useMessages(options: UseMessagesOptions = {}) {
  const { conversationId, enabled = true, onNewMessage } = options

  const [messages, setMessages] = useState<Message[]>([])
  const [isPolling, setIsPolling] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const lastMessageIdRef = useRef<string | null>(null)
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const isTabActiveRef = useRef(true)

  // Poll for new messages
  const pollForNewMessages = useCallback(async () => {
    if (!enabled || !isTabActiveRef.current) {
      return
    }

    try {
      setIsPolling(true)
      setError(null)

      const params = new URLSearchParams()
      if (lastMessageIdRef.current) {
        params.append('after', lastMessageIdRef.current)
      }
      if (conversationId) {
        params.append('conversation_id', conversationId)
      }

      const response = await fetch(`/api/messages/new?${params.toString()}`)
      if (!response.ok) {
        throw new Error('Failed to fetch new messages')
      }

      const data = await response.json()
      const newMessages: Message[] = data.messages || []

      if (newMessages.length > 0) {
        // Update last message ID
        const latestMessage = newMessages[newMessages.length - 1]
        lastMessageIdRef.current = latestMessage.id

        // Add new messages to state
        setMessages((prev) => {
          const existingIds = new Set(prev.map((m) => m.id))
          const uniqueNew = newMessages.filter((m) => !existingIds.has(m.id))
          return [...prev, ...uniqueNew]
        })

        // Call callback for each new message
        newMessages.forEach((msg) => {
          onNewMessage?.(msg)
        })
      }
    } catch (err) {
      console.error('Error polling for messages:', err)
      setError(err instanceof Error ? err : new Error('Polling error'))
    } finally {
      setIsPolling(false)
    }
  }, [enabled, conversationId, onNewMessage])

  // Start polling
  const startPolling = useCallback(() => {
    if (pollingIntervalRef.current) {
      return // Already polling
    }

    // Initial poll
    pollForNewMessages()

    // Set up interval
    pollingIntervalRef.current = setInterval(() => {
      pollForNewMessages()
    }, POLLING_INTERVAL)
  }, [pollForNewMessages])

  // Stop polling
  const stopPolling = useCallback(() => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current)
      pollingIntervalRef.current = null
    }
  }, [])

  // Handle tab visibility changes
  useEffect(() => {
    const handleVisibilityChange = () => {
      isTabActiveRef.current = !document.hidden

      if (document.hidden) {
        stopPolling()
      } else if (enabled) {
        startPolling()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [enabled, startPolling, stopPolling])

  // Start/stop polling based on enabled state
  useEffect(() => {
    if (enabled && isTabActiveRef.current) {
      startPolling()
    } else {
      stopPolling()
    }

    return () => {
      stopPolling()
    }
  }, [enabled, startPolling, stopPolling])

  // Manual refresh function
  const refresh = useCallback(() => {
    pollForNewMessages()
  }, [pollForNewMessages])

  return {
    messages,
    isPolling,
    error,
    refresh,
    startPolling,
    stopPolling,
  }
}
