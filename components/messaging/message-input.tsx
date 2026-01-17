'use client'

import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { QuickReplyChips } from './quick-reply-chips'
import { ImageAttachmentPreview } from './image-attachment-preview'
import { Paperclip, Send, X } from 'lucide-react'

interface MessageInputProps {
  onSend: (content: string, attachments?: string[]) => void
  conversationId: string
}

export function MessageInput({ onSend, conversationId }: MessageInputProps) {
  const [content, setContent] = useState('')
  const [attachments, setAttachments] = useState<string[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleSend = async () => {
    if (!content.trim() && attachments.length === 0) {
      return
    }

    if (content.length > 1000) {
      alert('Message exceeds 1000 characters')
      return
    }

    if (attachments.length > 3) {
      alert('Maximum 3 attachments allowed')
      return
    }

    await onSend(content.trim(), attachments.length > 0 ? attachments : undefined)
    setContent('')
    setAttachments([])
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    // Validate max 3 images
    if (attachments.length + files.length > 3) {
      alert('Maximum 3 images allowed')
      return
    }

    setIsUploading(true)

    try {
      const uploadPromises = Array.from(files).map(async (file) => {
        // Validate file type
        if (!file.type.startsWith('image/')) {
          throw new Error('Only images are allowed')
        }

        // Validate file size (5MB)
        if (file.size > 5 * 1024 * 1024) {
          throw new Error('File size exceeds 5MB')
        }

        // Upload file
        const formData = new FormData()
        formData.append('file', file)
        formData.append('conversationId', conversationId)

        const response = await fetch('/api/messages/upload', {
          method: 'POST',
          body: formData,
        })

        if (!response.ok) {
          throw new Error('Failed to upload image')
        }

        const data = await response.json()
        return data.url
      })

      const uploadedUrls = await Promise.all(uploadPromises)
      setAttachments((prev) => [...prev, ...uploadedUrls])
    } catch (error) {
      console.error('Error uploading images:', error)
      alert(error instanceof Error ? error.message : 'Failed to upload images')
    } finally {
      setIsUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleRemoveAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index))
  }

  const handleTemplateSelect = (templateContent: string) => {
    setContent(templateContent)
  }

  return (
    <div className="space-y-2">
      {/* Quick Reply Chips */}
      <QuickReplyChips onSelect={handleTemplateSelect} />

      {/* Image Attachments Preview */}
      {attachments.length > 0 && (
        <ImageAttachmentPreview
          attachments={attachments}
          onRemove={handleRemoveAttachment}
        />
      )}

      {/* Input Area */}
      <div className="flex items-end gap-2">
        {/* File Upload Button */}
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => fileInputRef.current?.click()}
          disabled={attachments.length >= 3 || isUploading}
          title="Attach image (max 3)"
        >
          <Paperclip className="size-4" />
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          onChange={handleFileSelect}
          className="hidden"
        />

        {/* Text Input */}
        <Textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type a message..."
          className="min-h-[60px] max-h-[200px] resize-none"
          rows={1}
        />

        {/* Send Button */}
        <Button
          onClick={handleSend}
          disabled={(!content.trim() && attachments.length === 0) || isUploading}
          size="icon"
        >
          <Send className="size-4" />
        </Button>
      </div>

      {/* Character count */}
      {content.length > 0 && (
        <p className="text-xs text-muted-foreground text-right">
          {content.length} / 1000
        </p>
      )}
    </div>
  )
}
