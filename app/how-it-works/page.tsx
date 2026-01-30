import type { Metadata } from 'next'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { PageSection } from '@/components/tier2/page-section'
import { Search, ShoppingCart, CreditCard, Download, Upload, FileCheck } from 'lucide-react'

export const metadata: Metadata = {
  title: 'How It Works',
  description: 'Learn how Ako may lesson plan na! works for Filipino teachers. Browse, buy, or sell lesson plans, exams, and educational resources. GCash and Maya payments.',
  openGraph: {
    title: 'How Ako may lesson plan na! Works - Buy and Sell Teaching Resources',
    description: 'Step-by-step guide to buying and selling educational resources on the Filipino teacher marketplace.',
  },
}

export default function HowItWorksPage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-4 text-foreground">How Ako may lesson plan na! Works</h1>
        <p className="text-muted-foreground text-lg">
          Here&apos;s how to buy or sell educational resources on our marketplace.
        </p>
      </div>

      <div className="space-y-8">
        <PageSection title="For Buyers: Getting Started">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3 mb-2">
                  <Search className="h-8 w-8 text-primary" />
                  <h3 className="font-semibold text-foreground">1. Search or Browse</h3>
                </div>
                <p className="text-muted-foreground text-sm">
                  Use the marketplace or search to find lesson plans, exams, RPMS, posters, and tarpaulins. Filter by grade, subject, and type.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3 mb-2">
                  <ShoppingCart className="h-8 w-8 text-primary" />
                  <h3 className="font-semibold text-foreground">2. Add to Cart</h3>
                </div>
                <p className="text-muted-foreground text-sm">
                  Add resources to your cart (one copy per product). Save items to your wishlist for later.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3 mb-2">
                  <CreditCard className="h-8 w-8 text-primary" />
                  <h3 className="font-semibold text-foreground">3. Pay with GCash or Maya</h3>
                </div>
                <p className="text-muted-foreground text-sm">
                  Check out securely. We accept GCash and Maya. Your order is confirmed instantly after payment.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3 mb-2">
                  <Download className="h-8 w-8 text-primary" />
                  <h3 className="font-semibold text-foreground">4. Download from Library</h3>
                </div>
                <p className="text-muted-foreground text-sm">
                  Access purchased resources anytime from your library. Download files and leave a review.
                </p>
              </CardContent>
            </Card>
          </div>
        </PageSection>

        <PageSection title="For Sellers: Earning from Your Materials">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3 mb-2">
                  <Upload className="h-8 w-8 text-primary" />
                  <h3 className="font-semibold text-foreground">1. Get Verified</h3>
                </div>
                <p className="text-muted-foreground text-sm">
                  Register as a seller and submit teacher verification (e.g., PRC license). Once approved, you can list products.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3 mb-2">
                  <FileCheck className="h-8 w-8 text-primary" />
                  <h3 className="font-semibold text-foreground">2. Upload Your Work</h3>
                </div>
                <p className="text-muted-foreground text-sm">
                  Use our 5-step upload wizard to add lesson plans, exams, or other materials. Set your price and add a cover image.
                </p>
              </CardContent>
            </Card>
          </div>
          <p className="text-muted-foreground mt-4">
            After review, your product goes live. Buyers can purchase and you earn per sale. Withdraw earnings via GCash or Maya when you reach the minimum threshold.
          </p>
        </PageSection>
      </div>

      <div className="mt-8 flex flex-wrap gap-4">
        <Link href="/marketplace" className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">
          Browse Marketplace
        </Link>
        <Link href="/become-seller" className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">
          Become a Seller
        </Link>
        <Link href="/about" className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium hover:bg-accent">
          About Us
        </Link>
      </div>
    </div>
  )
}
