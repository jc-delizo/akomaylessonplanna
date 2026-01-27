'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/lib/hooks/useAuth'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { GlareButton } from '@/components/ui/glare-button'
import Link from 'next/link'
import Image from 'next/image'

export function ResetPasswordForm() {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [checkingSession, setCheckingSession] = useState(true)
  const [hasValidSession, setHasValidSession] = useState(false)
  const { updatePassword } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()

  // Check if user has a valid recovery session
  useEffect(() => {
    const checkSession = async () => {
      try {
        // Check if there's a hash fragment with tokens (Supabase password reset)
        const hash = window.location.hash
        if (hash) {
          // Supabase automatically processes hash fragments on page load
          // The hash contains: #access_token=...&refresh_token=...&type=recovery
          // Wait a bit for Supabase to process the hash and create the session
          await new Promise(resolve => setTimeout(resolve, 500))
          
          // Clear the hash from URL for security
          if (window.history.replaceState) {
            window.history.replaceState(null, '', window.location.pathname)
          }
        }

        // Check for session - Supabase should have processed the hash by now
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()
        
        if (sessionError) {
          console.error('Session error:', sessionError)
          setHasValidSession(false)
          setCheckingSession(false)
          return
        }

        // For password reset, we need a session with a user
        // The session type will be 'recovery' when coming from password reset email
        if (session?.user) {
          setHasValidSession(true)
        } else {
          // No session found - might need to check hash again or it's expired
          setHasValidSession(false)
        }
      } catch (err) {
        console.error('Error checking session:', err)
        setHasValidSession(false)
      } finally {
        setCheckingSession(false)
      }
    }

    checkSession()
  }, [supabase])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    // Validation
    if (password.length < 8) {
      setError('Password must be at least 8 characters long')
      return
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    setLoading(true)

    try {
      await updatePassword(password)
      setSuccess(true)
      // Redirect to login after 2 seconds
      setTimeout(() => {
        router.push('/login')
      }, 2000)
    } catch (err: any) {
      // Handle specific error cases
      if (err.message?.includes('expired') || err.message?.includes('invalid')) {
        setError('This password reset link has expired or is invalid. Please request a new one.')
      } else if (err.message?.includes('session')) {
        setError('No valid reset session found. Please request a new password reset link.')
      } else {
        setError(err.message || 'Failed to reset password. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  if (checkingSession) {
    return (
      <Card className="w-full max-w-md">
        <CardContent className="pt-6">
          <div className="flex flex-col items-center justify-center space-y-4 py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <p className="text-sm text-muted-foreground">Verifying reset link...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!hasValidSession) {
    return (
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-4 text-center">
          <div className="flex justify-center">
            <GlareButton>
              <Image
                src="/akomaylogo.png"
                alt="Ako may lesson plan na! Logo"
                width={120}
                height={120}
                className="h-auto w-auto"
                priority
              />
            </GlareButton>
          </div>
          <div className="space-y-2">
            <CardTitle className="text-2xl font-bold">Invalid or Expired Link</CardTitle>
            <CardDescription>
              This password reset link is invalid or has expired
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-md bg-red-50 dark:bg-red-900/20 p-3 text-sm text-red-800 dark:text-red-200">
            Password reset links expire after 1 hour. Please request a new one.
          </div>
          <div className="text-center space-y-2">
            <Link
              href="/forgot-password"
              className="text-sm text-primary hover:underline font-medium block"
            >
              Request a new password reset link
            </Link>
            <Link
              href="/login"
              className="text-sm text-muted-foreground hover:underline"
            >
              Back to login
            </Link>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (success) {
    return (
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-4 text-center">
          <div className="flex justify-center">
            <GlareButton>
              <Image
                src="/akomaylogo.png"
                alt="Ako may lesson plan na! Logo"
                width={120}
                height={120}
                className="h-auto w-auto"
                priority
              />
            </GlareButton>
          </div>
          <div className="space-y-2">
            <CardTitle className="text-2xl font-bold">Password Reset Successful</CardTitle>
            <CardDescription>
              Your password has been updated successfully
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-md bg-green-50 dark:bg-green-900/20 p-3 text-sm text-green-800 dark:text-green-200">
            You can now sign in with your new password. Redirecting to login...
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="space-y-4 text-center">
        <div className="flex justify-center">
          <GlareButton>
            <Image
              src="/akomaylogo.png"
              alt="Ako may lesson plan na! Logo"
              width={120}
              height={120}
              className="h-auto w-auto"
              priority
            />
          </GlareButton>
        </div>
        <div className="space-y-2">
          <CardTitle className="text-2xl font-bold">Reset your password</CardTitle>
          <CardDescription>
            Enter your new password below
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-md bg-red-50 dark:bg-red-900/20 p-3 text-sm text-red-800 dark:text-red-200">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="password">New Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading}
              minLength={8}
              autoFocus
            />
            <p className="text-xs text-muted-foreground">
              Must be at least 8 characters long
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm New Password</Label>
            <Input
              id="confirmPassword"
              type="password"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              disabled={loading}
              minLength={8}
            />
          </div>

          <Button type="submit" className="w-full uppercase text-lg" size="lg" disabled={loading}>
            {loading ? 'RESETTING PASSWORD...' : 'RESET PASSWORD'}
          </Button>
        </form>

        <div className="text-center">
          <Link
            href="/login"
            className="text-sm text-primary hover:underline font-medium"
          >
            Back to login
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}
