import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { UnsubscribeClient } from '@/components/unsubscribe/unsubscribe-client'
import { redirect } from 'next/navigation'

async function processUnsubscribe(token: string) {
  try {
    // Decode token (simple base64 for now, should use JWT in production)
    const decoded = Buffer.from(token, 'base64').toString('utf-8')
    const [userId, email] = decoded.split(':')

    if (!userId || !email) {
      return { success: false, error: 'Invalid token' }
    }

    const supabase = createAdminClient()

    // Verify user exists
    const { data: user } = await supabase
      .from('users')
      .select('id, email')
      .eq('id', userId)
      .eq('email', email)
      .single()

    if (!user) {
      return { success: false, error: 'User not found' }
    }

    // Disable all email preferences
    await supabase
      .from('user_email_preferences')
      .update({
        selling_notifications: false,
        buying_notifications: false,
        social_notifications: false,
        announcements: false,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId)

    // Also update legacy email_notifications field
    await supabase
      .from('users')
      .update({ email_notifications: false })
      .eq('id', userId)

    return { success: true }
  } catch (error) {
    console.error('Error processing unsubscribe:', error)
    return { success: false, error: 'Failed to process unsubscribe' }
  }
}

export default async function UnsubscribePage({
  searchParams,
}: {
  searchParams: { token?: string }
}) {
  if (!searchParams.token) {
    return (
      <div className="container mx-auto px-4 py-16 max-w-2xl">
        <Card className="p-8 text-center">
          <h1 className="text-2xl font-bold mb-4">Invalid Unsubscribe Link</h1>
          <p className="text-gray-600 mb-6">
            This unsubscribe link is invalid or has expired.
          </p>
          <Button asChild>
            <a href="/settings/notifications">Go to Email Preferences</a>
          </Button>
        </Card>
      </div>
    )
  }

  const result = await processUnsubscribe(searchParams.token)

  return (
    <div className="container mx-auto px-4 py-16 max-w-2xl">
      <UnsubscribeClient success={result.success} error={result.error} />
    </div>
  )
}
