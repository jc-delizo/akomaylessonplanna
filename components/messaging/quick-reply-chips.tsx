'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { replaceTemplateVariables } from '@/lib/messaging/template-helpers'

interface QuickReplyChipsProps {
  onSelect: (content: string) => void
  buyerName?: string
  productTitle?: string
  sellerName?: string
}

interface Template {
  id: string
  name: string
  content: string
  template_type: 'system' | 'custom'
}

export function QuickReplyChips({
  onSelect,
  buyerName,
  productTitle,
  sellerName,
}: QuickReplyChipsProps) {
  const [templates, setTemplates] = useState<Template[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchTemplates()
  }, [])

  const fetchTemplates = async () => {
    try {
      const response = await fetch('/api/messages/templates')
      if (!response.ok) throw new Error('Failed to fetch templates')
      const data = await response.json()
      setTemplates(data.templates || [])
    } catch (error) {
      console.error('Error fetching templates:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleTemplateClick = (template: Template) => {
    // Replace template variables
    const content = replaceTemplateVariables(template.content, {
      buyerName,
      productTitle,
      sellerName,
    })

    onSelect(content)

    // Increment usage count (for custom templates)
    if (template.template_type === 'custom') {
      fetch(`/api/messages/templates/${template.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          usage_count: (template as any).usage_count + 1,
        }),
      }).catch(console.error)
    }
  }

  if (loading || templates.length === 0) {
    return null
  }

  // Show only first 5 templates (system templates)
  const displayTemplates = templates.slice(0, 5)

  return (
    <div className="flex flex-wrap gap-2">
      {displayTemplates.map((template) => (
        <Button
          key={template.id}
          variant="outline"
          size="sm"
          onClick={() => handleTemplateClick(template)}
          className="text-xs"
        >
          {template.name}
        </Button>
      ))}
    </div>
  )
}
