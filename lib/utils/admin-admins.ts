import type { SupabaseClient } from '@supabase/supabase-js'

/**
 * Get admins list with last active. Safe to call from server components or API routes.
 * Uses first_name, last_name; adds name for display compatibility.
 */
export async function getAdminsData(supabase: SupabaseClient) {
  const { data: admins, error } = await supabase
    .from('users')
    .select('id, first_name, last_name, email, avatar_url, admin_role, created_at, updated_at')
    .eq('role', 'admin')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching admins:', error)
    throw new Error('Failed to fetch admins')
  }

  const adminsWithActivity = await Promise.all(
    (admins || []).map(async (admin) => {
      const { data: lastActivity } = await supabase
        .from('audit_log')
        .select('created_at')
        .eq('admin_id', admin.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      const name = [admin.first_name, admin.last_name].filter(Boolean).join(' ') || 'Admin'
      return {
        ...admin,
        name,
        lastActive: lastActivity?.created_at || null,
        status: 'active',
      }
    })
  )

  return { admins: adminsWithActivity }
}
