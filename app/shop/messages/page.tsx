'use client'

import { MessagesPageContent } from '@/components/messaging/messages-page-content'

export default function MessagesPage() {
  return (
    <MessagesPageContent
      basePath="/shop/messages"
      showNewButton={false}
      tabs={['active', 'archived']}
      useQueryParams={false}
      requireAuth={true}
      containerHeight="h-[calc(100vh-4rem)]"
    />
  )
}
