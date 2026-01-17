'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Share2, Facebook, MessageCircle, Link as LinkIcon } from 'lucide-react'
import { toast } from 'sonner'

interface ShareDropdownProps {
  productUrl?: string
  productId: string
  productTitle?: string
}

export function ShareDropdown({
  productUrl,
  productId,
  productTitle,
}: ShareDropdownProps) {
  const [isSharing, setIsSharing] = useState<string | null>(null)
  const [url, setUrl] = useState<string>('')

  useEffect(() => {
    if (productUrl) {
      setUrl(productUrl)
    } else if (typeof window !== 'undefined') {
      setUrl(`${window.location.origin}/products/${productId}`)
    }
  }, [productUrl, productId])

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
      const shareUrl = data.share_url || url

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
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          disabled={isSharing !== null}
          className="h-10 w-10"
        >
          <Share2 className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem
          onClick={() => handleShare('messenger')}
          disabled={isSharing === 'messenger'}
        >
          <MessageCircle className="h-4 w-4 mr-2" />
          Messenger
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => handleShare('facebook')}
          disabled={isSharing === 'facebook'}
        >
          <Facebook className="h-4 w-4 mr-2" />
          Facebook
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => handleShare('copy_link')}
          disabled={isSharing === 'copy_link'}
        >
          <LinkIcon className="h-4 w-4 mr-2" />
          Copy Link
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
