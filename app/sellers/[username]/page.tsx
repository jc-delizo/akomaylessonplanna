import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { toPromise } from '@/lib/utils/supabase-promise'
import { Button } from '@/components/ui/button'
import { BadgeDisplay } from '@/components/profiles/badge-display'
import { FollowButton } from '@/components/profiles/follow-button'
import { getUserBadges, formatProfileUrl, getInitials, getFullName } from '@/lib/utils/profile'
import { Avatar, AvatarImage, AvatarFallback } from '@/registry/default/avatar/avatar'
import Link from 'next/link'
import { SellerReviewsSection } from '@/components/sellers/seller-reviews-section'
import { ShareButtons } from '@/components/social/share-buttons'

interface PageProps {
  params: Promise<{ username: string }>
}

/**
 * Public Seller Profile Page
 * 
 * Displays seller profile with all sections:
 * - Header: Banner, Avatar, Name + Username, Badges, Follow button, Contact button, Share button
 * - Stats: Total products, Total sales, Average rating, Response time, Followers count
 * - About: Bio, Subjects taught, Grade levels, Location, Member since, Social links
 * - Featured Products (Pro/Pioneer only): Up to 6 manually selected
 * - All Products: Grid with sort/filter options
 * - Reviews: Top 3 most recent
 * 
 * Reference: docs/brainstorming/3-feature-02-user-profiles-and-profile-management.md lines 69-121
 */
export default async function SellerProfilePage({ params }: PageProps) {
  const { username } = await params
  const supabase = await createClient()

  // Get current user (if authenticated) for follow button and "View as Public" toggle
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser()

  // Fetch seller profile directly from database
  const { data: user, error: userError } = await supabase
    .from('users')
    .select(
      `
      id,
      name,
      username,
      avatar_url,
      bio,
      subjects_taught,
      grade_levels_taught,
      location_city,
      location_region,
      social_links,
      banner_url,
      custom_accent_color,
      profile_completion_percent,
      followers_count,
      response_time_hours,
      role,
      is_verified_teacher,
      can_sell,
      subscription_tier,
      is_pioneer,
      email,
      created_at
    `
    )
    .eq('username', username)
    .single()

  if (userError || !user) {
    notFound()
  }

  // Only return seller profiles (or admin for testing)
  if (user.role !== 'seller' && user.role !== 'admin') {
    notFound()
  }

  // Track profile view (insert into profile_views)
  // This is done asynchronously, so we don't wait for it
  toPromise(
    supabase
      .from('profile_views')
      .insert({
        profile_user_id: user.id,
        viewer_id: authUser?.id || null,
      })
  )
    .then(() => {})
    .catch((error) => {
      // Log error but don't fail the request
      console.error('Failed to track profile view:', error)
    })

  // Get products count (when products table exists)
  // For now, return 0
  const productsCount = 0

  // Get sales count (when orders exist)
  // For now, return 0
  const salesCount = 0

  // Get average rating (when reviews exist)
  // For now, return null
  const avgRating = null

  // Build public profile response (only public fields)
  const profile = {
    ...user,
    products_count: productsCount,
    sales_count: salesCount,
    avg_rating: avgRating as number | null,
  }

  if (!profile || (profile.role !== 'seller' && profile.role !== 'admin')) {
    notFound()
  }

  const badges = getUserBadges(profile)
  const isOwnProfile = authUser?.id === profile.id

  // Get full name and initials
  const fullName = getFullName(profile)

  // Format member since date
  const memberSince = new Date(profile.created_at).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
  })

  // Format response time
  const formatResponseTime = (hours: number | null) => {
    if (!hours) return null
    if (hours <= 24) return 'Usually responds within 24 hours'
    if (hours <= 48) return 'Usually responds within 2 days'
    return `Usually responds within ${Math.ceil(hours / 24)} days`
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  const profileUrl = `${baseUrl}/sellers/${profile.username}`

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Header Section */}
      <div className="relative mb-6">
        {/* Banner */}
        {profile.banner_url ? (
          <div className="relative h-48 md:h-64 lg:h-80 w-full rounded-lg overflow-hidden">
            <img
              src={profile.banner_url}
              alt={`${fullName} banner`}
              className="w-full h-full object-cover"
            />
          </div>
        ) : (
          <div className="h-48 md:h-64 lg:h-80 w-full rounded-lg bg-muted" />
        )}

        {/* Profile Picture Overlay */}
        <div className="absolute -bottom-12 left-4 md:left-8">
          <Avatar className="h-24 w-24 md:h-32 md:w-32 border-4 border-background">
            {profile.avatar_url && <AvatarImage src={profile.avatar_url} alt={fullName} />}
            <AvatarFallback className="text-lg md:text-2xl">
              {getInitials(profile.first_name, profile.last_name)}
            </AvatarFallback>
          </Avatar>
        </div>

        {/* Action Buttons */}
        <div className="absolute top-4 right-4 flex gap-2">
          {isOwnProfile ? (
            <Link href="/profile/edit">
              <Button variant="outline" size="sm">
                Edit Profile
              </Button>
            </Link>
          ) : (
            <>
              <FollowButton
                username={profile.username}
                initialFollowersCount={profile.followers_count}
                className="flex items-center gap-2"
              />
              <Link href={`/messages/new?sellerId=${profile.id}`}>
                <Button variant="outline" size="sm">
                  Contact Seller
                  {profile.response_time_hours !== undefined &&
                    profile.response_time_hours !== null && (
                      <span className="ml-2 text-xs text-muted-foreground">
                        ⏱️ Responds within {profile.response_time_hours}h
                      </span>
                    )}
                </Button>
              </Link>
              <ShareButtons
                productUrl={`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/sellers/${profile.username}`}
                productId={profile.id}
                platform="seller"
              />
            </>
          )}
        </div>
      </div>

      {/* Profile Info Section */}
      <div className="mt-16 md:mt-20 mb-8">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">{fullName}</h1>
            {profile.username && (
              <p className="text-muted-foreground">@{profile.username}</p>
            )}
            {badges.length > 0 && <BadgeDisplay badges={badges} className="mt-2" />}
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <Card className="mb-8">
        <CardContent className="pt-6">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold">{profile.products_count || 0}</div>
              <div className="text-xs text-muted-foreground">Products</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{profile.sales_count || 0}</div>
              <div className="text-xs text-muted-foreground">Sales</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">
                {profile.avg_rating ? (profile.avg_rating as number).toFixed(1) : '—'}
              </div>
              <div className="text-xs text-muted-foreground">Rating</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{profile.followers_count}</div>
              <div className="text-xs text-muted-foreground">Followers</div>
            </div>
            <div className="text-center">
              <div className="text-sm font-medium">
                {formatResponseTime(profile.response_time_hours) || '—'}
              </div>
              <div className="text-xs text-muted-foreground">Response Time</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - About Section */}
        <div className="lg:col-span-1">
          <Card className="sticky top-4">
            <CardHeader>
              <CardTitle>About</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {profile.bio && (
                <div>
                  <p className="text-sm whitespace-pre-line">{profile.bio}</p>
                </div>
              )}

              {profile.subjects_taught && profile.subjects_taught.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium mb-2">Subjects Taught</h3>
                  <div className="flex flex-wrap gap-2">
                    {profile.subjects_taught.map((subject: string) => (
                      <span
                        key={subject}
                        className="text-xs px-2 py-1 bg-muted rounded-md"
                      >
                        {subject}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {profile.grade_levels_taught && profile.grade_levels_taught.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium mb-2">Grade Levels</h3>
                  <div className="flex flex-wrap gap-2">
                    {profile.grade_levels_taught.map((grade: string) => (
                      <span
                        key={grade}
                        className="text-xs px-2 py-1 bg-muted rounded-md"
                      >
                        {grade}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {(profile.location_city || profile.location_region) && (
                <div>
                  <h3 className="text-sm font-medium mb-1">Location</h3>
                  <p className="text-sm text-muted-foreground">
                    {[profile.location_city, profile.location_region].filter(Boolean).join(', ')}
                  </p>
                </div>
              )}

              <div>
                <h3 className="text-sm font-medium mb-1">Member Since</h3>
                <p className="text-sm text-muted-foreground">{memberSince}</p>
              </div>

              {profile.social_links && (
                <div>
                  <h3 className="text-sm font-medium mb-2">Social Links</h3>
                  <div className="flex gap-2">
                    {profile.social_links.facebook && (
                      <a
                        href={profile.social_links.facebook}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-primary hover:underline"
                      >
                        Facebook
                      </a>
                    )}
                    {profile.social_links.instagram && (
                      <a
                        href={profile.social_links.instagram}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-primary hover:underline"
                      >
                        Instagram
                      </a>
                    )}
                    {profile.social_links.youtube && (
                      <a
                        href={profile.social_links.youtube}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-primary hover:underline"
                      >
                        YouTube
                      </a>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Products and Reviews */}
        <div className="lg:col-span-2 space-y-8">
          {/* Featured Products (Pro/Pioneer only) */}
          {(profile.subscription_tier === 'pro' || profile.subscription_tier === 'pioneer') && (
            <Card>
              <CardHeader>
                <CardTitle>Featured Products</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Featured products will appear here once products are available.
                </p>
              </CardContent>
            </Card>
          )}

          {/* All Products */}
          <Card>
            <CardHeader>
              <CardTitle>All Products</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Products will appear here once the product listings feature is implemented.
              </p>
            </CardContent>
          </Card>

          {/* Reviews */}
          <SellerReviewsSection username={username} />
        </div>
      </div>
    </div>
  )
}

// Generate metadata for SEO and Open Graph
export async function generateMetadata({ params }: PageProps) {
  const { username } = await params
  const supabase = await createClient()

  const { data: user } = await supabase
    .from('users')
    .select('name, username, bio, avatar_url, banner_url')
    .eq('username', username)
    .single()

  if (!user) {
    return {
      title: 'Seller Not Found',
    }
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  const profileUrl = `${baseUrl}/sellers/${username}`

  return {
    title: `${getFullName(user)} - Seller Profile | AKOMAYLESSONPLANNA`,
    description: user.bio || `View ${getFullName(user)}'s products and reviews on AKOMAYLESSONPLANNA`,
    openGraph: {
      title: `${getFullName(user)} - Seller Profile`,
      description: user.bio || `View ${getFullName(user)}'s products and reviews on AKOMAYLESSONPLANNA`,
      url: profileUrl,
      type: 'profile',
      images: user.banner_url || user.avatar_url ? [user.banner_url || user.avatar_url || ''] : [],
      siteName: 'AKOMAYLESSONPLANNA',
    },
  }
}
