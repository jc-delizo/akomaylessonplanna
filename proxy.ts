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

  // Redirect old /dashboard/* routes to /shop/*
  if (request.nextUrl.pathname.startsWith('/dashboard')) {
    const newPath = request.nextUrl.pathname.replace(/^\/dashboard/, '/shop')
    const newUrl = new URL(newPath, request.url)
    newUrl.search = request.nextUrl.search // Preserve query parameters
    return NextResponse.redirect(newUrl)
  }

  // Protected routes that require authentication
  const isProtectedRoute =
    request.nextUrl.pathname.startsWith('/shop') ||
    request.nextUrl.pathname.startsWith('/admin') ||
    request.nextUrl.pathname.startsWith('/checkout') ||
    request.nextUrl.pathname.startsWith('/seller')

  // Auth routes (login, signup)
  const isAuthRoute =
    request.nextUrl.pathname.startsWith('/login') ||
    request.nextUrl.pathname.startsWith('/signup')

  // Redirect to login if accessing protected route without session
  if (isProtectedRoute && !user) {
    const redirectUrl = new URL('/login', request.url)
    // Preserve full pathname and query params in redirect
    const fullPath = request.nextUrl.pathname + request.nextUrl.search
    redirectUrl.searchParams.set('redirect', fullPath)
    return NextResponse.redirect(redirectUrl)
  }

  // Redirect to marketplace if accessing auth route with session
  if (isAuthRoute && user) {
    return NextResponse.redirect(new URL('/marketplace', request.url))
  }

  // Admin routes - check role
  if (request.nextUrl.pathname.startsWith('/admin')) {
    if (!user) {
      return NextResponse.redirect(new URL('/login', request.url))
    }

    // Check if user is admin - first check role (always exists)
    const { data: roleData } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    // If not admin role, redirect
    if (!roleData || roleData.role !== 'admin') {
      return NextResponse.redirect(new URL('/', request.url))
    }

    // User has admin role - try to get admin_role (may not exist if migration not applied)
    let adminRole: string | null = 'super_admin' // Default if column missing
    const { data: adminRoleData } = await supabase
      .from('users')
      .select('admin_role')
      .eq('id', user.id)
      .single()

    if (adminRoleData?.admin_role) {
      adminRole = adminRoleData.admin_role
    }

    // Super Admin only routes
    const superAdminOnlyRoutes = ['/admin/financials']
    const isSuperAdminOnlyRoute = superAdminOnlyRoutes.some((route) =>
      request.nextUrl.pathname.startsWith(route)
    )

    if (isSuperAdminOnlyRoute && adminRole !== 'super_admin') {
      return NextResponse.redirect(new URL('/admin', request.url))
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
