'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import Image from 'next/image'
import { ArrowLeft, MoreVertical, ShieldAlert } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface ConversationHeaderProps {
  conversation: {
    id: string
    buyer_id: string
    seller_id: string
    product?: {
      id: string
      title: string
      price: number
      cover_image_url?: string
    }
    buyer?: {
      id: string
      name: string
      username: string
      avatar_url?: string
      is_verified_teacher?: boolean
    }
    seller?: {
      id: string
      name: string
      username: string
      avatar_url?: string
      is_verified_teacher?: boolean
    }
    status: string
  }
  onBack?: () => void
  currentUserId?: string
}

export function ConversationHeader({
  conversation,
  onBack,
  currentUserId: propCurrentUserId,
}: ConversationHeaderProps) {
  const router = useRouter()
  const [isBlocking, setIsBlocking] = useState(false)
  const [currentUserId, setCurrentUserId] = useState<string | null>(
    propCurrentUserId || null
  )

  // Get current user ID if not provided
  useEffect(() => {
    if (!propCurrentUserId) {
      const getCurrentUser = async () => {
        const { createClient } = await import('@/lib/supabase/client')
        const supabase = createClient()
        const {
          data: { user },
        } = await supabase.auth.getUser()
        if (user) {
          setCurrentUserId(user.id)
        }
      }
      getCurrentUser()
    }
  }, [propCurrentUserId])

  // Determine other party
  const otherParty =
    conversation.buyer_id === currentUserId
      ? conversation.seller
      : conversation.buyer

  const handleArchive = async () => {
    try {
      await fetch(`/api/messages/conversations/${conversation.id}/archive`, {
        method: 'PUT',
      })
      router.refresh()
    } catch (error) {
      console.error('Error archiving conversation:', error)
    }
  }

  const handleBlock = async () => {
    if (!confirm('Are you sure you want to block this user? You won\'t receive messages from them.')) {
      return
    }

    setIsBlocking(true)
    try {
      await fetch(`/api/messages/conversations/${conversation.id}/block`, {
        method: 'POST',
      })
      router.refresh()
    } catch (error) {
      console.error('Error blocking user:', error)
    } finally {
      setIsBlocking(false)
    }
  }

  const handleReport = () => {
    router.push(`/messages/report?conversationId=${conversation.id}`)
  }

  return (
    <div className="flex items-center justify-between p-4 border-b">
      <div className="flex items-center gap-3 flex-1 min-w-0">
        {/* Back button (mobile) */}
        {onBack && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onBack}
            className="md:hidden"
          >
            <ArrowLeft className="size-4" />
          </Button>
        )}

        {/* Avatar */}
        {otherParty?.avatar_url ? (
          <Image
            src={otherParty.avatar_url}
            alt={otherParty.name || 'User'}
            width={40}
            height={40}
            className="rounded-full flex-shrink-0"
          />
        ) : (
          <div className="size-10 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
            <span className="text-sm font-medium">
              {otherParty?.name?.[0]?.toUpperCase() || 'U'}
            </span>
          </div>
        )}

        {/* Name and info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h2 className="font-medium text-sm truncate">
              {otherParty?.name || 'Unknown User'}
            </h2>
            {otherParty?.is_verified_teacher && (
              <Badge variant="outline" className="text-xs">
                ✓ Verified
              </Badge>
            )}
          </div>
          {conversation.seller && (
            <p className="text-xs text-muted-foreground truncate">
              {conversation.seller.name || 'Seller'}
            </p>
          )}
        </div>
      </div>

      {/* Actions */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon">
            <MoreVertical className="size-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={handleArchive}>
            Archive Conversation
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleReport} className="text-destructive">
            <ShieldAlert className="size-4 mr-2" />
            Report User
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={handleBlock}
            disabled={isBlocking}
            className="text-destructive"
          >
            Block User
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
