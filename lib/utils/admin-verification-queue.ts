import type { SupabaseClient } from '@supabase/supabase-js'

export interface VerificationQueueResult {
  verifications: Array<{
    id: string
    user_id: string
    status: string
    created_at: string
    document_url?: string | null
    prc_license_number?: string | null
    prc_license_expiry?: string | null
    user: {
      id: string
      first_name: string | null
      last_name: string | null
      email: string | null
      username: string | null
      avatar_url: string | null
      created_at: string
    } | null
  }>
  total: number
}

/**
 * Get teacher verification queue (pending, oldest first). Safe to call from server components or API routes.
 */
export async function getVerificationQueueData(
  supabase: SupabaseClient
): Promise<VerificationQueueResult> {
  const { data: verifications, error } = await supabase
    .from('teacher_id_verifications')
    .select(
      `
      *,
      user:users!teacher_id_verifications_user_id_fkey(
        id,
        first_name,
        last_name,
        email,
        username,
        avatar_url,
        created_at
      )
    `
    )
    .eq('status', 'pending')
    .order('created_at', { ascending: true })

  if (error) {
    if (error.code === 'PGRST205' || error.message?.includes('schema cache')) {
      return { verifications: [], total: 0 }
    }
    console.error('Error fetching verification queue:', error)
    throw new Error('Failed to fetch verification queue')
  }

  const list = (verifications || []) as VerificationQueueResult['verifications']
  return {
    verifications: list,
    total: list.length,
  }
}
