import { createClient } from '@/lib/supabase/server'
import { Suspense } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { UserProfileCard } from '@/components/profiles/user-profile-card'
import type { User } from '@/lib/utils/profile'

interface SearchParams {
  search?: string
  subject?: string
  grade?: string
  location?: string
  tier?: string
  rating?: string
  sort?: string
  page?: string
}

interface PageProps {
  searchParams: Promise<SearchParams>
}

/**
 * Seller Search/Discovery Page
 * 
 * Server Component with search and filters
 * 
 * Features:
 * - Search bar with autocomplete (display name, username, bio)
 * - Filters: Subject, Grade Level, Location, Seller Tier, Rating
 * - Sort options: Relevance, Most Products, Highest Rated, Most Followers, Recently Joined
 * - Results grid: 2 columns mobile, 4 columns desktop
 * 
 * Reference: docs/brainstorming/3-feature-02-user-profiles-and-profile-management.md lines 321-358
 */
export default async function SellersPage({ searchParams }: PageProps) {
  const params = await searchParams
  const supabase = await createClient()

  // Parse search parameters
  const search = params.search || ''
  const subject = params.subject
  const grade = params.grade
  const location = params.location
  const tier = params.tier
  const rating = params.rating
  const sort = params.sort || 'relevance'
  const page = parseInt(params.page || '1', 10)
  const limit = 24
  const offset = (page - 1) * limit

  // Build query
  let query = supabase
    .from('users')
    .select('*', { count: 'exact' })
    .eq('role', 'seller') // Only sellers
    .eq('can_sell', true) // Only those who can sell

  // Apply search filter
  if (search) {
    // Search in name, username, or bio
    query = query.or(
      `name.ilike.%${search}%,username.ilike.%${search}%,bio.ilike.%${search}%`
    )
  }

  // Apply subject filter
  if (subject) {
    query = query.contains('subjects_taught', [subject])
  }

  // Apply grade filter
  if (grade) {
    query = query.contains('grade_levels_taught', [grade])
  }

  // Apply location filter
  if (location) {
    query = query.or(`location_city.ilike.%${location}%,location_region.ilike.%${location}%`)
  }

  // Apply tier filter
  if (tier && tier !== 'all') {
    if (tier === 'pioneer') {
      query = query.eq('is_pioneer', true)
    } else {
      query = query.eq('subscription_tier', tier)
    }
  }

  // Apply rating filter (will work once reviews exist)
  // For now, skip rating filter

  // Apply sorting
  switch (sort) {
    case 'most_products':
      // Will sort by products count once products exist
      query = query.order('created_at', { ascending: false })
      break
    case 'highest_rated':
      // Will sort by avg_rating once reviews exist
      query = query.order('created_at', { ascending: false })
      break
    case 'most_followers':
      query = query.order('followers_count', { ascending: false })
      break
    case 'recently_joined':
      query = query.order('created_at', { ascending: false })
      break
    case 'relevance':
    default:
      // Relevance: verified first, then by followers, then by created_at
      query = query
        .order('is_verified_teacher', { ascending: false })
        .order('followers_count', { ascending: false })
        .order('created_at', { ascending: false })
  }

  // Apply pagination
  query = query.range(offset, offset + limit - 1)

  const { data: sellers, error, count } = await query

  if (error) {
    console.error('Error fetching sellers:', error)
  }

  // Get available subjects and grades for filters
  const { data: subjects } = await supabase
    .from('subjects')
    .select('id, name')
    .eq('is_active', true)
    .order('name')

  const { data: grades } = await supabase
    .from('grades')
    .select('id, name')
    .eq('is_active', true)
    .order('sort_order')

  const totalPages = Math.ceil((count || 0) / limit)

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <h1 className="text-3xl font-bold mb-8">Find Teachers</h1>

      {/* Search and Filters */}
      <Card className="mb-8">
        <CardContent className="pt-6">
          <SellersSearchForm
            initialSearch={search}
            initialSubject={subject}
            initialGrade={grade}
            initialLocation={location}
            initialTier={tier}
            initialRating={rating}
            initialSort={sort}
            subjects={subjects || []}
            grades={grades || []}
          />
        </CardContent>
      </Card>

      {/* Results */}
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {count || 0} {count === 1 ? 'seller' : 'sellers'} found
        </p>
      </div>

      {/* Results Grid */}
      {sellers && sellers.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {sellers.map((seller) => (
            <UserProfileCard key={seller.id} user={seller as User} />
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="pt-6 text-center text-muted-foreground">
            No sellers found. Try adjusting your search or filters.
          </CardContent>
        </Card>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2">
          {page > 1 && (
            <a
              href={`/sellers?${new URLSearchParams({
                ...params,
                page: String(page - 1),
              }).toString()}`}
              className="px-4 py-2 border rounded-md hover:bg-muted"
            >
              Previous
            </a>
          )}
          {Array.from({ length: totalPages }, (_, i) => i + 1)
            .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 2)
            .map((p, idx, arr) => (
              <span key={p}>
                {idx > 0 && arr[idx - 1] !== p - 1 && <span className="px-2">...</span>}
                {p === page ? (
                  <span className="px-4 py-2 border rounded-md bg-primary text-primary-foreground">
                    {p}
                  </span>
                ) : (
                  <a
                    href={`/sellers?${new URLSearchParams({
                      ...params,
                      page: String(p),
                    }).toString()}`}
                    className="px-4 py-2 border rounded-md hover:bg-muted"
                  >
                    {p}
                  </a>
                )}
              </span>
            ))}
          {page < totalPages && (
            <a
              href={`/sellers?${new URLSearchParams({
                ...params,
                page: String(page + 1),
              }).toString()}`}
              className="px-4 py-2 border rounded-md hover:bg-muted"
            >
              Next
            </a>
          )}
        </div>
      )}
    </div>
  )
}

/**
 * Client Component for Search Form
 */
function SellersSearchForm({
  initialSearch,
  initialSubject,
  initialGrade,
  initialLocation,
  initialTier,
  initialRating,
  initialSort,
  subjects,
  grades,
}: {
  initialSearch?: string
  initialSubject?: string
  initialGrade?: string
  initialLocation?: string
  initialTier?: string
  initialRating?: string
  initialSort?: string
  subjects: { id: string; name: string }[]
  grades: { id: string; name: string }[]
}) {
  return (
    <form method="GET" action="/sellers" className="space-y-4">
      {/* Search Bar */}
      <div>
        <Input
          name="search"
          type="text"
          placeholder="Search by name, username, or bio..."
          defaultValue={initialSearch}
        />
      </div>

      {/* Filters Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Subject Filter */}
        <div>
          <label className="text-xs font-medium mb-1 block">Subject</label>
          <select
            name="subject"
            defaultValue={initialSubject}
            className="w-full h-7 rounded-md border border-input bg-input/20 dark:bg-input/30 px-2 py-0.5 text-sm"
          >
            <option value="">All Subjects</option>
            {subjects.map((subject) => (
              <option key={subject.id} value={subject.name}>
                {subject.name}
              </option>
            ))}
          </select>
        </div>

        {/* Grade Filter */}
        <div>
          <label className="text-xs font-medium mb-1 block">Grade Level</label>
          <select
            name="grade"
            defaultValue={initialGrade}
            className="w-full h-7 rounded-md border border-input bg-input/20 dark:bg-input/30 px-2 py-0.5 text-sm"
          >
            <option value="">All Grades</option>
            {grades.map((grade) => (
              <option key={grade.id} value={grade.name}>
                {grade.name}
              </option>
            ))}
          </select>
        </div>

        {/* Location Filter */}
        <div>
          <label className="text-xs font-medium mb-1 block">Location</label>
          <Input
            name="location"
            type="text"
            placeholder="City or Region"
            defaultValue={initialLocation}
          />
        </div>

        {/* Tier Filter */}
        <div>
          <label className="text-xs font-medium mb-1 block">Seller Tier</label>
          <select
            name="tier"
            defaultValue={initialTier}
            className="w-full h-7 rounded-md border border-input bg-input/20 dark:bg-input/30 px-2 py-0.5 text-sm"
          >
            <option value="all">All</option>
            <option value="pioneer">Pioneer</option>
            <option value="pro">Pro</option>
            <option value="verified">Verified</option>
          </select>
        </div>

        {/* Rating Filter */}
        <div>
          <label className="text-xs font-medium mb-1 block">Rating</label>
          <select
            name="rating"
            defaultValue={initialRating}
            className="w-full h-7 rounded-md border border-input bg-input/20 dark:bg-input/30 px-2 py-0.5 text-sm"
          >
            <option value="">All Ratings</option>
            <option value="5">5 Stars</option>
            <option value="4.5">4.5+ Stars</option>
            <option value="4">4+ Stars</option>
          </select>
        </div>
      </div>

      {/* Sort and Submit */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <label className="text-xs font-medium">Sort by:</label>
          <select
            name="sort"
            defaultValue={initialSort}
            className="h-7 rounded-md border border-input bg-input/20 dark:bg-input/30 px-2 py-0.5 text-sm"
          >
            <option value="relevance">Relevance</option>
            <option value="most_products">Most Products</option>
            <option value="highest_rated">Highest Rated</option>
            <option value="most_followers">Most Followers</option>
            <option value="recently_joined">Recently Joined</option>
          </select>
        </div>
        <button
          type="submit"
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/80 text-sm font-medium"
        >
          Search
        </button>
      </div>
    </form>
  )
}
