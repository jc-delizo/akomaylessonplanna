import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextRequest, NextResponse } from 'next/server'

/**
 * GET /api/search/suggestions
 * Autocomplete suggestions for search
 * 
 * Query params:
 * - q: search query (required)
 * 
 * Returns 8 suggestions:
 * - 3 product titles (exact matches)
 * - 2 subjects (Grade 7 Math, Science)
 * - 2 seller names
 * - 1 popular search
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q') || ''

    if (!query || query.length < 2) {
      return NextResponse.json({ suggestions: [] })
    }

    const supabase = await createClient()
    const adminClient = createAdminClient()
    const suggestions: Array<{ type: string; text: string; url?: string }> = []

    // 1. Get 3 product titles (exact matches)
    try {
      const { data: products } = await supabase
        .from('products')
        .select('title, id, slug')
        .eq('status', 'published')
        .or(`title.ilike.%${query}%,title.ilike.${query}%`)
        .limit(3)
        .order('sales_count', { ascending: false })

      if (products) {
        products.forEach((product: any) => {
          suggestions.push({
            type: 'product',
            text: product.title,
            url: `/products/${product.slug || product.id}`
          })
        })
      }
    } catch (err) {
      console.error('Error fetching product suggestions:', err)
    }

    // 2. Get 2 subjects (format: "Grade 7 Math", "Grade 7 Science")
    try {
      const { data: subjects } = await supabase
        .from('subjects')
        .select('name, code')
        .or(`name.ilike.%${query}%,code.ilike.%${query}%`)
        .limit(2)

      if (subjects) {
        subjects.forEach((subject: any) => {
          // Try to find a grade that matches the query or use a common grade
          suggestions.push({
            type: 'subject',
            text: `${subject.name}`,
            url: `/search?subject=${subject.code || subject.name}`
          })
        })
      }
    } catch (err) {
      console.error('Error fetching subject suggestions:', err)
    }

    // 3. Get 2 seller names
    try {
      const { data: sellers } = await supabase
        .from('users')
        .select('first_name, last_name, username')
        .eq('role', 'seller')
        .eq('can_sell', true)
        .or(`first_name.ilike.%${query}%,last_name.ilike.%${query}%,username.ilike.%${query}%`)
        .limit(2)

      if (sellers) {
        sellers.forEach((seller: any) => {
          const fullName = seller.first_name && seller.last_name
            ? `${seller.first_name} ${seller.last_name}`.trim()
            : seller.first_name || seller.username
          suggestions.push({
            type: 'seller',
            text: fullName,
            url: `/sellers/${seller.username}`
          })
        })
      }
    } catch (err) {
      console.error('Error fetching seller suggestions:', err)
    }

    // 4. Get 1 popular search
    try {
      const { data: popularSearches } = await adminClient
        .from('search_queries')
        .select('query_text')
        .ilike('query_text', `%${query}%`)
        .order('search_count', { ascending: false })
        .limit(1)

      if (popularSearches && popularSearches.length > 0) {
        const popularQuery = popularSearches[0].query_text
        if (!suggestions.some(s => s.text === popularQuery)) {
          suggestions.push({
            type: 'popular',
            text: popularQuery,
            url: `/search?q=${encodeURIComponent(popularQuery)}`
          })
        }
      }
    } catch (err) {
      console.error('Error fetching popular search suggestions:', err)
    }

    // Limit to 8 suggestions total
    return NextResponse.json({
      suggestions: suggestions.slice(0, 8)
    })
  } catch (error) {
    console.error('Error in GET /api/search/suggestions:', error)
    return NextResponse.json(
      { error: 'Internal server error', suggestions: [] },
      { status: 500 }
    )
  }
}
