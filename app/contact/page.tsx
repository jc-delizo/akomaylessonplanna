import type { Metadata } from 'next'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { PageSection } from '@/components/tier2/page-section'
import { Mail } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Contact Us',
  description: 'Contact Ako may lesson plan na! for support, seller inquiries, or general questions. Email support@akomaylessonplanna.com for Filipino teacher marketplace assistance.',
  openGraph: {
    title: 'Contact Ako may lesson plan na! - Support and Inquiries',
    description: 'Get in touch with our team for marketplace support, seller verification, or feedback.',
  },
}

export default function ContactPage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-4 text-foreground">Contact Us</h1>
        <p className="text-muted-foreground text-lg">
          Have questions or need help? Reach out to the Ako may lesson plan na! team.
        </p>
      </div>

      <Card className="mb-8">
        <CardContent className="pt-6">
          <PageSection title="Support and Inquiries">
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <Mail className="h-6 w-6 text-primary shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-foreground">Email</h3>
                  <a
                    href="mailto:support@akomaylessonplanna.com"
                    className="text-primary hover:underline"
                  >
                    support@akomaylessonplanna.com
                  </a>
                  <p className="text-muted-foreground text-sm mt-1">
                    For general support, seller verification, purchase issues, or platform questions.
                  </p>
                </div>
              </div>
            </div>
          </PageSection>
        </CardContent>
      </Card>

      <PageSection title="What We Can Help With" className="mb-8">
        <ul className="space-y-2 text-muted-foreground list-disc list-inside">
          <li>Account and login issues</li>
          <li>Seller verification and becoming a seller</li>
          <li>Payment and checkout questions (GCash, Maya)</li>
          <li>Download or access to purchased resources</li>
          <li>Refunds and order issues</li>
          <li>Report inappropriate content or sellers</li>
          <li>Partnership or collaboration inquiries</li>
        </ul>
      </PageSection>

      <p className="text-muted-foreground mb-6">
        We aim to respond within 24–48 hours. For urgent order or payment issues, please include your order ID or email used for the account.
      </p>

      <div className="flex flex-wrap gap-4">
        <a
          href="mailto:support@akomaylessonplanna.com"
          className="inline-flex items-center justify-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          <Mail className="h-4 w-4" />
          Email Support
        </a>
        <Link href="/about" className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium hover:bg-accent">
          About Us
        </Link>
        <Link href="/how-it-works" className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium hover:bg-accent">
          How It Works
        </Link>
      </div>
    </div>
  )
}
