'use client'

import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Avatar, AvatarImage, AvatarFallback } from '@/registry/default/avatar/avatar'
import { getFullName, getInitials, getUserBadges, type User } from '@/lib/utils/profile'
import { BadgeDisplay } from '@/components/profiles/badge-display'
import { Palette, Pencil, Image as ImageIcon } from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'
import { ProTierPlaceholder } from '@/components/pro-tier-placeholder'

interface Profile {
  id: string
  first_name: string
  last_name: string
  display_name?: string | null
  username?: string | null
  role?: string
  avatar_url?: string | null
  banner_url?: string | null
  bio?: string | null
  subjects_taught?: string[] | null
  grade_levels_taught?: string[] | null
  location_city?: string | null
  location_region?: string | null
  social_links?: { facebook?: string; instagram?: string; youtube?: string } | null
  followers_count?: number
  response_time_hours?: number | null
  subscription_tier?: string
  is_pioneer?: boolean
  is_verified_teacher?: boolean
  created_at?: string
}

export default function CustomizeShopPage() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [editSection, setEditSection] = useState<'bio' | null>(null)
  const [editingDisplayName, setEditingDisplayName] = useState(false)
  const [editingUsername, setEditingUsername] = useState(false)
  const [saving, setSaving] = useState(false)
  const avatarInputRef = useRef<HTMLInputElement>(null)
  const bannerInputRef = useRef<HTMLInputElement>(null)

  // Edit form state (per section)
  const [displayName, setDisplayName] = useState('')
  const [username, setUsername] = useState('')
  const [bio, setBio] = useState('')

  useEffect(() => {
    loadProfile()
  }, [])

  const loadProfile = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/me/profile')
      if (!res.ok) throw new Error('Failed to load profile')
      const { profile: data } = await res.json()
      setProfile(data)
      setDisplayName(data.display_name || '')
      setUsername(data.username || '')
      setBio(data.bio || '')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to load profile')
    } finally {
      setLoading(false)
    }
  }

  const openEditBio = () => {
    if (!profile) return
    setBio(profile.bio || '')
    setEditSection('bio')
  }

  const closeEdit = () => setEditSection(null)

  const saveDisplayName = async () => {
    try {
      setSaving(true)
      const res = await fetch('/api/me/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ display_name: displayName.trim() || null }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Failed to update')
      }
      const { profile: data } = await res.json()
      setProfile(data)
      setEditingDisplayName(false)
      toast.success('Display name updated')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update')
    } finally {
      setSaving(false)
    }
  }

  const saveUsername = async () => {
    try {
      setSaving(true)
      const res = await fetch('/api/me/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.trim() }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Failed to update')
      }
      const { profile: data } = await res.json()
      setProfile(data)
      setEditingUsername(false)
      toast.success('Username updated')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update')
    } finally {
      setSaving(false)
    }
  }

  const saveBio = async () => {
    try {
      setSaving(true)
      const res = await fetch('/api/me/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bio: bio }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Failed to update')
      }
      const { profile: data } = await res.json()
      setProfile(data)
      toast.success('Bio updated')
      closeEdit()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update')
    } finally {
      setSaving(false)
    }
  }

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const formData = new FormData()
    formData.append('avatar', file)
    try {
      const res = await fetch('/api/me/profile/avatar', { method: 'POST', body: formData })
      if (!res.ok) throw new Error('Upload failed')
      const { avatar_url } = await res.json()
      setProfile((p) => (p ? { ...p, avatar_url } : null))
      toast.success('Profile picture updated')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to upload')
    }
    e.target.value = ''
  }

  const handleBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const formData = new FormData()
    formData.append('banner', file)
    try {
      const res = await fetch('/api/me/profile/banner', { method: 'POST', body: formData })
      if (!res.ok) throw new Error('Upload failed')
      const { banner_url } = await res.json()
      setProfile((p) => (p ? { ...p, banner_url } : null))
      toast.success('Banner updated')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to upload')
    }
    e.target.value = ''
  }

  if (loading || !profile) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-muted animate-pulse rounded" />
        <div className="h-64 bg-muted animate-pulse rounded-lg" />
      </div>
    )
  }

  const fullName = getFullName(profile)
  const memberSince = profile.created_at
    ? new Date(profile.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long' })
    : '—'

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Palette className="size-6" />
          Customize Shop
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Preview how buyers see your shop and edit below.
        </p>
      </div>

      {/* Live preview - same structure as public seller page */}
      <Card className="overflow-hidden">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Shop preview</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="relative">
            {/* Banner with Edit (Pro/Pioneer) or placeholder (Free) */}
            <div className="relative h-40 md:h-52 w-full bg-muted">
              {profile.banner_url ? (
                <img
                  src={profile.banner_url}
                  alt="Banner"
                  className="w-full h-full object-cover"
                />
              ) : null}
              <input
                ref={bannerInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleBannerUpload}
              />
              {(profile.subscription_tier === 'pro' || profile.subscription_tier === 'pioneer') && (
                <>
                  <p className="absolute bottom-2 right-2 text-xs text-muted-foreground bg-black/50 text-white px-2 py-1 rounded">
                    Recommended: 1200×300px, max 5MB
                  </p>
                  <Button
                    variant="secondary"
                    size="sm"
                    className="absolute top-2 right-2 gap-1"
                    onClick={() => bannerInputRef.current?.click()}
                  >
                    <ImageIcon className="size-4" />
                    Edit banner
                  </Button>
                </>
              )}
            </div>
            {(profile.subscription_tier !== 'pro' && profile.subscription_tier !== 'pioneer') && (
              <div className="p-4">
                <ProTierPlaceholder
                  title="Pro Feature"
                  description="Custom banner for your shop. Unlock with Pro to personalize your storefront."
                  ctaLabel="Unlock with Pro"
                />
              </div>
            )}

            {/* Avatar with Edit */}
            <div className="absolute -bottom-10 left-4">
              <Avatar className="h-20 w-20 md:h-24 md:w-24 border-4 border-background">
                {profile.avatar_url && (
                  <AvatarImage src={profile.avatar_url} alt={fullName} />
                )}
                <AvatarFallback className="text-lg">
                  {getInitials(profile.first_name, profile.last_name)}
                </AvatarFallback>
              </Avatar>
              <input
                ref={avatarInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarUpload}
              />
              <Button
                variant="secondary"
                size="sm"
                className="absolute -bottom-1 -right-1 gap-1 shadow"
                onClick={() => avatarInputRef.current?.click()}
              >
                <Pencil className="size-3" />
              </Button>
            </div>
          </div>

          {/* Profile info: display name + pen (inline edit), full name below, username + pen (inline edit), badges */}
          <div className="mt-14 md:mt-16 px-4 pb-4">
            <div className="space-y-2">
              {/* Display name: view or inline edit */}
              {editingDisplayName ? (
                <div className="space-y-2">
                  <Input
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="e.g. Teacher Juan's Math Resources"
                    maxLength={255}
                    className="text-lg font-semibold text-muted-foreground max-w-md"
                  />
                  <p className="text-xs text-muted-foreground">Shown above your name on your shop. Full name and username always remain visible.</p>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => { setEditingDisplayName(false); setDisplayName(profile.display_name || '') }}>
                      Cancel
                    </Button>
                    <Button size="sm" onClick={saveDisplayName} disabled={saving}>
                      {saving ? 'Saving...' : 'Save'}
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-lg font-semibold text-muted-foreground">
                    {profile.display_name || 'Add display name'}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-muted-foreground shrink-0"
                    onClick={() => { setDisplayName(profile.display_name || ''); setEditingDisplayName(true) }}
                    aria-label="Edit display name"
                  >
                    <Pencil className="size-3" />
                  </Button>
                </div>
              )}

              {/* Full name (read-only, always below display name) */}
              <h2 className="text-xl font-bold">{fullName}</h2>

              {/* Username: view or inline edit */}
              {editingUsername ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">@</span>
                    <Input
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="username"
                      className="max-w-[200px]"
                    />
                  </div>
                  {username && (
                    <p className="text-xs text-muted-foreground">Shop URL: /sellers/{username}</p>
                  )}
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => { setEditingUsername(false); setUsername(profile.username || '') }}>
                      Cancel
                    </Button>
                    <Button size="sm" onClick={saveUsername} disabled={saving || !username.trim()}>
                      {saving ? 'Saving...' : 'Save'}
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2 flex-wrap">
                  {profile.username && (
                    <span className="text-muted-foreground">@{profile.username}</span>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-muted-foreground shrink-0"
                    onClick={() => { setUsername(profile.username || ''); setEditingUsername(true) }}
                    aria-label="Edit username"
                  >
                    <Pencil className="size-3" />
                  </Button>
                </div>
              )}

              {(() => {
                const badges = getUserBadges(profile as User)
                return badges.length > 0 ? <BadgeDisplay badges={badges} className="mt-2" /> : null
              })()}
            </div>

            {/* Stats placeholder */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 text-center border rounded-lg p-4 bg-muted/30">
              <div>
                <div className="text-xl font-bold">0</div>
                <div className="text-xs text-muted-foreground">Products</div>
              </div>
              <div>
                <div className="text-xl font-bold">0</div>
                <div className="text-xs text-muted-foreground">Sales</div>
              </div>
              <div>
                <div className="text-xl font-bold">—</div>
                <div className="text-xs text-muted-foreground">Rating</div>
              </div>
              <div>
                <div className="text-xl font-bold">{profile.followers_count ?? 0}</div>
                <div className="text-xs text-muted-foreground">Followers</div>
              </div>
            </div>

            {/* About - Bio with inline edit */}
            <div className="mt-6">
              <div className="flex items-center justify-between gap-2 mb-2">
                <h3 className="font-semibold">About</h3>
                {editSection !== 'bio' && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={openEditBio}
                  >
                    <Pencil className="size-3 mr-1" />
                    Edit bio
                  </Button>
                )}
              </div>
              {editSection === 'bio' ? (
                <div className="space-y-2">
                  <Textarea
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="Tell buyers about yourself and what you offer..."
                    maxLength={5000}
                    rows={6}
                    className="resize-none text-sm"
                  />
                  <p className="text-xs text-muted-foreground">{bio.length}/5000</p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setBio(profile?.bio || '')
                        closeEdit()
                      }}
                    >
                      Cancel
                    </Button>
                    <Button size="sm" onClick={saveBio} disabled={saving}>
                      {saving ? 'Saving...' : 'Save'}
                    </Button>
                  </div>
                </div>
              ) : profile.bio ? (
                <p className="text-sm whitespace-pre-line text-muted-foreground">
                  {profile.bio}
                </p>
              ) : (
                <p className="text-sm text-muted-foreground italic">No bio yet.</p>
              )}
              {(profile.subjects_taught?.length ?? 0) > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {profile.subjects_taught?.map((s: string) => (
                    <span key={s} className="text-xs px-2 py-1 bg-muted rounded-md">
                      {s}
                    </span>
                  ))}
                </div>
              )}
              {(profile.location_city || profile.location_region) && (
                <p className="text-sm text-muted-foreground mt-2">
                  {[profile.location_city, profile.location_region].filter(Boolean).join(', ')}
                </p>
              )}
              <p className="text-sm text-muted-foreground mt-1">Member since {memberSince}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
