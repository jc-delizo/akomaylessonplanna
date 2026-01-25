'use client'

import { useState } from 'react'
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Lock, Eye, EyeOff, Shield } from 'lucide-react'
import { toast } from 'sonner'

export function SecuritySettings() {
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [saving, setSaving] = useState(false)

  const getPasswordStrength = (password: string): { strength: 'weak' | 'medium' | 'strong'; label: string } => {
    if (password.length === 0) {
      return { strength: 'weak', label: '' }
    }
    if (password.length < 8) {
      return { strength: 'weak', label: 'Too short' }
    }
    const hasUpper = /[A-Z]/.test(password)
    const hasLower = /[a-z]/.test(password)
    const hasNumber = /\d/.test(password)
    const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password)

    const criteriaCount = [hasUpper, hasLower, hasNumber, hasSpecial].filter(Boolean).length

    if (criteriaCount >= 3 && password.length >= 12) {
      return { strength: 'strong', label: 'Strong' }
    }
    if (criteriaCount >= 2) {
      return { strength: 'medium', label: 'Medium' }
    }
    return { strength: 'weak', label: 'Weak' }
  }

  const passwordStrength = getPasswordStrength(newPassword)

  const handleSave = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error('All fields are required')
      return
    }

    if (newPassword.length < 8) {
      toast.error('New password must be at least 8 characters')
      return
    }

    if (newPassword !== confirmPassword) {
      toast.error('New passwords do not match')
      return
    }

    if (currentPassword === newPassword) {
      toast.error('New password must be different from current password')
      return
    }

    try {
      setSaving(true)
      const response = await fetch('/api/seller/settings/password', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          current_password: currentPassword,
          new_password: newPassword,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to update password')
      }

      toast.success('Password updated successfully')
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (error: any) {
      console.error('Error updating password:', error)
      toast.error(error.message || 'Failed to update password')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-red-100">
            <Shield className="size-5 text-red-600" />
          </div>
          <div>
            <CardTitle>Security</CardTitle>
            <CardDescription>
              Change your password to keep your account secure
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Current Password */}
        <div className="space-y-2">
          <Label htmlFor="current-password" className="text-base font-medium">
            Current Password
          </Label>
          <div className="relative">
            <Input
              id="current-password"
              type={showCurrentPassword ? 'text' : 'password'}
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="Enter your current password"
              className="h-10 pr-10"
            />
            <button
              type="button"
              onClick={() => setShowCurrentPassword(!showCurrentPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              {showCurrentPassword ? (
                <EyeOff className="size-4" />
              ) : (
                <Eye className="size-4" />
              )}
            </button>
          </div>
        </div>

        <Separator />

        {/* New Password */}
        <div className="space-y-3">
          <Label htmlFor="new-password" className="text-base font-medium">
            New Password
          </Label>
          <div className="relative">
            <Input
              id="new-password"
              type={showNewPassword ? 'text' : 'password'}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Enter your new password"
              className="h-10 pr-10"
            />
            <button
              type="button"
              onClick={() => setShowNewPassword(!showNewPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              {showNewPassword ? (
                <EyeOff className="size-4" />
              ) : (
                <Eye className="size-4" />
              )}
            </button>
          </div>
          {newPassword && (
            <div className="space-y-2 p-3 bg-gray-50 rounded-lg border border-gray-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-gray-700">Password Strength</span>
                <span
                  className={`text-xs font-semibold ${
                    passwordStrength.strength === 'weak'
                      ? 'text-red-600'
                      : passwordStrength.strength === 'medium'
                      ? 'text-yellow-600'
                      : 'text-green-600'
                  }`}
                >
                  {passwordStrength.label}
                </span>
              </div>
              <div className="flex gap-1">
                {[1, 2, 3, 4].map((level) => (
                  <div
                    key={level}
                    className={`h-2 flex-1 rounded-full transition-colors ${
                      passwordStrength.strength === 'weak' && level <= 1
                        ? 'bg-red-500'
                        : passwordStrength.strength === 'medium' && level <= 2
                        ? 'bg-yellow-500'
                        : passwordStrength.strength === 'strong' && level <= 4
                        ? 'bg-green-500'
                        : 'bg-gray-200'
                    }`}
                  />
                ))}
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Use at least 8 characters with a mix of letters, numbers, and symbols
              </p>
            </div>
          )}
        </div>

        {/* Confirm Password */}
        <div className="space-y-2">
          <Label htmlFor="confirm-password" className="text-base font-medium">
            Confirm New Password
          </Label>
          <div className="relative">
            <Input
              id="confirm-password"
              type={showConfirmPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm your new password"
              className="h-10 pr-10"
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              {showConfirmPassword ? (
                <EyeOff className="size-4" />
              ) : (
                <Eye className="size-4" />
              )}
            </button>
          </div>
          {confirmPassword && newPassword !== confirmPassword && (
            <p className="text-xs text-red-600 flex items-center gap-1">
              <span>⚠️</span> Passwords do not match
            </p>
          )}
        </div>
      </CardContent>

      <CardFooter className="border-t bg-gray-50/50">
        <Button onClick={handleSave} disabled={saving} className="ml-auto">
          {saving ? 'Saving...' : 'Change Password'}
        </Button>
      </CardFooter>
    </Card>
  )
}
