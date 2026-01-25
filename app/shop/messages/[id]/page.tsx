'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ConversationView } from '@/components/messaging/conversation-view'
import { useAuth } from '@/lib/hooks/useAuth'

export default function ConversationPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const [conversationId, setConversationId] = useState<string>('')

  useEffect(() => {
    params.then((p) => setConversationId(p.id))
  }, [params])

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login?redirect=/shop/messages')
    }
  }, [user, authLoading, router])

  if (authLoading || !conversationId) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#ff7200] mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null // Will redirect
  }

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col">
      <ConversationView
        conversationId={conversationId}
        onBack={() => router.push('/shop/messages')}
      />
    </div>
  )
}
