'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { formatRelativeTime } from '@/lib/utils/date'
import { ArrowLeft, Send, Shield } from 'lucide-react'
import { MessageBubble } from '@/components/messaging/message-bubble'
import { use } from 'react'

export default function AdminConversationViewPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id: conversationId } = use(params)
  const router = useRouter()
  const [conversation, setConversation] = useState<any>(null)
  const [messages, setMessages] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [adminMessage, setAdminMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [adminJoined, setAdminJoined] = useState(false)

  useEffect(() => {
    fetchConversation()
    checkAdminJoined()
  }, [conversationId])

  const fetchConversation = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/admin/messages/conversations/${conversationId}`)
      if (!response.ok) throw new Error('Failed to fetch conversation')
      const data = await response.json()
      setConversation(data.conversation)
      setMessages(data.messages || [])
    } catch (error) {
      console.error('Error fetching conversation:', error)
    } finally {
      setLoading(false)
    }
  }

  const checkAdminJoined = async () => {
    // Check if admin has already joined
    const hasAdminMessage = messages.some((m) => m.message_type === 'admin')
    setAdminJoined(hasAdminMessage)
  }

  const handleJoinConversation = async () => {
    try {
      const response = await fetch(`/api/admin/messages/conversations/${conversationId}/join`, {
        method: 'POST',
      })
      if (response.ok) {
        setAdminJoined(true)
        fetchConversation()
      }
    } catch (error) {
      console.error('Error joining conversation:', error)
    }
  }

  const handleSendAdminMessage = async () => {
    if (!adminMessage.trim()) return

    try {
      setSending(true)
      const response = await fetch(
        `/api/admin/messages/conversations/${conversationId}/message`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content: adminMessage.trim() }),
        }
      )

      if (response.ok) {
        setAdminMessage('')
        fetchConversation()
      }
    } catch (error) {
      console.error('Error sending admin message:', error)
    } finally {
      setSending(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-sm text-muted-foreground">Loading conversation...</div>
      </div>
    )
  }

  if (!conversation) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-sm text-destructive">Conversation not found</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="size-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Conversation Details</h1>
          <p className="text-sm text-muted-foreground">
            {conversation.buyer ? `${conversation.buyer.first_name} ${conversation.buyer.last_name || ''}`.trim() : 'Unknown'} ↔ {conversation.seller ? `${conversation.seller.first_name} ${conversation.seller.last_name || ''}`.trim() : 'Unknown'}
          </p>
        </div>
      </div>

      {/* Admin Actions */}
      {!adminJoined && (
        <Card className="p-4 bg-yellow-50 border-yellow-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium mb-1">Join as Mediator</p>
              <p className="text-xs text-muted-foreground">
                Join this conversation to help resolve disputes
              </p>
            </div>
            <Button onClick={handleJoinConversation} size="sm">
              <Shield className="size-4 mr-2" />
              Join Conversation
            </Button>
          </div>
        </Card>
      )}

      {/* Messages */}
      <Card className="p-6">
        <h2 className="font-semibold mb-4">Messages</h2>
        <div className="space-y-4 max-h-[600px] overflow-y-auto">
          {messages.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              No messages yet
            </p>
          ) : (
            messages.map((message) => (
              <MessageBubble key={message.id} message={message} />
            ))
          )}
        </div>
      </Card>

      {/* Admin Message Input */}
      {adminJoined && (
        <Card className="p-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Send Admin Message</label>
            <Textarea
              value={adminMessage}
              onChange={(e) => setAdminMessage(e.target.value)}
              placeholder="Type your message..."
              rows={3}
            />
            <Button
              onClick={handleSendAdminMessage}
              disabled={!adminMessage.trim() || sending}
              className="w-full"
            >
              <Send className="size-4 mr-2" />
              {sending ? 'Sending...' : 'Send Message'}
            </Button>
          </div>
        </Card>
      )}
    </div>
  )
}
