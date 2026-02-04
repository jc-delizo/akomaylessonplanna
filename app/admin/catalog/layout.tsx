import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getAdminUser } from '@/lib/utils/admin-auth'

export default async function CatalogLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser()

  if (!authUser) {
    redirect('/login?redirect=/admin/catalog')
  }

  const adminUser = await getAdminUser(authUser.id)

  if (!adminUser || adminUser.admin_role !== 'super_admin') {
    redirect('/admin')
  }

  return <>{children}</>
}
