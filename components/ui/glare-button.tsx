'use client'

import { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface GlareButtonProps {
  children: ReactNode
  className?: string
}

/**
 * GlareButton - A wrapper component that adds an automatic glare animation effect
 * The glare sweeps across the button every 5 seconds
 */
export function GlareButton({ children, className }: GlareButtonProps) {
  return (
    <div className={cn('relative overflow-hidden', className)}>
      {children}
      <div 
        className="glare-overlay absolute top-0 left-0 w-full h-full pointer-events-none"
        aria-hidden="true"
      />
    </div>
  )
}
