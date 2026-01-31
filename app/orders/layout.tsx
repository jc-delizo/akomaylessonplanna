import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { MainNav } from '@/components/navigation/main-nav'
import { Footer } from '@/components/layout/footer'

export default async function OrdersLayout({
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

  const mainNavUser = {
    id: authUser.id,
    email: authUser.email,
    name: authUser.user_metadata?.name || authUser.user_metadata?.full_name || undefined,
  }

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
