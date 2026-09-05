import Link from 'next/link'
import { createAdminClient } from '@/lib/supabase/admin'
import { hashDeletionConfirmationCode } from '@/lib/security/data-deletion'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export const dynamic = 'force-dynamic'

interface PageProps {
  searchParams: Promise<{ id?: string }>
}

export default async function DeletionStatusPage({ searchParams }: PageProps) {
  const { id = '' } = await searchParams
  const validCode = /^[a-f0-9]{32}$/i.test(id)
  const { data: request } = validCode
    ? await createAdminClient()
        .from('data_deletion_requests')
        .select('status, requested_at, completed_at')
        .eq('confirmation_code_hash', hashDeletionConfirmationCode(id))
        .maybeSingle()
    : { data: null }

  const title = request?.status === 'completed'
    ? 'Deletion completed'
    : request?.status === 'failed'
      ? 'Deletion needs review'
      : request?.status === 'processing'
        ? 'Deletion in progress'
        : 'Request not found'

  const description = request?.status === 'completed'
    ? 'The account data associated with this request has been deleted.'
    : request?.status === 'failed'
      ? 'We could not finish this request automatically. Please contact support and include your confirmation code.'
      : request?.status === 'processing'
        ? 'Your request has been received and is still being processed.'
        : 'Check that you opened the complete status link supplied with your deletion request.'

  return (
    <main className="mx-auto flex min-h-[70vh] max-w-xl items-center px-4 py-12">
      <Card className="w-full">
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          {validCode && request?.status === 'failed' && (
            <p className="break-all rounded-md bg-muted p-3">
              Confirmation code: <span className="font-mono">{id}</span>
            </p>
          )}
          {request?.requested_at && (
            <p className="text-muted-foreground">
              Requested: {new Date(request.requested_at).toLocaleString('en-PH')}
            </p>
          )}
          <Link className="font-medium text-primary hover:underline" href="/contact">
            Contact support
          </Link>
        </CardContent>
      </Card>
    </main>
  )
}
