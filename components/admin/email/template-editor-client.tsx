'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'
import { Save, Eye, Mail, Clock, RotateCcw } from 'lucide-react'

interface EmailTemplate {
  id: string
  email_type: string
  template_name: string
  subject_line: string
  preheader: string | null
  body_html: string
  body_text: string | null
  cta_enabled: boolean
  cta_text: string | null
  cta_link_template: string | null
  version: number
  required_variables: string[]
  optional_variables: string[]
}

interface TemplateVersion {
  id: string
  version: number
  subject_line: string
  body_html: string
  created_at: string
  created_by: {
    id: string
    name: string
    email: string
  } | null
}

interface EmailTemplateEditorClientProps {
  template: EmailTemplate
  versions: TemplateVersion[]
  emailType: string
  metadata?: {
    name: string
    category: string
    description: string
    isTransactional: boolean
    required_variables?: string[]
    optional_variables?: string[]
  } | null
}

export function EmailTemplateEditorClient({
  template,
  versions,
  emailType,
  metadata,
}: EmailTemplateEditorClientProps) {
  const [subjectLine, setSubjectLine] = useState(template.subject_line)
  const [preheader, setPreheader] = useState(template.preheader || '')
  const [bodyHtml, setBodyHtml] = useState(template.body_html)
  const [ctaEnabled, setCtaEnabled] = useState(template.cta_enabled)
  const [ctaText, setCtaText] = useState(template.cta_text || '')
  const [loading, setLoading] = useState(false)
  const [showPreview, setShowPreview] = useState(false)

  const availableVariables = [
    'user_name',
    'user_email',
    'user_username',
    'platform_name',
    'platform_url',
    'current_date',
    'current_year',
    'order_id',
    'order_total',
    'product_title',
    'product_url',
    'download_link',
  ]

  const insertVariable = (variable: string) => {
    const cursorPos = (document.activeElement as HTMLTextAreaElement)?.selectionStart || bodyHtml.length
    const newBody = bodyHtml.slice(0, cursorPos) + `{{${variable}}}` + bodyHtml.slice(cursorPos)
    setBodyHtml(newBody)
  }

  const handleSave = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/admin/email/templates/${emailType}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject_line: subjectLine,
          preheader: preheader || null,
          body_html: bodyHtml,
          cta_enabled: ctaEnabled,
          cta_text: ctaText || null,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to save template')
      }

      toast.success('Template saved successfully')
    } catch (error) {
      console.error('Error saving template:', error)
      toast.error('Failed to save template')
    } finally {
      setLoading(false)
    }
  }

  const handleTest = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/admin/email/templates/${emailType}/test`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      })

      if (!response.ok) {
        throw new Error('Failed to send test email')
      }

      toast.success('Test email sent!')
    } catch (error) {
      console.error('Error sending test email:', error)
      toast.error('Failed to send test email')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Subject Line */}
      <Card className="p-6">
        <Label htmlFor="subject" className="text-base font-semibold">
          Subject Line
        </Label>
        <Input
          id="subject"
          value={subjectLine}
          onChange={(e) => setSubjectLine(e.target.value)}
          className="mt-2"
          placeholder="Email subject line..."
        />
        <p className="text-xs text-gray-500 mt-1">
          Use variables like {`{{user_name}}`} for personalization
        </p>
      </Card>

      {/* Preheader */}
      <Card className="p-6">
        <Label htmlFor="preheader" className="text-base font-semibold">
          Preheader Text (Optional)
        </Label>
        <Input
          id="preheader"
          value={preheader}
          onChange={(e) => setPreheader(e.target.value)}
          className="mt-2"
          placeholder="Preview text shown in email clients..."
        />
        <p className="text-xs text-gray-500 mt-1">
          Short preview text shown next to subject line
        </p>
      </Card>

      {/* Email Body */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <Label htmlFor="body" className="text-base font-semibold">
            Email Body (HTML)
          </Label>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowPreview(!showPreview)}
            >
              <Eye className="h-4 w-4 mr-2" />
              {showPreview ? 'Edit' : 'Preview'}
            </Button>
          </div>
        </div>

        {showPreview ? (
          <div
            className="border rounded-lg p-4 bg-white min-h-[400px]"
            dangerouslySetInnerHTML={{ __html: bodyHtml }}
          />
        ) : (
          <>
            <div className="mb-2 flex flex-wrap gap-2">
              <span className="text-xs text-gray-600">Insert variable:</span>
              {availableVariables.map((variable) => (
                <Badge
                  key={variable}
                  variant="outline"
                  className="cursor-pointer hover:bg-gray-100"
                  onClick={() => insertVariable(variable)}
                >
                  {`{{${variable}}}`}
                </Badge>
              ))}
            </div>
            <Textarea
              id="body"
              value={bodyHtml}
              onChange={(e) => setBodyHtml(e.target.value)}
              className="mt-2 font-mono text-sm"
              rows={20}
              placeholder="Enter HTML email body..."
            />
            <p className="text-xs text-gray-500 mt-1">
              Use HTML for formatting. Variables will be replaced when sending.
            </p>
          </>
        )}
      </Card>

      {/* CTA Settings */}
      <Card className="p-6">
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="cta_enabled"
              checked={ctaEnabled}
              onChange={(e) => setCtaEnabled(e.target.checked)}
              className="h-4 w-4"
            />
            <Label htmlFor="cta_enabled" className="text-base font-semibold">
              Enable Call-to-Action Button
            </Label>
          </div>
          {ctaEnabled && (
            <div>
              <Label htmlFor="cta_text">Button Text</Label>
              <Input
                id="cta_text"
                value={ctaText}
                onChange={(e) => setCtaText(e.target.value)}
                className="mt-2"
                placeholder="Download Now"
              />
            </div>
          )}
        </div>
      </Card>

      {/* Version History */}
      {versions.length > 0 && (
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold">Version History</h3>
            <Badge>Current: v{template.version}</Badge>
          </div>
          <div className="space-y-2">
            {versions.slice(0, 5).map((version) => (
              <div
                key={version.id}
                className="flex items-center justify-between p-3 border rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <Clock className="h-4 w-4 text-gray-400" />
                  <div>
                    <div className="font-medium">Version {version.version}</div>
                    <div className="text-xs text-gray-500">
                      {new Date(version.created_at).toLocaleDateString()}
                      {version.created_by && ` by ${version.created_by.name}`}
                    </div>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={async () => {
                    try {
                      const response = await fetch(
                        `/api/admin/email/templates/${emailType}/revert`,
                        {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ version: version.version }),
                        }
                      )
                      if (response.ok) {
                        toast.success(`Reverted to version ${version.version}`)
                        window.location.reload()
                      }
                    } catch (error) {
                      toast.error('Failed to revert version')
                    }
                  }}
                >
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Revert
                </Button>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Actions */}
      <div className="flex items-center justify-end gap-4">
        <Button variant="outline" onClick={handleTest} disabled={loading}>
          <Mail className="h-4 w-4 mr-2" />
          Send Test Email
        </Button>
        <Button onClick={handleSave} disabled={loading}>
          <Save className="h-4 w-4 mr-2" />
          Save Changes
        </Button>
      </div>
    </div>
  )
}
