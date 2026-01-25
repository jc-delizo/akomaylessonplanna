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
import { getFullName, getInitials } from '@/lib/utils/profile'

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
    const otherPartyFullName = conv.other_party ? getFullName(conv.other_party).toLowerCase() : ''
    const otherPartyUsername = conv.other_party?.username?.toLowerCase() || ''
    const productTitle = conv.product?.title?.toLowerCase() || ''
    const lastMessage = conv.last_message?.content?.toLowerCase() || ''

    return (
      otherPartyFullName.includes(query) ||
      otherPartyUsername.includes(query) ||
      productTitle.includes(query) ||
      lastMessage.includes(query)
    )
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#ff7200] mb-3"></div>
          <p className="text-sm text-muted-foreground">Loading conversations...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center max-w-sm px-6">
          <div className="rounded-full bg-red-100 p-4 mb-4 inline-block">
            <MessageSquare className="size-6 text-red-600" />
          </div>
          <p className="text-sm font-medium text-gray-900 mb-1">Error loading conversations</p>
          <p className="text-xs text-muted-foreground">Please try refreshing the page</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Search */}
      <div className="p-4 border-b border-gray-200 bg-white">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
          <Input
            type="text"
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 bg-gray-50 border-gray-200 focus:bg-white focus:border-[#ff7200] transition-colors"
          />
        </div>
      </div>

      {/* Conversation List */}
      <div className="flex-1 overflow-y-auto">
        {filteredConversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full p-8 text-center">
            <div className="mb-4">
              <div className="rounded-full bg-gray-100 p-4 inline-block">
                <MessageSquare className="size-8 text-gray-400" />
              </div>
            </div>
            <h3 className="text-sm font-medium text-gray-900 mb-1">
              {searchQuery ? 'No matches found' : 'No conversations yet'}
            </h3>
            <p className="text-xs text-gray-500 max-w-xs">
              {searchQuery
                ? 'Try adjusting your search terms'
                : 'Start a new conversation to begin messaging'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {filteredConversations.map((conversation) => (
              <button
                key={conversation.id}
                onClick={() => onSelectConversation(conversation.id)}
                className={`w-full text-left px-4 py-3 hover:bg-gray-50 transition-all duration-150 ${
                  selectedConversationId === conversation.id
                    ? 'bg-orange-50 border-l-4 border-l-[#ff7200]'
                    : 'border-l-4 border-l-transparent'
                }`}
              >
                <div className="flex items-start gap-3">
                  {/* Avatar */}
                  <div className="relative flex-shrink-0">
                    {conversation.other_party?.avatar_url ? (
                      <Image
                        src={conversation.other_party.avatar_url}
                        alt={conversation.other_party ? getFullName(conversation.other_party) : 'User'}
                        width={48}
                        height={48}
                        className="rounded-full ring-2 ring-gray-100"
                      />
                    ) : (
                      <div className="size-12 rounded-full bg-gradient-to-br from-[#ff7200] to-[#e66500] flex items-center justify-center ring-2 ring-gray-100">
                        <span className="text-lg font-semibold text-white">
                          {conversation.other_party ? getInitials(conversation.other_party.first_name || '', conversation.other_party.last_name || '') : 'U'}
                        </span>
                      </div>
                    )}
                    {conversation.unread_count > 0 && (
                      <Badge
                        variant="destructive"
                        className="absolute -top-1 -right-1 size-5 flex items-center justify-center p-0 text-xs font-semibold shadow-sm"
                      >
                        {conversation.unread_count > 9 ? '9+' : conversation.unread_count}
                      </Badge>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1.5">
                      <h3 className={`font-semibold text-sm truncate ${
                        conversation.unread_count > 0 ? 'text-gray-900' : 'text-gray-700'
                      }`}>
                        {conversation.other_party ? getFullName(conversation.other_party) : 'Unknown User'}
                      </h3>
                      {conversation.last_message_at && (
                        <span className={`text-xs flex-shrink-0 ml-2 ${
                          conversation.unread_count > 0 ? 'text-gray-600 font-medium' : 'text-gray-400'
                        }`}>
                          {formatRelativeTime(new Date(conversation.last_message_at))}
                        </span>
                      )}
                    </div>

                    {/* Product thumbnail (if product-linked) */}
                    {conversation.product && (
                      <div className="flex items-center gap-2 mb-1.5">
                        {conversation.product.cover_image_url && (
                          <Image
                            src={conversation.product.cover_image_url}
                            alt={conversation.product.title}
                            width={20}
                            height={20}
                            className="rounded object-cover ring-1 ring-gray-200"
                          />
                        )}
                        <span className="text-xs text-gray-500 truncate">
                          {conversation.product.title}
                        </span>
                      </div>
                    )}

                    {/* Last message preview */}
                    {conversation.last_message && (
                      <p
                        className={`text-sm truncate ${
                          conversation.unread_count > 0
                            ? 'font-medium text-gray-900'
                            : 'text-gray-500'
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
