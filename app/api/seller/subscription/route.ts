import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

/**
 * POST /api/seller/subscription
 * Initiates Pro subscription payment (GCash/Maya API).
 * Placeholder: returns 503 until payment integration is built.
 * When built: accept { plan: 'monthly' | 'annual' }, call GCash/Maya API,
 * return { payment_url } or { payment_reference } for redirect; webhook/callback
 * updates users.subscription_tier to 'pro' and optional pro_ends_at.
 */
export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser()

    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from('users')
      .select('role, can_sell, subscription_tier')
      .eq('id', authUser.id)
      .single()

    if (!profile || (profile.role !== 'seller' && profile.role !== 'admin') || !profile.can_sell) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    if (profile.subscription_tier === 'pro' || profile.subscription_tier === 'pioneer') {
      return NextResponse.json(
        { error: 'Already on Pro or Pioneer. No upgrade needed.' },
        { status: 400 }
      )
    }

    const body = await request.json().catch(() => ({}))
    const plan = body?.plan as string | undefined
    if (!plan || !['monthly', 'annual'].includes(plan)) {
      return NextResponse.json(
        { error: 'Invalid plan. Use plan: "monthly" or "annual".' },
        { status: 400 }
      )
    }

    // Placeholder: payment integration (GCash and Maya API) not yet wired.
    // When implemented: create payment via GCash/Maya API, return payment_url or
    // payment_reference; callback/webhook updates users.subscription_tier and optional pro_ends_at.
    return NextResponse.json(
      {
        error: 'Payment integration coming soon',
        message: 'Pro subscription will be available soon via GCash and Maya. For now, please contact support to upgrade.',
        contact_email: 'support@akomaylessonplanna.com',
      },
      { status: 503 }
    )
  } catch (err) {
    console.error('POST /api/seller/subscription:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
