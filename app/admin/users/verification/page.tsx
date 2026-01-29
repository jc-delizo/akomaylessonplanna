import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getAdminUser } from '@/lib/utils/admin-auth'
import { getVerificationQueueData } from '@/lib/utils/admin-verification-queue'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Clock } from 'lucide-react'
import { VerificationDocumentLink } from '@/components/admin/verification-document-link'
import { VerificationActions } from '@/components/admin/verification-actions'
import { PrcVerificationInfo } from '@/components/admin/prc-verification-info'
import { getFullName, getInitials } from '@/lib/utils/profile'

export default async function VerificationQueuePage() {
  const supabase = await createClient()
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser()

  if (!authUser) {
    redirect('/login?redirect=/admin/users/verification')
  }

  const adminUser = await getAdminUser(authUser.id)
  if (!adminUser) {
    redirect('/')
  }

  const { verifications } = await getVerificationQueueData(supabase)

  const getTimeAgo = (date: string) => {
    const now = new Date()
    // Fix: Ensure database timestamps (without timezone) are treated as UTC
    // PostgreSQL returns timestamps like "2026-01-17T15:28:46.242062" without 'Z'
    // JavaScript Date() interprets these as local time, causing timezone issues
    const dateStr = date.includes('Z') || date.includes('+') || date.includes('-', 10) 
      ? date 
      : date + 'Z' // Append 'Z' to treat as UTC if no timezone indicator
    const then = new Date(dateStr)
    const diffMs = now.getTime() - then.getTime()
    const diffHours = Math.floor(diffMs / 3600000)
    const diffMinutes = Math.floor((diffMs % 3600000) / 60000)
    const diffDays = Math.floor(diffMs / 86400000)
    
    if (diffMs < 0) {
      // Negative difference means future date - shouldn't happen, but handle gracefully
      return 'Just now'
    }
    
    if (diffMinutes < 1) return 'Just now'
    if (diffMinutes < 60) return `${diffMinutes}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    return then.toLocaleDateString()
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold">Verification Queue</h1>
          <PrcVerificationInfo />
        </div>
        <p className="text-gray-600 mt-1">Review teacher ID verifications (oldest first)</p>
      </div>

      {/* Verification Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {verifications?.length === 0 ? (
          <Card className="p-12 text-center col-span-full">
            <div className="flex flex-col items-center justify-center">
              <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                <Clock className="h-8 w-8 text-gray-400" />
              </div>
              <p className="text-gray-600 font-medium text-lg mb-1">No pending verifications</p>
              <p className="text-gray-500 text-sm">All verification requests have been processed</p>
            </div>
          </Card>
        ) : (
          verifications?.map((verification: any) => {
            const user = verification.user
            // Fix: Ensure database timestamps are treated as UTC for time calculations
            const createdAtStr = verification.created_at.includes('Z') || verification.created_at.includes('+') || verification.created_at.includes('-', 10)
              ? verification.created_at
              : verification.created_at + 'Z'
            const createdAtDate = new Date(createdAtStr)
            const submittedTime = getTimeAgo(verification.created_at)
            const isOver24Hours = new Date().getTime() - createdAtDate.getTime() > 24 * 3600000
            const isOver48Hours = new Date().getTime() - createdAtDate.getTime() > 48 * 3600000

            return (
              <Card key={verification.id} className="p-6">
                {/* Header Section: User Info + Priority Badge */}
                <div className="flex items-start justify-between mb-5">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center shrink-0">
                      {user?.avatar_url ? (
                        <img src={user.avatar_url} alt={getFullName(user)} className="w-12 h-12 rounded-full" />
                      ) : (
                        <span className="text-lg font-medium">{getInitials(user?.first_name || '', user?.last_name || '')}</span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-base truncate">{getFullName(user)}</p>
                      <p className="text-sm text-gray-500 truncate">{user?.email}</p>
                    </div>
                  </div>
                  <div className="shrink-0 ml-3">
                    {isOver48Hours && (
                      <Badge className="bg-red-100 text-red-700 border-red-200">Over 48h</Badge>
                    )}
                    {isOver24Hours && !isOver48Hours && (
                      <Badge className="bg-orange-100 text-orange-700 border-orange-200">Over 24h</Badge>
                    )}
                  </div>
                </div>

                {/* Verification Details Section */}
                <div className="mb-5 pb-5 border-b border-gray-200">
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <span className="text-sm text-gray-600">Submitted</span>
                      <span className="text-sm font-medium text-gray-900">{submittedTime}</span>
                    </div>
                    {verification.prc_license_number && (
                      <div className="flex items-start justify-between">
                        <span className="text-sm text-gray-600">PRC License</span>
                        <span className="text-sm font-medium text-gray-900">{verification.prc_license_number}</span>
                      </div>
                    )}
                    {verification.prc_license_expiry && (
                      <div className="flex items-start justify-between">
                        <span className="text-sm text-gray-600">Expires</span>
                        <span className="text-sm font-medium text-gray-900">
                          {new Date(verification.prc_license_expiry).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Document Section */}
                {verification.document_url && (
                  <div className="mb-5 pb-5 border-b border-gray-200">
                    <VerificationDocumentLink
                      verificationId={verification.id}
                      documentUrl={verification.document_url}
                    />
                  </div>
                )}

                {/* Actions Section */}
                <VerificationActions
                  userId={verification.user_id}
                  verificationId={verification.id}
                />
              </Card>
            )
          })
        )}
      </div>
    </div>
  )
}
