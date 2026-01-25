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

  const signup = async (email: string, password: string, firstName: string, lastName: string, rememberMe: boolean = false) => {
    // Sign up with Supabase Auth
    // Store full name in auth metadata for compatibility
    const fullName = `${firstName} ${lastName}`.trim()
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name: fullName,
          first_name: firstName,
          last_name: lastName,
          role: 'buyer',
        },
        // DO NOT require email confirmation for buyers
        emailRedirectTo: undefined,
      },
    })

    if (authError) throw authError
    if (!authData.user) throw new Error('Failed to create user')

    // Check if profile already exists (Hypothesis A)
    const existingProfileCheck = await supabase.from('users').select('id,email,username').eq('id', authData.user.id).maybeSingle();

    // If profile already exists, skip insert (user may have signed up before)
    if (existingProfileCheck.data) {
      // Profile already exists, continue with signup success
    } else {
      // Create user profile in public.users table
      const insertPayload = {
        id: authData.user.id,
        email: authData.user.email!,
        first_name: firstName,
        last_name: lastName || '',
        username: email.split('@')[0], // Temporary username from email
        role: 'buyer',
        is_verified_teacher: false,
        can_sell: false,
        email_verified: false, // No email verification for buyers
      };

      const { data: insertData, error: profileError } = await supabase.from('users').insert(insertPayload).select()

      if (profileError) {
        // Check if it's a duplicate key error (profile might have been created by trigger or race condition)
        if (profileError.code === '23505') {
          // Duplicate key - profile already exists, continue with signup success
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

  const resetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })

    if (error) throw error
    // Always return success to prevent email enumeration
    return { success: true }
  }

  const updatePassword = async (newPassword: string) => {
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    })

    if (error) throw error
    return { success: true }
  }

  return {
    user,
    loading,
    login,
    signup,
    logout,
    signInWithOAuth,
    resetPassword,
    updatePassword,
    getRememberMePreference,
  }
}
