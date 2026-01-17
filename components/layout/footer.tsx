import Link from 'next/link'

export function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="border-t bg-gray-50 mt-auto">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
          {/* Platform Info */}
          <div>
            <h3 className="font-semibold text-lg mb-4">AKOMAYLESSONPLANNA</h3>
            <p className="text-gray-600 text-sm mb-4">
              A marketplace for Filipino K-12 teachers to buy and sell educational resources.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-semibold text-lg mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/marketplace" className="text-gray-600 hover:text-[#ff7200] text-sm transition-colors">
                  Marketplace
                </Link>
              </li>
              <li>
                <Link href="/sellers" className="text-gray-600 hover:text-[#ff7200] text-sm transition-colors">
                  Browse Sellers
                </Link>
              </li>
              <li>
                <Link href="/become-seller" className="text-gray-600 hover:text-[#ff7200] text-sm transition-colors">
                  Become a Seller
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="font-semibold text-lg mb-4">Legal</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/terms" className="text-gray-600 hover:text-[#ff7200] text-sm transition-colors">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="text-gray-600 hover:text-[#ff7200] text-sm transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/refund-policy" className="text-gray-600 hover:text-[#ff7200] text-sm transition-colors">
                  Refund Policy
                </Link>
              </li>
              <li>
                <Link href="/seller-agreement" className="text-gray-600 hover:text-[#ff7200] text-sm transition-colors">
                  Seller Agreement
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="font-semibold text-lg mb-4">Contact</h3>
            <ul className="space-y-2">
              <li>
                <a 
                  href="mailto:support@akomaylessonplanna.com" 
                  className="text-gray-600 hover:text-[#ff7200] text-sm transition-colors"
                >
                  support@akomaylessonplanna.com
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t pt-6 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-gray-600 text-sm">
            © {currentYear} AKOMAYLESSONPLANNA. All rights reserved.
          </p>
          <p className="text-gray-500 text-xs">
            Made for Filipino teachers, by Filipino teachers
          </p>
        </div>
      </div>
    </footer>
  )
}
