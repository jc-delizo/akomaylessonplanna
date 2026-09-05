import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { verifyFacebookSignedRequest } from '@/lib/security/facebook-signed-request'
import { hashDeletionConfirmationCode } from '@/lib/security/data-deletion'
import crypto from 'crypto'

/**
 * Facebook User Data Deletion Callback
 * 
 * This endpoint handles Facebook's data deletion requests as required by Facebook's
 * Data Deletion Callback URL policy.
 * 
 * When a user requests data deletion through Facebook, Facebook will send a POST
 * request to this endpoint with a signed_request parameter.
 * 
 * Documentation: https://developers.facebook.com/docs/apps/delete-data
 * 
 * POST /api/webhooks/facebook/data-deletion
 * 
 * Body (form-data):
 * - signed_request: string (Facebook signed request containing user_id)
 * 
 * Response:
 * {
 *   "url": "https://yourdomain.com/deletion-status?id=CONFIRMATION_CODE",
 *   "confirmation_code": "CONFIRMATION_CODE"
 * }
 */

/**
 * Find user by Facebook provider ID
 * 
 * We store the Facebook user ID in user_metadata during OAuth flow.
 * This allows us to find users by their Facebook ID for deletion requests.
 */
async function findUserByFacebookId(
  facebookUserId: string,
  supabase: ReturnType<typeof createAdminClient>
): Promise<string | null> {
  let page = 1

  while (page <= 100) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 1000 })

    if (error) throw error

    const user = data.users.find(
      (candidate) =>
        candidate.user_metadata?.provider_user_id === facebookUserId ||
        candidate.user_metadata?.facebook_user_id === facebookUserId ||
        candidate.app_metadata?.provider_user_id === facebookUserId ||
        candidate.identities?.some(
          (identity) =>
            identity.provider === 'facebook' &&
            (identity.id === facebookUserId || identity.identity_data?.sub === facebookUserId)
        )
    )

    if (user) return user.id
    if (!data.nextPage) return null
    page = data.nextPage
  }

  throw new Error('Facebook identity lookup exceeded the pagination limit')
}

/**
 * Delete or anonymize user data
 */
async function deleteUserData(
  userId: string,
  supabase: ReturnType<typeof createAdminClient>
): Promise<boolean> {
  try {
    // 1. Delete user profile from public.users table
    const { error: profileError } = await supabase
      .from('users')
      .delete()
      .eq('id', userId)

    if (profileError) {
      console.error('Error deleting user profile:', profileError)
      return false
    }

    // 2. Delete user from Supabase Auth
    const { error: authError } = await supabase.auth.admin.deleteUser(userId)

    if (authError) {
      console.error('Error deleting auth user:', authError)
      return false
    }

    return true
  } catch (error) {
    console.error('Error deleting user data:', error)
    return false
  }
}

export async function POST(request: NextRequest) {
  try {
    // Get Facebook App Secret from environment
    const facebookAppSecret = process.env.FACEBOOK_APP_SECRET

    if (!facebookAppSecret) {
      console.error('FACEBOOK_APP_SECRET is not configured')
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      )
    }

    // Parse form data
    const formData = await request.formData()
    const signedRequest = formData.get('signed_request') as string

    if (!signedRequest) {
      return NextResponse.json(
        { error: 'Missing signed_request parameter' },
        { status: 400 }
      )
    }

    // Verify and decode the signed request
    const decoded = verifyFacebookSignedRequest(signedRequest, facebookAppSecret)

    if (!decoded || !decoded.user_id) {
      return NextResponse.json(
        { error: 'Invalid signed_request' },
        { status: 400 }
      )
    }

    const facebookUserId = decoded.user_id
    const supabase = createAdminClient()

    // Generate a confirmation code
    const confirmationCode = crypto.randomBytes(16).toString('hex')
    const confirmationCodeHash = hashDeletionConfirmationCode(confirmationCode)

    const { data: deletionRequest, error: requestError } = await supabase
      .from('data_deletion_requests')
      .insert({
        provider: 'facebook',
        confirmation_code_hash: confirmationCodeHash,
        status: 'processing',
      })
      .select('id')
      .single()

    if (requestError || !deletionRequest) {
      console.error('Unable to persist Facebook deletion request:', requestError)
      return NextResponse.json({ error: 'Unable to process deletion request' }, { status: 500 })
    }

    let status: 'completed' | 'failed' = 'completed'
    let failureReason: string | null = null
    let userId: string | null = null

    try {
      userId = await findUserByFacebookId(facebookUserId, supabase)
      if (userId && !(await deleteUserData(userId, supabase))) {
        status = 'failed'
        failureReason = 'automatic_deletion_failed'
      }
    } catch (error) {
      console.error('Error resolving Facebook deletion request:', error)
      status = 'failed'
      failureReason = 'identity_lookup_failed'
    }

    const { error: statusError } = await supabase
      .from('data_deletion_requests')
      .update({
        status,
        failure_reason: failureReason,
        completed_at: status === 'completed' ? new Date().toISOString() : null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', deletionRequest.id)

    if (statusError) {
      console.error('Unable to update Facebook deletion status:', statusError)
      return NextResponse.json({ error: 'Unable to process deletion request' }, { status: 500 })
    }

    // Return confirmation URL as required by Facebook
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin
    const confirmationUrl = new URL('/deletion-status', baseUrl)
    confirmationUrl.searchParams.set('id', confirmationCode)

    return NextResponse.json({
      url: confirmationUrl.toString(),
      confirmation_code: confirmationCode,
    })
  } catch (error) {
    console.error('Error processing Facebook data deletion request:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * GET endpoint for Facebook to verify the callback URL is accessible
 * Facebook may send a GET request to verify the endpoint exists
 */
export async function GET() {
  return NextResponse.json({
    message: 'Facebook Data Deletion Callback is active',
    status: 'ok',
  })
}
