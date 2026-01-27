import { createClient } from '@/lib/supabase/server'
import { MainNav } from '@/components/navigation/main-nav'
import { Footer } from '@/components/layout/footer'

export default async function ForTeachersLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser()

  const mainNavUser = authUser
    ? {
        id: authUser.id,
        email: authUser.email,
        name: authUser.user_metadata?.name || authUser.user_metadata?.full_name || undefined,
      }
    : null

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <MainNav user={mainNavUser} />
      <main className="flex-1">
        {children}
      </main>
      <Footer />
    </div>
  )
}
