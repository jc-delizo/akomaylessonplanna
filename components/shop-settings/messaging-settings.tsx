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
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { MessageSquare, Calendar, Sparkles } from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'

interface MessagingSettingsProps {
  initialData?: {
    away_message_enabled: boolean
    away_message_return_date?: string | null
    away_message_text?: string | null
  }
  subscriptionTier?: 'free' | 'pro' | 'pioneer'
}

export function MessagingSettings({
  initialData,
  subscriptionTier = 'free',
}: MessagingSettingsProps) {
  const [awayEnabled, setAwayEnabled] = useState(initialData?.away_message_enabled || false)
  const [returnDate, setReturnDate] = useState(
    initialData?.away_message_return_date
      ? new Date(initialData.away_message_return_date).toISOString().split('T')[0]
      : ''
  )
  const [awayMessage, setAwayMessage] = useState(
    initialData?.away_message_text || ''
  )
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (initialData) {
      setAwayEnabled(initialData.away_message_enabled || false)
      setReturnDate(
        initialData.away_message_return_date
          ? new Date(initialData.away_message_return_date).toISOString().split('T')[0]
          : ''
      )
      setAwayMessage(initialData.away_message_text || '')
    }
  }, [initialData])

  const defaultAwayMessage = `Hi! 👋

I'm currently away and will respond when I return.

Thank you for your patience! 💚`

  const handleSave = async () => {
    if (awayEnabled && !returnDate) {
      toast.error('Please set a return date when away message is enabled')
      return
    }

    try {
      setSaving(true)
      const response = await fetch('/api/seller/settings/messaging', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          away_message_enabled: awayEnabled,
          away_message_return_date: awayEnabled && returnDate ? returnDate : null,
          away_message_text: awayEnabled && awayMessage ? awayMessage.trim() : null,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to update messaging settings')
      }

      toast.success('Messaging settings updated successfully')
    } catch (error: any) {
      console.error('Error updating messaging settings:', error)
      toast.error(error.message || 'Failed to update messaging settings')
    } finally {
      setSaving(false)
    }
  }

  const isProOrPioneer = subscriptionTier === 'pro' || subscriptionTier === 'pioneer'

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-purple-100">
            <MessageSquare className="size-5 text-purple-600" />
          </div>
          <div>
            <CardTitle>Messaging Settings</CardTitle>
            <CardDescription>
              Configure your messaging preferences and auto-replies
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Away Message Toggle */}
        <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-start gap-3 flex-1">
              <MessageSquare className="size-5 text-gray-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <Label htmlFor="away-enabled" className="text-base font-medium cursor-pointer">
                  Away Message
                </Label>
                <p className="text-sm text-gray-600 mt-1">
                  Automatically reply to messages when you're away
                </p>
              </div>
            </div>
            <Switch
              id="away-enabled"
              checked={awayEnabled}
              onCheckedChange={setAwayEnabled}
            />
          </div>

          {awayEnabled && (
            <div className="mt-4 pt-4 border-t border-gray-300 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="return-date" className="flex items-center gap-2 text-sm font-medium">
                  <Calendar className="size-4" />
                  Return Date
                </Label>
                <Input
                  id="return-date"
                  type="date"
                  value={returnDate}
                  onChange={(e) => setReturnDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  className="h-10 bg-white"
                />
                <p className="text-xs text-gray-500">
                  When you'll be back and able to respond
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="away-message" className="text-sm font-medium">
                  Away Message
                  <span className="text-xs font-normal text-gray-500 ml-1">(Optional)</span>
                </Label>
                <Textarea
                  id="away-message"
                  value={awayMessage}
                  onChange={(e) => setAwayMessage(e.target.value)}
                  placeholder={defaultAwayMessage}
                  rows={6}
                  className="resize-none bg-white"
                />
                <p className="text-xs text-gray-500">
                  Custom message to send. If left empty, a default message will be used.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Quick Reply Templates (Pro/Pioneer) */}
        {isProOrPioneer && (
          <>
            <Separator />
            <div className="p-4 bg-gradient-to-r from-orange-50 to-purple-50 rounded-lg border border-orange-200">
              <div className="flex items-center justify-between">
                <div className="flex items-start gap-3 flex-1">
                  <Sparkles className="size-5 text-[#ff7200] mt-0.5 flex-shrink-0" />
                  <div>
                    <h3 className="text-sm font-semibold mb-1">Quick Reply Templates</h3>
                    <p className="text-xs text-gray-600">
                      Create custom templates for faster responses
                    </p>
                  </div>
                </div>
                <Button variant="outline" size="sm" asChild>
                  <Link href="/shop/messages/templates">Manage</Link>
                </Button>
              </div>
            </div>
          </>
        )}
      </CardContent>

      <CardFooter className="border-t bg-gray-50/50">
        <Button onClick={handleSave} disabled={saving} className="ml-auto">
          {saving ? 'Saving...' : 'Save Changes'}
        </Button>
      </CardFooter>
    </Card>
  )
}
