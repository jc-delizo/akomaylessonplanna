import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getAdminUser } from '@/lib/utils/admin-auth'
import { EmailTemplateEditorClient } from '@/components/admin/email/template-editor-client'
import { EMAIL_TYPES } from '@/lib/emails/email-types'

async function getEmailTemplate(emailType: string) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  const response = await fetch(`${baseUrl}/api/admin/email/templates/${emailType}`, {
    cache: 'no-store',
  })
  if (!response.ok) {
    return null
  }
  return response.json()
}

async function getTemplateVersions(emailType: string) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  const response = await fetch(`${baseUrl}/api/admin/email/templates/${emailType}/versions`, {
    cache: 'no-store',
  })
  if (!response.ok) {
    return { versions: [] }
  }
  return response.json()
}

export default async function EmailTemplateEditorPage({
  params,
}: {
  params: { emailType: string }
}) {
  const supabase = await createClient()
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser()

  if (!authUser) {
    redirect(`/login?redirect=/admin/settings/email/templates/${params.emailType}`)
  }

  const adminUser = await getAdminUser(authUser.id)
  if (!adminUser) {
    redirect('/admin')
  }

  const templateData = await getEmailTemplate(params.emailType)
  const versionsData = await getTemplateVersions(params.emailType)

  const metadata = EMAIL_TYPES[params.emailType as keyof typeof EMAIL_TYPES]

  if (!templateData?.template) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Template Not Found</h1>
          <p className="text-gray-600 mt-1">
            Template for {params.emailType} does not exist yet.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">
          Edit Template: {metadata?.name || templateData.template.template_name}
        </h1>
        <p className="text-gray-600 mt-1">
          {metadata?.description || templateData.template.description || 'Email template editor'}
        </p>
      </div>

      <EmailTemplateEditorClient
        template={templateData.template}
        versions={versionsData.versions || []}
        emailType={params.emailType}
        metadata={metadata}
      />
    </div>
  )
}
