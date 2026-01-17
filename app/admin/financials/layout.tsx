import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getAdminUser } from '@/lib/utils/admin-auth'

export default async function FinancialsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser()

  if (!authUser) {
    redirect('/login?redirect=/admin/financials')
  }

  const adminUser = await getAdminUser(authUser.id)
  
  // Super Admin only
  if (!adminUser || adminUser.admin_role !== 'super_admin') {
    redirect('/admin')
  }

  return <>{children}</>
}
