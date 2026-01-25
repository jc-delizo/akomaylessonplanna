import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { DashboardSidebar } from '@/components/dashboard/dashboard-sidebar'
import { DashboardBottomNav } from '@/components/dashboard/dashboard-bottom-nav'
import { MainNav } from '@/components/navigation/main-nav'
import { Footer } from '@/components/layout/footer'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser()

  if (!authUser) {
    redirect('/login')
  }

  // Get user profile data
  const { data: userProfile } = await supabase
    .from('users')
    .select('id, first_name, last_name, avatar_url, subscription_tier, role, can_sell')
    .eq('id', authUser.id)
    .single()

  // Verify user is a seller (check both role and can_sell flag)
  if (!userProfile || (!userProfile.can_sell && userProfile.role !== 'seller' && userProfile.role !== 'admin')) {
    redirect('/marketplace')
  }

  // Transform authUser to MainNav format
  const firstName = userProfile?.first_name || ''
  const lastName = userProfile?.last_name || ''
  const fullName = `${firstName} ${lastName}`.trim() || firstName || undefined
  
  const mainNavUser = {
    id: authUser.id,
    email: authUser.email,
    name: authUser.user_metadata?.name || authUser.user_metadata?.full_name || fullName,
  }

  // Transform userProfile for DashboardSidebar (needs name field)
  const sidebarUser = userProfile ? {
    ...userProfile,
    name: fullName || 'User'
  } : undefined

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Main Navigation */}
      <MainNav user={mainNavUser} />

      <div className="flex flex-1">
        {/* Desktop Sidebar - Hidden on mobile */}
        <div className="hidden md:block">
          <DashboardSidebar user={sidebarUser} />
        </div>

        {/* Main Content Area */}
        <main className="flex-1 md:ml-64 pb-16 md:pb-0">
          <div className="container mx-auto px-4 py-4 md:px-4 md:py-6">
            {children}
          </div>
        </main>

        {/* Mobile Bottom Navigation - Hidden on desktop */}
        <DashboardBottomNav />
      </div>

      {/* Footer */}
      <Footer />
    </div>
  )
}
