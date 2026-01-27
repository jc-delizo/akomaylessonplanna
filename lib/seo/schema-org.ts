/**
 * Schema.org structured data utilities
 * For SEO and rich snippets in search results
 */
import { getFullName } from '@/lib/utils/profile'

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
    first_name: string
    last_name: string
    name?: string // For backward compatibility
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
      name: getFullName(product.seller),
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
  contactPoint?: {
    '@type': string
    email: string
    contactType: string
  }
}

export function generateOrganizationSchema(): OrganizationSchema {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://akomaylessonplanna.com'

  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Ako may lesson plan na!',
    url: baseUrl,
    logo: `${baseUrl}/akomaylogo.png`,
    description: 'Marketplace for Filipino teachers to buy and sell lesson plans, exams, and teaching resources',
    contactPoint: {
      '@type': 'ContactPoint',
      email: 'support@akomaylessonplanna.com',
      contactType: 'customer support',
    },
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
  first_name: string
  last_name: string
  name?: string // For backward compatibility
  username: string
  avatar_url?: string
  bio?: string
}): PersonSchema {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://akomaylessonplanna.com'

  return {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: getFullName(seller),
    url: `${baseUrl}/sellers/${seller.username}`,
    ...(seller.avatar_url && { image: seller.avatar_url }),
    jobTitle: 'Teacher',
  }
}

interface WebSiteSchema {
  '@context': string
  '@type': string
  name: string
  url: string
  description?: string
  potentialAction?: {
    '@type': string
    target: {
      '@type': string
      urlTemplate: string
    }
    'query-input': string
  }
}

export function generateWebSiteSchema(): WebSiteSchema {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://akomaylessonplanna.com'

  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Ako may lesson plan na!',
    url: baseUrl,
    description: 'Marketplace for Filipino K-12 teachers to buy and sell educational resources',
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${baseUrl}/search?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  }
}

interface SiteNavigationElementSchema {
  '@context': string
  '@type': string
  name: string
  hasPart?: Array<{
    '@type': string
    name: string
    url: string
  }>
}

export function generateSiteNavigationSchema(): SiteNavigationElementSchema {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://akomaylessonplanna.com'

  return {
    '@context': 'https://schema.org',
    '@type': 'SiteNavigationElement',
    name: 'Main Navigation',
    hasPart: [
      { '@type': 'SiteNavigationElement', name: 'Marketplace', url: `${baseUrl}/marketplace` },
      { '@type': 'SiteNavigationElement', name: 'How It Works', url: `${baseUrl}/how-it-works` },
      { '@type': 'SiteNavigationElement', name: 'Become a Seller', url: `${baseUrl}/become-seller` },
      { '@type': 'SiteNavigationElement', name: 'About', url: `${baseUrl}/about` },
      { '@type': 'SiteNavigationElement', name: 'For Teachers', url: `${baseUrl}/for-teachers` },
      { '@type': 'SiteNavigationElement', name: 'Contact', url: `${baseUrl}/contact` },
    ],
  }
}
