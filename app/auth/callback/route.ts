import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const error = requestUrl.searchParams.get('error')
  const errorDescription = requestUrl.searchParams.get('error_description')
  const next = requestUrl.searchParams.get('next') || '/marketplace'

  // Handle OAuth errors from provider
  if (error) {
    console.error('OAuth error:', error, errorDescription)
    const loginUrl = new URL('/login', requestUrl.origin)
    loginUrl.searchParams.set(
      'error',
      errorDescription || 'Authentication failed. Please try again.'
    )
    return NextResponse.redirect(loginUrl)
  }

  // Handle missing code parameter
  if (!code) {
    console.error('Missing authorization code in callback')
    const loginUrl = new URL('/login', requestUrl.origin)
    loginUrl.searchParams.set('error', 'Authentication failed. Please try again.')
    return NextResponse.redirect(loginUrl)
  }

  try {
    const supabase = await createClient()
    
    // Exchange code for session
    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
    
    if (exchangeError) {
      console.error('Error exchanging code for session:', exchangeError)
      const loginUrl = new URL('/login', requestUrl.origin)
      loginUrl.searchParams.set(
        'error',
        exchangeError.message || 'Failed to complete authentication. Please try again.'
      )
      return NextResponse.redirect(loginUrl)
    }

    // After OAuth, check if user profile exists, if not create it
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError) {
      console.error('Error getting user:', userError)
      const loginUrl = new URL('/login', requestUrl.origin)
      loginUrl.searchParams.set('error', 'Failed to retrieve user information. Please try again.')
      return NextResponse.redirect(loginUrl)
    }

    if (user) {
      // Validate user has email (required for profile creation)
      if (!user.email) {
        console.error('User missing email address')
        const loginUrl = new URL('/login', requestUrl.origin)
        loginUrl.searchParams.set(
          'error',
          'Your account must have an email address. Please use a different account or sign up with email.'
        )
        return NextResponse.redirect(loginUrl)
      }

      // Check if profile exists
      const { data: profile, error: profileCheckError } = await supabase
        .from('users')
        .select('id')
        .eq('id', user.id)
        .single()

      // Handle profile check errors (ignore if it's just "not found")
      if (profileCheckError && profileCheckError.code !== 'PGRST116') {
        console.error('Error checking profile:', profileCheckError)
        // Continue anyway - we'll try to create the profile
      }

      // If profile doesn't exist, create it
      if (!profile) {
        // Extract name from user metadata (works for Google, Facebook, and other providers)
        // Facebook provides: name, full_name
        // Google provides: name, full_name
        const name =
          user.user_metadata?.name ||
          user.user_metadata?.full_name ||
          user.user_metadata?.display_name ||
          user.user_metadata?.first_name && user.user_metadata?.last_name
            ? `${user.user_metadata.first_name} ${user.user_metadata.last_name}`
            : user.email.split('@')[0]

        const { error: insertError } = await supabase.from('users').insert({
          id: user.id,
          email: user.email,
          name,
          username: user.email.split('@')[0], // Temporary username
          role: 'buyer',
          is_verified_teacher: false,
          can_sell: false,
          email_verified: user.email_confirmed_at ? true : false,
        })

        if (insertError) {
          // Log error but don't block user - they can still use the app
          // Profile might already exist from a previous attempt
          console.error('Error creating profile:', insertError)
          // Check if it's a duplicate key error (user already exists)
          if (insertError.code !== '23505') {
            // Only redirect on non-duplicate errors
            const loginUrl = new URL('/login', requestUrl.origin)
            loginUrl.searchParams.set(
              'error',
              'Account created but profile setup failed. Please contact support.'
            )
            return NextResponse.redirect(loginUrl)
          }
        }
      }
    } else {
      console.error('No user found after OAuth')
      const loginUrl = new URL('/login', requestUrl.origin)
      loginUrl.searchParams.set('error', 'Authentication failed. Please try again.')
      return NextResponse.redirect(loginUrl)
    }

    // Success - redirect to intended destination
    return NextResponse.redirect(new URL(next, requestUrl.origin))
  } catch (err) {
    // Catch any unexpected errors
    console.error('Unexpected error in OAuth callback:', err)
    const loginUrl = new URL('/login', requestUrl.origin)
    loginUrl.searchParams.set('error', 'An unexpected error occurred. Please try again.')
    return NextResponse.redirect(loginUrl)
  }
}
