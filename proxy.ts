import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  // Check if remember me is enabled (90 days = 7776000 seconds)
  const REMEMBER_ME_COOKIE_NAME = 'sb-remember-me'
  const rememberMe = request.cookies.get(REMEMBER_ME_COOKIE_NAME)?.value === 'true'
  const cookieMaxAge = rememberMe ? 7776000 : undefined // 90 days in seconds, or undefined for session cookie

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value)
          })
          
          response = NextResponse.next({
            request,
          })
          
          cookiesToSet.forEach(({ name, value, options }) => {
            // Apply remember me maxAge to Supabase auth cookies (sb-access-token, sb-refresh-token)
            if (name.startsWith('sb-') && name !== REMEMBER_ME_COOKIE_NAME) {
              const cookieOptions = { ...options }
              
              if (cookieMaxAge !== undefined) {
                // Set maxAge for 90-day persistence when rememberMe is true
                cookieOptions.maxAge = cookieMaxAge
              }
              // If cookieMaxAge is undefined, don't set maxAge - this makes it a session cookie
              
              response.cookies.set(name, value, cookieOptions)
            } else {
              // For non-Supabase cookies, use original options
              response.cookies.set(name, value, options)
            }
          })
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const matchesPathSegment = (path: string) =>
    request.nextUrl.pathname === path ||
    request.nextUrl.pathname.startsWith(`${path}/`)

  const redirectWithSessionCookies = (url: URL) => {
    const redirectResponse = NextResponse.redirect(url)
    response.cookies.getAll().forEach((cookie) => {
      redirectResponse.cookies.set(cookie)
    })
    return redirectResponse
  }

  // Redirect root path to /marketplace (unless it's an OAuth callback)
  if (request.nextUrl.pathname === '/') {
    const code = request.nextUrl.searchParams.get('code')
    const error = request.nextUrl.searchParams.get('error')
    // Only redirect if it's not an OAuth callback
    if (!code && !error) {
      return redirectWithSessionCookies(new URL('/marketplace', request.url))
    }
  }

  // Redirect old /dashboard/* routes to /shop/*
  if (matchesPathSegment('/dashboard')) {
    const newPath = request.nextUrl.pathname.replace(/^\/dashboard/, '/shop')
    const newUrl = new URL(newPath, request.url)
    newUrl.search = request.nextUrl.search // Preserve query parameters
    return redirectWithSessionCookies(newUrl)
  }

  // Protected routes that require authentication
  const isProtectedRoute =
    matchesPathSegment('/shop') ||
    matchesPathSegment('/admin') ||
    matchesPathSegment('/checkout') ||
    matchesPathSegment('/seller')

  // Auth routes (login, signup)
  const isAuthRoute =
    matchesPathSegment('/login') ||
    matchesPathSegment('/signup')

  // Redirect to login if accessing protected route without session
  if (isProtectedRoute && !user) {
    const redirectUrl = new URL('/login', request.url)
    // Preserve full pathname and query params in redirect
    const fullPath = request.nextUrl.pathname + request.nextUrl.search
    redirectUrl.searchParams.set('redirect', fullPath)
    return redirectWithSessionCookies(redirectUrl)
  }

  // Redirect to marketplace if accessing auth route with session
  if (isAuthRoute && user) {
    return redirectWithSessionCookies(new URL('/marketplace', request.url))
  }

  // Admin routes - check role
  if (matchesPathSegment('/admin')) {
    if (!user) {
      return redirectWithSessionCookies(new URL('/login', request.url))
    }

    const { data: adminRole, error: adminError } = await supabase.rpc('current_admin_role')

    const validAdminRoles = ['super_admin', 'moderator', 'content_manager']
    if (
      adminError ||
      typeof adminRole !== 'string' ||
      !validAdminRoles.includes(adminRole)
    ) {
      return redirectWithSessionCookies(new URL('/', request.url))
    }

    // Super Admin only routes
    const superAdminOnlyRoutes = ['/admin/financials']
    const isSuperAdminOnlyRoute = superAdminOnlyRoutes.some(matchesPathSegment)

    if (isSuperAdminOnlyRoute && adminRole !== 'super_admin') {
      return redirectWithSessionCookies(new URL('/admin', request.url))
    }
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
