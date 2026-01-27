import type { Metadata } from 'next'
import { Suspense } from 'react'
import { PageContent } from './page-content'

export const metadata: Metadata = {
  title: 'Ako may lesson plan na!',
  description: 'A marketplace for educational resources including lesson plans, exams, RPMS, posters, and tarpaulins for teachers',
}

function PageLoading() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <div className="mb-4 h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto"></div>
        <p className="text-muted-foreground">Loading...</p>
      </div>
    </div>
  )
}

export default function Page() {
  return (
    <Suspense fallback={<PageLoading />}>
      <PageContent />
    </Suspense>
  );
}