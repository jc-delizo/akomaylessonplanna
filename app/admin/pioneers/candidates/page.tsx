import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getAdminUser } from '@/lib/utils/admin-auth'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Award, TrendingUp } from 'lucide-react'

async function getCandidates() {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  const response = await fetch(`${baseUrl}/api/admin/pioneers/candidates`, {
    cache: 'no-store',
  })
  if (!response.ok) {
    throw new Error('Failed to fetch candidates')
  }
  return response.json()
}

async function getAvailableSlots() {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  const response = await fetch(`${baseUrl}/api/admin/pioneers`, {
    cache: 'no-store',
  })
  if (!response.ok) {
    return { availableSlots: 0 }
  }
  const data = await response.json()
  return { availableSlots: data.availableSlots || 0 }
}

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

  const { candidates } = await getCandidates()
  const { availableSlots } = await getAvailableSlots()

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
                candidates?.map((candidate: any) => (
                  <tr key={candidate.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                          {candidate.avatar_url ? (
                            <img
                              src={candidate.avatar_url}
                              alt={candidate.name}
                              className="w-10 h-10 rounded-full"
                            />
                          ) : (
                            <span className="text-sm font-medium">
                              {candidate.name?.[0]?.toUpperCase()}
                            </span>
                          )}
                        </div>
                        <div>
                          <p className="font-medium">{candidate.name}</p>
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
                        <Button size="sm" className="bg-purple-600 hover:bg-purple-700">
                          <Award className="h-4 w-4 mr-2" />
                          Invite
                        </Button>
                      ) : (
                        <span className="text-sm text-gray-400">
                          {candidate.qualityScore < 70 ? 'Score too low' : 'No slots'}
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
