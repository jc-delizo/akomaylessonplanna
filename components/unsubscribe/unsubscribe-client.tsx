'use client'

import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CheckCircle2, XCircle } from 'lucide-react'
import Link from 'next/link'

interface UnsubscribeClientProps {
  success: boolean
  error?: string
}

export function UnsubscribeClient({ success, error }: UnsubscribeClientProps) {
  if (success) {
    return (
      <Card className="p-8 text-center">
        <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto mb-4" />
        <h1 className="text-2xl font-bold mb-4">Successfully Unsubscribed</h1>
        <p className="text-gray-600 mb-6">
          You have been unsubscribed from all non-transactional emails. You will still receive essential emails like order confirmations and password resets.
        </p>
        <div className="flex gap-4 justify-center">
          <Button variant="outline" asChild>
            <Link href="/">Go to Homepage</Link>
          </Button>
          <Button asChild>
            <Link href="/settings/notifications">Manage Email Preferences</Link>
          </Button>
        </div>
      </Card>
    )
  }

  return (
    <Card className="p-8 text-center">
      <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
      <h1 className="text-2xl font-bold mb-4">Unsubscribe Failed</h1>
      <p className="text-gray-600 mb-6">
        {error || 'There was an error processing your unsubscribe request. The link may be invalid or expired.'}
      </p>
      <div className="flex gap-4 justify-center">
        <Button variant="outline" asChild>
          <Link href="/">Go to Homepage</Link>
        </Button>
        <Button asChild>
          <Link href="/settings/notifications">Manage Email Preferences</Link>
        </Button>
      </div>
    </Card>
  )
}
