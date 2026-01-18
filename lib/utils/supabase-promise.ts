/**
 * Supabase Promise Utilities
 * 
 * Supabase queries return PromiseLike<T> instead of Promise<T>, which doesn't support .catch()
 * These utilities convert PromiseLike to Promise for proper error handling.
 */

/**
 * Convert Supabase PromiseLike to Promise for proper error handling
 * 
 * @param promiseLike - A PromiseLike or Promise from Supabase
 * @returns A proper Promise<T>
 * 
 * @example
 * ```typescript
 * toPromise(supabase.from('table').insert(data))
 *   .then(() => {})
 *   .catch((err) => console.error(err))
 * ```
 */
export function toPromise<T>(
  promiseLike: PromiseLike<T> | Promise<T>
): Promise<T> {
  return Promise.resolve(promiseLike)
}

/**
 * Safely execute Supabase query with error handling
 * 
 * @param query - A Supabase query (PromiseLike or Promise)
 * @param onError - Optional error handler callback
 * @returns The query result or null if error occurred
 * 
 * @example
 * ```typescript
 * const result = await safeSupabaseQuery(
 *   supabase.from('table').select('*'),
 *   (error) => console.error('Query failed:', error)
 * )
 * ```
 */
export async function safeSupabaseQuery<T>(
  query: PromiseLike<T> | Promise<T>,
  onError?: (error: unknown) => void
): Promise<T | null> {
  try {
    return await Promise.resolve(query)
  } catch (error) {
    onError?.(error)
    return null
  }
}
