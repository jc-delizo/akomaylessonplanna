'use client'

/**
 * Admin Authentication Hook
 * 
 * React hook for admin authentication state and permissions
 */

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { isAdminRole, type AdminRole } from '@/lib/auth/admin-role'
import { hasPermission, type Permission } from '@/lib/utils/admin-permissions'

export interface AdminAuthState {
  isAdmin: boolean
  adminRole: AdminRole | null
  loading: boolean
  error: Error | null
}

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

        const { data: adminRoleData, error: adminRoleError } = await supabase
          .rpc('current_admin_role')

        if (adminRoleError || !isAdminRole(adminRoleData)) {
          if (mounted) {
            setState({
              isAdmin: false,
              adminRole: null,
              loading: false,
              error: adminRoleError
                ? new Error('Unable to verify administrator permissions')
                : null,
            })
          }
          return
        }

        if (mounted) {
          setState({
            isAdmin: true,
            adminRole: adminRoleData,
            loading: false,
            error: null,
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
