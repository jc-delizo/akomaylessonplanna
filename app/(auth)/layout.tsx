import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowLeft, BookOpenCheck, HeartHandshake, Store } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Authentication | Ako may lesson plan na!',
  description: 'Sign in or create an account to access the marketplace',
}

const benefits = [
  { icon: BookOpenCheck, label: 'Keep purchased resources in one library' },
  { icon: Store, label: 'Build your own teaching-resource shop' },
  { icon: HeartHandshake, label: 'Join a marketplace made for educators' },
]

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-[#fffaf3] lg:grid lg:grid-cols-[0.88fr_1.12fr]">
      <aside className="relative hidden overflow-hidden bg-slate-950 p-10 text-white lg:flex lg:flex-col xl:p-14">
        <div
          className="absolute inset-0 opacity-20"
          aria-hidden="true"
          style={{
            backgroundImage:
              'linear-gradient(#fb923c 1px, transparent 1px), linear-gradient(90deg, #fb923c 1px, transparent 1px)',
            backgroundSize: '40px 40px',
            maskImage: 'linear-gradient(to bottom right, black, transparent 78%)',
          }}
        />
        <div className="absolute -bottom-24 -right-24 size-80 rounded-full bg-orange-500/20 blur-3xl" aria-hidden="true" />

        <Link href="/marketplace" className="relative z-10 inline-flex items-center gap-3 self-start">
          <Image src="/android-chrome-192x192.png" alt="" width={46} height={46} className="size-11 rounded-xl" priority />
          <span className="text-lg font-black tracking-tight">Ako may lesson plan na!</span>
        </Link>

        <div className="relative z-10 my-auto max-w-lg py-14">
          <span className="inline-flex rounded-full border border-orange-400/30 bg-orange-400/10 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.16em] text-orange-300">
            Your teacher marketplace
          </span>
          <h1 className="mt-6 text-balance text-4xl font-black leading-tight tracking-tight xl:text-5xl">
            More time for teaching. Less time starting from zero.
          </h1>
          <p className="mt-5 max-w-md text-base leading-7 text-slate-300">
            Discover, organize, and share practical classroom resources with fellow Filipino educators.
          </p>
          <ul className="mt-8 space-y-4">
            {benefits.map(({ icon: Icon, label }) => (
              <li key={label} className="flex items-center gap-3 text-sm font-medium text-slate-200">
                <span className="flex size-9 items-center justify-center rounded-xl bg-white/10 text-orange-300">
                  <Icon className="size-4.5" aria-hidden="true" />
                </span>
                {label}
              </li>
            ))}
          </ul>
        </div>

        <p className="relative z-10 text-xs text-slate-500">Built with the needs of Filipino K–12 educators in mind.</p>
      </aside>

      <main className="flex min-h-screen flex-col px-4 py-5 sm:px-8 lg:px-12 lg:py-8">
        <div className="mx-auto flex w-full max-w-xl items-center justify-between lg:justify-end">
          <Link href="/marketplace" className="inline-flex min-h-10 items-center gap-2 text-sm font-semibold text-slate-600 transition hover:text-orange-700">
            <ArrowLeft className="size-4" aria-hidden="true" />
            Back to marketplace
          </Link>
          <Link href="/marketplace" className="flex items-center gap-2 lg:hidden" aria-label="Ako may lesson plan na! home">
            <Image src="/android-chrome-192x192.png" alt="" width={34} height={34} className="size-8 rounded-lg" priority />
          </Link>
        </div>
        <div className="mx-auto flex w-full max-w-xl flex-1 items-start py-8 sm:items-center sm:py-12">
          <div className="w-full animate-in fade-in-0 slide-in-from-bottom-2 duration-300 motion-reduce:animate-none motion-reduce:opacity-100">
            {children}
          </div>
        </div>
      </main>
    </div>
  )
}
