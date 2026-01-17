'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'
import {
  Mail,
  ShoppingCart,
  Package,
  Users,
  Bell,
  CheckCircle2,
  XCircle,
  Clock,
} from 'lucide-react'

interface EmailConfiguration {
  id: string
  email_type: string
  is_enabled: boolean
  notes: string | null
  sent_today?: number
  last_sent?: string | null
  metadata?: {
    name: string
    category: string
    description: string
    isTransactional: boolean
  } | null
}

interface EmailConfigurationClientProps {
  initialConfigurations: EmailConfiguration[]
}

const categoryIcons = {
  transactional: Mail,
  selling: Package,
  buying: ShoppingCart,
  social: Users,
  announcements: Bell,
}

const categoryColors = {
  transactional: 'bg-blue-100 text-blue-800',
  selling: 'bg-green-100 text-green-800',
  buying: 'bg-purple-100 text-purple-800',
  social: 'bg-pink-100 text-pink-800',
  announcements: 'bg-orange-100 text-orange-800',
}

export function EmailConfigurationClient({
  initialConfigurations,
}: EmailConfigurationClientProps) {
  const [configurations, setConfigurations] = useState(initialConfigurations)
  const [loading, setLoading] = useState<Record<string, boolean>>({})

  const updateConfiguration = async (
    emailType: string,
    isEnabled: boolean
  ) => {
    setLoading((prev) => ({ ...prev, [emailType]: true }))

    try {
      const response = await fetch(
        `/api/admin/email/configuration/${emailType}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ is_enabled: isEnabled }),
        }
      )

      if (!response.ok) {
        throw new Error('Failed to update configuration')
      }

      setConfigurations((prev) =>
        prev.map((config) =>
          config.email_type === emailType
            ? { ...config, is_enabled: isEnabled }
            : config
        )
      )

      toast.success(
        `${emailType} ${isEnabled ? 'enabled' : 'disabled'} successfully`
      )
    } catch (error) {
      console.error('Error updating configuration:', error)
      toast.error('Failed to update configuration')
    } finally {
      setLoading((prev) => ({ ...prev, [emailType]: false }))
    }
  }

  const enableAll = async () => {
    const disabled = configurations.filter((c) => !c.is_enabled)
    for (const config of disabled) {
      await updateConfiguration(config.email_type, true)
    }
  }

  const disableAll = async () => {
    const enabled = configurations.filter((c) => c.is_enabled)
    for (const config of enabled) {
      await updateConfiguration(config.email_type, false)
    }
  }

  // Group by category
  const grouped = configurations.reduce((acc, config) => {
    const category = config.metadata?.category || 'other'
    if (!acc[category]) {
      acc[category] = []
    }
    acc[category].push(config)
    return acc
  }, {} as Record<string, EmailConfiguration[]>)

  const categories = [
    'transactional',
    'selling',
    'buying',
    'social',
    'announcements',
  ]

  return (
    <div className="space-y-6">
      {/* Quick Actions */}
      <Card className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-semibold">Quick Actions</h2>
            <p className="text-sm text-gray-600">
              Enable or disable all email types at once
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={enableAll}>
              Enable All
            </Button>
            <Button variant="outline" size="sm" onClick={disableAll}>
              Disable All
            </Button>
          </div>
        </div>
      </Card>

      {/* Email Types by Category */}
      {categories.map((category) => {
        const configs = grouped[category] || []
        if (configs.length === 0) return null

        const Icon = categoryIcons[category as keyof typeof categoryIcons]
        const categoryColor =
          categoryColors[category as keyof typeof categoryColors]

        return (
          <Card key={category} className="p-6">
            <div className="flex items-center gap-3 mb-4">
              {Icon && <Icon className="h-5 w-5" />}
              <h2 className="text-lg font-semibold capitalize">{category}</h2>
              <Badge className={categoryColor}>
                {configs.filter((c) => c.is_enabled).length} / {configs.length}{' '}
                enabled
              </Badge>
            </div>

            <div className="space-y-4">
              {configs.map((config) => (
                <div key={config.id}>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <Label
                          htmlFor={config.email_type}
                          className="font-medium cursor-pointer"
                        >
                          {config.metadata?.name || config.email_type}
                        </Label>
                        {config.metadata?.isTransactional && (
                          <Badge variant="outline" className="text-xs">
                            Required
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mt-1">
                        {config.metadata?.description || 'No description'}
                      </p>
                      <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                        {config.sent_today !== undefined && (
                          <span className="flex items-center gap-1">
                            <CheckCircle2 className="h-3 w-3" />
                            {config.sent_today} sent today
                          </span>
                        )}
                        {config.last_sent && (
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            Last: {new Date(config.last_sent).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                    <Switch
                      id={config.email_type}
                      checked={config.is_enabled}
                      onCheckedChange={(checked) =>
                        updateConfiguration(config.email_type, checked)
                      }
                      disabled={
                        loading[config.email_type] ||
                        config.metadata?.isTransactional
                      }
                    />
                  </div>
                  {config.metadata?.isTransactional && (
                    <p className="text-xs text-gray-500 mt-1 ml-0">
                      Transactional emails cannot be disabled
                    </p>
                  )}
                  {config.id !== configs[configs.length - 1].id && (
                    <Separator className="mt-4" />
                  )}
                </div>
              ))}
            </div>
          </Card>
        )
      })}
    </div>
  )
}
