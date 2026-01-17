'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Bell, Mail } from 'lucide-react'
import { toast } from 'sonner'

interface NotificationSettingsContentProps {
  initialEmailNotifications: boolean
}

export function NotificationSettingsContent({
  initialEmailNotifications,
}: NotificationSettingsContentProps) {
  const [emailNotifications, setEmailNotifications] = useState(
    initialEmailNotifications
  )
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    setSaving(true)
    try {
      const response = await fetch('/api/settings/notifications', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email_notifications: emailNotifications,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to update preferences')
      }

      toast.success('Notification preferences updated successfully')
    } catch (error) {
      console.error('Error updating notification preferences:', error)
      toast.error('Failed to update preferences. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="bg-white border rounded-lg p-6 space-y-6">
      <div className="space-y-4">
        {/* Email Notifications */}
        <div className="flex items-center justify-between p-4 border rounded-lg">
          <div className="flex items-start gap-3">
            <Mail className="h-5 w-5 text-gray-600 mt-0.5" />
            <div>
              <Label htmlFor="email-notifications" className="text-base font-medium">
                Email notifications
              </Label>
              <p className="text-sm text-gray-600 mt-1">
                Turn on to receive notifications about sales, reviews, price drops,
                and platform updates via email.
              </p>
            </div>
          </div>
          <Checkbox
            checked={emailNotifications}
            onCheckedChange={(checked) => setEmailNotifications(checked === true)}
          />
        </div>

        {/* In-App Notifications */}
        <div className="flex items-center justify-between p-4 border rounded-lg bg-gray-50">
          <div className="flex items-start gap-3">
            <Bell className="h-5 w-5 text-gray-600 mt-0.5" />
            <div>
              <Label className="text-base font-medium">In-app notifications</Label>
              <p className="text-sm text-gray-600 mt-1">
                Always on (bell icon in header). You'll receive notifications for all
                events in your notification center.
              </p>
            </div>
          </div>
          <div className="text-sm text-gray-500">Always on</div>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving}>
          {saving ? 'Saving...' : 'Save Preferences'}
        </Button>
      </div>
    </div>
  )
}
