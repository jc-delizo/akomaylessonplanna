'use client'

import { ParticlesBackground } from '@/components/ui/particles-background'

export default function UpgradeLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="relative -mx-4 -my-4 min-h-[calc(100vh-8rem)] md:-mx-4 md:-my-6 md:min-h-[calc(100vh-10rem)] overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <ParticlesBackground
        particleCount={70}
        particleColor="rgba(255, 255, 255, 0.4)"
        lineColor="rgba(255, 255, 255, 0.15)"
        lineDistance={120}
        speed={0.4}
        className="z-0"
      />
      <div className="relative z-10 px-4 py-6 md:px-6 md:py-8">
        {children}
      </div>
    </div>
  )
}
