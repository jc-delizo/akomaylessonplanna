/**
 * Supabase Relation Type Utilities
 * 
 * Supabase sometimes incorrectly types foreign key relations as arrays when they should be single objects.
 * These utilities safely extract relations regardless of how TypeScript infers them.
 */

/**
 * Safely extract a Supabase relation that might be typed as array or single object
 * 
 * @param relation - A Supabase relation that could be T, T[], null, or undefined
 * @returns The relation as a single object T, or null if not present
 * 
 * @example
 * ```typescript
 * const order = getRelation(item.order)
 * const status = order?.payment_status
 * ```
 */
export function getRelation<T>(
  relation: T | T[] | null | undefined
): T | null {
  if (!relation) return null
  return Array.isArray(relation) ? relation[0] : relation
}

/**
 * Safely extract multiple relations (always returns array)
 * 
 * @param relations - A Supabase relation that could be T, T[], null, or undefined
 * @returns An array of relations T[]
 * 
 * @example
 * ```typescript
 * const buyers = getRelations(order.buyers)
 * buyers.forEach(buyer => { ... })
 * ```
 */
export function getRelations<T>(
  relations: T | T[] | null | undefined
): T[] {
  if (!relations) return []
  return Array.isArray(relations) ? relations : [relations]
}
