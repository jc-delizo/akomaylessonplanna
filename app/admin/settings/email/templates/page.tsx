import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getAdminUser } from '@/lib/utils/admin-auth'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { Plus, Edit } from 'lucide-react'
import { EMAIL_TYPES } from '@/lib/emails/email-types'

async function getEmailTemplates() {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  const response = await fetch(`${baseUrl}/api/admin/email/templates`, {
    cache: 'no-store',
  })
  if (!response.ok) {
    throw new Error('Failed to fetch email templates')
  }
  return response.json()
}

export default async function EmailTemplatesPage() {
  const supabase = await createClient()
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser()

  if (!authUser) {
    redirect('/login?redirect=/admin/settings/email/templates')
  }

  const adminUser = await getAdminUser(authUser.id)
  if (!adminUser) {
    redirect('/admin')
  }

  const { templates } = await getEmailTemplates()

  // Group by category
  const grouped = (templates || []).reduce((acc: any, template: any) => {
    const category = template.category || 'other'
    if (!acc[category]) {
      acc[category] = []
    }
    acc[category].push(template)
    return acc
  }, {})

  const categories = ['transactional', 'selling', 'buying', 'social', 'announcements']

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Email Templates</h1>
          <p className="text-gray-600 mt-1">
            Manage email templates for all 26 email types
          </p>
        </div>
      </div>

      {categories.map((category) => {
        const categoryTemplates = grouped[category] || []
        if (categoryTemplates.length === 0) return null

        return (
          <Card key={category} className="p-6">
            <h2 className="text-lg font-semibold mb-4 capitalize">{category}</h2>
            <div className="space-y-2">
              {categoryTemplates.map((template: any) => {
                const metadata = EMAIL_TYPES[template.email_type as keyof typeof EMAIL_TYPES]
                return (
                  <div
                    key={template.id}
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50"
                  >
                    <div>
                      <div className="font-medium">
                        {metadata?.name || template.template_name}
                      </div>
                      <div className="text-sm text-gray-600">
                        {template.email_type}
                      </div>
                      {template.description && (
                        <div className="text-xs text-gray-500 mt-1">
                          {template.description}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500">
                        v{template.version}
                      </span>
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/admin/settings/email/templates/${template.email_type}`}>
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </Link>
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>
          </Card>
        )
      })}
    </div>
  )
}
