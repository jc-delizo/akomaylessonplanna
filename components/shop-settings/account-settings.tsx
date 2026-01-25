'use client'

import { useState, useEffect } from 'react'
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
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import Image from 'next/image'
import { Upload, User, UserCircle } from 'lucide-react'
import { toast } from 'sonner'

interface AccountSettingsProps {
  initialData?: {
    name: string
    username: string
    avatar_url?: string | null
    bio?: string | null
  }
}

export function AccountSettings({ initialData }: AccountSettingsProps) {
  const [name, setName] = useState(initialData?.name || '')
  const [username, setUsername] = useState(initialData?.username || '')
  const [bio, setBio] = useState(initialData?.bio || '')
  const [avatarUrl, setAvatarUrl] = useState(initialData?.avatar_url || '')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (initialData) {
      setName(initialData.name || '')
      setUsername(initialData.username || '')
      setBio(initialData.bio || '')
      setAvatarUrl(initialData.avatar_url || '')
    }
  }, [initialData])

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file')
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size must be less than 5MB')
      return
    }

    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/me/profile/avatar', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        throw new Error('Failed to upload avatar')
      }

      const data = await response.json()
      setAvatarUrl(data.avatar_url)
      toast.success('Avatar updated successfully')
    } catch (error) {
      console.error('Error uploading avatar:', error)
      toast.error('Failed to upload avatar')
    }
  }

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error('Display name is required')
      return
    }

    if (name.length < 2 || name.length > 255) {
      toast.error('Display name must be between 2 and 255 characters')
      return
    }

    if (bio && bio.length > 1000) {
      toast.error('Bio must be less than 1000 characters')
      return
    }

    try {
      setSaving(true)
      const response = await fetch('/api/seller/settings/account', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          display_name: name.trim(),
          avatar_url: avatarUrl,
          bio: bio.trim() || null,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to update account settings')
      }

      toast.success('Account settings updated successfully')
    } catch (error: any) {
      console.error('Error updating account settings:', error)
      toast.error(error.message || 'Failed to update account settings')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-orange-100">
            <UserCircle className="size-5 text-[#ff7200]" />
          </div>
          <div>
            <CardTitle>Account Information</CardTitle>
            <CardDescription>
              Update your account information and profile details
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Avatar Section */}
        <div className="space-y-3">
          <Label className="text-base font-medium">Profile Picture</Label>
          <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
            {avatarUrl ? (
              <Image
                src={avatarUrl}
                alt={name}
                width={80}
                height={80}
                className="rounded-full object-cover ring-2 ring-white shadow-sm"
              />
            ) : (
              <div className="size-20 rounded-full bg-gradient-to-br from-[#ff7200] to-[#e66500] flex items-center justify-center ring-2 ring-white shadow-sm">
                <span className="text-2xl font-semibold text-white">
                  {name.charAt(0).toUpperCase() || <User className="size-8" />}
                </span>
              </div>
            )}
            <div className="flex-1">
              <label htmlFor="avatar-upload" className="cursor-pointer">
                <Button variant="outline" size="sm" asChild>
                  <span>
                    <Upload className="size-4 mr-2" />
                    Upload Photo
                  </span>
                </Button>
              </label>
              <input
                id="avatar-upload"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarUpload}
              />
              <p className="text-xs text-gray-500 mt-1.5">
                JPG, PNG or WebP. Max 5MB
              </p>
            </div>
          </div>
        </div>

        <Separator />

        {/* Profile Information */}
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="display-name" className="text-base font-medium">
              Display Name *
            </Label>
            <Input
              id="display-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your display name"
              maxLength={255}
              className="h-10"
            />
            <p className="text-xs text-gray-500">
              This is how your name appears to other users
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="username" className="text-base font-medium">
              Username
            </Label>
            <Input
              id="username"
              value={username || 'Not set'}
              disabled
              className="bg-gray-50 h-10"
            />
            <p className="text-xs text-gray-500">
              Username cannot be changed. Used for your profile URL
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="bio" className="text-base font-medium">
              Bio
            </Label>
            <Textarea
              id="bio"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Tell us about yourself..."
              rows={4}
              maxLength={1000}
              className="resize-none"
            />
            <div className="flex items-center justify-between">
              <p className="text-xs text-gray-500">
                Share a bit about yourself with other users
              </p>
              <p className="text-xs text-gray-400">
                {bio.length}/1000
              </p>
            </div>
          </div>
        </div>
      </CardContent>

      <CardFooter className="border-t bg-gray-50/50">
        <Button onClick={handleSave} disabled={saving} className="ml-auto">
          {saving ? 'Saving...' : 'Save Changes'}
        </Button>
      </CardFooter>
    </Card>
  )
}
