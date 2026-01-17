import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

/**
 * POST /api/me/profile/banner
 * Upload banner image (Pro/Pioneer only)
 * 
 * Requires authentication
 * Requires Pro or Pioneer subscription
 * Accepts image file (max 5MB, 1200x300px recommended)
 * Uploads to Supabase Storage: user-banners/[user_id]/banner.jpg
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Check authentication
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser()

    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check subscription tier (Pro or Pioneer only)
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('subscription_tier')
      .eq('id', authUser.id)
      .single()

    if (userError || !user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    if (user.subscription_tier !== 'pro' && user.subscription_tier !== 'pioneer') {
      return NextResponse.json(
        { error: 'Banner upload is only available for Pro and Pioneer sellers' },
        { status: 403 }
      )
    }

    // Get form data
    const formData = await request.formData()
    const file = formData.get('banner') as File

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: 'File must be an image' }, { status: 400 })
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024 // 5MB
    if (file.size > maxSize) {
      return NextResponse.json({ error: 'File size must be less than 5MB' }, { status: 400 })
    }

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Generate file path
    const fileExt = file.name.split('.').pop() || 'jpg'
    const fileName = `banner.${fileExt}`
    const filePath = `${authUser.id}/${fileName}`

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('user-banners')
      .upload(filePath, buffer, {
        contentType: file.type,
        upsert: true, // Replace if exists
      })

    if (uploadError) {
      console.error('Error uploading banner:', uploadError)
      return NextResponse.json({ error: 'Failed to upload banner' }, { status: 500 })
    }

    // Get public URL
    const {
      data: { publicUrl },
    } = supabase.storage.from('user-banners').getPublicUrl(filePath)

    // Update user's banner_url
    const { error: updateError } = await supabase
      .from('users')
      .update({ banner_url: publicUrl })
      .eq('id', authUser.id)

    if (updateError) {
      console.error('Error updating banner URL:', updateError)
      return NextResponse.json({ error: 'Failed to update banner URL' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      banner_url: publicUrl,
    })
  } catch (error) {
    console.error('Error uploading banner:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
