'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Check, Sparkles, Crown, Zap } from 'lucide-react'

interface UpgradePageContentProps {
  subscriptionTier: 'free' | 'pro' | 'pioneer'
}

export function UpgradePageContent({ subscriptionTier }: UpgradePageContentProps) {
  if (subscriptionTier === 'pioneer') {
    return (
      <div className="max-w-2xl mx-auto py-8">
        <Card className="border-2 border-amber-200 bg-amber-50/50">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-100">
                <Crown className="h-8 w-8 text-amber-600" />
              </div>
              <div>
                <CardTitle className="text-xl">You&apos;re on Pioneer — no upgrade needed</CardTitle>
                <CardDescription>
                  You already have all Pro features and enjoy 15% commission on every sale.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Keep selling and growing. If you have questions, visit Settings or contact support.
            </p>
            <Link href="/shop" className="inline-block mt-4">
              <Button variant="outline">Back to Dashboard</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (subscriptionTier === 'pro') {
    return (
      <div className="max-w-2xl mx-auto py-8">
        <Card className="border-2 border-[#ff7200]/30 bg-[#ff7200]/5">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-[#ff7200]/20">
                <Zap className="h-8 w-8 text-[#ff7200]" />
              </div>
              <div>
                <CardTitle className="text-xl">You&apos;re already on Pro</CardTitle>
                <CardDescription>
                  You have access to advanced analytics, Excel/PDF export, custom profile, and more.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Link href="/shop" className="inline-block">
              <Button variant="outline">Back to Dashboard</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Free tier: show upgrade content
  return (
    <div className="max-w-4xl mx-auto space-y-8 py-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Upgrade to Pro</h1>
        <p className="text-gray-600 mt-1">
          Get advanced analytics, Excel & PDF export, custom profile, and grow your sales.
        </p>
      </div>

      {/* Pricing */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card className="relative">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Monthly
              <Badge variant="secondary" className="text-xs">Billed monthly</Badge>
            </CardTitle>
            <CardDescription>Cancel anytime</CardDescription>
            <div className="mt-2">
              <span className="text-3xl font-bold">₱249</span>
              <span className="text-muted-foreground">/month</span>
            </div>
          </CardHeader>
          <CardContent>
            <UpgradeCtaButton plan="monthly" label="Subscribe — ₱249/month" />
          </CardContent>
        </Card>
        <Card className="relative border-[#ff7200] border-2">
          <div className="absolute -top-2.5 right-4">
            <Badge className="bg-[#ff7200] text-white">Save 17%</Badge>
          </div>
          <CardHeader>
            <CardTitle>Annual</CardTitle>
            <CardDescription>Best value — one payment per year</CardDescription>
            <div className="mt-2">
              <span className="text-3xl font-bold">₱2,490</span>
              <span className="text-muted-foreground">/year</span>
            </div>
          </CardHeader>
          <CardContent>
            <UpgradeCtaButton plan="annual" label="Get Pro yearly — ₱2,490/year" primary />
          </CardContent>
        </Card>
      </div>

      {/* Trust line */}
      <p className="text-sm text-muted-foreground text-center">
        Same 20% commission as Free. Cancel anytime.
      </p>

      {/* Comparison */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-[#ff7200]" />
            Free vs Pro
          </CardTitle>
          <CardDescription>What you get with Pro</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 font-medium">Feature</th>
                  <th className="text-left py-2 font-medium">Free</th>
                  <th className="text-left py-2 font-medium">Pro</th>
                </tr>
              </thead>
              <tbody className="text-muted-foreground">
                <tr className="border-b">
                  <td className="py-2">Commission</td>
                  <td className="py-2">20%</td>
                  <td className="py-2">20%</td>
                </tr>
                <tr className="border-b">
                  <td className="py-2">Dashboard</td>
                  <td className="py-2">Basic metrics, 7-day chart</td>
                  <td className="py-2">Interactive charts, 30-day trends</td>
                </tr>
                <tr className="border-b">
                  <td className="py-2">Export</td>
                  <td className="py-2">CSV only</td>
                  <td className="py-2">CSV, Excel, PDF</td>
                </tr>
                <tr className="border-b">
                  <td className="py-2">Analytics</td>
                  <td className="py-2">Product table, sparklines</td>
                  <td className="py-2">Revenue over time, top products, recommendations</td>
                </tr>
                <tr className="border-b">
                  <td className="py-2">Profile</td>
                  <td className="py-2">Avatar, bio</td>
                  <td className="py-2">Custom banner, accent color, Pro badge</td>
                </tr>
                <tr className="border-b">
                  <td className="py-2">Earnings</td>
                  <td className="py-2">Balance, withdrawal history</td>
                  <td className="py-2">+ Projected earnings, charts, PDF reports</td>
                </tr>
                <tr className="border-b">
                  <td className="py-2">Messaging</td>
                  <td className="py-2">System templates only</td>
                  <td className="py-2">Custom quick-reply templates</td>
                </tr>
                <tr>
                  <td className="py-2">Support</td>
                  <td className="py-2">Email, 48-hour response</td>
                  <td className="py-2">Priority, 12-hour response</td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-center gap-4">
        <UpgradeCtaButton plan="monthly" label="Upgrade to Pro — ₱249/month" />
        <UpgradeCtaButton plan="annual" label="Upgrade to Pro — ₱2,490/year" primary />
      </div>
    </div>
  )
}

function UpgradeCtaButton({
  plan,
  label,
  primary,
}: {
  plan: 'monthly' | 'annual'
  label: string
  primary?: boolean
}) {
  const [loading, setLoading] = useState(false)

  const handleClick = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/seller/subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan }),
      })
      const data = await res.json().catch(() => ({}))
      if (res.ok && data.payment_url) {
        window.location.href = data.payment_url
        return
      }
      if (res.ok && data.payment_reference) {
        // Redirect to payment page if API returns reference
        window.location.href = `/shop/upgrade?pay=${data.payment_reference}`
        return
      }
      // Placeholder (503) or error: fall back to contact
      const contact = data.contact_email || 'support@akomaylessonplanna.com'
      window.location.href = `mailto:${contact}?subject=Upgrade%20to%20Pro%20(${plan})&body=I%20would%20like%20to%20upgrade%20to%20Pro%20(${plan}).`
    } catch {
      window.location.href = `mailto:support@akomaylessonplanna.com?subject=Upgrade%20to%20Pro%20(${plan})&body=I%20would%20like%20to%20upgrade%20to%20Pro%20(${plan}).`
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button
      onClick={handleClick}
      disabled={loading}
      className={primary ? 'bg-[#ff7200] hover:bg-[#e66800]' : ''}
      variant={primary ? 'default' : 'outline'}
    >
      {loading ? 'Redirecting…' : label}
    </Button>
  )
}
