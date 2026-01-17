'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useConversations } from '@/lib/hooks/useConversations'
import { formatRelativeTime } from '@/lib/utils/date'
import Image from 'next/image'
import { Search, MessageSquare, Archive, MoreVertical } from 'lucide-react'

interface ConversationListProps {
  selectedConversationId?: string
  onSelectConversation: (conversationId: string) => void
  status?: 'active' | 'archived' | 'blocked' | 'all'
}

export function ConversationList({
  selectedConversationId,
  onSelectConversation,
  status = 'active',
}: ConversationListProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const router = useRouter()

  const { conversations, loading, error, refresh } = useConversations({
    status,
    page: 1,
    perPage: 50,
  })

  // Filter conversations by search query
  const filteredConversations = conversations.filter((conv) => {
    if (!searchQuery) return true

    const query = searchQuery.toLowerCase()
    const otherPartyName = conv.other_party?.name?.toLowerCase() || ''
    const otherPartyUsername = conv.other_party?.username?.toLowerCase() || ''
    const productTitle = conv.product?.title?.toLowerCase() || ''
    const lastMessage = conv.last_message?.content?.toLowerCase() || ''

    return (
      otherPartyName.includes(query) ||
      otherPartyUsername.includes(query) ||
      productTitle.includes(query) ||
      lastMessage.includes(query)
    )
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-sm text-muted-foreground">Loading conversations...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-sm text-destructive">Error loading conversations</div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      {/* Search */}
      <div className="p-4 border-b">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Conversation List */}
      <div className="flex-1 overflow-y-auto">
        {filteredConversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full p-8 text-center">
            <MessageSquare className="size-12 text-muted-foreground mb-4" />
            <p className="text-sm text-muted-foreground">
              {searchQuery
                ? 'No conversations match your search'
                : 'No conversations yet'}
            </p>
          </div>
        ) : (
          <div className="divide-y">
            {filteredConversations.map((conversation) => (
              <button
                key={conversation.id}
                onClick={() => onSelectConversation(conversation.id)}
                className={`w-full text-left p-4 hover:bg-muted/50 transition-colors ${
                  selectedConversationId === conversation.id
                    ? 'bg-muted border-l-4 border-l-primary'
                    : ''
                }`}
              >
                <div className="flex items-start gap-3">
                  {/* Avatar */}
                  <div className="relative flex-shrink-0">
                    {conversation.other_party?.avatar_url ? (
                      <Image
                        src={conversation.other_party.avatar_url}
                        alt={conversation.other_party.name || 'User'}
                        width={48}
                        height={48}
                        className="rounded-full"
                      />
                    ) : (
                      <div className="size-12 rounded-full bg-muted flex items-center justify-center">
                        <span className="text-lg font-medium">
                          {conversation.other_party?.name?.[0]?.toUpperCase() || 'U'}
                        </span>
                      </div>
                    )}
                    {conversation.unread_count > 0 && (
                      <Badge
                        variant="destructive"
                        className="absolute -top-1 -right-1 size-5 flex items-center justify-center p-0 text-xs"
                      >
                        {conversation.unread_count > 9 ? '9+' : conversation.unread_count}
                      </Badge>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="font-medium text-sm truncate">
                        {conversation.other_party?.name || 'Unknown User'}
                      </h3>
                      {conversation.last_message_at && (
                        <span className="text-xs text-muted-foreground flex-shrink-0 ml-2">
                          {formatRelativeTime(new Date(conversation.last_message_at))}
                        </span>
                      )}
                    </div>

                    {/* Product thumbnail (if product-linked) */}
                    {conversation.product && (
                      <div className="flex items-center gap-2 mb-1">
                        {conversation.product.cover_image_url && (
                          <Image
                            src={conversation.product.cover_image_url}
                            alt={conversation.product.title}
                            width={20}
                            height={20}
                            className="rounded object-cover"
                          />
                        )}
                        <span className="text-xs text-muted-foreground truncate">
                          {conversation.product.title}
                        </span>
                      </div>
                    )}

                    {/* Last message preview */}
                    {conversation.last_message && (
                      <p
                        className={`text-xs truncate ${
                          conversation.unread_count > 0
                            ? 'font-medium text-foreground'
                            : 'text-muted-foreground'
                        }`}
                      >
                        {conversation.last_message.content}
                      </p>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
