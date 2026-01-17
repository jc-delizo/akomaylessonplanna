import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { EmailPreferencesContent } from '@/components/settings/email-preferences-content'

async function getEmailPreferences(userId: string) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  const response = await fetch(`${baseUrl}/api/settings/email-preferences`, {
    cache: 'no-store',
  })
  if (!response.ok) {
    return {
      selling_notifications: true,
      buying_notifications: true,
      social_notifications: true,
      announcements: true,
    }
  }
  const data = await response.json()
  return data.preferences
}

export default async function NotificationSettingsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const preferences = await getEmailPreferences(user.id)

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Email Preferences</h1>
        <p className="text-gray-600 mt-2">
          Control which emails you receive. Transactional emails (order confirmations, password resets) cannot be disabled.
        </p>
      </div>

      <EmailPreferencesContent initialPreferences={preferences} />
    </div>
  )
}
