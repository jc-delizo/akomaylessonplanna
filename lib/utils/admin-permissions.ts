/**
 * Admin Permissions Matrix
 * 
 * Defines what each admin role can do based on Feature 9 design decisions
 * Reference: docs/brainstorming/11-feature-09-admin-panel-and-content-moderation.md lines 619-694
 */

import type { AdminRole } from './admin-auth'

export type Permission = 
  | 'view_dashboard'
  | 'view_financials'
  | 'view_users'
  | 'edit_user_tier'
  | 'ban_user'
  | 'reset_password'
  | 'view_verification_queue'
  | 'approve_verification'
  | 'view_products'
  | 'edit_products'
  | 'suspend_products'
  | 'delete_products'
  | 'approve_products'
  | 'view_pending_products'
  | 'view_flagged_reviews'
  | 'dismiss_review_flags'
  | 'delete_reviews'
  | 'view_reports'
  | 'resolve_reports'
  | 'warn_user'
  | 'suspend_user'
  | 'view_pioneers'
  | 'add_pioneer'
  | 'remove_pioneer'
  | 'process_withdrawals'
  | 'view_withdrawals'
  | 'create_announcements'
  | 'create_urgent_announcements'
  | 'view_settings'
  | 'edit_settings'
  | 'manage_admins'
  | 'view_audit_log'
  | 'view_all_audit_logs'

/**
 * Permission matrix based on design document
 * ✅ = Full access
 * ⚠️ = Restricted (requires approval)
 * ❌ = No access
 */
const PERMISSIONS: Record<AdminRole, Set<Permission>> = {
  super_admin: new Set([
    // Dashboard
    'view_dashboard',
    'view_financials',
    
    // Users
    'view_users',
    'edit_user_tier',
    'ban_user',
    'reset_password',
    'view_verification_queue',
    'approve_verification',
    
    // Products
    'view_products',
    'edit_products',
    'suspend_products',
    'delete_products',
    'approve_products',
    'view_pending_products',
    
    // Reviews
    'view_flagged_reviews',
    'dismiss_review_flags',
    'delete_reviews',
    
    // Reports
    'view_reports',
    'resolve_reports',
    'warn_user',
    'suspend_user',
    
    // Pioneers
    'view_pioneers',
    'add_pioneer',
    'remove_pioneer',
    
    // Financials
    'process_withdrawals',
    'view_withdrawals',
    
    // Announcements
    'create_announcements',
    'create_urgent_announcements',
    
    // Settings
    'view_settings',
    'edit_settings',
    'manage_admins',
    
    // Audit
    'view_audit_log',
    'view_all_audit_logs',
  ]),
  
  moderator: new Set([
    // Dashboard (no financials)
    'view_dashboard',
    
    // Users (read-only, can reset password, needs approval for bans)
    'view_users',
    'reset_password',
    'view_verification_queue',
    'approve_verification',
    
    // Products (read-only, can approve/reject, needs approval for suspensions)
    'view_products',
    'approve_products',
    'view_pending_products',
    
    // Reviews
    'view_flagged_reviews',
    'dismiss_review_flags',
    'delete_reviews',
    
    // Reports (can resolve with warnings, needs approval for suspensions/bans)
    'view_reports',
    'resolve_reports',
    'warn_user',
    
    // Pioneers (read-only)
    'view_pioneers',
    
    // Announcements (basic only, normal priority)
    'create_announcements',
    
    // Audit (own entries only)
    'view_audit_log',
  ]),
  
  content_manager: new Set([
    // Dashboard (basic only)
    'view_dashboard',
    
    // Users (read-only, can approve verification, can ban)
    'view_users',
    'ban_user',
    'view_verification_queue',
    'approve_verification',
    
    // Products (read-only, can approve/reject)
    'view_products',
    'approve_products',
    'view_pending_products',
    
    // Reviews
    'view_flagged_reviews',
    'dismiss_review_flags',
    'delete_reviews',
    
    // Reports (can resolve with warnings only, no suspensions/bans)
    'view_reports',
    'resolve_reports',
    'warn_user',
    
    // Pioneers (read-only)
    'view_pioneers',
    
    // Announcements (basic only, normal priority)
    'create_announcements',
    
    // Audit (own entries only)
    'view_audit_log',
  ]),
}

/**
 * Check if an admin role has a specific permission
 */
export function hasPermission(adminRole: AdminRole, permission: Permission): boolean {
  return PERMISSIONS[adminRole]?.has(permission) ?? false
}

/**
 * Check if an admin role requires approval for a restricted action
 * Note: ban_user and suspend_products no longer require approval per plan - Moderator and Content Manager can execute directly
 */
export function requiresApproval(adminRole: AdminRole, action: Permission): boolean {
  // No actions require approval - all permitted actions can be executed directly
  return false
}

/**
 * Get all permissions for an admin role
 */
export function getPermissions(adminRole: AdminRole): Permission[] {
  return Array.from(PERMISSIONS[adminRole] || [])
}
