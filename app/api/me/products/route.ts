import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

/**
 * GET /api/me/products
 * Get all products for the authenticated user
 */
export async function GET() {
  try {
    const supabase = await createClient()

    // Check authentication
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Fetch user's products with related data
    const { data: products, error } = await supabase
      .from('products')
      .select(`
        *,
        grade:grades!products_grade_id_fkey(
          id,
          name
        ),
        subject:subjects!products_subject_id_fkey(
          id,
          name,
          code
        )
      `)
      .eq('seller_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching user products:', error)
      return NextResponse.json(
        { error: 'Failed to fetch products' },
        { status: 500 }
      )
    }

    // Phase B: attach subject_ids from product_subjects for "Multiple Subjects" on SellerProductCard
    const list = products || []
    const productIds = list.map((p: { id: string }) => p.id)
    const productSubjectIds: Record<string, string[]> = {}
    if (productIds.length > 0) {
      const { data: psRows } = await supabase
        .from('product_subjects')
        .select('product_id, subject_id, sort_order')
        .in('product_id', productIds)
        .order('sort_order', { ascending: true })
      for (const row of psRows || []) {
        if (!productSubjectIds[row.product_id]) productSubjectIds[row.product_id] = []
        productSubjectIds[row.product_id].push(row.subject_id)
      }
    }
    const productsWithSubjectIds = list.map((p: { id: string; subject_id?: string }) => ({
      ...p,
      subject_ids: productSubjectIds[p.id]?.length ? productSubjectIds[p.id] : (p.subject_id ? [p.subject_id] : []),
    }))

    return NextResponse.json({ products: productsWithSubjectIds })
  } catch (error) {
    console.error('Error in GET /api/me/products:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
