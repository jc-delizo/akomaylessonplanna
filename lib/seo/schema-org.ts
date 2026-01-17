/**
 * Schema.org structured data utilities
 * For SEO and rich snippets in search results
 */

interface ProductSchema {
  '@context': string
  '@type': string
  name: string
  description: string
  image?: string
  offers: {
    '@type': string
    price: string
    priceCurrency: string
    availability: string
  }
  aggregateRating?: {
    '@type': string
    ratingValue: string
    reviewCount: string
  }
  brand?: {
    '@type': string
    name: string
  }
}

export function generateProductSchema(product: {
  title: string
  description: string
  price: number
  cover_image_url?: string
  avg_rating?: number
  reviews_count?: number
  seller: {
    name: string
  }
}): ProductSchema {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://akomaylessonplanna.com'
  
  const schema: ProductSchema = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.title,
    description: product.description,
    offers: {
      '@type': 'Offer',
      price: product.price.toFixed(2),
      priceCurrency: 'PHP',
      availability: 'https://schema.org/InStock',
    },
    brand: {
      '@type': 'Brand',
      name: product.seller.name,
    },
  }

  if (product.cover_image_url) {
    schema.image = product.cover_image_url.startsWith('http')
      ? product.cover_image_url
      : `${baseUrl}${product.cover_image_url}`
  }

  if (product.avg_rating && product.reviews_count) {
    schema.aggregateRating = {
      '@type': 'AggregateRating',
      ratingValue: product.avg_rating.toFixed(1),
      reviewCount: product.reviews_count.toString(),
    }
  }

  return schema
}

interface BreadcrumbSchema {
  '@context': string
  '@type': string
  itemListElement: Array<{
    '@type': string
    position: number
    name: string
    item?: string
  }>
}

export function generateBreadcrumbSchema(items: Array<{ label: string; href?: string }>): BreadcrumbSchema {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://akomaylessonplanna.com'

  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.label,
      ...(item.href && { item: `${baseUrl}${item.href}` }),
    })),
  }
}

interface OrganizationSchema {
  '@context': string
  '@type': string
  name: string
  url: string
  logo?: string
  description?: string
}

export function generateOrganizationSchema(): OrganizationSchema {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://akomaylessonplanna.com'

  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'AKOMAYLESSONPLANNA',
    url: baseUrl,
    description: 'Marketplace for Filipino teachers to buy and sell lesson plans, exams, and teaching resources',
  }
}

interface PersonSchema {
  '@context': string
  '@type': string
  name: string
  url?: string
  image?: string
  jobTitle?: string
}

export function generateSellerSchema(seller: {
  name: string
  username: string
  avatar_url?: string
  bio?: string
}): PersonSchema {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://akomaylessonplanna.com'

  return {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: seller.name,
    url: `${baseUrl}/sellers/${seller.username}`,
    ...(seller.avatar_url && { image: seller.avatar_url }),
    jobTitle: 'Teacher',
  }
}
