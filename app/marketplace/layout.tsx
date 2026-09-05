import { createClient } from '@/lib/supabase/server'
import { MainNav } from '@/components/navigation/main-nav'
import { Footer } from '@/components/layout/footer'

export default async function MarketplaceLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser()

  // Transform authUser to MainNav format (may be null for guests)
  const mainNavUser = authUser
    ? {
        id: authUser.id,
        email: authUser.email,
        name: authUser.user_metadata?.name || authUser.user_metadata?.full_name || undefined,
      }
    : null

  return (
    <div className="flex min-h-screen flex-col bg-[#fbfaf8]">
      {/* Main Navigation */}
      <MainNav user={mainNavUser} />

      {/* Page Content */}
      <main id="main-content" className="flex-1">
        {children}
      </main>

      {/* Footer */}
      <Footer />
    </div>
  )
}
