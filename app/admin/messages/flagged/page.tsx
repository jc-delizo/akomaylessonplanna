'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { formatRelativeTime } from '@/lib/utils/date'
import Image from 'next/image'
import { Flag, CheckCircle, X, Eye } from 'lucide-react'
import Link from 'next/link'

interface FlaggedMessage {
  id: string
  content: string
  flag_reason: string
  created_at: string
  sender: {
    id: string
    name: string
    username: string
    email: string
  }
  conversation: {
    id: string
    buyer_id: string
    seller_id: string
    product_id?: string
    buyer: {
      id: string
      name: string
    }
    seller: {
      id: string
      name: string
    }
    product?: {
      id: string
      title: string
    }
  }
}

export default function AdminFlaggedMessagesPage() {
  const [messages, setMessages] = useState<FlaggedMessage[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchFlaggedMessages()
  }, [])

  const fetchFlaggedMessages = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/messages/flagged')
      if (!response.ok) throw new Error('Failed to fetch flagged messages')
      const data = await response.json()
      setMessages(data.messages || [])
    } catch (error) {
      console.error('Error fetching flagged messages:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDismiss = async (messageId: string) => {
    try {
      const response = await fetch(`/api/admin/messages/flagged/${messageId}/dismiss`, {
        method: 'PUT',
      })
      if (response.ok) {
        setMessages((prev) => prev.filter((m) => m.id !== messageId))
      }
    } catch (error) {
      console.error('Error dismissing flag:', error)
    }
  }

  const getFlagReasonBadge = (reason: string) => {
    const variants: Record<string, 'destructive' | 'secondary' | 'outline'> = {
      external_link: 'destructive',
      profanity: 'destructive',
      spam: 'secondary',
      user_report: 'outline',
    }
    return variants[reason] || 'outline'
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-sm text-muted-foreground">Loading flagged messages...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Flagged Messages</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Review messages flagged for moderation
          </p>
        </div>
        <Badge variant="outline" className="text-sm">
          {messages.length} pending
        </Badge>
      </div>

      {messages.length === 0 ? (
        <Card className="p-8 text-center">
          <CheckCircle className="size-12 text-green-500 mx-auto mb-4" />
          <p className="text-lg font-medium">No flagged messages</p>
          <p className="text-sm text-muted-foreground mt-2">
            All messages are clean!
          </p>
        </Card>
      ) : (
        <div className="space-y-4">
          {messages.map((message) => (
            <Card key={message.id} className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Flag className="size-4 text-red-500" />
                    <Badge variant={getFlagReasonBadge(message.flag_reason)}>
                      {message.flag_reason.replace('_', ' ')}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {formatRelativeTime(new Date(message.created_at))}
                    </span>
                  </div>
                  <p className="text-sm mb-4 bg-muted p-3 rounded">
                    {message.content}
                  </p>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">From:</span>
                      <p className="font-medium">{message.sender.name}</p>
                      <p className="text-xs text-muted-foreground">{message.sender.email}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Conversation:</span>
                      <p className="font-medium">
                        {message.conversation.buyer.name} ↔ {message.conversation.seller.name}
                      </p>
                      {message.conversation.product && (
                        <p className="text-xs text-muted-foreground">
                          Product: {message.conversation.product.title}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex gap-2 pt-4 border-t">
                <Link href={`/admin/messages/conversations/${message.conversation.id}`}>
                  <Button variant="outline" size="sm">
                    <Eye className="size-4 mr-2" />
                    View Conversation
                  </Button>
                </Link>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDismiss(message.id)}
                >
                  <CheckCircle className="size-4 mr-2" />
                  Dismiss
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={async () => {
                    if (confirm('Are you sure you want to delete this message?')) {
                      try {
                        await fetch(`/api/admin/messages/${message.id}`, {
                          method: 'DELETE',
                        })
                        setMessages((prev) => prev.filter((m) => m.id !== message.id))
                      } catch (error) {
                        console.error('Error deleting message:', error)
                      }
                    }
                  }}
                >
                  <X className="size-4 mr-2" />
                  Delete Message
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
