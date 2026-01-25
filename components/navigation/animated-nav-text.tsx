'use client'

import RotatingText from '@/components/RotatingText'

const ALL_TEXTS = [
  'ako may lesson plan na!',
  'ako may presentation na!',
  'ako may exam na!',
  'ako may RPMS na!',
  'makakapahinga na ako!',
  'makakakain na ako!',
  'makakarelax na ako!',
  'bonding na tayo anak!',
  'makakanood nako movie!',
  'makakatulog na ako!'
]

const INTERVAL_DURATION = 3000 // 3 seconds

export function AnimatedNavText() {
  return (
    <span className="font-bold text-xl hidden sm:block min-w-[320px]">
      <RotatingText
        {...({
          texts: ALL_TEXTS,
          rotationInterval: INTERVAL_DURATION,
          loop: true,
          mainClassName: '',
          splitLevelClassName: '',
          elementLevelClassName: '',
        } as any)}
      />
    </span>
  )
}
