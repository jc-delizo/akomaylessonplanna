export type AdminRole = 'super_admin' | 'moderator' | 'content_manager'

const ADMIN_ROLES: ReadonlySet<string> = new Set([
  'super_admin',
  'moderator',
  'content_manager',
])

export function isAdminRole(value: unknown): value is AdminRole {
  return typeof value === 'string' && ADMIN_ROLES.has(value)
}
