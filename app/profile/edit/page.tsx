'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  User,
  UserCircle,
  AtSign,
  FileImage,
  FileText,
  BookOpen,
  GraduationCap,
  MapPin,
  Globe,
  Facebook,
  Instagram,
  Youtube,
  Palette,
  Image,
  CheckCircle2,
  AlertCircle,
  Info,
  Save,
  X,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { ProfileCompletionIndicator } from '@/components/profiles/profile-completion-indicator'
import { Avatar, AvatarImage, AvatarFallback } from '@/registry/default/avatar/avatar'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/registry/default/tabs/tabs'
import { Checkbox } from '@/registry/default/checkbox/checkbox'
import { RadioGroup, RadioGroupItem } from '@/registry/default/radio-group/radio-group'
import { Separator } from '@/registry/default/separator/separator'
import { Alert, AlertTitle, AlertDescription } from '@/registry/default/alert/alert'
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from '@/registry/default/tooltip/tooltip'
import { Skeleton } from '@/registry/default/skeleton/skeleton'
import { validateUsername, calculateProfileCompletion, getInitials } from '@/lib/utils/profile'
import type { User as ProfileUser } from '@/lib/utils/profile'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/registry/default/accordion/accordion'
import {
  getAllRegions,
  getCitiesByRegion,
  matchExistingLocation,
  findRegionByCode,
} from '@/lib/utils/location'
import type { Region, City } from '@/lib/data/philippines-locations'
import { CLASS_TYPES, LEARNER_PATHS } from '@/lib/config/lesson-plan-config'

/**
 * Profile Edit Page
 * 
 * Client Component with form for editing all profile fields
 * 
 * Form fields:
 * - Display Name (3-50 chars)
 * - Username (3-20 chars, unique validation)
 * - Avatar upload (with preview)
 * - Bio (max 500 chars, line breaks supported)
 * - Subjects Taught (multi-select dropdown - from grades/subjects tables)
 * - Grade Levels Taught (multi-select dropdown)
 * - Location (city + region - dropdowns with Philippines regions and cities)
 * - Social Links (Facebook, Instagram, YouTube URLs)
 * - Banner (Pro/Pioneer only) with upload
 * - Custom Accent Color (Pro/Pioneer only) - color picker from preset palette
 * 
 * Reference: docs/brainstorming/3-feature-02-user-profiles-and-profile-management.md lines 212-233
 */
export default function ProfileEditPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  // Form state
  const [profile, setProfile] = useState<Partial<ProfileUser>>({})
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [username, setUsername] = useState('')
  const [bio, setBio] = useState('')
  const [subjectsTaught, setSubjectsTaught] = useState<string[]>([])
  const [gradeLevelsTaught, setGradeLevelsTaught] = useState<string[]>([])
  // Phase 2 teaching preferences
  const [teachingClassTypes, setTeachingClassTypes] = useState<string[]>([])
  const [teachingLearnerPaths, setTeachingLearnerPaths] = useState<string[]>([])
  const [teachingStrandIds, setTeachingStrandIds] = useState<string[]>([])
  const [teachingSpedLevelIds, setTeachingSpedLevelIds] = useState<string[]>([])
  const [hierarchy, setHierarchy] = useState<{
    regular: { grades: { id: string; name: string; sortOrder: number }[]; strands: { id: string; name: string; code: string }[]; subjectsByGrade: Record<string, { id: string; name: string; code: string }[]>; subjectsByStrand: Record<string, { id: string; name: string; code: string }[]> }
    sped: { paths: ['graded', 'non_graded']; levels: { id: string; name: string; sortOrder: number }[]; spedSubjects: { id: string; name: string; code: string }[] }
  } | null>(null)
  const [locationCity, setLocationCity] = useState('')
  const [locationRegion, setLocationRegion] = useState('')
  const [selectedRegionCode, setSelectedRegionCode] = useState<string>('')
  const [availableCities, setAvailableCities] = useState<City[]>([])
  const [allRegions] = useState<Region[]>(getAllRegions())
  // Accordion value: Base UI expects (any | null)[]. [] = closed, ['region'] | ['city'] = open.
  const [accordionValue, setAccordionValue] = useState<(string | null)[]>([])
  const [socialLinks, setSocialLinks] = useState({
    facebook: '',
    instagram: '',
    youtube: '',
  })
  const [customAccentColor, setCustomAccentColor] = useState('')

  // Available options (will be fetched from API)
  const [availableSubjects, setAvailableSubjects] = useState<{ id: string; name: string }[]>([])
  const [availableGrades, setAvailableGrades] = useState<{ id: string; name: string }[]>([])

  // Fetch hierarchy for Phase 2
  useEffect(() => {
    const fetchHierarchy = async () => {
      try {
        const response = await fetch('/api/lesson-plan-config')
        if (response.ok) {
          const data = await response.json()
          setHierarchy(data)
          // Set available grades from hierarchy
          if (data.regular?.grades) {
            setAvailableGrades(data.regular.grades.map((g: { id: string; name: string }) => ({ id: g.id, name: g.name })))
          }
        }
      } catch (err) {
        console.error('Error fetching hierarchy:', err)
      }
    }
    fetchHierarchy()
  }, [])

  // Load profile data
  useEffect(() => {
    const loadProfile = async () => {
      try {
        const response = await fetch('/api/me/profile')
        if (!response.ok) {
          if (response.status === 401) {
            router.push('/login')
            return
          }
          throw new Error('Failed to load profile')
        }

        const { profile: profileData } = await response.json()
        setProfile(profileData)
        setFirstName(profileData.first_name || '')
        setLastName(profileData.last_name || '')
        setUsername(profileData.username || '')
        setBio(profileData.bio || '')
        setSubjectsTaught(profileData.subjects_taught || [])
        setGradeLevelsTaught(profileData.grade_levels_taught || [])
        // Phase 2 teaching preferences
        setTeachingClassTypes(profileData.teaching_class_types || [])
        setTeachingLearnerPaths(profileData.teaching_learner_paths || [])
        setTeachingStrandIds(profileData.teaching_strand_ids || [])
        setTeachingSpedLevelIds(profileData.teaching_sped_level_ids || [])
        // Handle location data - try to match existing free-text data to structured data
        const existingRegion = profileData.location_region || ''
        const existingCity = profileData.location_city || ''
        
        if (existingRegion || existingCity) {
          const matched = matchExistingLocation(existingRegion, existingCity)
          if (matched) {
            const region = findRegionByCode(matched.regionCode)
            setSelectedRegionCode(matched.regionCode)
            setLocationRegion(region ? region.name : existingRegion)
            setLocationCity(matched.cityName)
            setAvailableCities(getCitiesByRegion(matched.regionCode))
          } else {
            // Keep original values if no match found
            setLocationRegion(existingRegion)
            setLocationCity(existingCity)
          }
        }
        
        setSocialLinks(profileData.social_links || { facebook: '', instagram: '', youtube: '' })
        setCustomAccentColor(profileData.custom_accent_color || '')
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load profile')
      } finally {
        setLoading(false)
      }
    }

    loadProfile()
  }, [router])

  // Calculate profile completion
  const completionPercent = profile
    ? calculateProfileCompletion({
        ...profile,
        first_name: firstName,
        last_name: lastName || '',
        username,
        bio,
        subjects_taught: subjectsTaught,
        grade_levels_taught: gradeLevelsTaught,
        location_city: locationCity,
        location_region: locationRegion,
        social_links: socialLinks,
        custom_accent_color: customAccentColor,
      } as ProfileUser)
    : 0

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(false)
    setSaving(true)

    // Validate username
    const usernameValidation = validateUsername(username)
    if (!usernameValidation.valid) {
      setError(usernameValidation.error || 'Invalid username')
      setSaving(false)
      return
    }

    try {
      const response = await fetch('/api/me/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
          body: JSON.stringify({
          first_name: firstName,
          last_name: lastName || '',
          username,
          bio,
          subjects_taught: subjectsTaught,
          grade_levels_taught: gradeLevelsTaught,
          teaching_class_types: teachingClassTypes,
          teaching_learner_paths: teachingLearnerPaths,
          teaching_strand_ids: teachingStrandIds,
          teaching_sped_level_ids: teachingSpedLevelIds,
          location_city: locationCity,
          location_region: locationRegion,
          social_links: socialLinks,
          custom_accent_color:
            profile?.subscription_tier === 'pro' || profile?.subscription_tier === 'pioneer'
              ? customAccentColor
              : undefined,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update profile')
      }

      setSuccess(true)
      setTimeout(() => {
        router.refresh()
      }, 1000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update profile')
    } finally {
      setSaving(false)
    }
  }

  // Handle avatar upload
  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const formData = new FormData()
    formData.append('avatar', file)

    try {
      const response = await fetch('/api/me/profile/avatar', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        throw new Error('Failed to upload avatar')
      }

      const { avatar_url } = await response.json()
      setProfile({ ...profile, avatar_url })
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload avatar')
    }
  }

  // Handle banner upload (Pro/Pioneer only)
  const handleBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const formData = new FormData()
    formData.append('banner', file)

    try {
      const response = await fetch('/api/me/profile/banner', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        throw new Error('Failed to upload banner')
      }

      const { banner_url } = await response.json()
      setProfile({ ...profile, banner_url })
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload banner')
    }
  }

  // Handle region selection
  const handleRegionChange = (regionCode: string) => {
    setSelectedRegionCode(regionCode)
    const region = findRegionByCode(regionCode)
    if (region) {
      setLocationRegion(region.name)
      setAvailableCities(region.cities)
      // Reset city when region changes
      setLocationCity('')
      // Close accordion after region selection (user can open again to pick city)
      setAccordionValue([])
    }
  }

  // Handle city selection
  const handleCityChange = (cityName: string) => {
    setLocationCity(cityName)
    // Close accordion after selection
    setAccordionValue([])
  }

  // Check if Basic Info section is complete
  const isBasicInfoComplete = () => {
    const fullName = `${firstName} ${lastName || ''}`.trim()
    return (
      fullName.length >= 3 &&
      username.trim().length >= 3 &&
      profile?.avatar_url &&
      bio.trim().length >= 50
    )
  }

  // Check if Teaching section is complete
  const isTeachingComplete = () => {
    // At least one teaching preference must be set (Phase 2 OR existing subjects/grades)
    return (
      teachingClassTypes.length > 0 ||
      teachingStrandIds.length > 0 ||
      teachingSpedLevelIds.length > 0 ||
      (subjectsTaught.length > 0 && gradeLevelsTaught.length > 0)
    )
  }

  // Helper: Check if Regular is selected
  const isRegularSelected = teachingClassTypes.includes('regular')
  // Helper: Check if SPED is selected
  const isSpedSelected = teachingClassTypes.includes('sped')
  // Helper: Check if SPED Non-Graded is selected
  const isSpedNonGradedSelected = teachingLearnerPaths.includes('non_graded')
  // Helper: Check if Grade 11/12 is selected
  const isGrade11Or12Selected = gradeLevelsTaught.some((g) => g === 'Grade 11' || g === 'Grade 12')

  // Dynamically update available subjects based on selections
  useEffect(() => {
    if (!hierarchy) return

    const subjects: { id: string; name: string }[] = []

    // SPED Non-Graded: show SPED subjects
    if (isSpedNonGradedSelected && hierarchy.sped?.spedSubjects) {
      subjects.push(...hierarchy.sped.spedSubjects)
    }
    // Regular or SPED Graded: show subjects based on selected grades
    else if (gradeLevelsTaught.length > 0 && hierarchy.regular?.grades) {
      // Get grade IDs for selected grade names
      const selectedGradeIds = hierarchy.regular.grades
        .filter((g) => gradeLevelsTaught.includes(g.name))
        .map((g) => g.id)

      // Add subjects for each selected grade
      selectedGradeIds.forEach((gradeId) => {
        const gradeSubjects = hierarchy.regular?.subjectsByGrade?.[gradeId] || []
        subjects.push(...gradeSubjects)
      })

      // If Grade 11/12 + Strand selected: add specialized subjects for those strands
      if (isGrade11Or12Selected && teachingStrandIds.length > 0) {
        teachingStrandIds.forEach((strandId) => {
          const strandSubjects = hierarchy.regular?.subjectsByStrand?.[strandId] || []
          subjects.push(...strandSubjects)
        })
      }
    }

    // Remove duplicates by id (same subject might appear in multiple grades/strands)
    const uniqueSubjects = Array.from(
      new Map(subjects.map((s) => [s.id, s])).values()
    )
    
    setAvailableSubjects(uniqueSubjects)
  }, [
    hierarchy,
    gradeLevelsTaught,
    teachingStrandIds,
    isSpedNonGradedSelected,
    isGrade11Or12Selected,
  ])

  // Check if Location & Social section is complete
  const isLocationComplete = () => {
    return locationCity.trim().length > 0 && locationRegion.trim().length > 0
  }

  // Preset accent colors (12 brand colors)
  const accentColors = [
    '#3B82F6', // Blue
    '#8B5CF6', // Purple
    '#EC4899', // Pink
    '#F59E0B', // Amber
    '#10B981', // Green
    '#EF4444', // Red
    '#06B6D4', // Cyan
    '#F97316', // Orange
    '#84CC16', // Lime
    '#6366F1', // Indigo
    '#14B8A6', // Teal
    '#A855F7', // Violet
  ]

  // Loading state with skeleton
  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="flex items-center justify-between mb-8">
          <Skeleton className="h-9 w-48" />
          <Skeleton className="h-7 w-24" />
        </div>
        <Skeleton className="h-4 w-full mb-8" />
        <div className="space-y-6">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      </div>
    )
  }

  const isProOrPioneer =
    profile?.subscription_tier === 'pro' || profile?.subscription_tier === 'pioneer'
  const showCustomizationTab = profile?.role !== 'buyer'

  return (
    <TooltipProvider>
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="flex items-center gap-3 mb-8">
          <UserCircle className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold">Edit Profile</h1>
        </div>

        {/* Profile Completion Indicator */}
        <ProfileCompletionIndicator percentage={completionPercent} className="mb-8" />

        {/* Error/Success Messages */}
        {error && (
          <Alert className="mb-6 border-destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="mb-6 border-green-500">
            <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
            <AlertTitle className="text-green-800 dark:text-green-200">Success</AlertTitle>
            <AlertDescription className="text-green-700 dark:text-green-300">
              Profile updated successfully!
            </AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit}>
          <Tabs defaultValue="basic" className="w-full">
            <TabsList className={`grid w-full gap-1 h-10 items-center rounded-md bg-muted p-1 text-muted-foreground w-full mb-6 ${showCustomizationTab ? 'grid-cols-4' : 'grid-cols-3'}`}>
              <TabsTrigger
                  value="basic"
                  className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium transition-all data-[active]:bg-gray-900 dark:data-[active]:bg-gray-800 data-[active]:text-white data-[active]:font-semibold data-[active]:shadow-sm data-[active]:[&_.ring-white]:ring-0 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                  <User className="h-4 w-4" />
                  <span className="relative hidden sm:inline">
                    Basic Info
                    {!isBasicInfoComplete() && (
                      <span className="absolute -top-1 -right-2 h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-white" />
                    )}
                  </span>
                  <span className="relative sm:hidden">
                    Basic
                    {!isBasicInfoComplete() && (
                      <span className="absolute -top-1 -right-2 h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-white" />
                    )}
                  </span>
                </TabsTrigger>
                <TabsTrigger
                  value="teaching"
                  className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium transition-all data-[active]:bg-gray-900 dark:data-[active]:bg-gray-800 data-[active]:text-white data-[active]:font-semibold data-[active]:shadow-sm data-[active]:[&_.ring-white]:ring-0 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                  <BookOpen className="h-4 w-4" />
                  <span className="relative hidden sm:inline">
                    Teaching
                    {!isTeachingComplete() && (
                      <span className="absolute -top-1 -right-2 h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-white" />
                    )}
                  </span>
                  <span className="relative sm:hidden">
                    Teach
                    {!isTeachingComplete() && (
                      <span className="absolute -top-1 -right-2 h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-white" />
                    )}
                  </span>
                </TabsTrigger>
                <TabsTrigger
                  value="location"
                  className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium transition-all data-[active]:bg-gray-900 dark:data-[active]:bg-gray-800 data-[active]:text-white data-[active]:font-semibold data-[active]:shadow-sm data-[active]:[&_.ring-white]:ring-0 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                  <MapPin className="h-4 w-4" />
                  <span className="relative hidden sm:inline">
                    Location & Social
                    {!isLocationComplete() && (
                      <span className="absolute -top-1 -right-2 h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-white" />
                    )}
                  </span>
                  <span className="relative sm:hidden">
                    Social
                    {!isLocationComplete() && (
                      <span className="absolute -top-1 -right-2 h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-white" />
                    )}
                  </span>
                </TabsTrigger>
                {showCustomizationTab && (
                <TabsTrigger
                  value="customization"
                  className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium transition-all data-[active]:bg-gray-900 dark:data-[active]:bg-gray-800 data-[active]:text-white data-[active]:font-semibold data-[active]:shadow-sm data-[active]:[&_.ring-white]:ring-0 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                  <Palette className="h-4 w-4" />
                  <span className="hidden sm:inline">Customization</span>
                  <span className="sm:hidden">Custom</span>
                </TabsTrigger>
                )}
            </TabsList>

            {/* Basic Info Tab */}
            <TabsContent value="basic" className="space-y-6">
              {/* Single card: Row 1 = Avatar + First Name + Last Name; Row 2 = Username + Bio */}
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    <CardTitle>Profile</CardTitle>
                  </div>
                  <CardDescription>
                    Your public display name, username, profile picture, and bio
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Row 1: Avatar left, First Name + Last Name, Username below names */}
                  <div className="grid grid-cols-1 md:grid-cols-[auto_1fr] gap-6">
                    <div className="space-y-2">
                      <Avatar className="h-24 w-24 ring-2 ring-border">
                        {profile?.avatar_url && (
                          <AvatarImage src={profile.avatar_url} alt={firstName && lastName ? `${firstName} ${lastName}` : firstName || 'Avatar'} />
                        )}
                        <AvatarFallback className="text-2xl bg-muted">
                          {getInitials(firstName || 'User', lastName || '')}
                        </AvatarFallback>
                      </Avatar>
                      <Label htmlFor="avatar" className="cursor-pointer">
                        <div className="flex items-center gap-2 text-sm font-medium">
                          <FileImage className="h-4 w-4" />
                          Choose Image
                        </div>
                      </Label>
                      <Input
                        id="avatar"
                        type="file"
                        accept="image/*"
                        onChange={handleAvatarUpload}
                        className="cursor-pointer"
                      />
                      <p className="text-xs text-muted-foreground">
                        JPG, PNG or GIF. Max size 5MB
                      </p>
                    </div>
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="firstName">First Name</Label>
                          <Input
                            id="firstName"
                            type="text"
                            value={firstName}
                            onChange={(e) => setFirstName(e.target.value)}
                            minLength={1}
                            maxLength={255}
                            required
                            placeholder="Enter your first name"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="lastName">Last Name</Label>
                          <Input
                            id="lastName"
                            type="text"
                            value={lastName}
                            onChange={(e) => setLastName(e.target.value)}
                            maxLength={255}
                            placeholder="Enter your last name (optional)"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Label htmlFor="username">Username</Label>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Info className="h-3 w-3 text-muted-foreground cursor-help" />
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Your username must be unique and will be used in your profile URL</p>
                            </TooltipContent>
                          </Tooltip>
                        </div>
                        <Input
                          id="username"
                          type="text"
                          value={username}
                          onChange={(e) => setUsername(e.target.value)}
                          minLength={3}
                          maxLength={20}
                          pattern="[a-zA-Z0-9_]+"
                          placeholder="username"
                        />
                        <p className="text-xs text-muted-foreground">
                          /sellers/{username || 'username'}
                        </p>
                      </div>
                    </div>
                  </div>
                  {/* Row 2: Bio full width */}
                  <div className="space-y-2">
                    <Label htmlFor="bio">Bio</Label>
                    <Textarea
                      id="bio"
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      maxLength={500}
                      rows={5}
                      placeholder="Write a brief description about yourself..."
                      className="resize-none"
                    />
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-muted-foreground">
                        {bio.length}/500 characters
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {bio.length >= 50 ? '✓' : '50+ recommended'}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Teaching Tab */}
            <TabsContent value="teaching" className="space-y-4">
              {/* Phase 2 Preferences Section */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                  <BookOpen className="h-4 w-4" />
                  Phase 2 Preferences
                </h3>

                {/* Phase 2: Class Type (single-select) */}
                <Card>
                  <CardHeader className="bg-gray-50/50 dark:bg-gray-800/50 border-b">
                    <div className="flex items-center gap-2">
                      <BookOpen className="h-4 w-4" />
                      <CardTitle>Class Type</CardTitle>
                    </div>
                    <CardDescription>Select the class type you teach (optional)</CardDescription>
                  </CardHeader>
                  <CardContent className="pt-4 pb-4 px-6 space-y-2">
                    <RadioGroup
                      value={teachingClassTypes[0] ?? ''}
                      onValueChange={(value) => {
                        if (value && typeof value === 'string') {
                          setTeachingClassTypes([value])
                          if (value === 'sped') {
                            setTeachingLearnerPaths([])
                            setTeachingSpedLevelIds([])
                          } else {
                            setTeachingStrandIds([])
                          }
                        } else {
                          setTeachingClassTypes([])
                          setTeachingLearnerPaths([])
                          setTeachingSpedLevelIds([])
                          setTeachingStrandIds([])
                        }
                      }}
                      className="grid grid-cols-1 md:grid-cols-2 gap-3"
                    >
                      {CLASS_TYPES.map((classType) => (
                        <div key={classType.value} className="flex items-center gap-3 p-2 rounded-md hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                          <RadioGroupItem
                            id={`class-type-${classType.value}`}
                            value={classType.value}
                          />
                          <Label
                            htmlFor={`class-type-${classType.value}`}
                            className={`flex-1 cursor-pointer text-sm ${teachingClassTypes.includes(classType.value) ? 'font-medium' : 'font-normal'}`}
                          >
                            {classType.label}
                          </Label>
                        </div>
                      ))}
                    </RadioGroup>
                  </CardContent>
                </Card>

                {/* Phase 2: Learner Path (conditional on SPED, single-select) */}
                {isSpedSelected && (
                  <Card className="border-l-4 border-purple-200 dark:border-purple-800">
                    <CardHeader className="bg-gray-50/50 dark:bg-gray-800/50 border-b">
                      <div className="flex items-center gap-2">
                        <BookOpen className="h-4 w-4" />
                        <CardTitle>SPED Learner Path</CardTitle>
                      </div>
                      <CardDescription>Select the SPED learner path you teach (optional)</CardDescription>
                    </CardHeader>
                    <CardContent className="pt-4 pb-4 px-6 space-y-2">
                      <RadioGroup
                        value={teachingLearnerPaths[0] ?? ''}
                        onValueChange={(value) => {
                          if (value && typeof value === 'string') {
                            setTeachingLearnerPaths([value])
                            if (value !== 'non_graded') {
                              setTeachingSpedLevelIds([])
                            }
                          } else {
                            setTeachingLearnerPaths([])
                            setTeachingSpedLevelIds([])
                          }
                        }}
                        className="grid grid-cols-1 md:grid-cols-2 gap-3"
                      >
                        {LEARNER_PATHS.map((path) => (
                          <div key={path.value} className="flex items-center gap-3 p-2 rounded-md hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                            <RadioGroupItem
                              id={`learner-path-${path.value}`}
                              value={path.value}
                            />
                            <Label
                              htmlFor={`learner-path-${path.value}`}
                              className={`flex-1 cursor-pointer text-sm ${teachingLearnerPaths.includes(path.value) ? 'font-medium' : 'font-normal'}`}
                            >
                              {path.label}
                            </Label>
                          </div>
                        ))}
                      </RadioGroup>
                    </CardContent>
                  </Card>
                )}

                {/* Phase 2: SPED Levels (conditional on SPED Non-Graded) */}
                {isSpedNonGradedSelected && hierarchy?.sped?.levels && (
                  <Card className="border-l-4 border-purple-200 dark:border-purple-800">
                    <CardHeader className="bg-gray-50/50 dark:bg-gray-800/50 border-b">
                      <div className="flex items-center gap-2">
                        <BookOpen className="h-4 w-4" />
                        <CardTitle>SPED Levels</CardTitle>
                      </div>
                      <CardDescription>Select the SPED levels you teach (optional)</CardDescription>
                    </CardHeader>
                    <CardContent className="p-6 space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {hierarchy.sped.levels.map((level) => (
                          <div key={level.id} className="flex items-center gap-3 p-2 rounded-md hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                            <Checkbox
                              id={`sped-level-${level.id}`}
                              checked={teachingSpedLevelIds.includes(level.id)}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setTeachingSpedLevelIds([...teachingSpedLevelIds, level.id])
                                } else {
                                  setTeachingSpedLevelIds(teachingSpedLevelIds.filter((id) => id !== level.id))
                                }
                              }}
                            />
                            <Label
                              htmlFor={`sped-level-${level.id}`}
                              className={`flex-1 cursor-pointer text-sm ${teachingSpedLevelIds.includes(level.id) ? 'font-medium' : 'font-normal'}`}
                            >
                              {level.name}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Phase 2: Strand (conditional on Regular + G11/12) */}
                {isRegularSelected && isGrade11Or12Selected && hierarchy?.regular?.strands && (
                  <Card className="border-l-4 border-purple-200 dark:border-purple-800">
                    <CardHeader className="bg-gray-50/50 dark:bg-gray-800/50 border-b">
                      <div className="flex items-center gap-2">
                        <BookOpen className="h-4 w-4" />
                        <CardTitle>Strands</CardTitle>
                      </div>
                      <CardDescription>Select the strands you teach for Grade 11/12 (optional)</CardDescription>
                    </CardHeader>
                    <CardContent className="p-6 space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {hierarchy.regular.strands.map((strand) => (
                          <div key={strand.id} className="flex items-center gap-3 p-2 rounded-md hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                            <Checkbox
                              id={`strand-${strand.id}`}
                              checked={teachingStrandIds.includes(strand.id)}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setTeachingStrandIds([...teachingStrandIds, strand.id])
                                } else {
                                  setTeachingStrandIds(teachingStrandIds.filter((id) => id !== strand.id))
                                }
                              }}
                            />
                            <Label
                              htmlFor={`strand-${strand.id}`}
                              className={`flex-1 cursor-pointer text-sm ${teachingStrandIds.includes(strand.id) ? 'font-medium' : 'font-normal'}`}
                            >
                              {strand.name}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>

              <Separator className="my-6" />

              {/* Teaching Assignments Section */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                  <GraduationCap className="h-4 w-4" />
                  Teaching Assignments
                </h3>

                {/* Grade Levels Taught (hidden when SPED Non-Graded selected) */}
                {!isSpedNonGradedSelected && (
                  <Card>
                    <CardHeader className="bg-gray-50/50 dark:bg-gray-800/50 border-b">
                      <div className="flex items-center gap-2">
                        <GraduationCap className="h-4 w-4" />
                        <CardTitle>Grade Levels Taught</CardTitle>
                      </div>
                      <CardDescription>Select all grade levels you teach</CardDescription>
                    </CardHeader>
                    <CardContent className="p-6 space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {availableGrades.map((grade) => (
                          <div key={grade.id} className="flex items-center gap-3 p-2 rounded-md hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                            <Checkbox
                              id={`grade-${grade.id}`}
                              checked={gradeLevelsTaught.includes(grade.name)}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setGradeLevelsTaught([...gradeLevelsTaught, grade.name])
                                } else {
                                  const newGrades = gradeLevelsTaught.filter((g) => g !== grade.name)
                                  setGradeLevelsTaught(newGrades)
                                  if (grade.name === 'Grade 11' || grade.name === 'Grade 12') {
                                    const stillHasG11Or12 = newGrades.some((g) => g === 'Grade 11' || g === 'Grade 12')
                                    if (!stillHasG11Or12) {
                                      setTeachingStrandIds([])
                                    }
                                  }
                                }
                              }}
                            />
                            <Label
                              htmlFor={`grade-${grade.id}`}
                              className={`flex-1 cursor-pointer text-sm ${gradeLevelsTaught.includes(grade.name) ? 'font-medium' : 'font-normal'}`}
                            >
                              {grade.name}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Subjects Taught */}
                <Card>
                  <CardHeader className="bg-gray-50/50 dark:bg-gray-800/50 border-b">
                    <div className="flex items-center gap-2">
                      <BookOpen className="h-4 w-4" />
                      <CardTitle>Subjects Taught</CardTitle>
                    </div>
                    <CardDescription>Select all subjects you teach</CardDescription>
                  </CardHeader>
                  <CardContent className="p-6 space-y-4">
                    {availableSubjects.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {availableSubjects.map((subject) => (
                          <div key={subject.id} className="flex items-center gap-3 p-2 rounded-md hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                            <Checkbox
                              id={`subject-${subject.id}`}
                              checked={subjectsTaught.includes(subject.name)}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setSubjectsTaught([...subjectsTaught, subject.name])
                                } else {
                                  setSubjectsTaught(subjectsTaught.filter((s) => s !== subject.name))
                                }
                              }}
                            />
                            <Label
                              htmlFor={`subject-${subject.id}`}
                              className={`flex-1 cursor-pointer text-sm ${subjectsTaught.includes(subject.name) ? 'font-medium' : 'font-normal'}`}
                            >
                              {subject.name}
                            </Label>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground italic">Select grade levels first to see available subjects</p>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Location & Social Tab */}
            <TabsContent value="location" className="space-y-6">
              {/* Location */}
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    <CardTitle>Location</CardTitle>
                  </div>
                  <CardDescription>Help others find you by sharing your location</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Location</Label>
                    <Accordion
                      value={accordionValue}
                      onValueChange={(value) => setAccordionValue(Array.isArray(value) ? value : [])}
                      className="w-full"
                    >
                      <AccordionItem value="region">
                        <AccordionTrigger className="text-sm">
                          <div className="flex items-center gap-2">
                            <Globe className="h-4 w-4 text-muted-foreground" />
                            <span>
                              {selectedRegionCode
                                ? findRegionByCode(selectedRegionCode)?.name
                                : 'Select a region'}
                            </span>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent>
                          <div className="space-y-1 pt-2">
                            {allRegions.map((region) => (
                              <button
                                key={region.code}
                                type="button"
                                onClick={() => handleRegionChange(region.code)}
                                className="w-full text-left px-3 py-2 text-sm hover:bg-muted rounded-md transition-colors"
                              >
                                {region.name}
                              </button>
                            ))}
                          </div>
                        </AccordionContent>
                      </AccordionItem>

                      {selectedRegionCode && (
                        <AccordionItem value="city">
                          <AccordionTrigger className="text-sm">
                            <div className="flex items-center gap-2">
                              <MapPin className="h-4 w-4 text-muted-foreground" />
                              <span>
                                {locationCity || 'Select a city/municipality'}
                              </span>
                            </div>
                          </AccordionTrigger>
                          <AccordionContent>
                            <div className="space-y-1 pt-2 max-h-64 overflow-y-auto">
                              {availableCities.map((city, index) => (
                                <button
                                  key={`city-${selectedRegionCode}-${index}-${city.name}`}
                                  type="button"
                                  onClick={() => handleCityChange(city.name)}
                                  className="w-full text-left px-3 py-2 text-sm hover:bg-muted rounded-md transition-colors"
                                >
                                  {city.name}
                                </button>
                              ))}
                            </div>
                          </AccordionContent>
                        </AccordionItem>
                      )}
                    </Accordion>
                    {!selectedRegionCode && (
                      <p className="text-xs text-muted-foreground">
                        Please select a region first to see available cities
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Separator />

              {/* Social Links */}
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Globe className="h-4 w-4" />
                    <CardTitle>Social Links</CardTitle>
                  </div>
                  <CardDescription>Connect your social media profiles</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="facebook" className="flex items-center gap-2">
                      <Facebook className="h-4 w-4" />
                      Facebook URL
                    </Label>
                    <Input
                      id="facebook"
                      type="url"
                      value={socialLinks.facebook}
                      onChange={(e) =>
                        setSocialLinks({ ...socialLinks, facebook: e.target.value })
                      }
                      placeholder="https://facebook.com/yourpage"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="instagram" className="flex items-center gap-2">
                      <Instagram className="h-4 w-4" />
                      Instagram URL
                    </Label>
                    <Input
                      id="instagram"
                      type="url"
                      value={socialLinks.instagram}
                      onChange={(e) =>
                        setSocialLinks({ ...socialLinks, instagram: e.target.value })
                      }
                      placeholder="https://instagram.com/yourhandle"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="youtube" className="flex items-center gap-2">
                      <Youtube className="h-4 w-4" />
                      YouTube URL
                    </Label>
                    <Input
                      id="youtube"
                      type="url"
                      value={socialLinks.youtube}
                      onChange={(e) =>
                        setSocialLinks({ ...socialLinks, youtube: e.target.value })
                      }
                      placeholder="https://youtube.com/@yourchannel"
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Customization Tab (hidden for buyers) */}
            {showCustomizationTab && (
            <TabsContent value="customization" className="space-y-6">
              {isProOrPioneer ? (
                <>
                  {/* Banner */}
                  <Card>
                    <CardHeader>
                      <div className="flex items-center gap-2">
                        <Image className="h-4 w-4" />
                        <CardTitle>Banner Image</CardTitle>
                      </div>
                      <CardDescription>
                        Upload a banner image for your profile (max 5MB, 1200x300px recommended)
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {profile?.banner_url && (
                        <div className="relative h-32 w-full rounded-lg overflow-hidden border border-border">
                          <img
                            src={profile.banner_url}
                            alt="Banner"
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                      <div className="space-y-2">
                        <Label htmlFor="banner" className="cursor-pointer">
                          <div className="flex items-center gap-2 text-sm font-medium">
                            <Image className="h-4 w-4" />
                            Choose Banner Image
                          </div>
                        </Label>
                        <Input
                          id="banner"
                          type="file"
                          accept="image/*"
                          onChange={handleBannerUpload}
                          className="cursor-pointer"
                        />
                        <p className="text-xs text-muted-foreground">
                          JPG, PNG or GIF. Max size 5MB. Recommended: 1200x300px
                        </p>
                      </div>
                    </CardContent>
                  </Card>

                  <Separator />

                  {/* Custom Accent Color */}
                  <Card>
                    <CardHeader>
                      <div className="flex items-center gap-2">
                        <Palette className="h-4 w-4" />
                        <CardTitle>Custom Accent Color</CardTitle>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Choose a custom accent color to personalize your profile</p>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                      <CardDescription>Select an accent color for your profile theme</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-6 gap-3">
                        {accentColors.map((color) => (
                          <Tooltip key={color}>
                            <TooltipTrigger asChild>
                              <button
                                type="button"
                                onClick={() => setCustomAccentColor(color)}
                                className={`h-12 w-12 rounded-md border-2 transition-all hover:scale-110 hover:ring-2 hover:ring-offset-2 ${
                                  customAccentColor === color
                                    ? 'border-foreground ring-foreground/20'
                                    : 'border-transparent hover:border-foreground/50'
                                }`}
                                style={{ backgroundColor: color }}
                                aria-label={`Select color ${color}`}
                              />
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>{color}</p>
                            </TooltipContent>
                          </Tooltip>
                        ))}
                      </div>
                      {customAccentColor && (
                        <div className="flex items-center gap-2 p-3 rounded-md bg-muted">
                          <div
                            className="h-4 w-4 rounded-full border border-border"
                            style={{ backgroundColor: customAccentColor }}
                          />
                          <p className="text-sm text-muted-foreground">
                            Selected: <span className="font-mono">{customAccentColor}</span>
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </>
              ) : (
                <Card>
                  <CardContent className="py-12 text-center">
                    <Palette className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <CardTitle className="mb-2">Pro Feature</CardTitle>
                    <CardDescription>
                      Customization options are available for Pro and Pioneer subscribers.
                      Upgrade your account to access banner images and custom accent colors.
                    </CardDescription>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
            )}
          </Tabs>

          {/* Submit Button */}
          <div className="flex justify-end gap-4 mt-8 pt-6 border-t">
            <Button type="button" variant="outline" onClick={() => router.back()}>
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? (
                <>
                  <div className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </TooltipProvider>
  )
}
