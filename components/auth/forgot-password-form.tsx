'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { GlareButton } from '@/components/ui/glare-button'
import Link from 'next/link'
import Image from 'next/image'

export function ForgotPasswordForm() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const { resetPassword } = useAuth()
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    // #region agent log
    fetch('http://127.0.0.1:7248/ingest/00d5f2ca-d0b7-44d8-a520-af7d4c8e25e2',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'forgot-password-form.tsx:22',message:'handleSubmit entry',data:{email,emailLength:email?.length,emailTrimmed:email?.trim()},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
    // #endregion

    try {
      await resetPassword(email)
      // #region agent log
      fetch('http://127.0.0.1:7248/ingest/00d5f2ca-d0b7-44d8-a520-af7d4c8e25e2',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'forgot-password-form.tsx:30',message:'resetPassword success',data:{email},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A,B,C'})}).catch(()=>{});
      // #endregion
      // Always show success message to prevent email enumeration
      setSuccess(true)
    } catch (err: any) {
      // #region agent log
      fetch('http://127.0.0.1:7248/ingest/00d5f2ca-d0b7-44d8-a520-af7d4c8e25e2',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'forgot-password-form.tsx:34',message:'resetPassword error caught',data:{email,errorMessage:err?.message,errorStatus:err?.status,errorCode:err?.code,errorName:err?.name,errorStack:err?.stack},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A,B,C,E'})}).catch(()=>{});
      // #endregion
      // Even on error, show success message for security
      // This prevents attackers from knowing which emails exist
      setSuccess(true)
      console.error('Password reset error:', err)
    } finally {
      setLoading(false)
    }
  }

  if (success) {
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
            <CardTitle className="text-2xl font-bold">Check your email</CardTitle>
            <CardDescription>
              We've sent a password reset link to {email}
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-md bg-green-50 dark:bg-green-900/20 p-3 text-sm text-green-800 dark:text-green-200">
            If an account exists with this email, you'll receive a password reset link shortly. 
            The link will expire in 1 hour.
          </div>
          <div className="text-center space-y-2">
            <p className="text-sm text-muted-foreground">
              Didn't receive the email? Check your spam folder or try again.
            </p>
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
          <CardTitle className="text-2xl font-bold">Forgot your password?</CardTitle>
          <CardDescription>
            Enter your email address and we'll send you a link to reset your password
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
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
              autoFocus
            />
          </div>

          <Button type="submit" className="w-full uppercase text-lg" size="lg" disabled={loading}>
            {loading ? 'SENDING...' : 'SEND RESET LINK'}
          </Button>
        </form>

        <div className="text-center space-y-2">
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
