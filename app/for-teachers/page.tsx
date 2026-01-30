import type { Metadata } from 'next'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { PageSection } from '@/components/tier2/page-section'

export const metadata: Metadata = {
  title: 'For Teachers',
  description: 'Find lesson plans, exams, and teaching resources for Filipino K-12 teachers. Buy ready-to-use DLL, DLP, RPMS, posters, and tarpaulins from verified educators.',
  openGraph: {
    title: 'For Teachers - Buy Educational Resources | Ako may lesson plan na!',
    description: 'Save time with quality lesson plans and teaching materials from Filipino teachers. Browse by grade and subject.',
  },
}

export default function ForTeachersPage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-4 text-foreground">For Teachers</h1>
        <p className="text-muted-foreground text-lg">
          Find ready-to-use educational resources for Filipino K-12 educators.
        </p>
      </div>

      <Card className="mb-8">
        <CardContent className="pt-6">
          <PageSection title="Why Use Ako may lesson plan na!?">
            <ul className="space-y-3 text-muted-foreground list-disc list-inside">
              <li><strong className="text-foreground">Save time</strong> — Use lesson plans and materials created by fellow Filipino teachers</li>
              <li><strong className="text-foreground">Curriculum-aligned</strong> — Resources for K-12 DepEd curriculum</li>
              <li><strong className="text-foreground">Verified sellers</strong> — Buy from teachers who have completed verification</li>
              <li><strong className="text-foreground">Secure payments</strong> — Pay with GCash or Maya</li>
              <li><strong className="text-foreground">Instant access</strong> — Download from your library after purchase</li>
              <li><strong className="text-foreground">Reviews and ratings</strong> — See what other teachers say before buying</li>
            </ul>
          </PageSection>
        </CardContent>
      </Card>

      <PageSection title="What You Can Find" className="mb-8">
        <div className="grid gap-4 sm:grid-cols-2">
          <Card>
            <CardContent className="pt-6">
              <h3 className="font-semibold mb-2 text-foreground">Lesson Plans</h3>
              <p className="text-muted-foreground text-sm">
                DLL (Daily Lesson Logs), DLP (Detailed Lesson Plans), and other formats for Kindergarten through Grade 12.
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <h3 className="font-semibold mb-2 text-foreground">Exams and Assessments</h3>
              <p className="text-muted-foreground text-sm">
                Periodical tests, quarter exams, and formative assessments by subject and grade level.
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <h3 className="font-semibold mb-2 text-foreground">RPMS and Portfolio</h3>
              <p className="text-muted-foreground text-sm">
                RPMS documents, IPCRF materials, and portfolio items for teacher evaluation.
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <h3 className="font-semibold mb-2 text-foreground">Posters and Tarpaulins</h3>
              <p className="text-muted-foreground text-sm">
                Classroom decorations, instructional posters, and tarpaulin designs.
              </p>
            </CardContent>
          </Card>
        </div>
      </PageSection>

      <PageSection title="Getting Started" className="mb-8">
        <p className="text-muted-foreground mb-4">
          Create a free account to browse and buy. Search by grade, subject, or product type. Add items to your cart and checkout with GCash or Maya. Your purchased resources are available in your library anytime.
        </p>
        <Link href="/marketplace" className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">
          Browse Marketplace
        </Link>
      </PageSection>

      <div className="flex flex-wrap gap-4">
        <Link href="/how-it-works" className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium hover:bg-accent">
          How It Works
        </Link>
        <Link href="/become-seller" className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium hover:bg-accent">
          Sell Your Materials
        </Link>
        <Link href="/about" className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium hover:bg-accent">
          About Us
        </Link>
      </div>
    </div>
  )
}
