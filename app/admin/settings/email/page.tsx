import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getAdminUser } from '@/lib/utils/admin-auth'
import { Card } from '@/components/ui/card'
import { EmailConfigurationClient } from '@/components/admin/email/email-configuration-client'

async function getEmailConfigurations() {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  const response = await fetch(`${baseUrl}/api/admin/email/configuration`, {
    cache: 'no-store',
  })
  if (!response.ok) {
    throw new Error('Failed to fetch email configurations')
  }
  return response.json()
}

export default async function EmailConfigurationPage() {
  const supabase = await createClient()
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser()

  if (!authUser) {
    redirect('/login?redirect=/admin/settings/email')
  }

  const adminUser = await getAdminUser(authUser.id)
  if (!adminUser) {
    redirect('/admin')
  }

  const { configurations } = await getEmailConfigurations()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Email Configuration</h1>
        <p className="text-gray-600 mt-1">
          Configure which emails are sent to users. Users can control categories, but you control individual types.
        </p>
      </div>

      <EmailConfigurationClient initialConfigurations={configurations} />
    </div>
  )
}
