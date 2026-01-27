import type { Metadata } from 'next'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'

export const metadata: Metadata = {
  title: 'Refund Policy | Ako may lesson plan na!',
  description: 'Refund Policy for Ako may lesson plan na! - Learn about our refund process for digital educational resources',
  openGraph: {
    title: 'Refund Policy | Ako may lesson plan na!',
    description: 'Refund Policy for Ako may lesson plan na!',
  },
}

export default function RefundPolicyPage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-4">Refund Policy</h1>
        <p className="text-gray-600 text-lg">
          Last Updated: January 14, 2026
        </p>
      </div>

      <Card className="mb-6">
        <CardContent className="pt-6">
          <p className="text-gray-700 mb-6">
            This Refund Policy outlines the terms and conditions for refunds on Ako may lesson plan na!. 
            Please read this policy carefully before making a purchase.
          </p>
        </CardContent>
      </Card>

      <div className="space-y-8">
        {/* General Policy */}
        <section>
          <h2 className="text-2xl font-semibold mb-4">General Policy</h2>
          <div className="space-y-3 text-gray-700">
            <p className="font-medium text-lg">
              All sales of digital products are final once the product has been downloaded.
            </p>
            <p>
              Due to the digital nature of our products (lesson plans, exams, RPMS, posters, tarpaulins), 
              we cannot offer automatic refunds after download, as digital products cannot be &quot;returned.&quot;
            </p>
          </div>
        </section>

        {/* Refund Exceptions */}
        <section>
          <h2 className="text-2xl font-semibold mb-4">Refund Exceptions</h2>
          <div className="space-y-4 text-gray-700">
            <p>Refunds may be considered in the following exceptional circumstances:</p>
            
            <div>
              <h3 className="text-xl font-medium mb-2">1. Defective Products</h3>
              <p className="mb-2">A product may be considered defective if:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>The product does not match its description</li>
                <li>The product file is corrupted and cannot be opened</li>
                <li>The product is incomplete or missing essential components</li>
                <li>The product contains significant errors that make it unusable</li>
              </ul>
            </div>

            <div>
              <h3 className="text-xl font-medium mb-2">2. Unauthorized Purchase</h3>
              <p>
                If you believe a purchase was made without your authorization, please contact us immediately 
                at <a href="mailto:support@akomaylessonplanna.com" className="text-[#ff7200] hover:underline">
                  support@akomaylessonplanna.com
                </a>.
              </p>
            </div>

            <div>
              <h3 className="text-xl font-medium mb-2">3. Duplicate Purchase</h3>
              <p>
                If you accidentally purchase the same product twice, we may issue a refund for the duplicate purchase.
              </p>
            </div>
          </div>
        </section>

        {/* Refund Process */}
        <section>
          <h2 className="text-2xl font-semibold mb-4">How to Request a Refund</h2>
          <div className="space-y-4 text-gray-700">
            <div>
              <h3 className="text-xl font-medium mb-2">Step 1: Contact Support</h3>
              <p>
                Email us at{' '}
                <a href="mailto:support@akomaylessonplanna.com" className="text-[#ff7200] hover:underline">
                  support@akomaylessonplanna.com
                </a>{' '}
                with the following information:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4 mt-2">
                <li>Your order number or transaction ID</li>
                <li>Product name and seller</li>
                <li>Reason for refund request</li>
                <li>Supporting evidence (screenshots, descriptions of issues)</li>
              </ul>
            </div>

            <div>
              <h3 className="text-xl font-medium mb-2">Step 2: Seller Review</h3>
              <p>
                For product quality issues, the seller will be notified and given 48 hours to respond. 
                The seller may:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4 mt-2">
                <li>Approve the refund</li>
                <li>Offer to fix the issue</li>
                <li>Dispute the refund request</li>
              </ul>
            </div>

            <div>
              <h3 className="text-xl font-medium mb-2">Step 3: Platform Review</h3>
              <p>
                If the seller disputes the refund or does not respond within 48 hours, our support team 
                will review the case and make a final decision within 3-5 business days.
              </p>
            </div>

            <div>
              <h3 className="text-xl font-medium mb-2">Step 4: Refund Processing</h3>
              <p>
                If your refund is approved, the refund will be processed to your original payment method 
                (GCash or Maya) within 5-7 business days.
              </p>
            </div>
          </div>
        </section>

        {/* Non-Refundable Situations */}
        <section>
          <h2 className="text-2xl font-semibold mb-4">Non-Refundable Situations</h2>
          <div className="space-y-3 text-gray-700">
            <p>Refunds will NOT be issued for:</p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Change of mind after purchase</li>
              <li>Not reading the product description before purchase</li>
              <li>Compatibility issues with your device or software</li>
              <li>Minor errors or typos that don&apos;t affect usability</li>
              <li>Products that have been downloaded and used</li>
              <li>Disagreement with product quality when the product matches its description</li>
            </ul>
          </div>
        </section>

        {/* Seller Refund Rights */}
        <section>
          <h2 className="text-2xl font-semibold mb-4">Seller Refund Rights</h2>
          <div className="space-y-3 text-gray-700">
            <p>
              Sellers have the right to approve or deny refund requests for their products. However, 
              Ako may lesson plan na! reserves the right to override seller decisions in cases of clear violations 
              of our Terms of Service or when products are demonstrably defective.
            </p>
            <p>
              When a refund is issued, the seller&apos;s earnings from that sale will be deducted from 
              their account balance.
            </p>
          </div>
        </section>

        {/* Dispute Resolution */}
        <section>
          <h2 className="text-2xl font-semibold mb-4">Dispute Resolution</h2>
          <div className="space-y-3 text-gray-700">
            <p>
              If you disagree with a refund decision, you may escalate the matter to our support team. 
              All disputes will be reviewed fairly and in accordance with our{' '}
              <Link href="/terms" className="text-[#ff7200] hover:underline">
                Terms of Service
              </Link>.
            </p>
            <p>
              The platform&apos;s decision in refund disputes is final and binding.
            </p>
          </div>
        </section>

        {/* Contact Information */}
        <Card className="mt-8 bg-gray-50">
          <CardContent className="pt-6">
            <h2 className="text-xl font-semibold mb-4">Contact Us</h2>
            <p className="text-gray-700 mb-2">
              If you have questions about our Refund Policy or need to request a refund, please contact us:
            </p>
            <p className="text-gray-700">
              Email: <a href="mailto:support@akomaylessonplanna.com" className="text-[#ff7200] hover:underline">
                support@akomaylessonplanna.com
              </a>
            </p>
            <p className="text-gray-700 text-sm mt-4">
              Please include your order number and a detailed description of the issue when contacting us.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
