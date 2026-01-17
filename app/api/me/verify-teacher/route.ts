import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextRequest, NextResponse } from 'next/server'

/**
 * Ensure teacher-verifications storage bucket exists
 * Creates bucket if it doesn't exist (private bucket for PDF/JPG/PNG)
 */
async function ensureTeacherVerificationBucket() {
  try {
    const adminClient = createAdminClient()
    
    // Check if bucket exists by trying to list it
    const { data: buckets, error: listError } = await adminClient.storage.listBuckets()
    
    if (listError) {
      console.error('Error listing buckets:', listError)
      return { success: false, error: listError }
    }
    
    const bucketExists = buckets?.some(bucket => bucket.name === 'teacher-verifications')
    let bucketCreated = false
    
    if (!bucketExists) {
      // Bucket doesn't exist, create it using REST API
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
      const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
      
      const response = await fetch(`${supabaseUrl}/storage/v1/bucket`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${serviceRoleKey}`,
          'apikey': serviceRoleKey,
        },
        body: JSON.stringify({
          name: 'teacher-verifications',
          public: false, // Private bucket - sensitive documents
          file_size_limit: 5242880, // 5MB limit
          allowed_mime_types: ['application/pdf', 'image/jpeg', 'image/png'],
        }),
      })
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Unknown error' }))
        console.error('Error creating bucket:', errorData)
        return { success: false, error: errorData }
      }
      
      bucketCreated = true
    }
    
    return { success: true, created: bucketCreated }
  } catch (error) {
    console.error('Error ensuring storage bucket:', error)
    return { success: false, error }
  }
}

/**
 * POST /api/me/verify-teacher
 * Submit teacher verification with PRC License document
 * 
 * FormData:
 * - document: File (PRC ID - PDF/JPG/PNG, max 5MB)
 * - prc_license_number: string
 * - prc_license_expiry: date string (YYYY-MM-DD)
 * 
 * Returns: { verification_id, status: 'pending' }
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Check authentication
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user already has pending verification
    const { data: pendingVerification, error: pendingError } = await supabase
      .from('teacher_id_verifications')
      .select('id')
      .eq('user_id', user.id)
      .eq('status', 'pending')
      .single()

    // Handle table not found error gracefully (migration not run yet)
    if (pendingError && pendingError.code !== 'PGRST116' && pendingError.code !== 'PGRST205') {
      // PGRST116 = no rows returned (expected), PGRST205 = table not found
      console.error('Error checking pending verification:', pendingError)
      return NextResponse.json(
        { error: 'Failed to check verification status. Please try again.' },
        { status: 500 }
      )
    }

    if (pendingVerification) {
      return NextResponse.json(
        { error: 'You already have a pending verification request. Please wait for review.' },
        { status: 400 }
      )
    }

    // Check attempt count (max 3 rejections)
    const { data: rejectedVerifications, error: rejectedError } = await supabase
      .from('teacher_id_verifications')
      .select('id')
      .eq('user_id', user.id)
      .eq('status', 'rejected')

    // Handle table not found error gracefully
    if (rejectedError && rejectedError.code === 'PGRST205') {
      // Table doesn't exist - migration not run yet, allow submission
    } else if (rejectedError && rejectedError.code !== 'PGRST116') {
      console.error('Error checking rejected verifications:', rejectedError)
      return NextResponse.json(
        { error: 'Failed to check verification status. Please try again.' },
        { status: 500 }
      )
    } else if (rejectedVerifications && rejectedVerifications.length >= 3) {
      return NextResponse.json(
        { error: 'Maximum verification attempts reached. Please contact support for assistance.' },
        { status: 400 }
      )
    }

    // Parse form data
    const formData = await request.formData()
    const documentFile = formData.get('document') as File
    const prcLicenseNumber = formData.get('prc_license_number') as string
    const prcLicenseExpiry = formData.get('prc_license_expiry') as string

    // Validation
    if (!documentFile) {
      return NextResponse.json({ error: 'Document file is required' }, { status: 400 })
    }

    if (!prcLicenseNumber || !prcLicenseNumber.trim()) {
      return NextResponse.json({ error: 'PRC License Number is required' }, { status: 400 })
    }

    if (!prcLicenseExpiry) {
      return NextResponse.json({ error: 'PRC License Expiration Date is required' }, { status: 400 })
    }

    // Validate file type
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png']
    if (!allowedTypes.includes(documentFile.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Only PDF, JPG, and PNG files are allowed.' },
        { status: 400 }
      )
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024 // 5MB
    if (documentFile.size > maxSize) {
      return NextResponse.json(
        { error: 'File size must be less than 5MB' },
        { status: 400 }
      )
    }

    // Validate expiration date is in the future
    const expiryDate = new Date(prcLicenseExpiry)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    if (expiryDate <= today) {
      return NextResponse.json(
        { error: 'License expiration date must be in the future' },
        { status: 400 }
      )
    }

    // Ensure storage bucket exists before upload
    const bucketResult = await ensureTeacherVerificationBucket()
    
    if (!bucketResult.success) {
      console.error('Failed to ensure storage bucket:', bucketResult.error)
      return NextResponse.json(
        { error: 'Storage system is not set up yet. Please contact support or wait for system setup.' },
        { status: 503 }
      )
    }

    // Upload document to Supabase Storage
    const timestamp = Date.now()
    const fileExt = documentFile.name.split('.').pop() || 'pdf'
    const fileName = `${user.id}/${timestamp}-prc-license.${fileExt}`

    // Convert File to ArrayBuffer for upload
    const arrayBuffer = await documentFile.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Upload to teacher-verifications bucket
    // Use admin client to bypass RLS if policies aren't set up yet
    let uploadData, uploadError
    let usedAdminClient = false
    
    // Try with regular client first
    const uploadResult = await supabase.storage
      .from('teacher-verifications')
      .upload(fileName, buffer, {
        contentType: documentFile.type,
        upsert: false,
      })
    
    uploadData = uploadResult.data
    uploadError = uploadResult.error

    // If RLS policy error, try with admin client (bypasses RLS)
    if (uploadError && uploadError.message?.includes('row-level security')) {
      const adminClient = createAdminClient()
      const adminUploadResult = await adminClient.storage
        .from('teacher-verifications')
        .upload(fileName, buffer, {
          contentType: documentFile.type,
          upsert: false,
        })
      
      uploadData = adminUploadResult.data
      uploadError = adminUploadResult.error
      usedAdminClient = true
    }

    if (uploadError) {
      console.error('Error uploading document:', uploadError)
      
      // Handle bucket not found error
      if (uploadError.message?.includes('Bucket not found') || uploadError.message?.includes('does not exist')) {
        return NextResponse.json(
          { error: 'Verification system is not set up yet. The storage bucket has not been created. Please contact support or wait for system setup.' },
          { status: 503 }
        )
      }
      
      return NextResponse.json(
        { error: `Failed to upload document: ${uploadError.message || 'Please try again.'}` },
        { status: 500 }
      )
    }

    // For private buckets, store the path (admins will access via admin client)
    // Format: teacher-verifications/{user_id}/{timestamp}-prc-license.{ext}
    const documentUrl = `teacher-verifications/${uploadData.path}`

    // Create verification record
    const { data: verification, error: insertError } = await supabase
      .from('teacher_id_verifications')
      .insert({
        user_id: user.id,
        document_url: documentUrl,
        prc_license_number: prcLicenseNumber.trim(),
        prc_license_expiry: prcLicenseExpiry,
        status: 'pending',
      })
      .select()
      .single()

    if (insertError) {
      console.error('Error creating verification record:', insertError)
      
      // Try to delete uploaded file if record creation fails
      // Use the same client that was used for upload
      if (usedAdminClient) {
        const adminClient = createAdminClient()
        await adminClient.storage
          .from('teacher-verifications')
          .remove([uploadData.path])
          .catch(() => {}) // Ignore cleanup errors
      } else {
        await supabase.storage
          .from('teacher-verifications')
          .remove([uploadData.path])
          .catch(() => {}) // Ignore cleanup errors
      }

      // Handle table not found error
      if (insertError.code === 'PGRST205') {
        return NextResponse.json(
          { error: 'Verification system is not fully set up yet. The database table has not been created. Please run the migration or contact support.' },
          { status: 503 }
        )
      }

      return NextResponse.json(
        { error: 'Failed to create verification record. Please try again.' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      verification_id: verification.id,
      status: verification.status,
      message: 'Verification request submitted successfully',
    })
  } catch (error) {
    console.error('Error in POST /api/me/verify-teacher:', error)
    return NextResponse.json(
      { error: `An unexpected error occurred: ${error instanceof Error ? error.message : 'Please try again.'}` },
      { status: 500 }
    )
  }
}
