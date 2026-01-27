import Link from 'next/link'
import Image from 'next/image'
import { Facebook, Instagram, Youtube } from 'lucide-react'

export function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="border-t bg-gray-100 shadow-sm mt-auto w-full relative z-50">
      <div className="container mx-auto px-4 py-6">
        {/* Main Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          {/* Platform Info */}
          <div>
            <h3 className="font-semibold text-base mb-2">Ako may lesson plan na!</h3>
            <p className="text-gray-600 text-xs mb-3">
              A marketplace for Filipino K-12 teachers to buy and sell educational resources.
            </p>
            <a 
              href="mailto:support@akomaylessonplanna.com" 
              className="text-gray-600 hover:text-[#ff7200] text-xs transition-colors"
            >
              support@akomaylessonplanna.com
            </a>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-semibold text-base mb-2">Quick Links</h3>
            <ul className="space-y-1.5">
              <li>
                <Link href="/marketplace" className="text-gray-600 hover:text-[#ff7200] text-xs transition-colors">
                  Marketplace
                </Link>
              </li>
              <li>
                <Link href="/sellers" className="text-gray-600 hover:text-[#ff7200] text-xs transition-colors">
                  Browse Sellers
                </Link>
              </li>
              <li>
                <Link href="/become-seller" className="text-gray-600 hover:text-[#ff7200] text-xs transition-colors">
                  Become a Seller
                </Link>
              </li>
              <li>
                <Link href="/about" className="text-gray-600 hover:text-[#ff7200] text-xs transition-colors">
                  About
                </Link>
              </li>
              <li>
                <Link href="/how-it-works" className="text-gray-600 hover:text-[#ff7200] text-xs transition-colors">
                  How It Works
                </Link>
              </li>
              <li>
                <Link href="/for-teachers" className="text-gray-600 hover:text-[#ff7200] text-xs transition-colors">
                  For Teachers
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-gray-600 hover:text-[#ff7200] text-xs transition-colors">
                  Contact
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="font-semibold text-base mb-2">Legal</h3>
            <ul className="space-y-1.5">
              <li>
                <Link href="/terms" className="text-gray-600 hover:text-[#ff7200] text-xs transition-colors">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="text-gray-600 hover:text-[#ff7200] text-xs transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/refund-policy" className="text-gray-600 hover:text-[#ff7200] text-xs transition-colors">
                  Refund Policy
                </Link>
              </li>
              <li>
                <Link href="/seller-agreement" className="text-gray-600 hover:text-[#ff7200] text-xs transition-colors">
                  Seller Agreement
                </Link>
              </li>
            </ul>
          </div>

          {/* Payment Methods */}
          <div>
            <h3 className="font-semibold text-base mb-2">Payment Methods</h3>
            <div className="flex flex-col items-start gap-2">
              {/* GCash Logo */}
              <Image
                src="/gcashlogo.png"
                alt="GCash"
                width={64}
                height={32}
                className="h-8 w-auto object-contain"
              />
              {/* Maya Logo */}
              <Image
                src="/Maya_logo.png"
                alt="Maya"
                width={64}
                height={32}
                className="h-8 w-auto object-contain"
              />
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t pt-4 flex flex-col md:flex-row justify-between items-center gap-3">
          <p className="text-gray-600 text-xs">
            © {currentYear} Ako may lesson plan na! All rights reserved.
          </p>
          <div className="flex items-center gap-3">
            <a 
              href="#" 
              className="text-gray-500 hover:text-[#ff7200] transition-colors"
              aria-label="Facebook"
            >
              <Facebook className="w-5 h-5" />
            </a>
            <a 
              href="#" 
              className="text-gray-500 hover:text-[#ff7200] transition-colors"
              aria-label="Instagram"
            >
              <Instagram className="w-5 h-5" />
            </a>
            <a 
              href="#" 
              className="text-gray-500 hover:text-[#ff7200] transition-colors"
              aria-label="X"
            >
              <svg 
                className="w-5 h-5" 
                viewBox="0 0 24 24" 
                fill="currentColor"
                aria-hidden="true"
              >
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
              </svg>
            </a>
            <a 
              href="#" 
              className="text-gray-500 hover:text-[#ff7200] transition-colors"
              aria-label="YouTube"
            >
              <Youtube className="w-5 h-5" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}
