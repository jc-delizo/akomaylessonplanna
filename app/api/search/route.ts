import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextRequest, NextResponse } from 'next/server'
import { toPromise } from '@/lib/utils/supabase-promise'
import { 
  generateSearchCacheKey, 
  getCachedSearchResults, 
  setCachedSearchResults 
} from '@/lib/cache/search-cache'
import { trackSearchImpressions } from '@/lib/analytics/track-search-impressions'

/**
 * GET /api/search
 * Advanced search with full-text search and filtering
 * 
 * Query params:
 * - q: search query (title, description)
 * - page: number (default: 1)
 * - limit: number (default: 24)
 * - grade_id: UUID
 * - subject_id: UUID
 * - product_type: string
 * - specific_type: string
 * - quarter: number (1-4)
 * - min_price: number
 * - max_price: number
 * - language: string
 * - verified_seller_only: boolean (true/false)
 * - date_added: string (last_7_days, last_30_days, last_3_months)
 * - sort: string (relevance, newest, price_asc, price_desc, best_selling, highest_rated)
 */
export async function GET(request: NextRequest) {
  try {
    // #region agent log
    fetch('http://127.0.0.1:7248/ingest/00d5f2ca-d0b7-44d8-a520-af7d4c8e25e2',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/api/search/route.ts:32',message:'GET /api/search entry',data:{url:request.url},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
    // #endregion
    const supabase = await createClient()
    // #region agent log
    fetch('http://127.0.0.1:7248/ingest/00d5f2ca-d0b7-44d8-a520-af7d4c8e25e2',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/api/search/route.ts:35',message:'Supabase client created',data:{hasClient:!!supabase},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
    // #endregion
    const { searchParams } = new URL(request.url)

    // Parse query parameters (support both 'q' and 'query')
    const query = searchParams.get('q') || searchParams.get('query') || ''
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '24')
    const gradeId = searchParams.get('grade_id')
    const subjectId = searchParams.get('subject_id')
    const productType = searchParams.get('product_type')
    const specificType = searchParams.get('specific_type')
    const quarter = searchParams.get('quarter')
    const minPrice = searchParams.get('min_price')
    const maxPrice = searchParams.get('max_price')
    const language = searchParams.get('language')
    const verifiedSellerOnly = searchParams.get('verified_seller_only') === 'true'
    const dateAdded = searchParams.get('date_added') // last_7_days, last_30_days, last_3_months
    const sort = searchParams.get('sort') || 'relevance'

    // Check cache first
    // #region agent log
    fetch('http://127.0.0.1:7248/ingest/00d5f2ca-d0b7-44d8-a520-af7d4c8e25e2',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/api/search/route.ts:54',message:'Before cache check',data:{query,page,limit,gradeId,subjectId},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
    // #endregion
    const cacheKey = generateSearchCacheKey(query, {
      gradeId,
      subjectId,
      productType,
      specificType,
      quarter,
      minPrice,
      maxPrice,
      language,
      verifiedSellerOnly,
      dateAdded
    }, sort)

    const cachedResult = await getCachedSearchResults<any>(cacheKey)
    // #region agent log
    fetch('http://127.0.0.1:7248/ingest/00d5f2ca-d0b7-44d8-a520-af7d4c8e25e2',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/api/search/route.ts:68',message:'Cache check result',data:{hasCache:!!cachedResult},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
    // #endregion
    if (cachedResult) {
      return NextResponse.json(cachedResult, {
        headers: {
          'X-Cache': 'HIT',
          'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
        },
      })
    }

    // Start building query
    let dbQuery = supabase
      .from('products')
      .select(`
        *,
        seller:users!products_seller_id_fkey(
          id,
          first_name,
          last_name,
          username,
          avatar_url,
          is_verified_teacher
        ),
        grade:grades!products_grade_id_fkey(
          id,
          name
        ),
        subject:subjects!products_subject_id_fkey(
          id,
          name,
          code
        )
      `, { count: 'exact' })

    // Only show published products
    dbQuery = dbQuery.eq('status', 'published')

    // Apply search query
    // For now, use ILIKE (will be enhanced with full-text search via RPC function)
    if (query) {
      // Try to use full-text search via RPC, fallback to ILIKE
      dbQuery = dbQuery.or(`title.ilike.%${query}%,description.ilike.%${query}%`)
    }

    // Apply filters
    if (gradeId) {
      dbQuery = dbQuery.eq('grade_id', gradeId)
    }

    if (subjectId) {
      dbQuery = dbQuery.eq('subject_id', subjectId)
    }

    if (productType) {
      dbQuery = dbQuery.eq('product_type', productType)
    }

    if (specificType) {
      dbQuery = dbQuery.eq('specific_type', specificType)
    }

    if (quarter) {
      dbQuery = dbQuery.eq('quarter', parseInt(quarter))
    }

    if (minPrice) {
      dbQuery = dbQuery.gte('price', parseFloat(minPrice))
    }

    if (maxPrice) {
      dbQuery = dbQuery.lte('price', parseFloat(maxPrice))
    }

    if (language) {
      dbQuery = dbQuery.eq('language', language)
    }

    // Verified seller filter - filter by seller's is_verified_teacher
    // This requires a join, so we'll filter after fetching or use a more complex query
    // For now, we'll fetch all and filter in memory (not ideal, but works)
    // TODO: Optimize with proper join query

    // Date added filter
    if (dateAdded) {
      const now = new Date()
      let dateFrom: Date
      switch (dateAdded) {
        case 'last_7_days':
          dateFrom = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
          break
        case 'last_30_days':
          dateFrom = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
          break
        case 'last_3_months':
          dateFrom = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
          break
        default:
          dateFrom = new Date(0)
      }
      dbQuery = dbQuery.gte('published_at', dateFrom.toISOString())
    }

    // Apply sorting
    switch (sort) {
      case 'relevance':
        // For relevance with query, prioritize text match, then sales, rating, recency
        if (query) {
          // Use a combination: text match (title first), sales, rating, recency
          // Since Supabase doesn't support complex ranking, we'll fetch and sort in memory
          // For now, order by views_count as proxy for relevance
          dbQuery = dbQuery.order('views_count', { ascending: false })
        } else {
          dbQuery = dbQuery.order('created_at', { ascending: false })
        }
        break
      case 'newest':
        dbQuery = dbQuery.order('published_at', { ascending: false, nullsFirst: false })
          .order('created_at', { ascending: false })
        break
      case 'price_asc':
        dbQuery = dbQuery.order('price', { ascending: true })
        break
      case 'price_desc':
        dbQuery = dbQuery.order('price', { ascending: false })
        break
      case 'best_selling':
        dbQuery = dbQuery.order('sales_count', { ascending: false })
        break
      case 'highest_rated':
        dbQuery = dbQuery.order('avg_rating', { ascending: false, nullsFirst: false })
        break
      default:
        dbQuery = dbQuery.order('created_at', { ascending: false })
    }

    // Apply pagination
    const from = (page - 1) * limit
    const to = from + limit - 1
    dbQuery = dbQuery.range(from, to)

    // Execute query
    // #region agent log
    fetch('http://127.0.0.1:7248/ingest/00d5f2ca-d0b7-44d8-a520-af7d4c8e25e2',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/api/search/route.ts:207',message:'Before database query execution',data:{hasQuery:!!dbQuery},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
    // #endregion
    const { data: products, error, count } = await dbQuery
    // #region agent log
    fetch('http://127.0.0.1:7248/ingest/00d5f2ca-d0b7-44d8-a520-af7d4c8e25e2',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/api/search/route.ts:208',message:'Database query result',data:{hasError:!!error,errorMessage:error?.message,errorCode:error?.code,productsCount:products?.length,count},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
    // #endregion

    if (error) {
      console.error('Error searching products:', error)
      // #region agent log
      fetch('http://127.0.0.1:7248/ingest/00d5f2ca-d0b7-44d8-a520-af7d4c8e25e2',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/api/search/route.ts:210',message:'Database query error detected',data:{error:error?.message,code:error?.code,details:error?.details,hint:error?.hint},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
      // #endregion
      return NextResponse.json(
        { error: 'Failed to search products' },
        { status: 500 }
      )
    }

    // Filter by verified seller if requested (in memory filter)
    // Note: This is not optimal - ideally we'd filter in the database query
    // For now, we filter in memory and adjust the count
    let filteredProducts = products || []
    let adjustedCount = count || 0
    
    // Transform products to add 'name' field for backward compatibility
    // (database now uses first_name + last_name instead of name)
    filteredProducts = filteredProducts.map((p: any) => {
      if (p.seller) {
        const firstName = p.seller.first_name || ''
        const lastName = p.seller.last_name || ''
        p.seller.name = `${firstName} ${lastName}`.trim() || firstName
      }
      return p
    })
    
    if (verifiedSellerOnly) {
      filteredProducts = filteredProducts.filter(
        (p: any) => p.seller?.is_verified_teacher === true
      )
      // Adjust count - this is approximate since we filtered after pagination
      // In production, you'd want to apply this filter in the database query
      adjustedCount = filteredProducts.length
    }

    // Calculate relevance score and sort if relevance sort is requested
    if (sort === 'relevance' && query && filteredProducts.length > 0) {
      filteredProducts = filteredProducts.map((product: any) => {
        const title = product.title?.toLowerCase() || ''
        const description = product.description?.toLowerCase() || ''
        const queryLower = query.toLowerCase()
        
        // Calculate relevance score
        // 40% text match (title > description)
        const titleMatch = title.includes(queryLower) ? 1 : 0
        const descMatch = description.includes(queryLower) ? 0.5 : 0
        const textScore = (titleMatch * 0.4 + descMatch * 0.1) * 0.4
        
        // 25% sales performance (normalized to 0-1)
        const salesScore = Math.min(product.sales_count || 0, 1000) / 1000 * 0.25
        
        // 20% rating quality (normalized to 0-1)
        const ratingScore = ((product.avg_rating || 0) / 5) * 0.2
        
        // 10% recency boost (newer products)
        const publishedDate = product.published_at || product.created_at
        const daysSincePublished = (Date.now() - new Date(publishedDate).getTime()) / (1000 * 60 * 60 * 24)
        const recencyScore = daysSincePublished < 30 ? 0.1 : 0
        
        // 5% seller reputation
        const sellerScore = product.seller?.is_verified_teacher ? 0.05 : 0
        
        const relevanceScore = textScore + salesScore + ratingScore + recencyScore + sellerScore
        
        return {
          ...product,
          _relevance_score: relevanceScore
        }
      }).sort((a: any, b: any) => b._relevance_score - a._relevance_score)
      
      // Remove the temporary score field
      filteredProducts = filteredProducts.map((p: any) => {
        const { _relevance_score, ...rest } = p
        return rest
      })
    }

    // Get "Did you mean?" suggestions if no results
    let suggestions: string[] = []
    if (filteredProducts.length === 0 && query) {
      try {
        // #region agent log
        fetch('http://127.0.0.1:7248/ingest/00d5f2ca-d0b7-44d8-a520-af7d4c8e25e2',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/api/search/route.ts:277',message:'Before createAdminClient for suggestions',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
        // #endregion
        const adminClient = createAdminClient()
        // #region agent log
        fetch('http://127.0.0.1:7248/ingest/00d5f2ca-d0b7-44d8-a520-af7d4c8e25e2',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/api/search/route.ts:279',message:'Admin client created for suggestions',data:{hasClient:!!adminClient},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
        // #endregion
        // Try to get similar queries using trigram similarity
        const { data: similarQueries } = await adminClient
          .from('search_queries')
          .select('query_text')
          .order('search_count', { ascending: false })
          .limit(3)
        
        if (similarQueries && similarQueries.length > 0) {
          suggestions = similarQueries.map((q: any) => q.query_text)
        }
      } catch (err) {
        console.error('Failed to get suggestions:', err)
      }
    }

    // Track search query for analytics (async, don't wait)
    if (query) {
      try {
        const adminClient = createAdminClient()
        await toPromise(adminClient.rpc('upsert_search_query', { p_query_text: query })).catch(() => {
          // If RPC doesn't exist yet, insert directly
          toPromise(
            adminClient
              .from('search_queries')
              .upsert({
                query_text: query,
                search_count: 1,
                last_searched_at: new Date().toISOString()
              }, {
                onConflict: 'query_text',
                ignoreDuplicates: false
              })
          ).catch(() => {}) // Silently fail
        })
      } catch (err) {
        // Silently fail - analytics tracking shouldn't break search
      }
    }

    // Get filter counts (simplified - can be enhanced later)
    // #region agent log
    fetch('http://127.0.0.1:7248/ingest/00d5f2ca-d0b7-44d8-a520-af7d4c8e25e2',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/api/search/route.ts:318',message:'Before getFilterCounts',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
    // #endregion
    const filterCounts = await getFilterCounts(supabase, {
      gradeId,
      subjectId,
      productType,
      specificType,
      quarter,
      minPrice,
      maxPrice,
      language,
      verifiedSellerOnly,
      dateAdded,
      query
    })
    // #region agent log
    fetch('http://127.0.0.1:7248/ingest/00d5f2ca-d0b7-44d8-a520-af7d4c8e25e2',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/api/search/route.ts:330',message:'After getFilterCounts',data:{hasFilterCounts:!!filterCounts},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
    // #endregion

    // Prepare response
    const response = {
      products: filteredProducts,
      query,
      filters: {
        grade_id: gradeId,
        subject_id: subjectId,
        product_type: productType,
        specific_type: specificType,
        quarter,
        min_price: minPrice,
        max_price: maxPrice,
        language,
        verified_seller_only: verifiedSellerOnly,
        date_added: dateAdded,
      },
      sort,
      suggestions,
      filter_counts: filterCounts,
      pagination: {
        page,
        limit,
        total: adjustedCount,
        totalPages: Math.ceil(adjustedCount / limit),
      },
    }

    // Cache the results (async, don't wait)
    setCachedSearchResults(cacheKey, response).catch(err => {
      console.error('Error caching search results:', err)
    })

    // Track search impressions (async, don't wait)
    if (query && filteredProducts.length > 0) {
      const impressions = filteredProducts.map((product: any, index: number) => ({
        productId: product.id,
        searchTerm: query,
        position: index + 1
      }))
      trackSearchImpressions(impressions).catch(err => {
        console.error('Error tracking search impressions:', err)
      })
    }

    // Return results
    // #region agent log
    fetch('http://127.0.0.1:7248/ingest/00d5f2ca-d0b7-44d8-a520-af7d4c8e25e2',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/api/search/route.ts:377',message:'Before returning response',data:{productsCount:response.products.length,totalResults:response.pagination.total},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
    // #endregion
    return NextResponse.json(response, {
      headers: {
        'X-Cache': 'MISS',
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
      },
    })
  } catch (error) {
    console.error('Error in GET /api/search:', error)
    // #region agent log
    fetch('http://127.0.0.1:7248/ingest/00d5f2ca-d0b7-44d8-a520-af7d4c8e25e2',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/api/search/route.ts:384',message:'Top-level catch block',data:{errorMessage:error instanceof Error?error.message:String(error),errorStack:error instanceof Error?error.stack:undefined},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
    // #endregion
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Get filter counts for each filter option
async function getFilterCounts(
  supabase: any,
  activeFilters: {
    gradeId?: string | null
    subjectId?: string | null
    productType?: string | null
    specificType?: string | null
    quarter?: string | null
    minPrice?: string | null
    maxPrice?: string | null
    language?: string | null
    verifiedSellerOnly?: boolean
    dateAdded?: string | null
    query?: string
  }
) {
  // Simplified version - return empty for now
  // In production, you'd want to get counts for each filter option
  // while keeping other active filters applied
  // This requires multiple queries or a more complex SQL query
  return {}
}
