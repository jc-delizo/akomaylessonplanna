import { MetadataRoute } from 'next'
import { createAdminClient } from '@/lib/supabase/admin'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://akomaylessonplanna.com'

  // Static pages (always included so sitemap is fetchable even if Supabase fails)
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${baseUrl}/marketplace`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/search`,
      lastModified: new Date(),
      changeFrequency: 'hourly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/terms`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${baseUrl}/privacy`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${baseUrl}/refund-policy`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${baseUrl}/seller-agreement`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${baseUrl}/about`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/how-it-works`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/for-teachers`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/contact`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/become-seller`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
  ]

  let productPages: MetadataRoute.Sitemap = []
  let sellerPages: MetadataRoute.Sitemap = []

  try {
    const adminClient = createAdminClient()
    const { data: products } = await adminClient
      .from('products')
      .select('id, slug, updated_at, published_at')
      .eq('status', 'published')
      .not('slug', 'is', null)
      .limit(10000)

    productPages = (products || []).map((product: { id: string; slug?: string | null; updated_at?: string | null; published_at?: string | null }) => ({
      url: `${baseUrl}/products/${product.slug || product.id}`,
      lastModified: new Date((product.updated_at || product.published_at) ?? Date.now()),
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    }))

    const { data: sellers } = await adminClient
      .from('users')
      .select('username, updated_at')
      .eq('role', 'seller')
      .eq('is_verified_teacher', true)
      .not('username', 'is', null)
      .limit(1000)

    sellerPages = (sellers || []).map((seller: { username: string; updated_at?: string | null }) => ({
      url: `${baseUrl}/sellers/${seller.username}`,
      lastModified: new Date(seller.updated_at ?? Date.now()),
      changeFrequency: 'weekly' as const,
      priority: 0.6,
    }))
  } catch {
    // If Supabase fails (env, timeout), still return static + category pages so GSC can fetch sitemap
  }

  // Category pages
  const categoryPages: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}/categories/lesson-plans`,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 0.8,
    },
    {
      url: `${baseUrl}/categories/exams`,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 0.8,
    },
    {
      url: `${baseUrl}/categories/rpms`,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 0.8,
    },
    {
      url: `${baseUrl}/categories/posters`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    },
    {
      url: `${baseUrl}/categories/tarpaulins`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    },
  ]

  return [
    ...staticPages,
    ...productPages,
    ...sellerPages,
    ...categoryPages,
  ]
}
