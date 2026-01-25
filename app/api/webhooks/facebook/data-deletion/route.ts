import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
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
 * Verify and decode Facebook signed_request
 * This verifies the request is actually from Facebook
 */
function verifySignedRequest(
  signedRequest: string,
  appSecret: string
): { user_id: string } | null {
  try {
    const [signature, payload] = signedRequest.split('.', 2)

    // Decode the payload
    const decodedPayload = Buffer.from(
      payload.replace(/-/g, '+').replace(/_/g, '/'),
      'base64'
    ).toString('utf-8')

    // Verify the signature
    const expectedSignature = crypto
      .createHmac('sha256', appSecret)
      .update(payload)
      .digest('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '')

    if (signature !== expectedSignature) {
      console.error('Invalid Facebook signed_request signature')
      return null
    }

    const data = JSON.parse(decodedPayload)
    return { user_id: data.user_id }
  } catch (error) {
    console.error('Error verifying signed_request:', error)
    return null
  }
}

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
  try {
    // Query auth.users where user_metadata contains the Facebook user ID
    // We need to use the admin API to search user metadata
    const { data: users, error } = await supabase.auth.admin.listUsers()

    if (error) {
      console.error('Error listing users:', error)
      return null
    }

    // Find user with matching Facebook user ID in metadata
    const user = users.users.find(
      (u) => u.user_metadata?.provider_user_id === facebookUserId ||
             u.user_metadata?.facebook_user_id === facebookUserId ||
             u.app_metadata?.provider_user_id === facebookUserId
    )

    return user?.id || null
  } catch (error) {
    console.error('Error finding user by Facebook ID:', error)
    return null
  }
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
    }

    // 2. Delete user from Supabase Auth
    const { error: authError } = await supabase.auth.admin.deleteUser(userId)

    if (authError) {
      console.error('Error deleting auth user:', authError)
      return false
    }

    // 3. Note: Related data in other tables will be deleted via CASCADE
    // (orders, products, messages, etc. should have ON DELETE CASCADE)

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
    const decoded = verifySignedRequest(signedRequest, facebookAppSecret)

    if (!decoded || !decoded.user_id) {
      return NextResponse.json(
        { error: 'Invalid signed_request' },
        { status: 400 }
      )
    }

    const facebookUserId = decoded.user_id
    const supabase = createAdminClient()

    // Find the user in our system by Facebook ID
    const userId = await findUserByFacebookId(facebookUserId, supabase)

    // Generate a confirmation code
    const confirmationCode = crypto.randomBytes(16).toString('hex')

    if (userId) {
      // User found - delete their data
      const deleted = await deleteUserData(userId, supabase)

      if (deleted) {
        console.log(`Successfully deleted data for user ${userId} (Facebook ID: ${facebookUserId})`)
      } else {
        console.error(`Failed to delete data for user ${userId} (Facebook ID: ${facebookUserId})`)
        // Still return confirmation URL even if deletion partially failed
        // Facebook requires a confirmation URL regardless
      }
    } else {
      // User not found - they may have already been deleted or never existed
      console.log(`User not found for Facebook ID: ${facebookUserId}`)
      // Still return confirmation URL as required by Facebook
    }

    // Return confirmation URL as required by Facebook
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://akomaylessonplanna.com'
    const confirmationUrl = `${baseUrl}/deletion-status?id=${confirmationCode}`

    return NextResponse.json({
      url: confirmationUrl,
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
