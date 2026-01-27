import { Metadata } from 'next'
import { getFullName } from '@/lib/utils/profile'

interface GenerateMetadataOptions {
  title: string
  description: string
  image?: string
  url?: string
  type?: 'website' | 'article'
  publishedTime?: string
  modifiedTime?: string
}

export function generateMetadata({
  title,
  description,
  image,
  url,
  type = 'website',
  publishedTime,
  modifiedTime
}: GenerateMetadataOptions): Metadata {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://akomaylessonplanna.com'
  const fullUrl = url ? `${baseUrl}${url}` : baseUrl
  const ogImage = image || `${baseUrl}/og-image.jpg`

  return {
    title: `${title} | Ako may lesson plan na!`,
    description,
    openGraph: {
      title,
      description,
      url: fullUrl,
      siteName: 'Ako may lesson plan na!',
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
      locale: 'en_US',
      type,
      publishedTime,
      modifiedTime,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [ogImage],
    },
    alternates: {
      canonical: fullUrl,
    },
  }
}

export function generateProductMetadata(product: {
  title: string
  description: string
  price: number
  cover_image_url?: string
  slug: string
  avg_rating?: number
  reviews_count?: number
  seller: {
    first_name: string
    last_name: string
    name?: string // For backward compatibility
    username: string
  }
  grade: {
    name: string
  }
  subject: {
    name: string
  }
}): Metadata {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://akomaylessonplanna.com'
  const url = `${baseUrl}/products/${product.slug}`
  const description = `${product.description.substring(0, 155)}... ${product.grade.name} ${product.subject.name} lesson plan by ${getFullName(product.seller)}.`

  return generateMetadata({
    title: product.title,
    description,
    image: product.cover_image_url,
    url: `/products/${product.slug}`,
    type: 'website',
  })
}

export function generateCategoryMetadata(category: {
  name: string
  description?: string
  slug: string
  product_count: number
}): Metadata {
  const description = category.description || 
    `Browse ${category.product_count} ${category.name.toLowerCase()} resources from Filipino teachers. Find lesson plans, exams, and teaching materials.`

  return generateMetadata({
    title: `${category.name} Resources`,
    description,
    url: `/products/${category.slug}`,
    type: 'website',
  })
}
