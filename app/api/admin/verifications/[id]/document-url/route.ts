import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/middleware/admin-auth'

/**
 * GET /api/admin/verifications/[id]/document-url
 * Get signed URL for verification document (admin only)
 * 
 * Returns: { url: string } - Signed URL valid for 1 hour
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await requireAdmin(request)
    if (!authResult.success) {
      return authResult.response
    }

    const supabase = await createClient()
    const { id } = await params
    const verificationId = id

    // Get verification record
    const { data: verification, error: fetchError } = await supabase
      .from('teacher_id_verifications')
      .select('document_url')
      .eq('id', verificationId)
      .single()

    if (fetchError || !verification) {
      return NextResponse.json(
        { error: 'Verification not found' },
        { status: 404 }
      )
    }

    // Extract path from document_url
    // Format: teacher-verifications/{user_id}/{timestamp}-prc-license.{ext}
    let storagePath = verification.document_url
    if (storagePath.startsWith('teacher-verifications/')) {
      storagePath = storagePath.replace('teacher-verifications/', '')
    }

    // Use admin client to create signed URL
    const adminClient = createAdminClient()
    const { data: signedUrlData, error: urlError } = await adminClient.storage
      .from('teacher-verifications')
      .createSignedUrl(storagePath, 3600) // Valid for 1 hour

    if (urlError || !signedUrlData) {
      console.error('Error creating signed URL:', urlError)
      return NextResponse.json(
        { error: 'Failed to generate document URL' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      url: signedUrlData.signedUrl,
    })
  } catch (error) {
    console.error('Error in GET /api/admin/verifications/[id]/document-url:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
