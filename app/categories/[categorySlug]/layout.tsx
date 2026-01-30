import type { Metadata } from 'next'

const CATEGORY_META: Record<string, { title: string; description: string }> = {
  'lesson-plans': {
    title: 'Lesson Plans',
    description: 'Browse lesson plans (DLL, DLP) for K-12. Buy and sell from Filipino teachers. Ako may lesson plan na!',
  },
  exams: {
    title: 'Exams',
    description: 'Browse exams and assessments for K-12. Buy and sell from Filipino teachers. Ako may lesson plan na!',
  },
  rpms: {
    title: 'RPMS',
    description: 'Browse RPMS and teaching portfolio materials. Buy and sell from Filipino teachers. Ako may lesson plan na!',
  },
  posters: {
    title: 'Posters',
    description: 'Browse classroom posters and decorations. Buy and sell from Filipino teachers. Ako may lesson plan na!',
  },
  tarpaulins: {
    title: 'Tarpaulins',
    description: 'Browse tarpaulins and visual aids. Buy and sell from Filipino teachers. Ako may lesson plan na!',
  },
}

type Props = {
  children: React.ReactNode
  params: Promise<{ categorySlug: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { categorySlug } = await params
  const meta = CATEGORY_META[categorySlug]
  const title = meta ? `${meta.title} - K-12 Resources | Ako may lesson plan na!` : `Category | Ako may lesson plan na!`
  const description = meta?.description ?? 'Browse educational resources for Filipino K-12 teachers. Ako may lesson plan na!'

  return {
    title,
    description,
    openGraph: {
      title,
      description,
    },
  }
}

export default function CategorySlugLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
