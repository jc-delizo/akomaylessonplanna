'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { ConversationList } from '@/components/messaging/conversation-list'
import { ConversationView } from '@/components/messaging/conversation-view'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Plus, MessageSquare, Archive } from 'lucide-react'
import { useAuth } from '@/lib/hooks/useAuth'

interface MessagesPageContentProps {
  basePath: string // '/messages' or '/shop/messages'
  showNewButton?: boolean // true for /messages, false for /shop/messages
  tabs?: ('active' | 'archived' | 'all')[] // ['active', 'archived', 'all'] vs ['active', 'archived']
  useQueryParams?: boolean // true for /messages, false for /shop/messages
  requireAuth?: boolean // false for /messages (layout handles it), true for /shop/messages
  containerHeight?: string // 'h-full' vs 'h-[calc(100vh-4rem)]'
}

export function MessagesPageContent({
  basePath,
  showNewButton = false,
  tabs = ['active', 'archived'],
  useQueryParams = false,
  requireAuth = false,
  containerHeight = 'h-full',
}: MessagesPageContentProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user, loading: authLoading } = useAuth()
  const [selectedConversationId, setSelectedConversationId] = useState<
    string | null
  >(null)
  const [status, setStatus] = useState<'active' | 'archived' | 'all'>('active')
  const [isMobile, setIsMobile] = useState(false)

  // Get conversation ID from URL
  useEffect(() => {
    if (useQueryParams) {
      // Use query params (for /messages)
      const convId = searchParams.get('id')
      if (convId) {
        setSelectedConversationId(convId)
      } else {
        setSelectedConversationId(null)
      }
    } else {
      // Use path params (for /shop/messages)
      const pathParts = window.location.pathname.split('/')
      const conversationIndex = pathParts.indexOf('messages')
      if (conversationIndex !== -1 && pathParts[conversationIndex + 1]) {
        setSelectedConversationId(pathParts[conversationIndex + 1])
      } else {
        setSelectedConversationId(null)
      }
    }
  }, [searchParams, useQueryParams])

  // Listen to pathname changes for path-based routing
  useEffect(() => {
    if (!useQueryParams) {
      const updateFromPath = () => {
        const pathParts = window.location.pathname.split('/')
        const conversationIndex = pathParts.indexOf('messages')
        if (conversationIndex !== -1 && pathParts[conversationIndex + 1]) {
          setSelectedConversationId(pathParts[conversationIndex + 1])
        } else {
          setSelectedConversationId(null)
        }
      }
      
      updateFromPath()
      // Listen to popstate for browser back/forward
      window.addEventListener('popstate', updateFromPath)
      return () => window.removeEventListener('popstate', updateFromPath)
    }
  }, [useQueryParams])

  // Detect mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Redirect if not authenticated (only when requireAuth is true)
  useEffect(() => {
    if (requireAuth && !authLoading && !user) {
      router.push(`/login?redirect=${basePath}`)
    }
  }, [user, authLoading, router, requireAuth, basePath])

  const handleSelectConversation = (conversationId: string) => {
    setSelectedConversationId(conversationId)
    if (isMobile) {
      // On mobile, navigate to conversation view
      router.push(`${basePath}/${conversationId}`)
    } else {
      if (useQueryParams) {
        // Use query params for desktop
        router.push(`${basePath}?id=${conversationId}`)
      } else {
        // Use path params for desktop (update URL without navigation)
        window.history.pushState({}, '', `${basePath}/${conversationId}`)
      }
    }
  }

  const handleBack = () => {
    setSelectedConversationId(null)
    router.push(basePath)
  }

  // Show loading state if auth is required
  if (requireAuth && authLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#ff7200] mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  // Return null if auth is required but user is not authenticated (will redirect)
  if (requireAuth && !user) {
    return null
  }

  // Mobile: Show list or conversation view
  if (isMobile) {
    if (selectedConversationId) {
      return (
        <div className={`${containerHeight} flex flex-col bg-gray-50`}>
          <ConversationView
            conversationId={selectedConversationId}
            onBack={handleBack}
          />
        </div>
      )
    }

    return (
      <div className={`${containerHeight} flex flex-col bg-gray-50`}>
        <div className="bg-white border-b shadow-sm">
          <div className="px-4 py-4 flex items-center justify-between">
            <h1 className="text-xl font-semibold text-gray-900">Messages</h1>
            {showNewButton && (
              <Button
                size="sm"
                onClick={() => router.push(`${basePath}/new`)}
                className="bg-[#ff7200] hover:bg-[#e66500] text-white"
              >
                <Plus className="size-4 mr-2" />
                New
              </Button>
            )}
          </div>

          <Tabs value={status} onValueChange={(v) => setStatus(v as any)} className="px-4">
            <TabsList className="w-full bg-gray-100">
              {tabs.includes('active') && (
                <TabsTrigger value="active" className="flex-1 data-[state=active]:bg-white">
                  {basePath === '/shop/messages' && <MessageSquare className="size-4 mr-2" />}
                  Active
                </TabsTrigger>
              )}
              {tabs.includes('archived') && (
                <TabsTrigger value="archived" className="flex-1 data-[state=active]:bg-white">
                  {basePath === '/shop/messages' && <Archive className="size-4 mr-2" />}
                  Archived
                </TabsTrigger>
              )}
              {tabs.includes('all') && (
                <TabsTrigger value="all" className="flex-1 data-[state=active]:bg-white">
                  All
                </TabsTrigger>
              )}
            </TabsList>
          </Tabs>
        </div>

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
  if (basePath === '/shop/messages') {
    // Shop messages layout (simpler header, no New button in header)
    return (
      <div className={`${containerHeight} flex flex-col`}>
        <div className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">Messages</h1>
            <Tabs value={status} onValueChange={(v) => setStatus(v as any)}>
              <TabsList>
                {tabs.includes('active') && (
                  <TabsTrigger value="active">
                    <MessageSquare className="size-4 mr-2" />
                    Active
                  </TabsTrigger>
                )}
                {tabs.includes('archived') && (
                  <TabsTrigger value="archived">
                    <Archive className="size-4 mr-2" />
                    Archived
                  </TabsTrigger>
                )}
              </TabsList>
            </Tabs>
          </div>
        </div>

        <div className="flex-1 flex overflow-hidden">
          {/* Left: Conversation List (40% width) */}
          <div className="w-[40%] border-r border-gray-200 flex flex-col">
            <ConversationList
              selectedConversationId={selectedConversationId || undefined}
              onSelectConversation={handleSelectConversation}
              status={status}
            />
          </div>

          {/* Right: Conversation View (60% width) */}
          <div className="flex-1 flex flex-col">
            {selectedConversationId ? (
              <ConversationView conversationId={selectedConversationId} />
            ) : (
              <div className="flex-1 flex items-center justify-center bg-gray-50">
                <div className="text-center max-w-sm px-6">
                  <div className="rounded-full bg-gray-100 p-6 mb-4 inline-block">
                    <MessageSquare className="size-12 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Select a conversation
                  </h3>
                  <p className="text-sm text-gray-500">
                    Choose a conversation from the list to start messaging
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  // General messages layout (with New button, more styling)
  return (
    <div className={`${containerHeight} flex bg-gray-50`}>
      {/* Left Panel - Conversation List (40% width) */}
      <div className="w-[40%] bg-white border-r border-gray-200 shadow-sm flex flex-col">
        <div className="px-6 py-5 border-b border-gray-200 bg-white flex items-center justify-between">
          <h1 className="text-xl font-semibold text-gray-900">Messages</h1>
          {showNewButton && (
            <Button
              size="sm"
              onClick={() => router.push(`${basePath}/new`)}
              className="bg-[#ff7200] hover:bg-[#e66500] text-white shadow-sm"
            >
              <Plus className="size-4 mr-2" />
              New
            </Button>
          )}
        </div>

        <Tabs value={status} onValueChange={(v) => setStatus(v as any)} className="px-4 border-b border-gray-200 bg-gray-50">
          <TabsList className="w-full bg-gray-100 h-10">
            {tabs.includes('active') && (
              <TabsTrigger value="active" className="flex-1 data-[state=active]:bg-white data-[state=active]:shadow-sm">
                Active
              </TabsTrigger>
            )}
            {tabs.includes('archived') && (
              <TabsTrigger value="archived" className="flex-1 data-[state=active]:bg-white data-[state=active]:shadow-sm">
                Archived
              </TabsTrigger>
            )}
            {tabs.includes('all') && (
              <TabsTrigger value="all" className="flex-1 data-[state=active]:bg-white data-[state=active]:shadow-sm">
                All
              </TabsTrigger>
            )}
          </TabsList>
        </Tabs>

        <div className="flex-1 overflow-hidden bg-white">
          <ConversationList
            selectedConversationId={selectedConversationId || undefined}
            onSelectConversation={handleSelectConversation}
            status={status}
          />
        </div>
      </div>

      {/* Right Panel - Conversation View (60% width) */}
      <div className="flex-1 flex flex-col bg-gray-50">
        {selectedConversationId ? (
          <ConversationView
            conversationId={selectedConversationId}
            onBack={handleBack}
          />
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center max-w-md px-6">
              <div className="mb-6 flex justify-center">
                <div className="rounded-full bg-gray-100 p-6">
                  <MessageSquare className="size-12 text-gray-400" />
                </div>
              </div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                No conversation selected
              </h2>
              <p className="text-gray-500 mb-6">
                Select a conversation from the list to start messaging, or start a new conversation.
              </p>
              {showNewButton && (
                <Button
                  onClick={() => router.push(`${basePath}/new`)}
                  className="bg-[#ff7200] hover:bg-[#e66500] text-white"
                >
                  <Plus className="size-4 mr-2" />
                  Start New Conversation
                </Button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
