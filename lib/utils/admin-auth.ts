/**
 * Admin Authentication & Authorization Utilities
 * 
 * Provides functions to check admin roles and permissions
 * for Feature 9: Admin Panel & Content Moderation
 */

import { createAdminClient } from '@/lib/supabase/admin'
import { isAdminRole, type AdminRole } from '@/lib/auth/admin-role'

export { isAdminRole }
export type { AdminRole }

export interface AdminUser {
  id: string
  email: string
  name: string
  role: 'admin'
  admin_role: AdminRole | null
}

/**
 * Check if user is an admin (any admin role)
 */
export async function isAdmin(userId: string): Promise<boolean> {
  return (await getAdminRole(userId)) !== null
}

/**
 * Get admin role for a user
 */
export async function getAdminRole(userId: string): Promise<AdminRole | null> {
  const supabase = createAdminClient()
  
  const { data, error } = await supabase
    .from('users')
    .select('role, admin_role')
    .eq('id', userId)
    .single()

  if (error || data?.role !== 'admin' || !isAdminRole(data.admin_role)) return null

  return data.admin_role
}

/**
 * Get full admin user data
 */
export async function getAdminUser(userId: string): Promise<AdminUser | null> {
  const supabase = createAdminClient()
  
  const { data, error } = await supabase
    .from('users')
    .select('id, email, first_name, last_name, role, admin_role')
    .eq('id', userId)
    .eq('role', 'admin')
    .single()

  if (error || !data || !isAdminRole(data.admin_role)) return null
  
  // Build display name from first_name and last_name
  const name = [data.first_name, data.last_name]
    .filter(Boolean)
    .join(' ')
    .trim() || data.email
  
  return {
    id: data.id,
    email: data.email,
    name,
    role: 'admin',
    admin_role: data.admin_role,
  }
}

/**
 * Check if user has specific admin role
 */
export async function hasAdminRole(
  userId: string,
  requiredRole: AdminRole
): Promise<boolean> {
  const adminRole = await getAdminRole(userId)
  return adminRole === requiredRole
}

/**
 * Check if user is Super Admin
 */
export async function isSuperAdmin(userId: string): Promise<boolean> {
  return hasAdminRole(userId, 'super_admin')
}

/**
 * Check if user is Moderator or higher
 */
export async function isModeratorOrHigher(userId: string): Promise<boolean> {
  const adminRole = await getAdminRole(userId)
  return adminRole === 'super_admin' || adminRole === 'moderator'
}
