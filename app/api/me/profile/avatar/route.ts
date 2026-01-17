import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { ensureStorageBucket } from '@/lib/utils/storage'

/**
 * POST /api/me/profile/avatar
 * Upload avatar image
 * 
 * Requires authentication
 * Accepts image file (max 5MB)
 * Uploads to Supabase Storage: user-avatars/[user_id]/avatar.jpg
 * Auto-crops to square
 */
export async function POST(request: NextRequest) {
  // #region agent log
  fetch('http://127.0.0.1:7248/ingest/00d5f2ca-d0b7-44d8-a520-af7d4c8e25e2',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'route.ts:13',message:'POST /api/me/profile/avatar entry',data:{hasSupabaseUrl:!!process.env.NEXT_PUBLIC_SUPABASE_URL,supabaseUrlPrefix:process.env.NEXT_PUBLIC_SUPABASE_URL?.substring(0,20)||'missing'},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
  // #endregion
  try {
    const supabase = await createClient()

    // Check authentication
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser()

    // #region agent log
    fetch('http://127.0.0.1:7248/ingest/00d5f2ca-d0b7-44d8-a520-af7d4c8e25e2',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'route.ts:21',message:'Auth check result',data:{isAuthenticated:!!authUser,userId:authUser?.id?.substring(0,8)||'none'},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
    // #endregion

    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get form data
    const formData = await request.formData()
    const file = formData.get('avatar') as File

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
    const fileName = `avatar.${fileExt}`
    const filePath = `${authUser.id}/${fileName}`

    // #region agent log
    fetch('http://127.0.0.1:7248/ingest/00d5f2ca-d0b7-44d8-a520-af7d4c8e25e2',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'route.ts:61',message:'Before storage upload attempt',data:{bucketName:'user-avatars',filePath,fileSize:file.size,fileType:file.type,fileName},timestamp:Date.now(),sessionId:'debug-session',runId:'post-fix',hypothesisId:'A'})}).catch(()=>{});
    // #endregion

    // Ensure storage bucket exists
    const bucketName = 'user-avatars'
    const bucketResult = await ensureStorageBucket(bucketName, true)
    
    // #region agent log
    fetch('http://127.0.0.1:7248/ingest/00d5f2ca-d0b7-44d8-a520-af7d4c8e25e2',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'route.ts:66',message:'Bucket ensure result',data:{bucketName,success:bucketResult.success,created:bucketResult.created,hasError:!!bucketResult.error},timestamp:Date.now(),sessionId:'debug-session',runId:'post-fix',hypothesisId:'A'})}).catch(()=>{});
    // #endregion

    if (!bucketResult.success) {
      console.error('Failed to ensure storage bucket exists:', bucketResult.error)
      return NextResponse.json(
        { error: 'Storage bucket not available. Please contact support.' },
        { status: 500 }
      )
    }
    
    // #region agent log
    fetch('http://127.0.0.1:7248/ingest/00d5f2ca-d0b7-44d8-a520-af7d4c8e25e2',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'route.ts:80',message:'Bucket ensured, attempting upload',data:{bucketName,bucketCreated:bucketResult.created},timestamp:Date.now(),sessionId:'debug-session',runId:'post-fix',hypothesisId:'A'})}).catch(()=>{});
    // #endregion

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(bucketName)
      .upload(filePath, buffer, {
        contentType: file.type,
        upsert: true, // Replace if exists
      })

    // #region agent log
    fetch('http://127.0.0.1:7248/ingest/00d5f2ca-d0b7-44d8-a520-af7d4c8e25e2',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'route.ts:78',message:'Storage upload result',data:{hasError:!!uploadError,errorMessage:uploadError?.message||'none',errorName:uploadError?.name||'none',hasData:!!uploadData},timestamp:Date.now(),sessionId:'debug-session',runId:'post-fix',hypothesisId:'A'})}).catch(()=>{});
    // #endregion

    if (uploadError) {
      console.error('Error uploading avatar:', uploadError)
      
      // Check if it's an RLS policy error
      if (uploadError.message?.includes('row-level security') || uploadError.message?.includes('403')) {
        return NextResponse.json(
          { 
            error: 'Storage permissions not configured. Please run migration 006_storage_buckets_and_policies.sql',
            details: 'The storage bucket exists but RLS policies are missing. Run the migration to fix this.'
          },
          { status: 500 }
        )
      }
      
      return NextResponse.json({ error: 'Failed to upload avatar' }, { status: 500 })
    }

    if (!uploadData) {
      return NextResponse.json({ error: 'Failed to upload avatar' }, { status: 500 })
    }

    // Get public URL
    const {
      data: { publicUrl },
    } = supabase.storage.from(bucketName).getPublicUrl(filePath)

    // Update user's avatar_url
    const { error: updateError } = await supabase
      .from('users')
      .update({ avatar_url: publicUrl })
      .eq('id', authUser.id)

    if (updateError) {
      console.error('Error updating avatar URL:', updateError)
      return NextResponse.json({ error: 'Failed to update avatar URL' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      avatar_url: publicUrl,
    })
  } catch (error) {
    console.error('Error uploading avatar:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
