import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import { getAdminUser } from '@/lib/utils/admin-auth'
import { getPioneersCandidatesData, getPioneersData } from '@/lib/utils/admin-pioneers'
import { getFullName } from '@/lib/utils/profile'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { PioneerInviteButton } from '@/components/admin/pioneer-invite-button'

export default async function PioneerCandidatesPage() {
  const supabase = await createClient()
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser()

  if (!authUser) {
    redirect('/login?redirect=/admin/pioneers/candidates')
  }

  const adminUser = await getAdminUser(authUser.id)
  if (!adminUser) {
    redirect('/')
  }

  const adminClient = createAdminClient()
  const [{ candidates }, { availableSlots }] = await Promise.all([
    getPioneersCandidatesData(adminClient),
    getPioneersData(adminClient),
  ])

  const getScoreColor = (score: number) => {
    if (score >= 70) return 'bg-green-100 text-green-700'
    if (score >= 50) return 'bg-yellow-100 text-yellow-700'
    return 'bg-gray-100 text-gray-700'
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Pioneer Candidates</h1>
        <p className="text-gray-600 mt-1">
          Sellers eligible for Pioneer status (sorted by Quality Score)
        </p>
      </div>

      {/* Available Slots */}
      <Card className="p-4 bg-purple-50 border-purple-200">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600">Available Slots</p>
            <p className="text-2xl font-bold text-purple-700">
              {availableSlots} / 20
            </p>
          </div>
          {availableSlots === 0 && (
            <Badge className="bg-red-100 text-red-700">No slots available</Badge>
          )}
        </div>
      </Card>

      {/* Candidates Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Seller</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Quality Score</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Sales</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Products</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Rating</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Followers</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {candidates?.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                    No eligible candidates found
                  </td>
                </tr>
              ) : (
                candidates?.map((candidate: any) => {
                  const fullName = getFullName(candidate)
                  return (
                    <tr key={candidate.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                            {candidate.avatar_url ? (
                              <img
                                src={candidate.avatar_url}
                                alt={fullName}
                                className="w-10 h-10 rounded-full"
                              />
                            ) : (
                              <span className="text-sm font-medium">
                                {(candidate.first_name?.[0] ?? candidate.email?.[0] ?? '?').toUpperCase()}
                              </span>
                            )}
                          </div>
                          <div>
                            <p className="font-medium">{fullName}</p>
                            <p className="text-sm text-gray-500">{candidate.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <Badge className={getScoreColor(candidate.qualityScore)}>
                          {candidate.qualityScore}/100
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-sm">{candidate.metrics.salesCount}</td>
                      <td className="px-4 py-3 text-sm">{candidate.metrics.productCount}</td>
                      <td className="px-4 py-3 text-sm">
                        {candidate.metrics.avgRating.toFixed(1)} ⭐
                      </td>
                      <td className="px-4 py-3 text-sm">{candidate.metrics.followersCount}</td>
                      <td className="px-4 py-3">
                        {candidate.qualityScore >= 70 && availableSlots > 0 ? (
                          <PioneerInviteButton
                            userId={candidate.id}
                            fullName={fullName}
                          />
                        ) : (
                          <span className="text-sm text-gray-400">
                            {candidate.qualityScore < 70 ? 'Score too low' : 'No slots'}
                          </span>
                        )}
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
