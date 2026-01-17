import type { Metadata } from 'next'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'

export const metadata: Metadata = {
  title: 'Terms of Service | AKOMAYLESSONPLANNA',
  description: 'Terms of Service for AKOMAYLESSONPLANNA - A marketplace for educational resources',
  openGraph: {
    title: 'Terms of Service | AKOMAYLESSONPLANNA',
    description: 'Terms of Service for AKOMAYLESSONPLANNA',
  },
}

export default function TermsPage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-4">Terms of Service</h1>
        <p className="text-gray-600 text-lg">
          Last Updated: January 14, 2026
        </p>
      </div>

      <Card className="mb-6">
        <CardContent className="pt-6">
          <p className="text-gray-700 mb-6">
            Welcome to AKOMAYLESSONPLANNA. By accessing or using our platform, you agree to be bound by these Terms of Service. 
            Please read them carefully before using our services.
          </p>
        </CardContent>
      </Card>

      <div className="space-y-8">
        {/* Section 1: Acceptance */}
        <section>
          <h2 className="text-2xl font-semibold mb-4">1. Acceptance</h2>
          <div className="space-y-3 text-gray-700">
            <p>By using AKOMAYLESSONPLANNA, you agree to these Terms of Service:</p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>You must be 18 years or older to sell products on the platform</li>
              <li>Teachers under 18 years old need parent or guardian permission to purchase products</li>
              <li>You agree to comply with all applicable laws and regulations</li>
            </ul>
          </div>
        </section>

        {/* Section 2: Account Responsibilities */}
        <section>
          <h2 className="text-2xl font-semibold mb-4">2. Account Responsibilities</h2>
          <div className="space-y-3 text-gray-700">
            <p>You are responsible for:</p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Maintaining the security of your account credentials</li>
              <li>Providing accurate and up-to-date information</li>
              <li>Maintaining only one account per person</li>
              <li>All activities that occur under your account</li>
            </ul>
          </div>
        </section>

        {/* Section 3: Seller Obligations */}
        <section>
          <h2 className="text-2xl font-semibold mb-4">3. Seller Obligations</h2>
          <div className="space-y-3 text-gray-700">
            <p>As a seller on AKOMAYLESSONPLANNA, you agree to:</p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Be a verified teacher with valid credentials</li>
              <li>Own all rights to the content you upload, or have proper authorization</li>
              <li>Upload only appropriate, educational content</li>
              <li>Grant the platform a license to display and sell your content</li>
              <li>Maintain the right to remove your content at any time</li>
            </ul>
          </div>
        </section>

        {/* Section 4: Buyer Rights */}
        <section>
          <h2 className="text-2xl font-semibold mb-4">4. Buyer Rights</h2>
          <div className="space-y-3 text-gray-700">
            <p>When you purchase products on AKOMAYLESSONPLANNA:</p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>You may use purchased products for personal or classroom use only</li>
              <li>You may not resell or redistribute purchased products</li>
              <li>Violation of these terms may result in account suspension or ban</li>
            </ul>
          </div>
        </section>

        {/* Section 5: Platform Fees */}
        <section>
          <h2 className="text-2xl font-semibold mb-4">5. Platform Fees</h2>
          <div className="space-y-3 text-gray-700">
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Standard sellers pay a 20% commission on sales</li>
              <li>Pioneer sellers pay a 15% commission on sales</li>
              <li>Platform fees may be changed with 30 days advance notice</li>
              <li>There are no listing fees</li>
            </ul>
          </div>
        </section>

        {/* Section 6: Payment Terms */}
        <section>
          <h2 className="text-2xl font-semibold mb-4">6. Payment Terms</h2>
          <div className="space-y-3 text-gray-700">
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Payments are processed through GCash and Maya only</li>
              <li>Seller earnings become available after the buyer downloads the product</li>
              <li>Minimum withdrawal amount is ₱500</li>
              <li>Withdrawal processing takes 5-7 business days</li>
            </ul>
          </div>
        </section>

        {/* Section 7: Refund Policy */}
        <section>
          <h2 className="text-2xl font-semibold mb-4">7. Refund Policy</h2>
          <div className="space-y-3 text-gray-700">
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>All sales are final for digital goods</li>
              <li>Exceptions may be made for defective products that do not match their description</li>
              <li>Refund requests are reviewed on a case-by-case basis</li>
              <li>Sellers may approve refunds at their discretion</li>
            </ul>
            <p className="mt-4">
              For more details, please see our{' '}
              <Link href="/refund-policy" className="text-[#ff7200] hover:underline">
                Refund Policy
              </Link>.
            </p>
          </div>
        </section>

        {/* Section 8: Prohibited Activities */}
        <section>
          <h2 className="text-2xl font-semibold mb-4">8. Prohibited Activities</h2>
          <div className="space-y-3 text-gray-700">
            <p>The following activities are strictly prohibited:</p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Uploading inappropriate or offensive content</li>
              <li>Reselling products purchased from other sellers</li>
              <li>Creating multiple accounts</li>
              <li>Engaging in fraudulent activities</li>
              <li>Harassment of other users</li>
              <li>Any illegal activities</li>
            </ul>
            <p className="mt-4 font-medium">Violations may result in immediate account termination.</p>
          </div>
        </section>

        {/* Section 9: Content Moderation */}
        <section>
          <h2 className="text-2xl font-semibold mb-4">9. Content Moderation</h2>
          <div className="space-y-3 text-gray-700">
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>The first 3 products from new sellers are reviewed before publication</li>
              <li>AKOMAYLESSONPLANNA reserves the right to remove any content that violates these terms</li>
              <li>Accounts may be suspended or banned for violations</li>
            </ul>
          </div>
        </section>

        {/* Section 10: Limitation of Liability */}
        <section>
          <h2 className="text-2xl font-semibold mb-4">10. Limitation of Liability</h2>
          <div className="space-y-3 text-gray-700">
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>The platform is provided &quot;as is&quot; without warranties</li>
              <li>AKOMAYLESSONPLANNA is not responsible for product quality or disputes between buyers and sellers</li>
              <li>Maximum liability is limited to the amount paid by the user in the past 12 months</li>
            </ul>
          </div>
        </section>

        {/* Section 11: Termination */}
        <section>
          <h2 className="text-2xl font-semibold mb-4">11. Termination</h2>
          <div className="space-y-3 text-gray-700">
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>AKOMAYLESSONPLANNA may terminate accounts for violations of these terms</li>
              <li>Users may delete their accounts at any time</li>
              <li>Outstanding payments will be processed within 30 days of account deletion</li>
              <li>Banned users forfeit any outstanding earnings</li>
            </ul>
          </div>
        </section>

        {/* Section 12: Dispute Resolution */}
        <section>
          <h2 className="text-2xl font-semibold mb-4">12. Dispute Resolution</h2>
          <div className="space-y-3 text-gray-700">
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>AKOMAYLESSONPLANNA will mediate disputes between buyers and sellers</li>
              <li>The platform&apos;s decision in disputes is final</li>
              <li>These terms are governed by Philippine law</li>
              <li>Any legal proceedings shall be subject to the jurisdiction of Philippine courts</li>
            </ul>
          </div>
        </section>

        {/* Contact Information */}
        <Card className="mt-8 bg-gray-50">
          <CardContent className="pt-6">
            <h2 className="text-xl font-semibold mb-4">Contact Us</h2>
            <p className="text-gray-700 mb-2">
              If you have questions about these Terms of Service, please contact us at:
            </p>
            <p className="text-gray-700">
              Email: <a href="mailto:support@akomaylessonplanna.com" className="text-[#ff7200] hover:underline">
                support@akomaylessonplanna.com
              </a>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
