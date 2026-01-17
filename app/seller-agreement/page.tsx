import type { Metadata } from 'next'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'

export const metadata: Metadata = {
  title: 'Seller Agreement | AKOMAYLESSONPLANNA',
  description: 'Seller Agreement for AKOMAYLESSONPLANNA - Terms and conditions for sellers on our platform',
  openGraph: {
    title: 'Seller Agreement | AKOMAYLESSONPLANNA',
    description: 'Seller Agreement for AKOMAYLESSONPLANNA',
  },
}

export default function SellerAgreementPage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-4">Seller Agreement</h1>
        <p className="text-gray-600 text-lg">
          Last Updated: January 14, 2026
        </p>
      </div>

      <Card className="mb-6">
        <CardContent className="pt-6">
          <p className="text-gray-700 mb-6">
            This Seller Agreement governs your use of AKOMAYLESSONPLANNA as a seller. By becoming a seller 
            on our platform, you agree to be bound by this agreement in addition to our{' '}
            <Link href="/terms" className="text-[#ff7200] hover:underline">
              Terms of Service
            </Link>.
          </p>
        </CardContent>
      </Card>

      <div className="space-y-8">
        {/* Section 1: Eligibility */}
        <section>
          <h2 className="text-2xl font-semibold mb-4">1. Eligibility</h2>
          <div className="space-y-3 text-gray-700">
            <p>To become a seller on AKOMAYLESSONPLANNA, you must:</p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Be a licensed teacher in the Philippines</li>
              <li>Have a valid teacher ID (PRC License preferred)</li>
              <li>Be at least 18 years old</li>
              <li>Complete the teacher verification process</li>
              <li>Agree to this Seller Agreement and our Terms of Service</li>
            </ul>
          </div>
        </section>

        {/* Section 2: Content Ownership */}
        <section>
          <h2 className="text-2xl font-semibold mb-4">2. Content Ownership</h2>
          <div className="space-y-3 text-gray-700">
            <p>You represent and warrant that:</p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>You own all rights to the content you upload, OR</li>
              <li>You have obtained proper authorization from the content owner</li>
              <li>Your content is original work or properly licensed</li>
              <li>Your content is not plagiarized from other sources</li>
              <li>Any third-party content included has proper copyright clearance</li>
            </ul>
            <p className="mt-4">
              You are solely responsible for ensuring you have the right to sell the content you upload. 
              Violations of copyright or intellectual property rights may result in immediate account termination.
            </p>
          </div>
        </section>

        {/* Section 3: Content Standards */}
        <section>
          <h2 className="text-2xl font-semibold mb-4">3. Content Standards</h2>
          <div className="space-y-3 text-gray-700">
            <p>All products you upload must:</p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Be educational and appropriate for K-12 teachers</li>
              <li>Not contain offensive, inappropriate, or illegal content</li>
              <li>Have accurate descriptions that match the actual product</li>
              <li>Be free of viruses, malware, or harmful code</li>
              <li>Comply with Philippine educational standards</li>
              <li>Be properly formatted and usable</li>
            </ul>
            <p className="mt-4">
              Products that do not meet these standards may be removed, and repeated violations may result 
              in account suspension or termination.
            </p>
          </div>
        </section>

        {/* Section 4: Pricing & Earnings */}
        <section>
          <h2 className="text-2xl font-semibold mb-4">4. Pricing & Earnings</h2>
          <div className="space-y-4 text-gray-700">
            <div>
              <h3 className="text-xl font-medium mb-2">Pricing</h3>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>You set the price for your products</li>
                <li>Minimum price is ₱50</li>
                <li>You can change prices at any time (changes apply to future sales only)</li>
              </ul>
            </div>
            <div>
              <h3 className="text-xl font-medium mb-2">Commission Rates</h3>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Standard sellers: 20% commission on each sale</li>
                <li>Pioneer sellers: 15% commission on each sale</li>
                <li>Commission rates may be changed with 30 days advance notice</li>
              </ul>
            </div>
            <div>
              <h3 className="text-xl font-medium mb-2">Earnings</h3>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Earnings are tracked in your seller dashboard</li>
                <li>Earnings become available after the buyer downloads the product</li>
                <li>Minimum withdrawal amount is ₱500</li>
                <li>Withdrawals are processed within 5-7 business days</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Section 5: Taxes */}
        <section>
          <h2 className="text-2xl font-semibold mb-4">5. Taxes</h2>
          <div className="space-y-3 text-gray-700">
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>You are responsible for declaring your income from sales</li>
              <li>AKOMAYLESSONPLANNA will issue earnings statements for tax purposes</li>
              <li>Tax withholding may apply as required by Philippine law</li>
              <li>You should consult with a tax professional regarding your tax obligations</li>
            </ul>
            <p className="mt-4 text-sm italic">
              Note: This information is for general purposes only and does not constitute tax advice. 
              Please consult a tax professional for specific guidance.
            </p>
          </div>
        </section>

        {/* Section 6: Platform Rights */}
        <section>
          <h2 className="text-2xl font-semibold mb-4">6. Platform Rights</h2>
          <div className="space-y-3 text-gray-700">
            <p>By uploading content to AKOMAYLESSONPLANNA, you grant us:</p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>A non-exclusive license to display, market, and sell your products</li>
              <li>The right to review and moderate your content</li>
              <li>The right to remove content that violates our terms</li>
              <li>The right to use product images and descriptions for marketing purposes</li>
            </ul>
            <p className="mt-4">
              You retain ownership of your content and can remove it from the platform at any time. 
              However, products that have already been sold will remain accessible to buyers who purchased them.
            </p>
          </div>
        </section>

        {/* Section 7: Responsibilities */}
        <section>
          <h2 className="text-2xl font-semibold mb-4">7. Your Responsibilities</h2>
          <div className="space-y-3 text-gray-700">
            <p>As a seller, you are responsible for:</p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Keeping your products updated and accurate</li>
              <li>Responding to buyer questions in a timely manner</li>
              <li>Delivering quality educational resources</li>
              <li>Maintaining professional conduct in all interactions</li>
              <li>Addressing buyer concerns and refund requests appropriately</li>
              <li>Ensuring your account information is current</li>
            </ul>
          </div>
        </section>

        {/* Section 8: Termination */}
        <section>
          <h2 className="text-2xl font-semibold mb-4">8. Termination</h2>
          <div className="space-y-4 text-gray-700">
            <div>
              <h3 className="text-xl font-medium mb-2">Voluntary Termination</h3>
              <p>You may stop selling on AKOMAYLESSONPLANNA at any time by:</p>
              <ul className="list-disc list-inside space-y-2 ml-4 mt-2">
                <li>Removing your products from the platform</li>
                <li>Requesting account deletion</li>
                <li>Outstanding earnings will be processed within 30 days</li>
              </ul>
            </div>
            <div>
              <h3 className="text-xl font-medium mb-2">Platform Termination</h3>
              <p>AKOMAYLESSONPLANNA may suspend or terminate your seller account for:</p>
              <ul className="list-disc list-inside space-y-2 ml-4 mt-2">
                <li>Violations of this Seller Agreement</li>
                <li>Violations of our Terms of Service</li>
                <li>Copyright infringement</li>
                <li>Fraudulent activity</li>
                <li>Repeated complaints from buyers</li>
              </ul>
            </div>
            <div>
              <h3 className="text-xl font-medium mb-2">Consequences of Termination</h3>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Banned sellers forfeit any outstanding earnings</li>
                <li>Your products will be removed from the marketplace</li>
                <li>You may not create a new account</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Product Review Process */}
        <section>
          <h2 className="text-2xl font-semibold mb-4">Product Review Process</h2>
          <div className="space-y-3 text-gray-700">
            <p>
              Your first 3 products will be reviewed by our moderation team before publication. This helps 
              ensure quality and compliance with our standards. After approval, subsequent products may be 
              published immediately, but are still subject to review and removal if they violate our terms.
            </p>
          </div>
        </section>

        {/* Dispute Resolution */}
        <section>
          <h2 className="text-2xl font-semibold mb-4">Dispute Resolution</h2>
          <div className="space-y-3 text-gray-700">
            <p>
              Disputes between buyers and sellers will be mediated by AKOMAYLESSONPLANNA. Our decisions 
              are final and binding. For more information, please refer to our{' '}
              <Link href="/terms" className="text-[#ff7200] hover:underline">
                Terms of Service
              </Link>.
            </p>
          </div>
        </section>

        {/* Contact Information */}
        <Card className="mt-8 bg-gray-50">
          <CardContent className="pt-6">
            <h2 className="text-xl font-semibold mb-4">Contact Us</h2>
            <p className="text-gray-700 mb-2">
              If you have questions about this Seller Agreement, please contact us at:
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
