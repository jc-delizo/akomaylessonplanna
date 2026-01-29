import type { SupabaseClient } from '@supabase/supabase-js'

/**
 * Get admin announcements list. Safe to call from server components or API routes.
 */
export async function getAnnouncementsData(supabase: SupabaseClient) {
  const { data: announcements, error } = await supabase
    .from('announcements')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(100)

  if (error) {
    console.error('Error fetching announcements:', error)
    throw new Error('Failed to fetch announcements')
  }
  return { announcements: announcements || [] }
}
