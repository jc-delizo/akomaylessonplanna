import type { SupabaseClient } from '@supabase/supabase-js'

/**
 * Get categories list with product count placeholder. Safe to call from server components or API routes.
 */
export async function getCategoriesData(supabase: SupabaseClient) {
  const { data: categories, error } = await supabase
    .from('categories')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching categories:', error)
    throw new Error('Failed to fetch categories')
  }

  const categoriesWithCounts = (categories || []).map((category: any) => ({
    ...category,
    productCount: 0,
  }))

  return { categories: categoriesWithCounts }
}
