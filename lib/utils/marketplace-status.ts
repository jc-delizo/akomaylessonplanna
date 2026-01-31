import type { SupabaseClient } from '@supabase/supabase-js'

/**
 * Read marketplace_closed from platform_settings.
 * Used by marketplace page (server), GET /api/marketplace-status, and GET /api/admin/settings/platform.
 * Default false (open) if row missing or value invalid.
 */
export async function getMarketplaceClosed(supabase: SupabaseClient): Promise<boolean> {
  const { data, error } = await supabase
    .from('platform_settings')
    .select('value')
    .eq('key', 'marketplace_closed')
    .maybeSingle()

  if (error || !data?.value) return false
  const v = data.value
  if (typeof v === 'boolean') return v
  if (v === true || v === 'true') return true
  return false
}
