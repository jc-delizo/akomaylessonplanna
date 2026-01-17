'use client'

import { useRouter } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Image from 'next/image'
import { ExternalLink } from 'lucide-react'

interface ProductContextCardProps {
  product: {
    id: string
    title: string
    price: number
    cover_image_url?: string
    slug?: string
  }
}

export function ProductContextCard({ product }: ProductContextCardProps) {
  const router = useRouter()

  return (
    <Card className="p-3">
      <div className="flex items-center gap-3">
        {product.cover_image_url && (
          <Image
            src={product.cover_image_url}
            alt={product.title}
            width={60}
            height={60}
            className="rounded object-cover flex-shrink-0"
          />
        )}
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-sm truncate mb-1">{product.title}</h3>
          <p className="text-sm font-semibold text-primary mb-2">
            ₱{product.price.toFixed(2)}
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push(`/products/${product.id}`)}
            className="w-full"
          >
            <ExternalLink className="size-3 mr-2" />
            View Product
          </Button>
        </div>
      </div>
    </Card>
  )
}
