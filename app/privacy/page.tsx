import type { Metadata } from 'next'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'

export const metadata: Metadata = {
  title: 'Privacy Policy | AKOMAYLESSONPLANNA',
  description: 'Privacy Policy for AKOMAYLESSONPLANNA - How we collect, use, and protect your personal information',
  openGraph: {
    title: 'Privacy Policy | AKOMAYLESSONPLANNA',
    description: 'Privacy Policy for AKOMAYLESSONPLANNA',
  },
}

export default function PrivacyPage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-4">Privacy Policy</h1>
        <p className="text-gray-600 text-lg">
          Last Updated: January 14, 2026
        </p>
      </div>

      <Card className="mb-6">
        <CardContent className="pt-6">
          <p className="text-gray-700 mb-6">
            At AKOMAYLESSONPLANNA, we are committed to protecting your privacy. This Privacy Policy explains how we collect, 
            use, disclose, and safeguard your information when you use our platform. We comply with the Data Privacy Act 
            of the Philippines (Republic Act No. 10173).
          </p>
        </CardContent>
      </Card>

      <div className="space-y-8">
        {/* Information Collected */}
        <section>
          <h2 className="text-2xl font-semibold mb-4">Information We Collect</h2>
          <div className="space-y-4 text-gray-700">
            <div>
              <h3 className="text-xl font-medium mb-2">Account Information</h3>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Name</li>
                <li>Email address</li>
                <li>Phone number</li>
                <li>GCash/Maya account information</li>
              </ul>
            </div>
            <div>
              <h3 className="text-xl font-medium mb-2">Verification Information</h3>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Teacher ID documents (for seller verification)</li>
                <li>PRC License information</li>
              </ul>
            </div>
            <div>
              <h3 className="text-xl font-medium mb-2">Payment Information</h3>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>GCash/Maya account numbers (encrypted)</li>
                <li>Transaction history</li>
              </ul>
            </div>
            <div>
              <h3 className="text-xl font-medium mb-2">Usage Information</h3>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Pages visited</li>
                <li>Products viewed</li>
                <li>Search queries</li>
              </ul>
            </div>
            <div>
              <h3 className="text-xl font-medium mb-2">Transaction Information</h3>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Purchases made</li>
                <li>Sales made (for sellers)</li>
                <li>Earnings and withdrawals</li>
              </ul>
            </div>
          </div>
        </section>

        {/* How It's Used */}
        <section>
          <h2 className="text-2xl font-semibold mb-4">How We Use Your Information</h2>
          <div className="space-y-3 text-gray-700">
            <p>We use the information we collect to:</p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Process transactions and payments</li>
              <li>Verify teacher credentials</li>
              <li>Send notifications and updates</li>
              <li>Improve our platform features and user experience</li>
              <li>Prevent fraud and ensure platform security</li>
              <li>Comply with legal obligations</li>
            </ul>
          </div>
        </section>

        {/* Information Sharing */}
        <section>
          <h2 className="text-2xl font-semibold mb-4">Information Sharing</h2>
          <div className="space-y-3 text-gray-700">
            <p className="font-medium text-lg">We do NOT sell your personal information.</p>
            <p>We may share your information only in the following circumstances:</p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>With payment processors (GCash/Maya) to complete transactions</li>
              <li>With trusted service providers who assist in platform operations (under strict confidentiality agreements)</li>
              <li>With law enforcement when required by law or to protect our rights</li>
            </ul>
            <p className="mt-4 font-medium">We never share your information for marketing purposes.</p>
          </div>
        </section>

        {/* Data Security */}
        <section>
          <h2 className="text-2xl font-semibold mb-4">Data Security</h2>
          <div className="space-y-3 text-gray-700">
            <p>We implement industry-standard security measures to protect your information:</p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Encryption of data at rest and in transit</li>
              <li>Secure payment processing</li>
              <li>Restricted access to personal information</li>
              <li>Regular security audits and updates</li>
            </ul>
            <p className="mt-4">
              While we strive to protect your information, no method of transmission over the internet is 100% secure. 
              We cannot guarantee absolute security.
            </p>
          </div>
        </section>

        {/* Your Rights (DPA Compliant) */}
        <section>
          <h2 className="text-2xl font-semibold mb-4">Your Rights (Data Privacy Act Compliant)</h2>
          <div className="space-y-3 text-gray-700">
            <p>Under the Data Privacy Act of the Philippines, you have the following rights:</p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li><strong>Right to Know:</strong> You have the right to know what personal information we collect</li>
              <li><strong>Right to Access:</strong> You can request access to your personal information</li>
              <li><strong>Right to Correct:</strong> You can request correction of inaccurate or incomplete information</li>
              <li><strong>Right to Delete:</strong> You can request deletion of your personal information</li>
              <li><strong>Right to Object:</strong> You can object to the processing of your personal information</li>
              <li><strong>Right to File a Complaint:</strong> You can file a complaint with the National Privacy Commission (NPC)</li>
            </ul>
            <p className="mt-4">
              To exercise these rights, please contact us at{' '}
              <a href="mailto:support@akomaylessonplanna.com" className="text-[#ff7200] hover:underline">
                support@akomaylessonplanna.com
              </a>
            </p>
          </div>
        </section>

        {/* Data Retention */}
        <section>
          <h2 className="text-2xl font-semibold mb-4">Data Retention</h2>
          <div className="space-y-3 text-gray-700">
            <div>
              <h3 className="text-xl font-medium mb-2">Active Accounts</h3>
              <p>We retain your information while your account is active.</p>
            </div>
            <div>
              <h3 className="text-xl font-medium mb-2">Transaction Records</h3>
              <p>We retain transaction records for 7 years as required by tax regulations.</p>
            </div>
            <div>
              <h3 className="text-xl font-medium mb-2">Teacher ID Documents</h3>
              <p>Teacher ID documents are deleted after verification is complete or when you delete your account.</p>
            </div>
            <div>
              <h3 className="text-xl font-medium mb-2">Deleted Accounts</h3>
              <p>When you delete your account, your personal information is anonymized within 30 days, except for transaction records which are retained for legal compliance.</p>
            </div>
          </div>
        </section>

        {/* Cookies and Tracking */}
        <section>
          <h2 className="text-2xl font-semibold mb-4">Cookies and Tracking</h2>
          <div className="space-y-3 text-gray-700">
            <p>
              We use cookies and similar technologies to enhance your experience, analyze platform usage, and assist in 
              our marketing efforts. You can control cookies through your browser settings.
            </p>
          </div>
        </section>

        {/* Children's Privacy */}
        <section>
          <h2 className="text-2xl font-semibold mb-4">Children&apos;s Privacy</h2>
          <div className="space-y-3 text-gray-700">
            <p>
              Our platform is intended for teachers. Users under 18 years old require parent or guardian permission to 
              purchase products. We do not knowingly collect personal information from children without parental consent.
            </p>
          </div>
        </section>

        {/* Changes to Privacy Policy */}
        <section>
          <h2 className="text-2xl font-semibold mb-4">Changes to This Privacy Policy</h2>
          <div className="space-y-3 text-gray-700">
            <p>
              We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new 
              Privacy Policy on this page and updating the &quot;Last Updated&quot; date. You are advised to review this 
              Privacy Policy periodically for any changes.
            </p>
          </div>
        </section>

        {/* Contact Information */}
        <Card className="mt-8 bg-gray-50">
          <CardContent className="pt-6">
            <h2 className="text-xl font-semibold mb-4">Contact Us</h2>
            <p className="text-gray-700 mb-2">
              If you have questions about this Privacy Policy or wish to exercise your rights, please contact us at:
            </p>
            <p className="text-gray-700 mb-4">
              Email: <a href="mailto:support@akomaylessonplanna.com" className="text-[#ff7200] hover:underline">
                support@akomaylessonplanna.com
              </a>
            </p>
            <p className="text-gray-700 text-sm">
              You may also file a complaint with the National Privacy Commission at{' '}
              <a href="https://www.privacy.gov.ph" target="_blank" rel="noopener noreferrer" className="text-[#ff7200] hover:underline">
                www.privacy.gov.ph
              </a>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
