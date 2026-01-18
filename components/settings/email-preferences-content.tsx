'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Card } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Mail, ShoppingCart, Package, Users, Bell, Info } from 'lucide-react'
import { toast } from 'sonner'

interface EmailPreferences {
  selling_notifications: boolean
  buying_notifications: boolean
  social_notifications: boolean
  announcements: boolean
}

interface EmailPreferencesContentProps {
  initialPreferences: EmailPreferences
}

export function EmailPreferencesContent({
  initialPreferences,
}: EmailPreferencesContentProps) {
  const [preferences, setPreferences] = useState(initialPreferences)
  const [saving, setSaving] = useState(false)

  const updatePreference = (key: keyof EmailPreferences, value: boolean) => {
    setPreferences((prev) => ({ ...prev, [key]: value }))
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const response = await fetch('/api/settings/email-preferences', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(preferences),
      })

      if (!response.ok) {
        throw new Error('Failed to update preferences')
      }

      toast.success('Email preferences updated successfully')
    } catch (error) {
      console.error('Error updating email preferences:', error)
      toast.error('Failed to update preferences. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Info Card */}
      <Card className="p-4 bg-blue-50 border-blue-200">
        <div className="flex items-start gap-3">
          <Info className="h-5 w-5 text-blue-600 mt-0.5" />
          <div className="text-sm text-blue-900">
            <p className="font-medium mb-1">About Email Preferences</p>
            <p>
              Transactional emails (order confirmations, password resets, payment notifications) are always sent and cannot be disabled. These are essential for account security and order processing.
            </p>
          </div>
        </div>
      </Card>

      {/* Category Preferences */}
      <Card className="p-6 space-y-6">
        <h2 className="text-lg font-semibold">Email Categories</h2>

        {/* Selling Notifications */}
        <div>
          <div className="flex items-center justify-between">
            <div className="flex items-start gap-3 flex-1">
              <Package className="h-5 w-5 text-gray-600 mt-0.5" />
              <div className="flex-1">
                <Label htmlFor="selling" className="text-base font-medium cursor-pointer">
                  Selling Notifications
                </Label>
                <p className="text-sm text-gray-600 mt-1">
                  Product approvals, rejections, new sales, new reviews, verification status
                </p>
              </div>
            </div>
            <Switch
              id="selling"
              checked={preferences.selling_notifications}
              onCheckedChange={(checked: boolean) =>
                updatePreference('selling_notifications', checked)
              }
            />
          </div>
        </div>

        <Separator />

        {/* Buying Notifications */}
        <div>
          <div className="flex items-center justify-between">
            <div className="flex items-start gap-3 flex-1">
              <ShoppingCart className="h-5 w-5 text-gray-600 mt-0.5" />
              <div className="flex-1">
                <Label htmlFor="buying" className="text-base font-medium cursor-pointer">
                  Buying Notifications
                </Label>
                <p className="text-sm text-gray-600 mt-1">
                  Cart reminders, review reminders, price drops, refund notifications
                </p>
              </div>
            </div>
            <Switch
              id="buying"
              checked={preferences.buying_notifications}
              onCheckedChange={(checked: boolean) =>
                updatePreference('buying_notifications', checked)
              }
            />
          </div>
        </div>

        <Separator />

        {/* Social Notifications */}
        <div>
          <div className="flex items-center justify-between">
            <div className="flex items-start gap-3 flex-1">
              <Users className="h-5 w-5 text-gray-600 mt-0.5" />
              <div className="flex-1">
                <Label htmlFor="social" className="text-base font-medium cursor-pointer">
                  Social Notifications
                </Label>
                <p className="text-sm text-gray-600 mt-1">
                  New followers, new products from followed sellers
                </p>
              </div>
            </div>
            <Switch
              id="social"
              checked={preferences.social_notifications}
              onCheckedChange={(checked: boolean) =>
                updatePreference('social_notifications', checked)
              }
            />
          </div>
        </div>

        <Separator />

        {/* Announcements */}
        <div>
          <div className="flex items-center justify-between">
            <div className="flex items-start gap-3 flex-1">
              <Bell className="h-5 w-5 text-gray-600 mt-0.5" />
              <div className="flex-1">
                <Label htmlFor="announcements" className="text-base font-medium cursor-pointer">
                  Platform Announcements
                </Label>
                <p className="text-sm text-gray-600 mt-1">
                  System updates, maintenance notices, policy changes, account status
                </p>
              </div>
            </div>
            <Switch
              id="announcements"
              checked={preferences.announcements}
              onCheckedChange={(checked: boolean) =>
                updatePreference('announcements', checked)
              }
            />
          </div>
        </div>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving}>
          {saving ? 'Saving...' : 'Save Preferences'}
        </Button>
      </div>
    </div>
  )
}
