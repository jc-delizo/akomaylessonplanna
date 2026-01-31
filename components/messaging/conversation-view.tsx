'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useMessages } from '@/lib/hooks/useMessages'
import { useAuth } from '@/lib/hooks/useAuth'
import { formatRelativeTime } from '@/lib/utils/date'
import Image from 'next/image'
import { MessageBubble } from './message-bubble'
import { MessageInput } from './message-input'
import { ConversationHeader } from './conversation-header'
import { ProductContextCard } from './product-context-card'

interface ConversationViewProps {
  conversationId: string
  onBack?: () => void
}

export function ConversationView({
  conversationId,
  onBack,
}: ConversationViewProps) {
  const router = useRouter()
  const { user } = useAuth()
  const [conversation, setConversation] = useState<any>(null)
  const [messages, setMessages] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Poll for new messages in this conversation (30s, pauses when tab hidden)
  const { refresh: refreshMessages } = useMessages({
    conversationId,
    enabled: true,
    initialAfter:
      messages.length > 0
        ? (() => {
            const sorted = [...messages].sort(
              (a, b) =>
                new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
            )
            return sorted[sorted.length - 1]?.created_at ?? null
          })()
        : undefined,
    onNewMessage: (message) => {
      setMessages((prev) => {
        if (prev.some((m) => m.id === message.id)) return prev
        return [...prev, message]
      })
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
      }, 100)
    },
  })

  // Fetch conversation and messages
  useEffect(() => {
    fetchConversation()
    fetchMessages()
  }, [conversationId])

  const fetchConversation = async () => {
    try {
      const response = await fetch(`/api/messages/conversations/${conversationId}`)
      if (!response.ok) throw new Error('Failed to fetch conversation')
      const data = await response.json()
      setConversation(data.conversation)
    } catch (error) {
      console.error('Error fetching conversation:', error)
    }
  }

  const fetchMessages = async () => {
    try {
      setLoading(true)
      const response = await fetch(
        `/api/messages/conversations/${conversationId}/messages?limit=50`
      )
      if (!response.ok) throw new Error('Failed to fetch messages')
      const data = await response.json()
      setMessages(data.messages || [])
    } catch (error) {
      console.error('Error fetching messages:', error)
    } finally {
      setLoading(false)
    }
  }

  // Mark all messages as read when conversation is viewed
  useEffect(() => {
    if (conversationId && messages.length > 0) {
      fetch(`/api/messages/conversations/${conversationId}/read-all`, {
        method: 'PUT',
      }).catch(console.error)
    }
  }, [conversationId, messages.length])

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSendMessage = async (content: string, attachments?: string[]) => {
    try {
      const response = await fetch(
        `/api/messages/conversations/${conversationId}/messages`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content, attachments }),
        }
      )

      if (!response.ok) throw new Error('Failed to send message')
      const data = await response.json()

      // Add message to list
      setMessages((prev) => [...prev, data.message])
      refreshMessages()
    } catch (error) {
      console.error('Error sending message:', error)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-sm text-muted-foreground">Loading conversation...</div>
      </div>
    )
  }

  if (!conversation) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-sm text-destructive">Conversation not found</div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <ConversationHeader
        conversation={conversation}
        onBack={onBack}
        currentUserId={user?.id}
      />

      {/* Product Context Card (if product-linked) */}
      {conversation.product && (
        <div className="p-4 border-b">
          <ProductContextCard product={conversation.product} />
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-sm text-muted-foreground">
              No messages yet. Start the conversation!
            </p>
          </div>
        ) : (
          messages.map((message) => (
            <MessageBubble
              key={message.id}
              message={message}
              currentUserId={user?.id}
            />
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="p-4 border-t">
        <MessageInput onSend={handleSendMessage} conversationId={conversationId} />
      </div>
    </div>
  )
}
