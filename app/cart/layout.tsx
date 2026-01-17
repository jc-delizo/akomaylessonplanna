import { createClient } from '@/lib/supabase/server'
import { MainNav } from '@/components/navigation/main-nav'
import { Footer } from '@/components/layout/footer'

export default async function CartLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser()

  // Allow guest access - no redirect
  // Transform authUser to MainNav format (can be null for guests)
  const mainNavUser = authUser
    ? {
        id: authUser.id,
        email: authUser.email,
        name: authUser.user_metadata?.name || authUser.user_metadata?.full_name || undefined,
      }
    : null

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Main Navigation */}
      <MainNav user={mainNavUser} />

      {/* Page Content */}
      <main className="flex-1">
        {children}
      </main>

      {/* Footer */}
      <Footer />
    </div>
  )
}
