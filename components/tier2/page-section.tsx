import { ReactNode } from 'react'

interface PageSectionProps {
  title?: string
  children: ReactNode
  className?: string
}

/**
 * Shared section pattern for Tier 2 informational pages (About, How it works, For teachers, Contact).
 * Consistent section title + content for clarity and scannability.
 */
export function PageSection({ title, children, className = '' }: PageSectionProps) {
  return (
    <section className={className}>
      {title && (
        <h2 className="text-2xl font-semibold mb-4 text-foreground">{title}</h2>
      )}
      {children}
    </section>
  )
}
