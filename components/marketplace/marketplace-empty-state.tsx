import Link from 'next/link'
import {
  ArrowRight,
  BookMarked,
  ClipboardCheck,
  FileStack,
  Presentation,
  Rocket,
  Shapes,
  Users,
} from 'lucide-react'

interface MarketplaceEmptyStateProps {
  isSignedIn: boolean
}

const resourceTypes = [
  { label: 'Lesson plans', icon: BookMarked, color: 'bg-orange-100 text-orange-700' },
  { label: 'Assessments', icon: ClipboardCheck, color: 'bg-blue-100 text-blue-700' },
  { label: 'Worksheets', icon: FileStack, color: 'bg-emerald-100 text-emerald-700' },
  { label: 'Teaching slides', icon: Presentation, color: 'bg-violet-100 text-violet-700' },
]

const highlights = [
  {
    icon: Shapes,
    title: 'Made for local classrooms',
    description: 'Resources shaped around the everyday needs of Filipino educators.',
  },
  {
    icon: ClipboardCheck,
    title: 'Quality comes first',
    description: 'A marketplace designed for useful, clear, classroom-ready materials.',
  },
  {
    icon: Users,
    title: 'Built with teachers',
    description: 'Early sellers help shape a platform that works for the community.',
  },
]

export function MarketplaceEmptyState({ isSignedIn }: MarketplaceEmptyStateProps) {
  return (
    <section className="py-12 sm:py-16" aria-labelledby="marketplace-launch-title">
      <div className="overflow-hidden rounded-3xl border border-orange-100 bg-white shadow-[0_24px_70px_-35px_rgba(124,45,18,0.35)]">
        <div className="grid lg:grid-cols-[1.1fr_0.9fr]">
          <div className="p-6 sm:p-10 lg:p-12">
            <span className="inline-flex items-center gap-2 rounded-full bg-orange-50 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.14em] text-orange-700">
              <Rocket className="size-4" aria-hidden="true" />
              Marketplace launch
            </span>
            <h2 id="marketplace-launch-title" className="mt-5 max-w-xl text-balance text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
              The shelves are ready for their first great resources.
            </h2>
            <p className="mt-4 max-w-xl text-pretty leading-7 text-slate-600">
              There are no published listings yet. If you create resources that make teaching easier, you can help open the marketplace as one of its first sellers.
            </p>

            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/become-seller"
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-slate-950 px-5 py-3 text-sm font-bold text-white transition hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:ring-offset-2"
              >
                Become a founding seller
                <ArrowRight className="size-4" aria-hidden="true" />
              </Link>
              <Link
                href={isSignedIn ? '/shop/products/new' : '/signup'}
                className="inline-flex min-h-12 items-center justify-center rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-bold text-slate-800 transition hover:border-orange-300 hover:text-orange-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2"
              >
                {isSignedIn ? 'Create a listing' : 'Create a free account'}
              </Link>
            </div>

            <p className="mt-5 text-xs leading-5 text-slate-500">
              Seller onboarding is open. Checkout will become available after payment processing is fully configured and tested.
            </p>
          </div>

          <div className="border-t border-orange-100 bg-[#fff8ef] p-6 sm:p-10 lg:border-l lg:border-t-0 lg:p-12">
            <p className="text-sm font-bold text-slate-900">Resources you&apos;ll find here</p>
            <div className="mt-5 grid grid-cols-2 gap-3">
              {resourceTypes.map(({ label, icon: Icon, color }) => (
                <div key={label} className="rounded-2xl border border-white/80 bg-white/80 p-4 shadow-sm backdrop-blur">
                  <div className={`flex size-10 items-center justify-center rounded-xl ${color}`}>
                    <Icon className="size-5" aria-hidden="true" />
                  </div>
                  <p className="mt-3 text-sm font-bold text-slate-800">{label}</p>
                </div>
              ))}
            </div>
            <Link href="/how-it-works" className="mt-6 inline-flex items-center gap-2 text-sm font-bold text-orange-700 hover:text-orange-800 hover:underline">
              Learn how the marketplace works
              <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
          </div>
        </div>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        {highlights.map(({ icon: Icon, title, description }) => (
          <div key={title} className="rounded-2xl border border-slate-200/80 bg-white p-5">
            <Icon className="size-5 text-orange-600" aria-hidden="true" />
            <h3 className="mt-3 text-sm font-bold text-slate-900">{title}</h3>
            <p className="mt-1 text-sm leading-6 text-slate-600">{description}</p>
          </div>
        ))}
      </div>
    </section>
  )
}
