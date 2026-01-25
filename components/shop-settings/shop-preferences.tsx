'use client'

import { useState, useEffect } from 'react'
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { Store, FileText, Zap, Sparkles } from 'lucide-react'
import { toast } from 'sonner'

interface ShopPreferencesProps {
  initialData?: {
    shop_name?: string | null
    shop_description?: string | null
    auto_publish?: boolean
  }
}

export function ShopPreferences({ initialData }: ShopPreferencesProps) {
  const [shopName, setShopName] = useState(initialData?.shop_name || '')
  const [shopDescription, setShopDescription] = useState(
    initialData?.shop_description || ''
  )
  const [autoPublish, setAutoPublish] = useState(initialData?.auto_publish || false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (initialData) {
      setShopName(initialData.shop_name || '')
      setShopDescription(initialData.shop_description || '')
      setAutoPublish(initialData.auto_publish || false)
    }
  }, [initialData])

  const handleSave = async () => {
    if (shopName && shopName.length > 255) {
      toast.error('Shop name must be less than 255 characters')
      return
    }

    if (shopDescription && shopDescription.length > 2000) {
      toast.error('Shop description must be less than 2000 characters')
      return
    }

    try {
      setSaving(true)
      const response = await fetch('/api/seller/settings/shop', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shop_name: shopName.trim() || null,
          shop_description: shopDescription.trim() || null,
          auto_publish: autoPublish,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to update shop preferences')
      }

      toast.success('Shop preferences updated successfully')
    } catch (error: any) {
      console.error('Error updating shop preferences:', error)
      toast.error(error.message || 'Failed to update shop preferences')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-green-100">
            <Store className="size-5 text-green-600" />
          </div>
          <div>
            <CardTitle>Shop Preferences</CardTitle>
            <CardDescription>
              Configure your shop settings and product publishing preferences
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Shop Information */}
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="shop-name" className="flex items-center gap-2 text-base font-medium">
              <Store className="size-4" />
              Shop Name
            </Label>
            <Input
              id="shop-name"
              value={shopName}
              onChange={(e) => setShopName(e.target.value)}
              placeholder="My Teaching Resources"
              maxLength={255}
              className="h-10"
            />
            <p className="text-xs text-gray-500">
              Optional. A custom name for your shop
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="shop-description" className="flex items-center gap-2 text-base font-medium">
              <FileText className="size-4" />
              Shop Description
            </Label>
            <Textarea
              id="shop-description"
              value={shopDescription}
              onChange={(e) => setShopDescription(e.target.value)}
              placeholder="Tell buyers about your shop and what you offer..."
              rows={4}
              maxLength={2000}
              className="resize-none"
            />
            <div className="flex items-center justify-between">
              <p className="text-xs text-gray-500">
                Describe your shop to help buyers understand what you offer
              </p>
              <p className="text-xs text-gray-400">
                {shopDescription.length}/2000
              </p>
            </div>
          </div>
        </div>

        <Separator />

        {/* Auto-Publish Toggle */}
        <div className="p-4 bg-blue-50/50 rounded-lg border border-blue-100">
          <div className="flex items-center justify-between">
            <div className="flex items-start gap-3 flex-1">
              <Zap className="size-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <Label htmlFor="auto-publish" className="text-base font-medium cursor-pointer">
                  Auto-Publish Products
                </Label>
                <p className="text-sm text-gray-600 mt-1">
                  When enabled, new products will be published immediately without admin review.
                  When disabled, products require admin approval before being published.
                </p>
              </div>
            </div>
            <Switch
              id="auto-publish"
              checked={autoPublish}
              onCheckedChange={setAutoPublish}
            />
          </div>
        </div>
      </CardContent>

      <CardFooter className="border-t bg-gray-50/50">
        <Button onClick={handleSave} disabled={saving} className="ml-auto">
          {saving ? 'Saving...' : 'Save Changes'}
        </Button>
      </CardFooter>
    </Card>
  )
}
