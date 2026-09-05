'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/lib/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'
import Image from 'next/image'
import { Eye, EyeOff, Loader2, UserPlus } from 'lucide-react'
import { getGuestCartProductIds, clearGuestCart } from '@/lib/utils/guest-cart'
import { getSafeRedirectPath } from '@/lib/utils/safe-redirect'

const googleOAuthEnabled = process.env.NEXT_PUBLIC_GOOGLE_OAUTH_ENABLED === 'true'

export function SignupForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [rememberMe, setRememberMe] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(() => searchParams.get('error'))
  const { signup, signInWithOAuth } = useAuth()

  // Check for OAuth error in URL parameters
  useEffect(() => {
    const oauthError = searchParams.get('error')
    if (oauthError) {
      // Clear the error from URL
      router.replace('/signup', { scroll: false })
    }
  }, [searchParams, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      await signup(email, password, firstName, lastName, rememberMe)
      
      // Merge guest cart if it exists
      const guestCartProductIds = getGuestCartProductIds()
      if (guestCartProductIds.length > 0) {
        try {
          const mergeResponse = await fetch('/api/cart/merge-guest', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ productIds: guestCartProductIds }),
          })
          
          if (mergeResponse.ok) {
            // Clear guest cart after successful merge
            clearGuestCart()
          }
        } catch (mergeError) {
          console.error('Error merging guest cart:', mergeError)
          // Don't block signup if merge fails
        }
      }
      
      // Redirect to return URL or default to marketplace
      const redirectUrl = getSafeRedirectPath(searchParams.get('redirect'))
      router.push(redirectUrl)
      router.refresh()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to create account. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleOAuth = async (provider: 'google' | 'facebook') => {
    setError(null)
    setLoading(true)

    try {
      await signInWithOAuth(provider, rememberMe)
      // OAuth redirects to callback, so we don't need to handle navigation here
      // The loading state will be reset when the page redirects
    } catch (err: unknown) {
      // Handle OAuth initiation errors (e.g., popup blocked)
      const errorMessage =
        (err instanceof Error ? err.message : null) ||
        `Failed to initiate ${provider} sign in. Please check your browser settings and try again.`
      setError(errorMessage)
      setLoading(false)
    }
  }

  return (
    <Card className="mx-auto w-full max-w-lg gap-0 rounded-3xl border border-slate-200 bg-white py-0 shadow-[0_24px_70px_-35px_rgba(15,23,42,0.45)] ring-0">
      <CardHeader className="space-y-2 px-6 pb-4 pt-7 text-left sm:px-8 sm:pt-8">
        <div className="mb-2 flex size-11 items-center justify-center rounded-2xl bg-orange-100 text-orange-700">
          <UserPlus className="size-5" aria-hidden="true" />
        </div>
        <CardTitle className="text-3xl font-black tracking-tight text-slate-950">Create your account</CardTitle>
        <CardDescription className="text-sm leading-6 text-slate-600">
          Join the growing community shaping this teacher marketplace.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5 px-6 pb-7 sm:px-8 sm:pb-8">
        {googleOAuthEnabled && (
          <>
            <Button
              type="button"
              variant="outline"
              size="lg"
              className="h-12 w-full gap-2 rounded-xl border border-slate-300 bg-white text-sm font-bold text-slate-800 hover:bg-slate-50"
              onClick={() => handleOAuth('google')}
              disabled={loading}
            >
              <Image src="/google-g.svg" alt="" width={20} height={20} className="shrink-0" />
              Continue with Google
            </Button>
            <div className="flex items-center gap-3 text-xs font-medium uppercase tracking-wider text-slate-400">
              <span className="h-px flex-1 bg-slate-200" />
              Or use email
              <span className="h-px flex-1 bg-slate-200" />
            </div>
          </>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm leading-5 text-red-700">
              {error}
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="firstName" className="text-sm font-semibold text-slate-800">First name</Label>
              <Input
                id="firstName"
                type="text"
                placeholder="Juan"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                autoComplete="given-name"
                required
                disabled={loading}
                className="h-12 rounded-xl border border-slate-300 bg-white px-3 text-base shadow-sm focus-visible:border-orange-500 focus-visible:ring-2 focus-visible:ring-orange-100 md:text-sm"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="lastName" className="text-sm font-semibold text-slate-800">Last name</Label>
              <Input
                id="lastName"
                type="text"
                placeholder="dela Cruz"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                autoComplete="family-name"
                required
                disabled={loading}
                className="h-12 rounded-xl border border-slate-300 bg-white px-3 text-base shadow-sm focus-visible:border-orange-500 focus-visible:ring-2 focus-visible:ring-orange-100 md:text-sm"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm font-semibold text-slate-800">Email address</Label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              aria-invalid={Boolean(error)}
              required
              disabled={loading}
              className="h-12 rounded-xl border border-slate-300 bg-white px-3 text-base shadow-sm focus-visible:border-orange-500 focus-visible:ring-2 focus-visible:ring-orange-100 md:text-sm"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="text-sm font-semibold text-slate-800">Password</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="At least 8 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
                aria-invalid={Boolean(error)}
                required
                minLength={8}
                disabled={loading}
                className="h-12 rounded-xl border border-slate-300 bg-white px-3 pr-12 text-base shadow-sm focus-visible:border-orange-500 focus-visible:ring-2 focus-visible:ring-orange-100 md:text-sm"
              />
              <button
                type="button"
                onClick={() => setShowPassword((visible) => !visible)}
                className="absolute right-1 top-1 flex size-10 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="size-4.5" aria-hidden="true" /> : <Eye className="size-4.5" aria-hidden="true" />}
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2.5 py-1">
            <Checkbox 
              id="rememberMe" 
              checked={rememberMe}
              onCheckedChange={(checked) => setRememberMe(checked === true)}
              disabled={loading}
            />
            <Label htmlFor="rememberMe" className="cursor-pointer text-sm font-normal text-slate-600">
              Remember me for 90 days
            </Label>
          </div>

          <Button type="submit" className="h-12 w-full gap-2 rounded-xl bg-[#f36d21] text-sm font-bold text-white shadow-lg shadow-orange-100 hover:bg-[#dc5d16]" size="lg" disabled={loading}>
            {loading && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
            {loading ? 'Creating account…' : 'Create account'}
          </Button>
        </form>

        <p className="text-center text-xs leading-5 text-slate-500">
          By signing up, you agree to our{' '}
          <Link href="/terms" className="font-semibold text-slate-700 hover:underline">
            Terms of Service
          </Link>
          {' '}and{' '}
          <Link href="/privacy" className="font-semibold text-slate-700 hover:underline">
            Privacy Policy
          </Link>
        </p>

        <p className="text-center text-sm text-slate-600">
          Already have an account?{' '}
          <Link href="/login" className="font-bold text-orange-700 hover:underline">
            Sign in
          </Link>
        </p>
      </CardContent>
    </Card>
  )
}
