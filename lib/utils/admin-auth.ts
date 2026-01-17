/**
 * Admin Authentication & Authorization Utilities
 * 
 * Provides functions to check admin roles and permissions
 * for Feature 9: Admin Panel & Content Moderation
 */

import { createClient } from '@/lib/supabase/server'
import type { User } from '@supabase/supabase-js'

export type AdminRole = 'super_admin' | 'moderator' | 'content_manager'

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
  const supabase = await createClient()
  
  // Check role first (always exists)
  const { data: roleData, error: roleError } = await supabase
    .from('users')
    .select('role')
    .eq('id', userId)
    .single()
  
  if (roleError || !roleData || roleData.role !== 'admin') return false
  
  // If role is admin, user is admin (admin_role may not exist if migration not applied)
  return true
}

/**
 * Get admin role for a user
 */
export async function getAdminRole(userId: string): Promise<AdminRole | null> {
  const supabase = await createClient()
  
  // First verify user is admin
  const { data: roleData } = await supabase
    .from('users')
    .select('role')
    .eq('id', userId)
    .single()
  
  if (!roleData || roleData.role !== 'admin') return null
  
  // Try to get admin_role (may not exist if migration not applied)
  const { data: adminRoleData } = await supabase
    .from('users')
    .select('admin_role')
    .eq('id', userId)
    .single()
  
  // Default to super_admin if column doesn't exist
  return (adminRoleData?.admin_role || 'super_admin') as AdminRole
}

/**
 * Get full admin user data
 */
export async function getAdminUser(userId: string): Promise<AdminUser | null> {
  const supabase = await createClient()
  
  // First check if user has admin role
  const { data: roleData, error: roleError } = await supabase
    .from('users')
    .select('id, email, name, role')
    .eq('id', userId)
    .eq('role', 'admin')
    .single()
  
  if (roleError || !roleData) return null
  
  // Try to get admin_role (may not exist if migration not applied)
  const { data: adminRoleData } = await supabase
    .from('users')
    .select('admin_role')
    .eq('id', userId)
    .single()
  
  // Default to super_admin if admin_role column doesn't exist
  const adminRole = adminRoleData?.admin_role || 'super_admin'
  
  return {
    id: roleData.id,
    email: roleData.email,
    name: roleData.name,
    role: 'admin',
    admin_role: adminRole as AdminRole,
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
