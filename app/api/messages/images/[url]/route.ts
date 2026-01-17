import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

/**
 * DELETE /api/messages/images/[url]
 * Delete uploaded image (before sending message)
 * Note: URL is base64 encoded path
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ url: string }> }
) {
  try {
    const { url } = await params
    const supabase = await createClient()

    // Check authentication
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Decode URL to get path
    const imagePath = decodeURIComponent(url)

    // Extract path from full URL if needed
    // Path format: {conversationId}/{userId}/{timestamp}-{random}.{ext}
    const pathParts = imagePath.split('/')
    const userId = pathParts[pathParts.length - 2] // User ID is second to last

    // Verify user owns this image
    if (userId !== user.id) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      )
    }

    // Delete from storage
    const { error: deleteError } = await supabase.storage
      .from('message-images')
      .remove([imagePath])

    if (deleteError) {
      console.error('Error deleting image:', deleteError)
      return NextResponse.json(
        { error: 'Failed to delete image' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in DELETE /api/messages/images/[url]:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
