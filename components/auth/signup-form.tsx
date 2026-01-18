'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/lib/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { GlareButton } from '@/components/ui/glare-button'
import Link from 'next/link'
import Image from 'next/image'
import { getGuestCartProductIds, clearGuestCart } from '@/lib/utils/guest-cart'

export function SignupForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [rememberMe, setRememberMe] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { signup, signInWithOAuth } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()

  // Check for OAuth error in URL parameters
  useEffect(() => {
    const oauthError = searchParams.get('error')
    if (oauthError) {
      setError(oauthError)
      // Clear the error from URL
      router.replace('/signup', { scroll: false })
    }
  }, [searchParams, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      await signup(email, password, name, rememberMe)
      
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
      const redirectUrl = searchParams.get('redirect') || '/marketplace'
      router.push(redirectUrl)
      router.refresh()
    } catch (err: any) {
      setError(err.message || 'Failed to create account. Please try again.')
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
    } catch (err: any) {
      // Handle OAuth initiation errors (e.g., popup blocked)
      const errorMessage =
        err.message ||
        `Failed to initiate ${provider} sign in. Please check your browser settings and try again.`
      setError(errorMessage)
      setLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="space-y-4 text-center">
        <div className="flex justify-center">
          <GlareButton>
            <Image
              src="/akomaylogo.png"
              alt="Akomay Logo"
              width={120}
              height={120}
              className="h-auto w-auto"
              priority
            />
          </GlareButton>
        </div>
        <div className="space-y-2">
          <CardTitle className="text-2xl font-bold">Ako may lesson plan na!</CardTitle>
          <CardDescription>
            Join thousands of Filipino teachers buying and selling lesson plans
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* OAuth Buttons */}
        <div className="flex flex-row gap-3">
          <Button
            type="button"
            variant="outline"
            size="lg"
            className="flex-1"
            onClick={() => handleOAuth('google')}
            disabled={loading}
          >
            Continue with Gmail
          </Button>

          <Button
            type="button"
            variant="outline"
            size="lg"
            className="flex-1"
            onClick={() => handleOAuth('facebook')}
            disabled={loading}
          >
            Continue with Facebook
          </Button>
        </div>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <Separator />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-card px-2 text-muted-foreground">
              Or sign up with email
            </span>
          </div>
        </div>

        {/* Email/Password Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-md bg-red-50 dark:bg-red-900/20 p-3 text-sm text-red-800 dark:text-red-200">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="name">Full Name</Label>
            <Input
              id="name"
              type="text"
              placeholder="Juan dela Cruz"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              disabled={loading}
            />
          </div>

          <div className="flex flex-row gap-3">
            <div className="space-y-2 flex-1">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
              />
            </div>

            <div className="space-y-2 flex-1">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                disabled={loading}
              />
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            Must be at least 6 characters
          </p>

          <div className="flex items-center space-x-2">
            <Checkbox 
              id="rememberMe" 
              checked={rememberMe}
              onCheckedChange={(checked) => setRememberMe(checked === true)}
              disabled={loading}
            />
            <Label htmlFor="rememberMe" className="text-sm font-normal cursor-pointer">
              Remember me for 90 days
            </Label>
          </div>

          <Button type="submit" className="w-full uppercase text-lg" size="lg" disabled={loading}>
            {loading ? 'CREATING ACCOUNT...' : 'CREATE ACCOUNT'}
          </Button>
        </form>

        <p className="text-center text-xs text-muted-foreground">
          By signing up, you agree to our{' '}
          <Link href="/terms" className="text-primary hover:underline">
            Terms of Service
          </Link>
          {' '}and{' '}
          <Link href="/privacy" className="text-primary hover:underline">
            Privacy Policy
          </Link>
        </p>

        <p className="text-center text-sm text-muted-foreground">
          Already have an account?{' '}
          <Link href="/login" className="text-primary hover:underline font-medium">
            Sign in
          </Link>
        </p>
      </CardContent>
    </Card>
  )
}
