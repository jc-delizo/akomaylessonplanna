import { createClient } from '@/lib/supabase/server'
import { ProductDetailLayout } from '@/components/products/product-detail-layout'
import { RelatedProducts } from '@/components/recommendations/related-products'
import { generateProductMetadata } from '@/lib/seo/generate-metadata'
import { generateProductSchema } from '@/lib/seo/schema-org'
import { notFound } from 'next/navigation'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function ProductDetailPage({ params }: PageProps) {
  const { id } = await params
  const supabase = await createClient()

  // Fetch product with related data
  const { data: product, error } = await supabase
    .from('products')
    .select(`
      *,
      seller:users!products_seller_id_fkey(
        id,
        name,
        username,
        avatar_url,
        bio,
        is_verified_teacher,
        subscription_tier,
        is_pioneer,
        followers_count,
        response_time_hours,
        created_at
      ),
      grade:grades!products_grade_id_fkey(
        id,
        name,
        sort_order
      ),
      subject:subjects!products_subject_id_fkey(
        id,
        name,
        code
      )
    `)
    .eq('id', id)
    .single()

  if (error || !product) {
    notFound()
  }

  // Check if product is accessible
  // Only published products should be visible to everyone
  // Draft/pending/rejected products should only be visible to the seller
  if (product.status !== 'published') {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user || user.id !== product.seller_id) {
      // Check if user is admin
      if (user) {
        const { data: userData } = await supabase
          .from('users')
          .select('role')
          .eq('id', user.id)
          .single()

        if (!userData || userData.role !== 'admin') {
          notFound()
        }
      } else {
        notFound()
      }
    }
  }

  // Generate schema.org structured data
  const productSchema = generateProductSchema({
    title: product.title,
    description: product.description,
    price: product.price,
    cover_image_url: product.cover_image_url || undefined,
    avg_rating: product.avg_rating || undefined,
    reviews_count: product.reviews_count || undefined,
    seller: {
      name: product.seller?.name || ''
    }
  })

  return (
    <div>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema) }}
      />
      <ProductDetailLayout product={product} />
      <div className="container mx-auto px-4">
        <RelatedProducts productId={product.id} />
      </div>
    </div>
  )
}

// Generate metadata for SEO
export async function generateMetadata({ params }: PageProps) {
  const { id } = await params
  const supabase = await createClient()

  const { data: product } = await supabase
    .from('products')
    .select(`
      title,
      description,
      cover_image_url,
      price,
      slug,
      avg_rating,
      reviews_count,
      seller:users!products_seller_id_fkey(
        name,
        username
      ),
      grade:grades!products_grade_id_fkey(
        name
      ),
      subject:subjects!products_subject_id_fkey(
        name
      )
    `)
    .eq('id', id)
    .single()

  if (!product) {
    return {
      title: 'Product Not Found',
    }
  }

  return generateProductMetadata({
    title: product.title,
    description: product.description,
    price: product.price,
    cover_image_url: product.cover_image_url,
    slug: product.slug || id,
    avg_rating: product.avg_rating,
    reviews_count: product.reviews_count,
    seller: {
      name: (Array.isArray(product.seller) ? product.seller[0] : product.seller)?.name || '',
      username: (Array.isArray(product.seller) ? product.seller[0] : product.seller)?.username || ''
    },
    grade: {
      name: (Array.isArray(product.grade) ? product.grade[0] : product.grade)?.name || ''
    },
    subject: {
      name: (Array.isArray(product.subject) ? product.subject[0] : product.subject)?.name || ''
    }
  })
}
