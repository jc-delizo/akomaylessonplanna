'use client'

import { Spinner } from '@/registry/default/spinner/spinner'

interface PageLoaderProps {
  message?: string
  className?: string
}

export function PageLoader({ message = 'Loading...', className }: PageLoaderProps) {
  return (
    <div className={`flex min-h-[400px] items-center justify-center ${className || ''}`}>
      <div className="text-center">
        <Spinner size="lg" className="mx-auto mb-4" />
        <p className="text-muted-foreground">{message}</p>
      </div>
    </div>
  )
}
