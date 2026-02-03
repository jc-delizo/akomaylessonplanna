'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Check, Sparkles, Crown, Zap, Minus, BarChart3, FileSpreadsheet, Palette, Headphones } from 'lucide-react'

interface UpgradePageContentProps {
  subscriptionTier: 'free' | 'pro' | 'pioneer'
}

export function UpgradePageContent({ subscriptionTier }: UpgradePageContentProps) {
  if (subscriptionTier === 'pioneer') {
    return (
      <div className="max-w-2xl mx-auto py-8">
        <Card className="border border-amber-400/30 bg-amber-500/10 backdrop-blur-sm">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-400/20">
                <Crown className="h-8 w-8 text-amber-400" />
              </div>
              <div>
                <CardTitle className="text-xl text-white">You&apos;re on Pioneer — no upgrade needed</CardTitle>
                <CardDescription className="text-white/80">
                  You already have all Pro features and enjoy 15% commission on every sale.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-white/70">
              Keep selling and growing. If you have questions, visit Settings or contact support.
            </p>
            <Link href="/shop" className="inline-block mt-4">
              <Button variant="outline" className="border-white/30 text-white hover:bg-white/10">Back to Dashboard</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (subscriptionTier === 'pro') {
    return (
      <div className="max-w-2xl mx-auto py-8">
        <Card className="border border-[#ff7200]/40 bg-[#ff7200]/10 backdrop-blur-sm">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-[#ff7200]/20">
                <Zap className="h-8 w-8 text-[#ff7200]" />
              </div>
              <div>
                <CardTitle className="text-xl text-white">You&apos;re already on Pro</CardTitle>
                <CardDescription className="text-white/80">
                  You have access to advanced analytics, Excel/PDF export, custom profile, and more.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Link href="/shop" className="inline-block">
              <Button variant="outline" className="border-white/30 text-white hover:bg-white/10">Back to Dashboard</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Free tier: show upgrade content
  const comparisonRows: { feature: string; free: string; pro: string }[] = [
    { feature: 'Commission', free: '20%', pro: '20%' },
    { feature: 'Dashboard', free: 'Basic metrics, 7-day chart', pro: 'Charts, 30-day trends' },
    { feature: 'Export', free: 'CSV only', pro: 'CSV, Excel, PDF' },
    { feature: 'Analytics', free: 'Product table, sparklines', pro: 'Revenue, top products, recommendations' },
    { feature: 'Profile', free: 'Avatar, bio', pro: 'Custom banner, accent, Pro badge' },
    { feature: 'Earnings', free: 'Balance, withdrawal history', pro: 'Projected earnings, charts, PDF' },
    { feature: 'Messaging', free: 'System templates only', pro: 'Custom quick-reply templates' },
    { feature: 'Support', free: 'Email, 48-hour response', pro: 'Priority, 12-hour response' },
  ]

  const cardClass = 'border border-white/10 bg-white/10 backdrop-blur-sm'

  return (
    <div className="max-w-4xl mx-auto space-y-8 py-2">
      <div>
        <h1 className="text-3xl font-bold text-white">Upgrade to Pro</h1>
        <p className="text-white/90 mt-1">
          Get advanced analytics, Excel & PDF export, custom profile, and grow your sales.
        </p>
      </div>

      {/* Pricing */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card className={`relative ${cardClass}`}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              Monthly
              <Badge variant="secondary" className="text-xs bg-white/20 text-white border-0">Billed monthly</Badge>
            </CardTitle>
            <CardDescription className="text-white/80">Cancel anytime</CardDescription>
            <div className="mt-2">
              <span className="text-3xl font-bold text-white">₱249</span>
              <span className="text-white/70">/month</span>
            </div>
          </CardHeader>
          <CardContent>
            <UpgradeCtaButton plan="monthly" label="Subscribe — ₱249/month" />
          </CardContent>
        </Card>
        <Card className="border-[#ff7200] border-2 bg-[#ff7200]/10 backdrop-blur-sm">
          <CardHeader className="flex flex-row items-start justify-between gap-2">
            <div>
              <CardTitle className="text-white">Annual</CardTitle>
              <CardDescription className="text-white/80">Best value — one payment per year</CardDescription>
              <div className="mt-2">
                <span className="text-3xl font-bold text-white">₱2,490</span>
                <span className="text-white/70">/year</span>
              </div>
            </div>
            <Badge className="bg-[#ff7200] text-white shrink-0">Save 17%</Badge>
          </CardHeader>
          <CardContent>
            <UpgradeCtaButton plan="annual" label="Get Pro yearly — ₱2,490/year" primary />
          </CardContent>
        </Card>
      </div>

      {/* Trust line */}
      <p className="text-sm text-white/80 text-center">
        Same 20% commission as Free. Cancel anytime.
      </p>

      {/* Why Pro */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="flex items-start gap-3 rounded-lg border border-white/10 bg-white/5 px-4 py-3">
          <div className="p-1.5 rounded-md bg-[#ff7200]/20">
            <BarChart3 className="h-5 w-5 text-[#ff7200]" />
          </div>
          <div>
            <p className="font-medium text-white text-sm">Better analytics</p>
            <p className="text-white/70 text-xs mt-0.5">30-day trends and interactive charts</p>
          </div>
        </div>
        <div className="flex items-start gap-3 rounded-lg border border-white/10 bg-white/5 px-4 py-3">
          <div className="p-1.5 rounded-md bg-[#ff7200]/20">
            <FileSpreadsheet className="h-5 w-5 text-[#ff7200]" />
          </div>
          <div>
            <p className="font-medium text-white text-sm">Excel & PDF export</p>
            <p className="text-white/70 text-xs mt-0.5">Reports for orders and earnings</p>
          </div>
        </div>
        <div className="flex items-start gap-3 rounded-lg border border-white/10 bg-white/5 px-4 py-3">
          <div className="p-1.5 rounded-md bg-[#ff7200]/20">
            <Palette className="h-5 w-5 text-[#ff7200]" />
          </div>
          <div>
            <p className="font-medium text-white text-sm">Custom profile</p>
            <p className="text-white/70 text-xs mt-0.5">Banner, accent color, Pro badge</p>
          </div>
        </div>
        <div className="flex items-start gap-3 rounded-lg border border-white/10 bg-white/5 px-4 py-3">
          <div className="p-1.5 rounded-md bg-[#ff7200]/20">
            <Headphones className="h-5 w-5 text-[#ff7200]" />
          </div>
          <div>
            <p className="font-medium text-white text-sm">Priority support</p>
            <p className="text-white/70 text-xs mt-0.5">12-hour response time</p>
          </div>
        </div>
      </div>

      {/* Free vs Pro comparison */}
      <Card className={cardClass}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <Sparkles className="h-5 w-5 text-[#ff7200]" />
            Free vs Pro
          </CardTitle>
          <CardDescription className="text-white/80">What you get with Pro</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-0">
            <div className="grid grid-cols-[1fr_1fr_1fr] gap-4 py-3 px-2 border-b border-white/10 text-sm font-medium text-white/90">
              <span>Feature</span>
              <span>Free</span>
              <span>Pro</span>
            </div>
            {comparisonRows.map((row, i) => (
              <div
                key={row.feature}
                className={`grid grid-cols-[1fr_1fr_1fr] gap-4 py-3 px-2 text-sm items-center ${i % 2 === 1 ? 'bg-white/5' : ''} ${i < comparisonRows.length - 1 ? 'border-b border-white/10' : ''}`}
              >
                <span className="text-white/90">{row.feature}</span>
                <span className="flex items-center gap-1.5 text-white/80">
                  <Minus className="h-4 w-4 shrink-0 text-white/50" />
                  {row.free}
                </span>
                <span className="flex items-center gap-1.5 text-white/90">
                  <Check className="h-4 w-4 shrink-0 text-[#ff7200]" />
                  {row.pro}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Single CTA row: primary + secondary */}
      <div className="flex flex-col sm:flex-row justify-center gap-3 pt-2">
        <UpgradeCtaButton plan="annual" label="Get Pro yearly — ₱2,490/year" primary />
        <UpgradeCtaButton plan="monthly" label="Subscribe monthly — ₱249/month" />
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
      className={primary ? 'bg-[#ff7200] hover:bg-[#e66800]' : 'border-white/40 text-white hover:bg-white/15 hover:text-white'}
      variant={primary ? 'default' : 'outline'}
    >
      {loading ? 'Redirecting…' : label}
    </Button>
  )
}
