import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://akomaylessonplanna.com'

  return {
    rules: [
      {
        userAgent: '*',
        allow: [
          '/',
          '/marketplace',
          '/products',
          '/search',
          '/sellers',
        ],
        disallow: [
          '/api/',
          '/shop/',
          '/admin/',
          '/checkout/',
          '/cart/',
          '/library/',
          '/auth/',
          '/login',
          '/signup',
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  }
}
