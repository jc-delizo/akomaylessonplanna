import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { UpgradePageContent } from './upgrade-page-content'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Upgrade to Pro | My Shop',
  description: 'Unlock advanced analytics, Excel/PDF export, custom profile, and more with Pro.',
}

export default async function UpgradePage() {
  const supabase = await createClient()
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser()

  if (!authUser) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('users')
    .select('subscription_tier, role, can_sell')
    .eq('id', authUser.id)
    .single()

  if (!profile || (!profile.can_sell && profile.role !== 'seller' && profile.role !== 'admin')) {
    redirect('/marketplace')
  }

  const tier = (profile.subscription_tier as 'free' | 'pro' | 'pioneer') || 'free'

  return <UpgradePageContent subscriptionTier={tier} />
}
