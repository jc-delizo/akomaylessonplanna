import Link from 'next/link'
import Image from 'next/image'
import { ArrowUpRight, BadgeCheck, Mail } from 'lucide-react'

export function Footer() {
  const currentYear = new Date().getFullYear()
  const paymentsEnabled = process.env.PAYMENTS_ENABLED === 'true'

  return (
    <footer className="relative z-40 mt-auto w-full border-t border-slate-800 bg-slate-950 text-slate-300">
      <div className="container mx-auto px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-[1.5fr_0.8fr_0.8fr_1fr]">
          <div className="max-w-sm">
            <Link href="/" className="inline-flex items-center gap-3 text-white">
              <Image
                src="/android-chrome-192x192.png"
                alt=""
                width={42}
                height={42}
                className="size-10 rounded-xl"
              />
              <span className="text-lg font-black tracking-tight">Ako may lesson plan na!</span>
            </Link>
            <p className="mt-4 text-sm leading-6 text-slate-400">
              A growing marketplace where Filipino K–12 educators can share practical resources and discover new ideas for the classroom.
            </p>
            <Link
              href="/contact"
              className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-orange-300 transition hover:text-orange-200"
            >
              <Mail className="size-4" aria-hidden="true" />
              Contact support
            </Link>
          </div>

          <nav aria-label="Marketplace links">
            <h2 className="text-sm font-bold text-white">Explore</h2>
            <ul className="mt-4 space-y-3 text-sm">
              <li><Link href="/marketplace" className="transition hover:text-white">Marketplace</Link></li>
              <li><Link href="/sellers" className="transition hover:text-white">Browse sellers</Link></li>
              <li><Link href="/become-seller" className="transition hover:text-white">Become a seller</Link></li>
              <li><Link href="/for-teachers" className="transition hover:text-white">For teachers</Link></li>
            </ul>
          </nav>

          <nav aria-label="Company and legal links">
            <h2 className="text-sm font-bold text-white">Company</h2>
            <ul className="mt-4 space-y-3 text-sm">
              <li><Link href="/about" className="transition hover:text-white">About</Link></li>
              <li><Link href="/how-it-works" className="transition hover:text-white">How it works</Link></li>
              <li><Link href="/privacy" className="transition hover:text-white">Privacy</Link></li>
              <li><Link href="/terms" className="transition hover:text-white">Terms</Link></li>
            </ul>
          </nav>

          <div>
            {paymentsEnabled ? (
              <>
                <h2 className="text-sm font-bold text-white">Secure payments</h2>
                <p className="mt-3 text-xs leading-5 text-slate-400">Supported payment providers</p>
                <div className="mt-4 flex items-center gap-3 rounded-xl bg-white p-3">
                  <Image src="/gcashlogo.png" alt="GCash" width={70} height={28} className="h-6 w-auto object-contain" />
                  <Image src="/Maya_logo.png" alt="Maya" width={70} height={28} className="h-6 w-auto object-contain" />
                </div>
              </>
            ) : (
              <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
                <BadgeCheck className="size-5 text-orange-300" aria-hidden="true" />
                <h2 className="mt-3 text-sm font-bold text-white">Seller onboarding is open</h2>
                <p className="mt-2 text-xs leading-5 text-slate-400">
                  Payments and checkout are being prepared for launch.
                </p>
                <Link href="/become-seller" className="mt-4 inline-flex items-center gap-1 text-xs font-bold text-orange-300 hover:text-orange-200">
                  Get started <ArrowUpRight className="size-3.5" aria-hidden="true" />
                </Link>
              </div>
            )}
          </div>
        </div>

        <div className="mt-10 flex flex-col gap-3 border-t border-slate-800 pt-6 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between">
          <p>© {currentYear} Ako may lesson plan na! All rights reserved.</p>
          <p>Made for Filipino educators.</p>
        </div>
      </div>
    </footer>
  )
}
