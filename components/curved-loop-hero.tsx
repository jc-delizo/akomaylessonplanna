import Link from 'next/link'
import {
  ArrowRight,
  BookOpenCheck,
  Check,
  FileText,
  GraduationCap,
  Layers3,
  Sparkles,
} from 'lucide-react'

interface CurvedLoopHeroProps {
  hasProducts?: boolean
}

const resourceCards = [
  {
    icon: FileText,
    eyebrow: 'Daily lesson plan',
    label: 'Classroom-ready',
    className: '-rotate-6 translate-x-1 bg-white',
  },
  {
    icon: Layers3,
    eyebrow: 'Assessment pack',
    label: 'Easy to adapt',
    className: 'rotate-3 translate-x-10 bg-[#fff8ef]',
  },
  {
    icon: BookOpenCheck,
    eyebrow: 'Teaching slides',
    label: 'Made to engage',
    className: '-rotate-2 translate-x-3 bg-white',
  },
]

export function CurvedLoopHero({ hasProducts = false }: CurvedLoopHeroProps) {
  return (
    <section className="relative isolate overflow-hidden border-b border-orange-100 bg-[#fffaf3]">
      <div
        className="absolute inset-0 -z-20 opacity-60"
        aria-hidden="true"
        style={{
          backgroundImage:
            'linear-gradient(#fed7aa 1px, transparent 1px), linear-gradient(90deg, #fed7aa 1px, transparent 1px)',
          backgroundSize: '32px 32px',
          maskImage: 'linear-gradient(to right, black, transparent 80%)',
        }}
      />
      <div className="absolute -right-24 -top-32 -z-10 size-80 rounded-full bg-orange-200/50 blur-3xl" aria-hidden="true" />
      <div className="absolute -bottom-28 left-1/3 -z-10 size-64 rounded-full bg-amber-100 blur-3xl" aria-hidden="true" />

      <div className="container mx-auto grid min-h-[440px] items-center gap-10 px-4 py-14 sm:px-6 lg:grid-cols-[1.1fr_0.9fr] lg:px-8 lg:py-16">
        <div className="max-w-3xl">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-orange-200 bg-white/90 px-3 py-1.5 text-xs font-semibold text-orange-700 shadow-sm sm:text-sm">
            <Sparkles className="size-4" aria-hidden="true" />
            Gawa ng guro, para sa guro
          </div>

          <h1 className="max-w-2xl text-balance text-4xl font-black leading-[1.05] tracking-tight text-slate-950 sm:text-5xl lg:text-6xl">
            Teach more.
            <span className="block text-[#f36d21]">Prep less.</span>
          </h1>
          <p className="mt-5 max-w-xl text-pretty text-base leading-7 text-slate-600 sm:text-lg">
            A growing marketplace for practical lesson plans and classroom resources created with Filipino K–12 educators in mind.
          </p>

          <div className="mt-7 flex flex-col gap-3 sm:flex-row">
            <Link
              href={hasProducts ? '/marketplace/browse' : '/become-seller'}
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[#f36d21] px-6 py-3 text-sm font-bold text-white shadow-lg shadow-orange-200 transition hover:-translate-y-0.5 hover:bg-[#dc5d16] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2 motion-reduce:transform-none"
            >
              {hasProducts ? 'Explore resources' : 'Become a founding seller'}
              <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
            <Link
              href="/how-it-works"
              className="inline-flex min-h-12 items-center justify-center rounded-xl border border-slate-300 bg-white/90 px-6 py-3 text-sm font-bold text-slate-800 shadow-sm transition hover:border-orange-300 hover:text-orange-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2"
            >
              See how it works
            </Link>
          </div>

          <ul className="mt-7 flex flex-wrap gap-x-5 gap-y-2 text-sm font-medium text-slate-600" aria-label="Marketplace benefits">
            {['Made for local classrooms', 'Teacher-friendly tools', 'Simple seller onboarding'].map((benefit) => (
              <li key={benefit} className="flex items-center gap-1.5">
                <span className="flex size-5 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                  <Check className="size-3.5" strokeWidth={3} aria-hidden="true" />
                </span>
                {benefit}
              </li>
            ))}
          </ul>
        </div>

        <div className="relative hidden min-h-[320px] items-center justify-center lg:flex" aria-hidden="true">
          <div className="absolute size-72 rounded-full border border-dashed border-orange-300" />
          <div className="absolute size-56 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 shadow-2xl shadow-orange-300/50" />
          <div className="absolute left-4 top-8 flex size-14 items-center justify-center rounded-2xl bg-slate-900 text-white shadow-xl">
            <GraduationCap className="size-7" />
          </div>
          <div className="relative z-10 w-72 space-y-3">
            {resourceCards.map(({ icon: Icon, eyebrow, label, className }) => (
              <div key={eyebrow} className={`flex items-center gap-3 rounded-2xl border border-orange-100 p-4 shadow-xl ${className}`}>
                <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-orange-100 text-orange-700">
                  <Icon className="size-5" />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-900">{eyebrow}</p>
                  <p className="mt-0.5 text-xs font-medium text-slate-500">{label}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
