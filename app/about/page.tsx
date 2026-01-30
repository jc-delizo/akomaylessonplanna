import type { Metadata } from 'next'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { PageSection } from '@/components/tier2/page-section'

export const metadata: Metadata = {
  title: 'About Us',
  description: 'Ako may lesson plan na! is a marketplace for Filipino K-12 teachers to buy and sell educational resources including lesson plans, exams, RPMS, posters, and tarpaulins.',
  openGraph: {
    title: 'About Ako may lesson plan na! - Filipino Teacher Marketplace',
    description: 'Ako may lesson plan na! Discover how we connect Filipino teachers with quality educational resources.',
  },
}

export default function AboutPage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-4 text-foreground">About Ako may lesson plan na!</h1>
        <p className="text-muted-foreground text-lg">
          A digital marketplace built for Filipino K-12 educators.
        </p>
      </div>

      <Card className="mb-6">
        <CardContent className="pt-6">
          <PageSection title="Our Mission">
            <p className="text-muted-foreground mb-4">
              We connect Filipino teachers with quality educational resources. Educators can buy ready-to-use lesson plans, exams, RPMS documents, posters, and tarpaulins—and sell their materials to earn from their expertise.
            </p>
            <p className="text-muted-foreground">
              Our goal is to save teachers time and support the Filipino teaching community with authentic, curriculum-aligned resources.
            </p>
          </PageSection>
        </CardContent>
      </Card>

      <div className="space-y-6 mb-8">
        <PageSection title="What We Offer">
          <ul className="space-y-2 text-muted-foreground list-disc list-inside">
            <li>Lesson plans (DLL, DLP) for K-12</li>
            <li>Exams and assessments</li>
            <li>RPMS and teaching portfolio materials</li>
            <li>Posters and classroom decorations</li>
            <li>Tarpaulins and visual aids</li>
          </ul>
        </PageSection>

        <PageSection title="For Buyers">
          <p className="text-muted-foreground mb-2">
            Browse and purchase resources from verified Filipino teachers. Filter by grade, subject, and type. Pay safely with GCash or Maya.
          </p>
          <Link href="/for-teachers" className="text-primary hover:underline font-medium">
            Learn more for teachers →
          </Link>
        </PageSection>

        <PageSection title="For Sellers">
          <p className="text-muted-foreground mb-2">
            Turn your teaching materials into income. Upload your best work, set your price, and reach teachers across the Philippines.
          </p>
          <Link href="/become-seller" className="text-primary hover:underline font-medium">
            Become a seller →
          </Link>
        </PageSection>
      </div>

      <div className="flex flex-wrap gap-4">
        <Link href="/marketplace" className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">
          Browse Marketplace
        </Link>
        <Link href="/how-it-works" className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium hover:bg-accent">
          How It Works
        </Link>
        <Link href="/contact" className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium hover:bg-accent">
          Contact Us
        </Link>
      </div>
    </div>
  )
}
