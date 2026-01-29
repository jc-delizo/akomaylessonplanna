import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { MainNav } from '@/components/navigation/main-nav'
import { Footer } from '@/components/layout/footer'
import { ParticlesBackground } from '@/components/ui/particles-background'

export default async function BecomeSellerLayout({
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

  // Transform authUser to MainNav format
  const mainNavUser = {
    id: authUser.id,
    email: authUser.email,
    name: authUser.user_metadata?.name || authUser.user_metadata?.full_name || undefined,
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex flex-col relative">
      {/* Particles Background */}
      <ParticlesBackground
        particleCount={70}
        particleColor="rgba(255, 255, 255, 0.4)"
        lineColor="rgba(255, 255, 255, 0.15)"
        lineDistance={120}
        speed={0.4}
        className="z-0"
      />

      {/* Main Navigation */}
      <div className="relative z-10">
        <MainNav user={mainNavUser} />
      </div>

      {/* Page Content */}
      <main className="flex-1 relative z-10">
        {children}
      </main>

      {/* Footer */}
      <div className="relative z-10">
        <Footer />
      </div>
    </div>
  )
}
