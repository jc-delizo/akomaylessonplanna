import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getAdminUser } from '@/lib/utils/admin-auth'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { headers } from 'next/headers'

async function getPlatformSettings() {
  const headersList = await headers()
  const cookieHeader = headersList.get('cookie')
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  const fetchUrl = `${baseUrl}/api/admin/settings/platform`
  const response = await fetch(fetchUrl, {
    cache: 'no-store',
    headers: cookieHeader ? { cookie: cookieHeader } : undefined,
  })
  if (!response.ok) {
    throw new Error('Failed to fetch platform settings')
  }
  const result = await response.json()
  return result
}

export default async function PlatformSettingsPage() {
  const supabase = await createClient()
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser()

  if (!authUser) {
    redirect('/login?redirect=/admin/settings/platform')
  }

  const adminUser = await getAdminUser(authUser.id)
  if (!adminUser || adminUser.admin_role !== 'super_admin') {
    redirect('/admin')
  }

  const settings = await getPlatformSettings()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Platform Settings</h1>
        <p className="text-gray-600 mt-1">Configure platform-wide settings (immediate effect)</p>
      </div>

      <Card className="p-6">
        <form className="space-y-8">
          {/* Commission Rates */}
          <div>
            <h2 className="text-lg font-semibold mb-4">Commission Rates</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="standard_commission">Standard Commission (%)</Label>
                <Input
                  id="standard_commission"
                  name="standard_commission"
                  type="number"
                  min="0"
                  max="30"
                  defaultValue={settings.commissionRates.standard}
                />
                <p className="text-xs text-gray-500 mt-1">Range: 0-30%</p>
              </div>
              <div>
                <Label htmlFor="pioneer_commission">Pioneer Commission (%)</Label>
                <Input
                  id="pioneer_commission"
                  name="pioneer_commission"
                  type="number"
                  min="0"
                  max="20"
                  defaultValue={settings.commissionRates.pioneer}
                />
                <p className="text-xs text-gray-500 mt-1">Range: 0-20% (must be &lt; Standard)</p>
              </div>
            </div>
          </div>

          <Separator />

          {/* Pricing Guidelines */}
          <div>
            <h2 className="text-lg font-semibold mb-4">Pricing Guidelines</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="min_price">Minimum Product Price (₱)</Label>
                <Input
                  id="min_price"
                  name="min_price"
                  type="number"
                  min="1"
                  max="100"
                  defaultValue={settings.pricing.minProductPrice}
                />
              </div>
              <div>
                <Label htmlFor="max_price">Maximum Product Price (₱)</Label>
                <Input
                  id="max_price"
                  name="max_price"
                  type="number"
                  min="500"
                  max="10000"
                  defaultValue={settings.pricing.maxProductPrice}
                />
              </div>
            </div>
            <p className="text-sm text-gray-600 mt-2">
              Recommended range: ₱{settings.pricing.recommendedRange.min} - ₱
              {settings.pricing.recommendedRange.max} (based on sales data)
            </p>
          </div>

          <Separator />

          {/* Upload Limits */}
          <div>
            <h2 className="text-lg font-semibold mb-4">Upload Limits</h2>
            <div className="space-y-4">
              <div>
                <Label htmlFor="max_file_size">Max File Size (MB)</Label>
                <Input
                  id="max_file_size"
                  name="max_file_size"
                  type="number"
                  min="100"
                  max="2000"
                  defaultValue={settings.uploadLimits.maxFileSize / (1024 * 1024)}
                />
                <p className="text-xs text-gray-500 mt-1">Range: 100MB - 2GB</p>
              </div>
              <div>
                <Label>Allowed File Types</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {settings.uploadLimits.allowedTypes.map((type: string) => (
                    <label key={type} className="flex items-center gap-2">
                      <input type="checkbox" defaultChecked />
                      <span className="text-sm uppercase">{type}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <Separator />

          {/* Moderation */}
          <div>
            <h2 className="text-lg font-semibold mb-4">Moderation</h2>
            <div className="space-y-4">
              <div>
                <Label htmlFor="first_n_review">First N Products Require Review</Label>
                <Input
                  id="first_n_review"
                  name="first_n_review"
                  type="number"
                  min="0"
                  max="10"
                  defaultValue={settings.moderation.firstNProductsRequireReview}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Range: 0-10 (0 = no review required)
                </p>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="auto_approve"
                  name="auto_approve"
                  defaultChecked={settings.moderation.autoApproveTrustedSellers}
                />
                <Label htmlFor="auto_approve">
                  Auto-approve trusted sellers (after X approved products)
                </Label>
              </div>
            </div>
          </div>

          <Separator />

          {/* Withdrawals */}
          <div>
            <h2 className="text-lg font-semibold mb-4">Withdrawals</h2>
            <div>
              <Label htmlFor="min_withdrawal">Minimum Withdrawal (₱)</Label>
              <Input
                id="min_withdrawal"
                name="min_withdrawal"
                type="number"
                min="1"
                defaultValue={settings.withdrawals.minWithdrawal}
              />
              <p className="text-sm text-gray-600 mt-2">
                Processing time: {settings.withdrawals.processingTime}
              </p>
            </div>
          </div>

          <Separator />

          {/* Platform Rules */}
          <div>
            <h2 className="text-lg font-semibold mb-4">Platform Rules</h2>
            <div className="space-y-2">
              <label className="flex items-center gap-2">
                <input type="checkbox" defaultChecked={settings.platformRules.accountCreationEnabled} />
                <span className="text-sm">Enable account creation</span>
              </label>
              <label className="flex items-center gap-2">
                <input type="checkbox" defaultChecked={settings.platformRules.sellerVerificationRequired} />
                <span className="text-sm">Seller verification required before selling</span>
              </label>
            </div>
          </div>

          <Separator />

          {/* Content */}
          <div>
            <h2 className="text-lg font-semibold mb-4">Content</h2>
            <div className="space-y-4">
              <label className="flex items-center gap-2">
                <input type="checkbox" defaultChecked={settings.content.watermarkDownloads} />
                <span className="text-sm">Watermark downloads</span>
              </label>
              <div>
                <Label htmlFor="preview_pages">Preview Pages</Label>
                <Input
                  id="preview_pages"
                  name="preview_pages"
                  type="number"
                  min="1"
                  max="10"
                  defaultValue={settings.content.previewPages}
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* SEO */}
          <div>
            <h2 className="text-lg font-semibold mb-4">SEO</h2>
            <div className="space-y-4">
              <div>
                <Label htmlFor="platform_name">Platform Name</Label>
                <Input
                  id="platform_name"
                  name="platform_name"
                  defaultValue={settings.seo.platformName}
                />
              </div>
              <div>
                <Label htmlFor="tagline">Tagline</Label>
                <Input
                  id="tagline"
                  name="tagline"
                  defaultValue={settings.seo.tagline}
                />
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-4 border-t">
            <Button type="submit" className="flex-1">
              Save Settings
            </Button>
            <Button type="button" variant="outline">
              Reset to Defaults
            </Button>
          </div>
        </form>
      </Card>
    </div>
  )
}
