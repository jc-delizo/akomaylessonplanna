'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { ConversationList } from '@/components/messaging/conversation-list'
import { ConversationView } from '@/components/messaging/conversation-view'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Plus } from 'lucide-react'

export default function MessagesPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [selectedConversationId, setSelectedConversationId] = useState<
    string | null
  >(null)
  const [status, setStatus] = useState<'active' | 'archived' | 'all'>('active')
  const [isMobile, setIsMobile] = useState(false)

  // Get conversation ID from URL
  useEffect(() => {
    const convId = searchParams.get('id')
    if (convId) {
      setSelectedConversationId(convId)
    }
  }, [searchParams])

  // Detect mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  const handleSelectConversation = (conversationId: string) => {
    setSelectedConversationId(conversationId)
    if (isMobile) {
      router.push(`/messages/${conversationId}`)
    } else {
      router.push(`/messages?id=${conversationId}`)
    }
  }

  const handleBack = () => {
    setSelectedConversationId(null)
    router.push('/messages')
  }

  // Mobile: Show list or conversation view
  if (isMobile) {
    if (selectedConversationId) {
      return (
        <div className="h-full flex flex-col">
          <ConversationView
            conversationId={selectedConversationId}
            onBack={handleBack}
          />
        </div>
      )
    }

    return (
      <div className="h-full flex flex-col">
        <div className="p-4 border-b flex items-center justify-between">
          <h1 className="text-lg font-semibold">Messages</h1>
          <Button
            size="sm"
            onClick={() => router.push('/messages/new')}
          >
            <Plus className="size-4 mr-2" />
            New
          </Button>
        </div>

        <Tabs value={status} onValueChange={(v) => setStatus(v as any)} className="border-b">
          <TabsList className="w-full">
            <TabsTrigger value="active" className="flex-1">Active</TabsTrigger>
            <TabsTrigger value="archived" className="flex-1">Archived</TabsTrigger>
            <TabsTrigger value="all" className="flex-1">All</TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="flex-1 overflow-hidden">
          <ConversationList
            selectedConversationId={selectedConversationId || undefined}
            onSelectConversation={handleSelectConversation}
            status={status}
          />
        </div>
      </div>
    )
  }

  // Desktop: Two-column layout
  return (
    <div className="h-full flex">
      {/* Left Panel - Conversation List (40% width) */}
      <div className="w-[40%] border-r flex flex-col">
        <div className="p-4 border-b flex items-center justify-between">
          <h1 className="text-lg font-semibold">Messages</h1>
          <Button
            size="sm"
            onClick={() => router.push('/messages/new')}
          >
            <Plus className="size-4 mr-2" />
            New
          </Button>
        </div>

        <Tabs value={status} onValueChange={(v) => setStatus(v as any)} className="border-b">
          <TabsList className="w-full rounded-none">
            <TabsTrigger value="active" className="flex-1">Active</TabsTrigger>
            <TabsTrigger value="archived" className="flex-1">Archived</TabsTrigger>
            <TabsTrigger value="all" className="flex-1">All</TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="flex-1 overflow-hidden">
          <ConversationList
            selectedConversationId={selectedConversationId || undefined}
            onSelectConversation={handleSelectConversation}
            status={status}
          />
        </div>
      </div>

      {/* Right Panel - Conversation View (60% width) */}
      <div className="flex-1 flex flex-col">
        {selectedConversationId ? (
          <ConversationView
            conversationId={selectedConversationId}
            onBack={handleBack}
          />
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <p className="text-muted-foreground mb-4">
                Select a conversation to start messaging
              </p>
              <Button onClick={() => router.push('/messages/new')}>
                Start New Conversation
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
