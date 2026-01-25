'use client'

import { MessagesPageContent } from '@/components/messaging/messages-page-content'

export default function MessagesPage() {
  return (
    <MessagesPageContent
      basePath="/messages"
      showNewButton={true}
      tabs={['active', 'archived', 'all']}
      useQueryParams={true}
      requireAuth={false}
      containerHeight="h-full"
    />
  )
}
