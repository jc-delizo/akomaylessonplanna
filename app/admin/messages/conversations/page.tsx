'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { formatRelativeTime } from '@/lib/utils/date'
import { Search, MessageSquare } from 'lucide-react'
import Link from 'next/link'

interface Conversation {
  id: string
  buyer_id: string
  seller_id: string
  product_id?: string
  status: string
  last_message_at: string
  created_at: string
  buyer: {
    id: string
    name: string
    username: string
    email: string
  }
  seller: {
    id: string
    name: string
    username: string
    email: string
  }
  product?: {
    id: string
    title: string
  }
}

export default function AdminConversationsPage() {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    fetchConversations()
  }, [])

  const fetchConversations = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/messages/conversations?per_page=50')
      if (!response.ok) throw new Error('Failed to fetch conversations')
      const data = await response.json()
      setConversations(data.conversations || [])
    } catch (error) {
      console.error('Error fetching conversations:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredConversations = conversations.filter((conv) => {
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    return (
      conv.buyer.name.toLowerCase().includes(query) ||
      conv.seller.name.toLowerCase().includes(query) ||
      conv.product?.title.toLowerCase().includes(query) ||
      conv.buyer.email.toLowerCase().includes(query) ||
      conv.seller.email.toLowerCase().includes(query)
    )
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-sm text-muted-foreground">Loading conversations...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">All Conversations</h1>
        <p className="text-sm text-muted-foreground mt-1">
          View and moderate all buyer-seller conversations
        </p>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Search by buyer, seller, product, or email..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Conversations List */}
      {filteredConversations.length === 0 ? (
        <Card className="p-8 text-center">
          <MessageSquare className="size-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-lg font-medium">No conversations found</p>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredConversations.map((conv) => (
            <Card key={conv.id} className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant={conv.status === 'active' ? 'default' : 'secondary'}>
                      {conv.status}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {formatRelativeTime(new Date(conv.last_message_at))}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Buyer:</span>
                      <p className="font-medium">{conv.buyer.name}</p>
                      <p className="text-xs text-muted-foreground">{conv.buyer.email}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Seller:</span>
                      <p className="font-medium">{conv.seller.name}</p>
                      <p className="text-xs text-muted-foreground">{conv.seller.email}</p>
                    </div>
                  </div>
                  {conv.product && (
                    <p className="text-sm text-muted-foreground mt-2">
                      Product: {conv.product.title}
                    </p>
                  )}
                </div>
                <Link href={`/admin/messages/conversations/${conv.id}`}>
                  <Button variant="outline" size="sm">
                    View
                  </Button>
                </Link>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
