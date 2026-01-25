'use client'

import { formatRelativeTime } from '@/lib/utils/date'
import Image from 'next/image'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { getFullName, getInitials } from '@/lib/utils/profile'

interface MessageBubbleProps {
  message: {
    id: string
    sender_id: string
    content: string
    message_type: 'user' | 'system' | 'admin'
    attachments?: string[]
    created_at: string
    is_read: boolean
    sender?: {
      id: string
      first_name: string
      last_name: string
      name?: string // For backward compatibility
      username: string
      avatar_url?: string
      is_verified_teacher?: boolean
    }
  }
  currentUserId?: string
}

export function MessageBubble({ message, currentUserId }: MessageBubbleProps) {
  const isOwnMessage = message.sender_id === currentUserId
  const isSystemMessage = message.message_type === 'system'
  const isAdminMessage = message.message_type === 'admin'

  // Get current user ID from auth (would need to be passed as prop or from context)
  // For now, we'll determine based on message type

  if (isSystemMessage) {
    return (
      <div className="flex items-center justify-center py-2">
        <p className="text-xs text-muted-foreground italic">{message.content}</p>
      </div>
    )
  }

  if (isAdminMessage) {
    return (
      <div className="flex items-start gap-3 mb-4">
        {message.sender?.avatar_url ? (
          <Image
            src={message.sender.avatar_url}
            alt={message.sender ? getFullName(message.sender) : 'Admin'}
            width={32}
            height={32}
            className="rounded-full"
          />
        ) : (
          <div className="size-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
            <span className="text-xs font-medium">A</span>
          </div>
        )}
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-medium">
              {message.sender ? getFullName(message.sender) : 'Admin'}
            </span>
            <Badge variant="outline" className="text-xs">
              Admin
            </Badge>
          </div>
          <div className="bg-muted rounded-lg p-3 border border-yellow-500/20">
            <p className="text-sm whitespace-pre-wrap">{message.content}</p>
            {message.attachments && message.attachments.length > 0 && (
              <div className="mt-2 space-y-2">
                {message.attachments.map((url, idx) => (
                  <Image
                    key={idx}
                    src={url}
                    alt={`Attachment ${idx + 1}`}
                    width={300}
                    height={200}
                    className="rounded-lg object-cover"
                  />
                ))}
              </div>
            )}
            <p className="text-xs text-muted-foreground mt-2">
              {formatRelativeTime(new Date(message.created_at))}
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div
      className={cn(
        'flex items-start gap-3 mb-4',
        isOwnMessage && 'flex-row-reverse'
      )}
    >
      {/* Avatar (only show for other person's messages) */}
      {!isOwnMessage && (
        <div className="flex-shrink-0">
          {message.sender?.avatar_url ? (
            <Image
              src={message.sender.avatar_url}
              alt={message.sender ? getFullName(message.sender) : 'User'}
              width={32}
              height={32}
              className="rounded-full"
            />
          ) : (
            <div className="size-8 rounded-full bg-muted flex items-center justify-center">
              <span className="text-xs font-medium">
                {message.sender ? getInitials(message.sender.first_name || '', message.sender.last_name || '') : 'U'}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Message Content */}
      <div
        className={cn(
          'flex-1 max-w-[70%]',
          isOwnMessage && 'flex flex-col items-end'
        )}
      >
        {!isOwnMessage && (
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-medium">
              {message.sender ? getFullName(message.sender) : 'Unknown User'}
            </span>
            {message.sender?.is_verified_teacher && (
              <Badge variant="outline" className="text-xs">
                ✓ Verified
              </Badge>
            )}
          </div>
        )}

        <div
          className={cn(
            'rounded-lg p-3',
            isOwnMessage
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted text-foreground'
          )}
        >
          <p className="text-sm whitespace-pre-wrap">{message.content}</p>

          {/* Attachments */}
          {message.attachments && message.attachments.length > 0 && (
            <div className="mt-2 space-y-2">
              {message.attachments.map((url, idx) => (
                <div key={idx} className="relative">
                  <Image
                    src={url}
                    alt={`Attachment ${idx + 1}`}
                    width={300}
                    height={200}
                    className="rounded-lg object-cover cursor-pointer"
                    onClick={() => window.open(url, '_blank')}
                  />
                  {message.attachments && message.attachments.length > 1 && (
                    <span className="absolute bottom-2 right-2 bg-black/50 text-white text-xs px-2 py-1 rounded">
                      {idx + 1} / {message.attachments.length}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}

          <div
            className={cn(
              'flex items-center gap-2 mt-2 text-xs',
              isOwnMessage ? 'text-primary-foreground/70' : 'text-muted-foreground'
            )}
          >
            <span>{formatRelativeTime(new Date(message.created_at))}</span>
            {isOwnMessage && (
              <span>
                {message.is_read ? '✓✓' : '✓'}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
