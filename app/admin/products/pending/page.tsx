import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import { getAdminUser } from '@/lib/utils/admin-auth'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { PendingProductCard, type PendingProduct } from '@/components/admin/pending-product-card'

async function getPendingProducts(
  supabase: ReturnType<typeof createAdminClient>
): Promise<PendingProduct[]> {
  const { data: pendingProducts, error } = await supabase
    .from('products')
    .select(`
      *,
      seller:users!products_seller_id_fkey(
        id,
        first_name,
        last_name,
        username,
        avatar_url,
        created_at,
        is_verified_teacher
      ),
      grade:grades!products_grade_id_fkey(id, name),
      subject:subjects!products_subject_id_fkey(id, name)
    `)
    .eq('status', 'pending_review')
    .order('updated_at', { ascending: true })

  if (error) {
    console.error('Error fetching pending products:', error)
    throw new Error('Failed to fetch pending products')
  }

  const productsWithMetadata = await Promise.all(
    (pendingProducts || []).map(async (product) => {
      // Use latest product_updates.created_at (submission event) when available; else updated_at (row last update); else created_at
      const { data: latestUpdate } = await supabase
        .from('product_updates')
        .select('created_at')
        .eq('product_id', product.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      const submittedAt =
        latestUpdate?.created_at ?? product.updated_at ?? product.created_at
      const submittedTime = new Date(submittedAt)
      const now = new Date()
      const hoursSinceSubmission = (now.getTime() - submittedTime.getTime()) / 3600000

      const { count: sellerProductCount } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true })
        .eq('seller_id', product.seller_id)
        .in('status', ['published', 'pending_review'])

      const { count: submissionCount } = await supabase
        .from('product_updates')
        .select('*', { count: 'exact', head: true })
        .eq('product_id', product.id)

      return {
        ...product,
        hoursSinceSubmission,
        priority:
          hoursSinceSubmission > 48 ? 'high' : hoursSinceSubmission > 24 ? 'medium' : 'low',
        productNumber: (sellerProductCount || 0) + 1,
        submissionCount: (submissionCount || 0) + 1,
      } as PendingProduct
    })
  )

  // Order by "oldest in queue" first (largest hoursSinceSubmission)
  productsWithMetadata.sort(
    (a, b) => b.hoursSinceSubmission - a.hoursSinceSubmission
  )
  return productsWithMetadata
}

function getTimeAgo(hours: number) {
  if (hours < 24) return `${Math.floor(hours)}h`
  return `${Math.floor(hours / 24)}d`
}

export default async function PendingProductsPage() {
  const supabase = await createClient()
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser()

  if (!authUser) {
    redirect('/login?redirect=/admin/products/pending')
  }

  const adminUser = await getAdminUser(authUser.id)
  if (!adminUser) {
    redirect('/')
  }

  const products = await getPendingProducts(createAdminClient())

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Pending product reviews
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Review and approve or reject products (oldest first)
        </p>
      </div>

      {products.length > 0 && (
        <Card className="border-amber-200/60 bg-amber-50/50 dark:border-amber-800/40 dark:bg-amber-950/20 p-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-medium text-amber-800 dark:text-amber-200">
              Oldest in queue: {getTimeAgo(products[0].hoursSinceSubmission)} ago
            </span>
            {products[0].hoursSinceSubmission > 48 && (
              <Badge className="bg-destructive/10 text-destructive text-xs">Over 48h</Badge>
            )}
          </div>
        </Card>
      )}

      <div className="grid gap-4 sm:grid-cols-1 lg:grid-cols-2">
        {products.length === 0 ? (
          <Card className="col-span-full flex items-center justify-center p-12">
            <p className="text-muted-foreground">No pending products</p>
          </Card>
        ) : (
          products.map((product) => (
            <PendingProductCard key={product.id} product={product} />
          ))
        )}
      </div>
    </div>
  )
}
