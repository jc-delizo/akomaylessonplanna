'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Check, X, Eye, Download, Loader2 } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/registry/default/dialog/dialog'

export type PendingProduct = {
  id: string
  title: string
  description?: string | null
  cover_image_url?: string | null
  product_type?: string
  price?: number
  file_urls?: string[] | null
  created_at: string
  hoursSinceSubmission: number
  priority: 'low' | 'medium' | 'high'
  productNumber: number
  submissionCount: number
  seller?: {
    id: string
    first_name?: string | null
    last_name?: string | null
    avatar_url?: string | null
  } | null
  grade?: { id: string; name: string } | null
  subject?: { id: string; name: string } | null
}

function getTimeAgo(hours: number) {
  if (hours < 24) return `${Math.floor(hours)}h`
  return `${Math.floor(hours / 24)}d`
}

interface PendingProductCardProps {
  product: PendingProduct
}

export function PendingProductCard({ product }: PendingProductCardProps) {
  const router = useRouter()
  const [rejectOpen, setRejectOpen] = useState(false)
  const [downloadModalOpen, setDownloadModalOpen] = useState(false)
  const [rejectReason, setRejectReason] = useState('')
  const [actionLoading, setActionLoading] = useState<'approve' | 'reject' | null>(null)
  const [error, setError] = useState<string | null>(null)

  const seller = product.seller
  const timeAgo = getTimeAgo(product.hoursSinceSubmission)
  const fileUrls = product.file_urls ?? []

  /** Same as product edit page: path last segment, strip leading timestamp, decode */
  function getFileNameFromUrl(url: string): string {
    try {
      const path = new URL(url).pathname
      const segment = path.split('/').filter(Boolean).pop() || ''
      const withoutTimestamp = segment.replace(/^\d+-/, '')
      return decodeURIComponent(withoutTimestamp || segment) || url
    } catch {
      return url
    }
  }

  const handleApprove = async () => {
    setActionLoading('approve')
    setError(null)
    try {
      const res = await fetch(`/api/admin/products/${product.id}/approve`, { method: 'POST' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to approve')
      router.refresh()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to approve')
    } finally {
      setActionLoading(null)
    }
  }

  const handleReject = async () => {
    const reason = rejectReason.trim()
    if (!reason) {
      setError('Please provide a reason for rejection.')
      return
    }
    setActionLoading('reject')
    setError(null)
    try {
      const res = await fetch(`/api/admin/products/${product.id}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason, allow_resubmission: true }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to reject')
      setRejectOpen(false)
      setRejectReason('')
      router.refresh()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to reject')
    } finally {
      setActionLoading(null)
    }
  }

  return (
    <>
      <Card className="overflow-hidden border border-border/60 bg-card shadow-sm transition-shadow hover:shadow-md">
        <div className="flex flex-col sm:flex-row">
          {/* Cover */}
          <div className="relative h-40 w-full shrink-0 bg-muted sm:h-auto sm:w-36">
            {product.cover_image_url ? (
              <Image
                src={product.cover_image_url}
                alt={product.title}
                fill
                className="object-cover"
                sizes="144px"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-muted-foreground text-sm">
                No image
              </div>
            )}
          </div>

          {/* Content */}
          <div className="flex flex-1 flex-col p-4 sm:p-5">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <h3 className="font-semibold text-foreground truncate pr-2">{product.title}</h3>
                <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                  <Badge variant="secondary" className="text-xs font-normal">
                    {product.product_type?.replace('_', ' ') ?? '—'}
                  </Badge>
                  {product.priority === 'high' && (
                    <Badge className="bg-destructive/10 text-destructive text-xs">Over 48h</Badge>
                  )}
                  {product.priority === 'medium' && (
                    <Badge className="bg-amber-500/10 text-amber-700 dark:text-amber-400 text-xs">
                      Over 24h
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            {/* Seller */}
            <div className="mt-3 flex items-center gap-2">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium text-muted-foreground">
                {seller?.avatar_url ? (
                  <img
                    src={seller.avatar_url}
                    alt=""
                    className="h-8 w-8 rounded-full object-cover"
                  />
                ) : (
                  (seller?.first_name?.[0] ?? '?').toUpperCase()
                )}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-foreground truncate">
                  {seller ? `${seller.first_name ?? ''} ${seller.last_name ?? ''}`.trim() || 'Seller' : 'Seller'}
                </p>
                <p className="text-xs text-muted-foreground">
                  #{product.productNumber} of 3 • {product.submissionCount} submission • {timeAgo} ago
                </p>
              </div>
            </div>

            {/* Meta */}
            <div className="mt-3 flex flex-wrap gap-x-4 gap-y-0 text-xs text-muted-foreground">
              <span>{product.grade?.name ?? 'N/A'}</span>
              <span>{product.subject?.name ?? 'N/A'}</span>
              <span>₱{product.price?.toFixed(2) ?? '—'}</span>
            </div>

            {product.description && (
              <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
                {product.description}
              </p>
            )}

            {error && (
              <p className="mt-2 text-sm text-destructive" role="alert">
                {error}
              </p>
            )}

            {/* Actions */}
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <Button variant="outline" size="sm" asChild>
                <Link href={`/products/${product.id}`} target="_blank" rel="noopener noreferrer">
                  <Eye className="h-4 w-4 mr-1.5" />
                  Preview
                </Link>
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={fileUrls.length === 0}
                title={fileUrls.length === 0 ? 'No file to download' : 'Download files'}
                aria-label="Download files"
                onClick={() => setDownloadModalOpen(true)}
              >
                <Download className="h-4 w-4 mr-1.5" />
                Download
              </Button>
              <Button
                size="sm"
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
                onClick={handleApprove}
                disabled={!!actionLoading}
              >
                {actionLoading === 'approve' ? (
                  <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                ) : (
                  <Check className="h-4 w-4 mr-1.5" />
                )}
                Approve
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="border-destructive/40 text-destructive hover:bg-destructive/10"
                onClick={() => setRejectOpen(true)}
                disabled={!!actionLoading}
              >
                <X className="h-4 w-4 mr-1.5" />
                Reject
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {/* Download files modal */}
      <Dialog open={downloadModalOpen} onOpenChange={setDownloadModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Download files</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Choose a file to download for review.
          </p>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {fileUrls.map((url, index) => (
              <a
                key={index}
                href={`/api/admin/products/${product.id}/download-preview?index=${index}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 rounded-md border border-border bg-muted/30 px-3 py-2 text-sm hover:bg-muted/60 transition-colors"
              >
                <Download className="h-4 w-4 shrink-0 text-muted-foreground" />
                <span className="truncate flex-1">{getFileNameFromUrl(url)}</span>
              </a>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDownloadModalOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject dialog */}
      <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Reject product</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Provide a reason for rejection. The seller will receive this feedback.
          </p>
          <div className="space-y-2">
            <Label htmlFor="reject-reason">Reason (required)</Label>
            <Textarea
              id="reject-reason"
              placeholder="e.g. Image quality too low, missing required fields…"
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              rows={3}
              className="resize-none"
            />
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setRejectOpen(false)} disabled={!!actionLoading}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={!rejectReason.trim() || actionLoading === 'reject'}
            >
              {actionLoading === 'reject' ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : null}
              Reject product
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
