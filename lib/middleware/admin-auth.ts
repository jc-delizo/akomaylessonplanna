/**
 * Admin API Route Authentication Middleware
 * 
 * Reusable middleware for admin API routes to check authentication and permissions
 */

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getAdminRole } from '@/lib/utils/admin-auth'
import { hasPermission, type Permission } from '@/lib/utils/admin-permissions'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export interface AdminAuthResult {
  userId: string
  adminRole: 'super_admin' | 'moderator' | 'content_manager'
}

/**
 * Check if request is from an authenticated admin
 */
export async function requireAdmin(
  request: NextRequest
): Promise<{ success: true; admin: AdminAuthResult } | { success: false; response: NextResponse }> {
  const supabase = await createClient()
  
  // Get authenticated user
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()
  
  if (authError || !user) {
    return {
      success: false,
      response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
    }
  }
  
  // A missing, invalid, or unreadable role must never grant elevated access.
  const adminRole = await getAdminRole(user.id)
  if (!adminRole) {
    return {
      success: false,
      response: NextResponse.json({ error: 'Forbidden' }, { status: 403 }),
    }
  }
  
  return {
    success: true,
    admin: {
      userId: user.id,
      adminRole,
    },
  }
}

/**
 * Check if admin has specific permission
 */
export async function requirePermission(
  request: NextRequest,
  permission: Permission
): Promise<{ success: true; admin: AdminAuthResult } | { success: false; response: NextResponse }> {
  const authResult = await requireAdmin(request)
  
  if (!authResult.success) {
    return authResult
  }
  
  // Check permission
  if (!hasPermission(authResult.admin.adminRole, permission)) {
    return {
      success: false,
      response: NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      ),
    }
  }
  
  return authResult
}

/**
 * Check if admin is Super Admin
 */
export async function requireSuperAdmin(
  request: NextRequest
): Promise<{ success: true; admin: AdminAuthResult } | { success: false; response: NextResponse }> {
  const authResult = await requireAdmin(request)
  
  if (!authResult.success) {
    return authResult
  }
  
  if (authResult.admin.adminRole !== 'super_admin') {
    return {
      success: false,
      response: NextResponse.json(
        { error: 'Super Admin access required' },
        { status: 403 }
      ),
    }
  }
  
  return authResult
}

/**
 * Log admin action to audit log
 */
export async function logAdminAction(
  adminId: string,
  action: string,
  entityType: string,
  entityId: string,
  changes?: Record<string, unknown>,
  reason?: string,
  ipAddress?: string,
  userAgent?: string
): Promise<void> {
  const supabase = createAdminClient()
  
  const { error } = await supabase.from('audit_log').insert({
    admin_id: adminId,
    action,
    entity_type: entityType,
    entity_id: entityId,
    changes: changes ? (changes as unknown) : null,
    reason: reason || null,
    ip_address: ipAddress || null,
    user_agent: userAgent || null,
  })

  if (error) {
    console.error('Failed to persist admin audit event', {
      action,
      entityType,
      entityId,
      error,
    })
  }
}
