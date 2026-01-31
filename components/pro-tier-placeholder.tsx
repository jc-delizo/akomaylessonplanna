'use client'

import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Sparkles } from 'lucide-react'

interface ProTierPlaceholderProps {
  /** Section title, e.g. "Pro Feature" or "Pro only" */
  title: string
  /** One-line benefit description */
  description: string
  /** CTA button label, e.g. "Unlock with Pro" */
  ctaLabel: string
  /** CTA link (default: /shop/upgrade) */
  ctaHref?: string
  /** Optional className for the card */
  className?: string
}

export function ProTierPlaceholder({
  title,
  description,
  ctaLabel,
  ctaHref = '/shop/upgrade',
  className,
}: ProTierPlaceholderProps) {
  return (
    <Card className={`border-dashed border-2 border-[#ff7200]/40 bg-muted/30 ${className ?? ''}`}>
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-[#ff7200]/10">
            <Sparkles className="h-5 w-5 text-[#ff7200]" />
          </div>
          <CardTitle className="text-base">{title}</CardTitle>
        </div>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <Link href={ctaHref}>
          <Button className="bg-[#ff7200] hover:bg-[#e66800]">{ctaLabel}</Button>
        </Link>
      </CardContent>
    </Card>
  )
}
