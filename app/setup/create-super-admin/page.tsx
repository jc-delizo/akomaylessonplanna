'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function CreateSuperAdminPage() {
  const [secret, setSecret] = useState('')
  const [email, setEmail] = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<{
    email: string
    tempPassword?: string
  } | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(null)

    try {
      const response = await fetch('/api/admin/create-admin-account', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Create-Super-Admin-Secret': secret,
        },
        body: JSON.stringify({
          email,
          first_name: firstName,
          last_name: lastName,
          password: password || undefined,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create super admin account')
      }

      setSuccess({
        email: data.data.email,
        tempPassword: data.data.tempPassword,
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold">Create Super Admin</h1>
          <p className="text-sm text-muted-foreground">
            Create the first super admin account for your platform
          </p>
        </div>

        {success ? (
          <div className="space-y-4 p-4 border border-green-500/50 bg-green-500/10 rounded-md">
            <h2 className="font-semibold text-green-600 dark:text-green-400">
              Super admin created successfully!
            </h2>
            <div className="space-y-2 text-sm">
              <p>
                <strong>Email:</strong> {success.email}
              </p>
              {success.tempPassword && (
                <div className="space-y-1">
                  <p>
                    <strong>Temporary Password:</strong>
                  </p>
                  <code className="block p-2 bg-background border rounded text-xs break-all">
                    {success.tempPassword}
                  </code>
                  <p className="text-xs text-muted-foreground">
                    Please save this password. The user should change it on first login.
                  </p>
                </div>
              )}
            </div>
            <div className="pt-4">
              <Button
                onClick={() => (window.location.href = '/login')}
                className="w-full"
              >
                Go to Login Page
              </Button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="secret">Setup Secret</Label>
              <Input
                id="secret"
                type="password"
                placeholder="Enter CREATE_SUPER_ADMIN_SECRET"
                value={secret}
                onChange={(e) => setSecret(e.target.value)}
                required
                autoComplete="off"
              />
              <p className="text-xs text-muted-foreground">
                This must match the CREATE_SUPER_ADMIN_SECRET environment variable
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                placeholder="admin@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name</Label>
                <Input
                  id="firstName"
                  type="text"
                  placeholder="Admin"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  required
                  autoComplete="given-name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                  id="lastName"
                  type="text"
                  placeholder="User"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  autoComplete="family-name"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password (Optional)</Label>
              <Input
                id="password"
                type="password"
                placeholder="Leave blank to auto-generate"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
                minLength={12}
              />
              <p className="text-xs text-muted-foreground">
                Use at least 12 characters, or leave blank to generate a secure password
              </p>
            </div>

            {error && (
              <div className="p-3 text-sm text-red-600 dark:text-red-400 bg-red-500/10 border border-red-500/50 rounded">
                {error}
              </div>
            )}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Creating...' : 'Create Super Admin'}
            </Button>
          </form>
        )}
      </div>
    </div>
  )
}
