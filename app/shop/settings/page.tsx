'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Skeleton } from '@/components/ui/skeleton'
import { PaymentMethods } from '@/components/shop-settings/payment-methods'
import { MessagingSettings } from '@/components/shop-settings/messaging-settings'
import { SecuritySettings } from '@/components/shop-settings/security-settings'
import { EmailPreferencesContent } from '@/components/settings/email-preferences-content'
import {
  CreditCard,
  MessageSquare,
  Lock,
  Mail,
  Settings as SettingsIcon,
} from 'lucide-react'
import { useAuth } from '@/lib/hooks/useAuth'
import { cn } from '@/lib/utils'

interface SellerSettings {
  account: {
    name: string
    username: string
    avatar_url?: string | null
    bio?: string | null
  }
  payment_methods: {
    gcash_number?: string | null
    maya_number?: string | null
  }
  messaging: {
    away_message_enabled: boolean
    away_message_return_date?: string | null
    away_message_text?: string | null
  }
  shop: {
    shop_name?: string | null
    shop_description?: string | null
    auto_publish: boolean
  }
  subscription_tier?: 'free' | 'pro' | 'pioneer'
  email_preferences?: {
    selling_notifications: boolean
    buying_notifications: boolean
    social_notifications: boolean
    announcements: boolean
  }
}

export default function SettingsPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const [settings, setSettings] = useState<SellerSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('payment')

  // Load active tab from localStorage
  useEffect(() => {
    const savedTab = localStorage.getItem('shop-settings-active-tab')
    if (savedTab && savedTab !== 'account' && savedTab !== 'shop') {
      setActiveTab(savedTab)
    }
  }, [])

  // Save active tab to localStorage
  useEffect(() => {
    if (activeTab) {
      localStorage.setItem('shop-settings-active-tab', activeTab)
    }
  }, [activeTab])

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login?redirect=/shop/settings')
    }
  }, [user, authLoading, router])

  // Fetch settings
  useEffect(() => {
    if (!user) return

    const fetchSettings = async () => {
      try {
        setLoading(true)
        const [settingsResponse, emailResponse] = await Promise.all([
          fetch('/api/seller/settings'),
          fetch('/api/settings/email-preferences'),
        ])

        const settingsData = settingsResponse.ok ? await settingsResponse.json() : null
        const emailData = emailResponse.ok ? await emailResponse.json() : null

        setSettings({
          ...settingsData,
          email_preferences: emailData?.preferences || {
            selling_notifications: true,
            buying_notifications: true,
            social_notifications: true,
            announcements: true,
          },
        })
      } catch (error) {
        console.error('Error fetching settings:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchSettings()
  }, [user])

  const settingsTabs = [
    { id: 'payment', label: 'Payment', icon: CreditCard },
    { id: 'messaging', label: 'Messaging', icon: MessageSquare },
    { id: 'notifications', label: 'Notifications', icon: Mail },
    { id: 'security', label: 'Security', icon: Lock },
  ]

  if (authLoading || loading) {
    return (
      <div className="space-y-6">
        <div>
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-4 w-96" />
        </div>
        <div className="flex gap-6">
          {/* Sidebar skeleton */}
          <div className="hidden md:block w-64 space-y-2">
            {settingsTabs.map((tab) => (
              <Skeleton key={tab.id} className="h-10 w-full" />
            ))}
          </div>
          {/* Content skeleton */}
          <div className="flex-1 space-y-4">
            <Skeleton className="h-64 w-full" />
          </div>
        </div>
      </div>
    )
  }

  if (!user || !settings) {
    return null // Will redirect
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-gradient-to-br from-[#ff7200] to-[#e66500]">
          <SettingsIcon className="size-5 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
          <p className="text-sm text-gray-600 mt-0.5">
            Manage your shop settings and preferences
          </p>
        </div>
      </div>

      {/* Desktop: Vertical Sidebar + Content */}
      <div className="hidden md:flex gap-6">
        {/* Vertical Navigation Sidebar */}
        <aside className="w-64 flex-shrink-0">
          <nav className="space-y-1">
            {settingsTabs.map((tab) => {
              const Icon = tab.icon
              const isActive = activeTab === tab.id
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    'w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-gray-900 dark:bg-gray-800 text-white border-l-4 border-gray-900 dark:border-gray-700'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white'
                  )}
                >
                  <Icon className="size-5 flex-shrink-0" />
                  <span>{tab.label}</span>
                </button>
              )
            })}
          </nav>
        </aside>

        {/* Content Area */}
        <div className="flex-1 min-w-0">
          {activeTab === 'payment' && (
            <PaymentMethods initialData={settings.payment_methods} />
          )}
          {activeTab === 'messaging' && (
            <MessagingSettings
              initialData={settings.messaging}
              subscriptionTier={settings.subscription_tier}
            />
          )}
          {activeTab === 'notifications' && (
            <EmailPreferencesContent
              initialPreferences={
                settings.email_preferences || {
                  selling_notifications: true,
                  buying_notifications: true,
                  social_notifications: true,
                  announcements: true,
                }
              }
            />
          )}
          {activeTab === 'security' && <SecuritySettings />}
        </div>
      </div>

      {/* Mobile: Horizontal Tabs */}
      <div className="md:hidden">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-6">
            {settingsTabs.map((tab) => {
              const Icon = tab.icon
              return (
                <TabsTrigger
                  key={tab.id}
                  value={tab.id}
                  className="flex flex-col items-center gap-1 h-auto py-2"
                >
                  <Icon className="size-4" />
                  <span className="text-xs">{tab.label}</span>
                </TabsTrigger>
              )
            })}
          </TabsList>

          <TabsContent value="payment" className="mt-0">
            <PaymentMethods initialData={settings.payment_methods} />
          </TabsContent>

          <TabsContent value="messaging" className="mt-0">
            <MessagingSettings
              initialData={settings.messaging}
              subscriptionTier={settings.subscription_tier}
            />
          </TabsContent>

          <TabsContent value="notifications" className="mt-0">
            <EmailPreferencesContent
              initialPreferences={
                settings.email_preferences || {
                  selling_notifications: true,
                  buying_notifications: true,
                  social_notifications: true,
                  announcements: true,
                }
              }
            />
          </TabsContent>

          <TabsContent value="security" className="mt-0">
            <SecuritySettings />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
