'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'

const CACHE_KEY = 'supabase.auth.user'
const REMEMBER_ME_KEY = 'supabase.auth.rememberMe'

// Cache helper functions
function getCachedUser(): User | null {
  if (typeof window === 'undefined') return null
  try {
    const cached = localStorage.getItem(CACHE_KEY)
    if (!cached) return null
    return JSON.parse(cached) as User
  } catch (error) {
    // Handle localStorage errors (private browsing, etc.)
    console.warn('Failed to read cached user:', error)
    return null
  }
}

function setCachedUser(user: User | null): void {
  if (typeof window === 'undefined') return
  try {
    if (user) {
      localStorage.setItem(CACHE_KEY, JSON.stringify(user))
    } else {
      localStorage.removeItem(CACHE_KEY)
    }
  } catch (error) {
    // Handle localStorage errors gracefully
    console.warn('Failed to cache user:', error)
  }
}

function clearCachedUser(): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.removeItem(CACHE_KEY)
  } catch (error) {
    console.warn('Failed to clear cached user:', error)
  }
}

// Remember Me helper functions
function setRememberMePreference(rememberMe: boolean): void {
  if (typeof window === 'undefined') return
  try {
    if (rememberMe) {
      localStorage.setItem(REMEMBER_ME_KEY, 'true')
    } else {
      localStorage.removeItem(REMEMBER_ME_KEY)
    }
  } catch (error) {
    console.warn('Failed to set remember me preference:', error)
  }
}

function getRememberMePreference(): boolean {
  if (typeof window === 'undefined') return false
  try {
    return localStorage.getItem(REMEMBER_ME_KEY) === 'true'
  } catch (error) {
    console.warn('Failed to read remember me preference:', error)
    return false
  }
}

function clearRememberMePreference(): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.removeItem(REMEMBER_ME_KEY)
    // Also clear the cookie
    document.cookie = 'sb-remember-me=; path=/; max-age=0; SameSite=Lax'
  } catch (error) {
    console.warn('Failed to clear remember me preference:', error)
  }
}

function setRememberMeCookie(rememberMe: boolean): void {
  if (typeof window === 'undefined') return
  try {
    if (rememberMe) {
      // Set cookie with 90 days expiry (7776000 seconds)
      const maxAge = 90 * 24 * 60 * 60 // 90 days in seconds
      document.cookie = `sb-remember-me=true; path=/; max-age=${maxAge}; SameSite=Lax`
    } else {
      // Clear the cookie
      document.cookie = 'sb-remember-me=; path=/; max-age=0; SameSite=Lax'
    }
  } catch (error) {
    console.warn('Failed to set remember me cookie:', error)
  }
}

export function useAuth() {
  // Initialize state from cache synchronously for instant UI
  const [user, setUser] = useState<User | null>(() => getCachedUser())
  const [loading, setLoading] = useState(() => getCachedUser() === null)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    // Get initial session and verify cache validity
    supabase.auth.getSession().then(({ data: { session } }) => {
      const sessionUser = session?.user ?? null
      
      // Verify cache matches session
      const cachedUser = getCachedUser()
      if (sessionUser) {
        // Session exists - update cache if different
        if (!cachedUser || cachedUser.id !== sessionUser.id) {
          setCachedUser(sessionUser)
        }
        setUser(sessionUser)
      } else {
        // No session - clear cache if it exists
        if (cachedUser) {
          clearCachedUser()
        }
        setUser(null)
      }
      setLoading(false)
    })

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      const sessionUser = session?.user ?? null
      
      // Update cache on auth state change
      if (sessionUser) {
        setCachedUser(sessionUser)
      } else {
        clearCachedUser()
      }
      
      setUser(sessionUser)
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [supabase])

  const login = async (email: string, password: string, rememberMe: boolean = false) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) throw error
    
    // Store remember me preference and set cookie
    setRememberMePreference(rememberMe)
    setRememberMeCookie(rememberMe)
    
    // Cache user on successful login
    if (data.user) {
      setCachedUser(data.user)
    }
    
    return data
  }

  const signup = async (email: string, password: string, name: string, rememberMe: boolean = false) => {
    // #region agent log
    fetch('http://127.0.0.1:7248/ingest/00d5f2ca-d0b7-44d8-a520-af7d4c8e25e2',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'useAuth.ts:42',message:'signup entry',data:{email,name},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A,B,C,D'})}).catch(()=>{});
    // #endregion
    // Sign up with Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name,
          role: 'buyer',
        },
        // DO NOT require email confirmation for buyers
        emailRedirectTo: undefined,
      },
    })

    // #region agent log
    fetch('http://127.0.0.1:7248/ingest/00d5f2ca-d0b7-44d8-a520-af7d4c8e25e2',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'useAuth.ts:57',message:'auth signup result',data:{hasUser:!!authData?.user,userId:authData?.user?.id,userEmail:authData?.user?.email,authError:authError?.message,authErrorCode:authError?.code},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B,C'})}).catch(()=>{});
    // #endregion

    if (authError) throw authError
    if (!authData.user) throw new Error('Failed to create user')

    // #region agent log
    const sessionCheck = await supabase.auth.getSession();
    fetch('http://127.0.0.1:7248/ingest/00d5f2ca-d0b7-44d8-a520-af7d4c8e25e2',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'useAuth.ts:139',message:'session before insert',data:{hasSession:!!sessionCheck.data.session,sessionUserId:sessionCheck.data.session?.user?.id,authUidMatches:sessionCheck.data.session?.user?.id===authData.user.id},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B,D,E'})}).catch(()=>{});
    // #endregion

    // Check if profile already exists (Hypothesis A)
    // #region agent log
    const existingProfileCheck = await supabase.from('users').select('id,email,username').eq('id', authData.user.id).maybeSingle();
    fetch('http://127.0.0.1:7248/ingest/00d5f2ca-d0b7-44d8-a520-af7d4c8e25e2',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'useAuth.ts:143',message:'check existing profile',data:{profileExists:!!existingProfileCheck.data,profileId:existingProfileCheck.data?.id,profileEmail:existingProfileCheck.data?.email,profileUsername:existingProfileCheck.data?.username,checkError:existingProfileCheck.error?.message},timestamp:Date.now(),sessionId:'debug-session',runId:'post-fix',hypothesisId:'A'})}).catch(()=>{});
    // #endregion

    // If profile already exists, skip insert (user may have signed up before)
    if (existingProfileCheck.data) {
      // #region agent log
      fetch('http://127.0.0.1:7248/ingest/00d5f2ca-d0b7-44d8-a520-af7d4c8e25e2',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'useAuth.ts:148',message:'profile exists, skipping insert',data:{profileId:existingProfileCheck.data.id},timestamp:Date.now(),sessionId:'debug-session',runId:'post-fix',hypothesisId:'A'})}).catch(()=>{});
      // #endregion
      // Profile already exists, continue with signup success
    } else {
      // Create user profile in public.users table
      const insertPayload = {
        id: authData.user.id,
        email: authData.user.email!,
        name,
        username: email.split('@')[0], // Temporary username from email
        role: 'buyer',
        is_verified_teacher: false,
        can_sell: false,
        email_verified: false, // No email verification for buyers
      };
      // #region agent log
      fetch('http://127.0.0.1:7248/ingest/00d5f2ca-d0b7-44d8-a520-af7d4c8e25e2',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'useAuth.ts:155',message:'insert payload before',data:insertPayload,timestamp:Date.now(),sessionId:'debug-session',runId:'post-fix',hypothesisId:'C'})}).catch(()=>{});
      // #endregion

      const { data: insertData, error: profileError } = await supabase.from('users').insert(insertPayload).select()

      // #region agent log
      const errorDetails = profileError ? {
        message: profileError.message,
        code: profileError.code,
        details: profileError.details,
        hint: profileError.hint,
        statusCode: (profileError as any).statusCode,
        statusText: (profileError as any).statusText,
        response: (profileError as any).response,
        toString: String(profileError),
        keys: Object.keys(profileError || {}),
        fullObject: Object.assign({}, profileError)
      } : null;
      fetch('http://127.0.0.1:7248/ingest/00d5f2ca-d0b7-44d8-a520-af7d4c8e25e2',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'useAuth.ts:161',message:'insert result',data:{hasError:!!profileError,hasData:!!insertData,errorDetails,insertData},timestamp:Date.now(),sessionId:'debug-session',runId:'post-fix',hypothesisId:'A,B,C,D,E'})}).catch(()=>{});
      // #endregion

      if (profileError) {
        // Check if it's a duplicate key error (profile might have been created by trigger or race condition)
        if (profileError.code === '23505') {
          // Duplicate key - profile already exists, continue with signup success
          // #region agent log
          fetch('http://127.0.0.1:7248/ingest/00d5f2ca-d0b7-44d8-a520-af7d4c8e25e2',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'useAuth.ts:182',message:'duplicate key error, profile exists, continuing',data:{errorCode:profileError.code},timestamp:Date.now(),sessionId:'debug-session',runId:'post-fix',hypothesisId:'A'})}).catch(()=>{});
          // #endregion
        } else {
          // Other error - log and throw
          console.error('Profile creation failed:', {
            message: profileError.message,
            code: profileError.code,
            details: profileError.details,
            hint: profileError.hint,
          })
          throw profileError
        }
      }
    }

    // Store remember me preference and set cookie
    setRememberMePreference(rememberMe)
    setRememberMeCookie(rememberMe)
    
    // Cache user on successful signup
    if (authData.user) {
      setCachedUser(authData.user)
    }

    return authData
  }

  const logout = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
    
    // Clear cache and remember me preference on logout
    clearCachedUser()
    clearRememberMePreference()
    
    router.push('/login')
    router.refresh()
  }

  const signInWithOAuth = async (provider: 'google' | 'facebook', rememberMe: boolean = false) => {
    // Store remember me preference and set cookie before OAuth redirect
    setRememberMePreference(rememberMe)
    setRememberMeCookie(rememberMe)
    
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })

    if (error) throw error
    return data
  }

  return {
    user,
    loading,
    login,
    signup,
    logout,
    signInWithOAuth,
    getRememberMePreference,
  }
}
