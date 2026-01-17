'use client'

import { ConversationView } from '@/components/messaging/conversation-view'
import { use } from 'react'

export default function ConversationPage({
  params,
}: {
  params: Promise<{ conversationId: string }>
}) {
  const { conversationId } = use(params)

  return (
    <div className="h-screen flex flex-col">
      <ConversationView conversationId={conversationId} />
    </div>
  )
}
