'use client'

/**
 * Admin Authentication Hook
 * 
 * React hook for admin authentication state and permissions
 */

import { useEffect, useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { AdminRole } from '@/lib/utils/admin-auth'
import { hasPermission, type Permission } from '@/lib/utils/admin-permissions'

export interface AdminAuthState {
  isAdmin: boolean
  adminRole: AdminRole | null
  loading: boolean
  error: Error | null
}

// Module-level cache to prevent repeated queries for non-existent admin_role column
let adminRoleColumnExists: boolean | null = null

export function useAdminAuth() {
  const [state, setState] = useState<AdminAuthState>({
    isAdmin: false,
    adminRole: null,
    loading: true,
    error: null,
  })

  useEffect(() => {
    let mounted = true

    async function checkAdminAuth() {
      try {
        const supabase = createClient()
        
        // Get current user
        const {
          data: { user },
          error: authError,
        } = await supabase.auth.getUser()

        if (authError || !user) {
          if (mounted) {
            setState({
              isAdmin: false,
              adminRole: null,
              loading: false,
              error: null,
            })
          }
          return
        }

        // Check if user is admin
        // First get role (this should always work)
        const { data: roleData, error: roleError } = await supabase
          .from('users')
          .select('role')
          .eq('id', user.id)
          .single()

        if (roleError || !roleData) {
          if (mounted) {
            setState({
              isAdmin: false,
              adminRole: null,
              loading: false,
              error: null,
            })
          }
          return
        }

        // Check if user is admin based on role
        // #region agent log
        fetch('http://127.0.0.1:7248/ingest/00d5f2ca-d0b7-44d8-a520-af7d4c8e25e2',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'useAdminAuth.ts:67',message:'Role check',data:{userId:user.id,role:roleData.role,isAdmin:roleData.role==='admin'},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
        // #endregion
        const isUserAdmin = roleData.role === 'admin'
        
        if (!isUserAdmin) {
          if (mounted) {
            setState({
              isAdmin: false,
              adminRole: null,
              loading: false,
              error: null,
            })
          }
          return
        }

        // User is admin - set state immediately, then try to get admin_role
        // #region agent log
        fetch('http://127.0.0.1:7248/ingest/00d5f2ca-d0b7-44d8-a520-af7d4c8e25e2',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'useAdminAuth.ts:75',message:'Setting admin state',data:{isAdmin:true,adminRole:'super_admin'},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
        // #endregion
        if (mounted) {
          setState({
            isAdmin: true,
            adminRole: 'super_admin', // Default, will update if admin_role exists
            loading: false,
            error: null,
          })
        }

        // Try to get admin_role asynchronously (non-blocking)
        // Only attempt if we haven't already determined the column doesn't exist
        if (adminRoleColumnExists !== false) {
          // #region agent log
          fetch('http://127.0.0.1:7248/ingest/00d5f2ca-d0b7-44d8-a520-af7d4c8e25e2',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'useAdminAuth.ts:110',message:'Querying admin_role',data:{userId:user.id,columnExistsCache:adminRoleColumnExists},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
          // #endregion
          supabase
            .from('users')
            .select('admin_role')
            .eq('id', user.id)
            .single()
            .then(({ data: adminRoleData, error: adminRoleError }) => {
              // #region agent log
              fetch('http://127.0.0.1:7248/ingest/00d5f2ca-d0b7-44d8-a520-af7d4c8e25e2',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'useAdminAuth.ts:116',message:'admin_role query result',data:{hasData:!!adminRoleData,hasError:!!adminRoleError,errorCode:adminRoleError?.code,errorMessage:adminRoleError?.message},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
              // #endregion
              // If there's any error, assume column doesn't exist and cache it
              // This prevents repeated queries until migration is applied
              if (adminRoleError) {
                // Cache that column doesn't exist to prevent future queries
                adminRoleColumnExists = false
                return
              }
              
              // If query succeeded, mark column as existing and update state
              if (adminRoleData?.admin_role) {
                adminRoleColumnExists = true
                if (mounted) {
                  setState((prev) => ({
                    ...prev,
                    adminRole: adminRoleData.admin_role as AdminRole,
                  }))
                }
              } else {
                // Query succeeded but no admin_role value - column exists but is null
                adminRoleColumnExists = true
              }
            })
            .catch(() => {
              // Any error means column likely doesn't exist - cache it
              adminRoleColumnExists = false
              // Silently ignore - keep default 'super_admin'
            })
        }
      } catch (error) {
        if (mounted) {
          setState({
            isAdmin: false,
            adminRole: null,
            loading: false,
            error: error instanceof Error ? error : new Error('Unknown error'),
          })
        }
      }
    }

    checkAdminAuth()

    // Listen for auth changes
    const supabase = createClient()
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      checkAdminAuth()
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  /**
   * Check if admin has specific permission
   */
  const checkPermission = (permission: Permission): boolean => {
    if (!state.adminRole) return false
    return hasPermission(state.adminRole, permission)
  }

  /**
   * Check if admin is Super Admin
   */
  const isSuperAdmin = (): boolean => {
    return state.adminRole === 'super_admin'
  }

  /**
   * Check if admin is Moderator or higher
   */
  const isModeratorOrHigher = (): boolean => {
    return state.adminRole === 'super_admin' || state.adminRole === 'moderator'
  }

  return {
    ...state,
    checkPermission,
    isSuperAdmin,
    isModeratorOrHigher,
  }
}
