'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Share2, Facebook, MessageCircle, Link as LinkIcon } from 'lucide-react'
import { toast } from 'sonner'

interface ShareButtonsProps {
  productUrl: string
  productId: string
  platform?: 'product' | 'seller'
  productTitle?: string
  className?: string
}

export function ShareButtons({
  productUrl,
  productId,
  platform = 'product',
  productTitle,
  className,
}: ShareButtonsProps) {
  const [isSharing, setIsSharing] = useState<string | null>(null)

  const handleShare = async (sharePlatform: 'facebook' | 'messenger' | 'copy_link') => {
    if (typeof window === 'undefined') return

    setIsSharing(sharePlatform)

    try {
      // Track share
      const response = await fetch(`/api/products/${productId}/share`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ platform: sharePlatform }),
      })

      const data = await response.json()
      const shareUrl = data.share_url || productUrl

      if (sharePlatform === 'facebook') {
        // Open Facebook share dialog
        const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`
        window.open(facebookUrl, '_blank', 'width=600,height=400')
      } else if (sharePlatform === 'messenger') {
        // Try to open Messenger app, fallback to web
        const messengerUrl = `https://www.facebook.com/dialog/send?app_id=${process.env.NEXT_PUBLIC_FACEBOOK_APP_ID || ''}&link=${encodeURIComponent(shareUrl)}&redirect_uri=${encodeURIComponent(window.location.origin)}`
        window.open(messengerUrl, '_blank', 'width=600,height=400')
      } else if (sharePlatform === 'copy_link') {
        // Copy to clipboard
        await navigator.clipboard.writeText(shareUrl)
        toast.success('Link copied to clipboard!')
      }
    } catch (error) {
      console.error('Error sharing:', error)
      toast.error('Failed to share. Please try again.')
    } finally {
      setIsSharing(null)
    }
  }

  return (
    <div className={`flex items-center gap-2 ${className || ''}`}>
      <span className="text-sm text-muted-foreground hidden sm:inline">Share:</span>
      <div className="flex items-center gap-2">
        {/* Desktop: Icon buttons with tooltips */}
        <div className="hidden md:flex items-center gap-1">
          <Button
            variant="outline"
            size="icon"
            onClick={() => handleShare('facebook')}
            disabled={isSharing === 'facebook'}
            title="Share on Facebook"
            className="h-9 w-9"
          >
            <Facebook className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => handleShare('messenger')}
            disabled={isSharing === 'messenger'}
            title="Share on Messenger"
            className="h-9 w-9"
          >
            <MessageCircle className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => handleShare('copy_link')}
            disabled={isSharing === 'copy_link'}
            title="Copy link"
            className="h-9 w-9"
          >
            <LinkIcon className="h-4 w-4" />
          </Button>
        </div>

        {/* Mobile: Full-size buttons with labels */}
        <div className="flex md:hidden items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleShare('facebook')}
            disabled={isSharing === 'facebook'}
            className="flex-1 min-w-[100px]"
          >
            <Facebook className="h-4 w-4 mr-2" />
            Facebook
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleShare('messenger')}
            disabled={isSharing === 'messenger'}
            className="flex-1 min-w-[100px]"
          >
            <MessageCircle className="h-4 w-4 mr-2" />
            Messenger
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleShare('copy_link')}
            disabled={isSharing === 'copy_link'}
            className="flex-1 min-w-[100px]"
          >
            <LinkIcon className="h-4 w-4 mr-2" />
            Copy Link
          </Button>
        </div>
      </div>
    </div>
  )
}
