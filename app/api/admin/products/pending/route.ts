import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/middleware/admin-auth'

/**
 * GET /api/admin/products/pending
 * Get pending products queue (oldest first - FCFS)
 * Shows first 3 products from new sellers
 */
export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAdmin(request)
    if (!authResult.success) {
      return authResult.response
    }

    const supabase = await createClient()

    // Get pending products (oldest first)
    const { data: pendingProducts, error } = await supabase
      .from('products')
      .select(`
        *,
        seller:users!products_seller_id_fkey(
          id,
          name,
          username,
          avatar_url,
          created_at,
          is_verified_teacher
        ),
        grade:grades!products_grade_id_fkey(id, name),
        subject:subjects!products_subject_id_fkey(id, name)
      `)
      .eq('status', 'pending_review')
      .order('created_at', { ascending: true }) // Oldest first (FCFS)

    if (error) {
      console.error('Error fetching pending products:', error)
      return NextResponse.json({ error: 'Failed to fetch pending products' }, { status: 500 })
    }

    // Calculate priority badges and submission counts
    const productsWithMetadata = await Promise.all(
      (pendingProducts || []).map(async (product) => {
        const submittedTime = new Date(product.created_at)
        const now = new Date()
        const hoursSinceSubmission = (now.getTime() - submittedTime.getTime()) / 3600000

        // Get seller's product count (to determine if this is one of first 3)
        const { count: sellerProductCount } = await supabase
          .from('products')
          .select('*', { count: 'exact', head: true })
          .eq('seller_id', product.seller_id)
          .in('status', ['published', 'pending_review'])

        // Get submission count (how many times this product was submitted)
        const { count: submissionCount } = await supabase
          .from('product_updates')
          .select('*', { count: 'exact', head: true })
          .eq('product_id', product.id)

        return {
          ...product,
          hoursSinceSubmission,
          priority: hoursSinceSubmission > 48 ? 'high' : hoursSinceSubmission > 24 ? 'medium' : 'low',
          productNumber: (sellerProductCount || 0) + 1, // 1 of 3
          submissionCount: (submissionCount || 0) + 1,
        }
      })
    )

    return NextResponse.json({
      products: productsWithMetadata,
      total: productsWithMetadata.length,
    })
  } catch (error) {
    console.error('Error in GET /api/admin/products/pending:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
