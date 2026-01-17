import { Metadata } from 'next'

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
  // #region agent log
  fetch('http://127.0.0.1:7248/ingest/00d5f2ca-d0b7-44d8-a520-af7d4c8e25e2',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'generate-metadata.ts:13',message:'generateMetadata called',data:{type,title,url},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
  // #endregion
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://akomaylessonplanna.com'
  const fullUrl = url ? `${baseUrl}${url}` : baseUrl
  const ogImage = image || `${baseUrl}/og-image.jpg`

  // #region agent log
  fetch('http://127.0.0.1:7248/ingest/00d5f2ca-d0b7-44d8-a520-af7d4c8e25e2',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'generate-metadata.ts:43',message:'Setting openGraph.type',data:{type,fullUrl},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
  // #endregion
  return {
    title: `${title} | AKOMAYLESSONPLANNA`,
    description,
    openGraph: {
      title,
      description,
      url: fullUrl,
      siteName: 'AKOMAYLESSONPLANNA',
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
    name: string
    username: string
  }
  grade: {
    name: string
  }
  subject: {
    name: string
  }
}): Metadata {
  // #region agent log
  fetch('http://127.0.0.1:7248/ingest/00d5f2ca-d0b7-44d8-a520-af7d4c8e25e2',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'generate-metadata.ts:77',message:'generateProductMetadata called',data:{productSlug:product.slug,productTitle:product.title},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
  // #endregion
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://akomaylessonplanna.com'
  const url = `${baseUrl}/products/${product.slug}`
  const description = `${product.description.substring(0, 155)}... ${product.grade.name} ${product.subject.name} lesson plan by ${product.seller.name}.`

  // #region agent log
  fetch('http://127.0.0.1:7248/ingest/00d5f2ca-d0b7-44d8-a520-af7d4c8e25e2',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'generate-metadata.ts:87',message:'Calling generateMetadata with type website',data:{type:'website',url:`/products/${product.slug}`},timestamp:Date.now(),sessionId:'debug-session',runId:'post-fix',hypothesisId:'A'})}).catch(()=>{});
  // #endregion
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
