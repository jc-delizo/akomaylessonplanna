'use client'

import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { X } from 'lucide-react'

interface ImageAttachmentPreviewProps {
  attachments: string[]
  onRemove: (index: number) => void
}

export function ImageAttachmentPreview({
  attachments,
  onRemove,
}: ImageAttachmentPreviewProps) {
  return (
    <div className="flex gap-2 flex-wrap">
      {attachments.map((url, index) => (
        <div key={index} className="relative group">
          <Image
            src={url}
            alt={`Attachment ${index + 1}`}
            width={100}
            height={100}
            className="rounded-lg object-cover"
          />
          <Button
            variant="destructive"
            size="icon"
            className="absolute -top-2 -right-2 size-6 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={() => onRemove(index)}
          >
            <X className="size-3" />
          </Button>
        </div>
      ))}
    </div>
  )
}
