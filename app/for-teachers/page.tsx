import type { Metadata } from 'next'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'

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
        <h1 className="text-4xl font-bold mb-4">For Teachers</h1>
        <p className="text-gray-600 text-lg">
          Ako may lesson plan na! Find ready-to-use educational resources for Filipino K-12 educators.
        </p>
      </div>

      <Card className="mb-8">
        <CardContent className="pt-6">
          <h2 className="text-2xl font-semibold mb-4">Why Use Ako may lesson plan na!?</h2>
          <ul className="space-y-3 text-gray-700 list-disc list-inside">
            <li><strong>Save time</strong> — Use lesson plans and materials created by fellow Filipino teachers</li>
            <li><strong>Curriculum-aligned</strong> — Resources for K-12 DepEd curriculum</li>
            <li><strong>Verified sellers</strong> — Buy from teachers who have completed verification</li>
            <li><strong>Secure payments</strong> — Pay with GCash or Maya</li>
            <li><strong>Instant access</strong> — Download from your library after purchase</li>
            <li><strong>Reviews and ratings</strong> — See what other teachers say before buying</li>
          </ul>
        </CardContent>
      </Card>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">What You Can Find</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Card>
            <CardContent className="pt-6">
              <h3 className="font-semibold mb-2">Lesson Plans</h3>
              <p className="text-gray-700 text-sm">
                DLL (Daily Lesson Logs), DLP (Detailed Lesson Plans), and other formats for Kindergarten through Grade 12.
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <h3 className="font-semibold mb-2">Exams and Assessments</h3>
              <p className="text-gray-700 text-sm">
                Periodical tests, quarter exams, and formative assessments by subject and grade level.
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <h3 className="font-semibold mb-2">RPMS and Portfolio</h3>
              <p className="text-gray-700 text-sm">
                RPMS documents, IPCRF materials, and portfolio items for teacher evaluation.
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <h3 className="font-semibold mb-2">Posters and Tarpaulins</h3>
              <p className="text-gray-700 text-sm">
                Classroom decorations, instructional posters, and tarpaulin designs.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">Getting Started</h2>
        <p className="text-gray-700 mb-4">
          Create a free account to browse and buy. You can search by grade, subject, or product type. Add items to your cart and checkout with GCash or Maya. Your purchased resources are available in your library anytime.
        </p>
        <Link href="/marketplace" className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">
          Browse Marketplace
        </Link>
      </section>

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
