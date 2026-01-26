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

export function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [rememberMe, setRememberMe] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { login, signInWithOAuth } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()

  // Check for OAuth error in URL parameters
  useEffect(() => {
    const oauthError = searchParams.get('error')
    if (oauthError) {
      setError(oauthError)
      // Clear the error from URL
      router.replace('/login', { scroll: false })
    }
  }, [searchParams, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      await login(email, password, rememberMe)
      
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
          // Don't block login if merge fails
        }
      }
      
      // Redirect to return URL or default to marketplace
      const redirectUrl = searchParams.get('redirect') || '/marketplace'
      router.push(redirectUrl)
      router.refresh()
    } catch (err: any) {
      setError(err.message || 'Failed to sign in. Please check your credentials.')
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
            Sign in to your account to continue
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* OAuth Buttons */}
        <Button
          type="button"
          variant="outline"
          size="lg"
          className="w-full"
          onClick={() => handleOAuth('google')}
          disabled={loading}
        >
          Continue with Gmail
        </Button>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <Separator />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-card px-2 text-muted-foreground">
              Or continue with email
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

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Password</Label>
              <Link
                href="/forgot-password"
                className="text-xs text-primary hover:underline"
              >
                Forgot password?
              </Link>
            </div>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading}
            />
          </div>

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
            {loading ? 'SIGNING IN...' : 'SIGN IN'}
          </Button>
        </form>

        <p className="text-center text-sm text-muted-foreground">
          Don't have an account?{' '}
          <Link href="/signup" className="text-primary hover:underline font-medium">
            Sign up
          </Link>
        </p>
      </CardContent>
    </Card>
  )
}
