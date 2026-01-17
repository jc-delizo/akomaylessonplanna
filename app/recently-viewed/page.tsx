import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { RecentlyViewedPageContent } from '@/components/recently-viewed/recently-viewed-page-content'

export default async function RecentlyViewedPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Recently Viewed</h1>
        <p className="text-gray-600 mt-2">
          Browse products you've recently viewed
        </p>
      </div>

      <RecentlyViewedPageContent />
    </div>
  )
}
