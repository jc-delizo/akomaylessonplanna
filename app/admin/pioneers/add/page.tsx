import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import { getAdminUser } from '@/lib/utils/admin-auth'
import { getPioneersCandidatesData, getPioneersData } from '@/lib/utils/admin-pioneers'
import { getFullName } from '@/lib/utils/profile'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Award, ArrowLeft, Users } from 'lucide-react'
import Link from 'next/link'
import { PioneerInviteButton } from '@/components/admin/pioneer-invite-button'

export default async function AddPioneerPage() {
  const supabase = await createClient()
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser()

  if (!authUser) {
    redirect('/login?redirect=/admin/pioneers/add')
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

  const topCandidates = (candidates ?? [])
    .filter((c: { qualityScore: number }) => c.qualityScore >= 70)
    .slice(0, 10)

  const getScoreColor = (score: number) => {
    if (score >= 70) return 'bg-green-100 text-green-700'
    if (score >= 50) return 'bg-yellow-100 text-yellow-700'
    return 'bg-gray-100 text-gray-700'
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/pioneers">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </Link>
      </div>

      <div>
        <h1 className="text-2xl font-bold">Add Pioneer</h1>
        <p className="text-gray-600 mt-1">
          Add a seller as a Pioneer. Only Super Admins can add Pioneers (max 20).
        </p>
      </div>

      {/* Add from candidates CTA */}
      <Card className="p-6 bg-purple-50 border-purple-200">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-purple-100">
            <Users className="h-6 w-6 text-purple-700" />
          </div>
          <div className="flex-1">
            <h2 className="font-semibold text-gray-900">Add from Pioneer Candidates</h2>
            <p className="text-sm text-gray-600 mt-1">
              View all eligible sellers sorted by Quality Score and invite them as Pioneers.
            </p>
          </div>
          <Link href="/admin/pioneers/candidates">
            <Button className="bg-purple-600 hover:bg-purple-700">
              <Award className="h-4 w-4 mr-2" />
              View All Candidates
            </Button>
          </Link>
        </div>
      </Card>

      {/* Available slots */}
      <Card className="p-4 bg-gray-50">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Available Pioneer slots</span>
          <Badge variant={availableSlots > 0 ? 'default' : 'secondary'}>
            {availableSlots} / 20
          </Badge>
        </div>
      </Card>

      {availableSlots === 0 ? (
        <Card className="p-8 text-center">
          <p className="text-gray-500">No Pioneer slots available. Remove a Pioneer first.</p>
          <Link href="/admin/pioneers">
            <Button variant="outline" className="mt-4">
              Back to Pioneers
            </Button>
          </Link>
        </Card>
      ) : adminUser.admin_role !== 'super_admin' ? (
        <Card className="p-8 text-center">
          <p className="text-gray-500">Only Super Admins can add Pioneers.</p>
          <Link href="/admin/pioneers">
            <Button variant="outline" className="mt-4">
              Back to Pioneers
            </Button>
          </Link>
        </Card>
      ) : (
        <>
          <h2 className="font-semibold text-gray-900">Top candidates (score ≥ 70)</h2>
          <p className="text-sm text-gray-600 mb-4">
            You can add from the list below or view all candidates above.
          </p>
          {topCandidates.length === 0 ? (
            <Card className="p-8 text-center">
              <p className="text-gray-500">No eligible candidates with score ≥ 70.</p>
              <Link href="/admin/pioneers/candidates">
                <Button variant="outline" className="mt-4">
                  View Candidates
                </Button>
              </Link>
            </Card>
          ) : (
            <Card>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                        Seller
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                        Quality Score
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                        Sales
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                        Products
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {topCandidates.map((candidate: any) => {
                      const fullName = getFullName(candidate)
                      return (
                        <tr key={candidate.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3">
                            <div>
                              <p className="font-medium">{fullName}</p>
                              <p className="text-sm text-gray-500">{candidate.email}</p>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <Badge className={getScoreColor(candidate.qualityScore)}>
                              {candidate.qualityScore}/100
                            </Badge>
                          </td>
                          <td className="px-4 py-3 text-sm">
                            {candidate.metrics.salesCount}
                          </td>
                          <td className="px-4 py-3 text-sm">
                            {candidate.metrics.productCount}
                          </td>
                          <td className="px-4 py-3">
                            <PioneerInviteButton
                              userId={candidate.id}
                              fullName={fullName}
                            />
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </>
      )}
    </div>
  )
}
