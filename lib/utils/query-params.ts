const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

/**
 * Remove characters that can alter PostgREST's raw `or` filter grammar.
 * This is for interpolated ilike terms; normal `.eq()` values are encoded by
 * the Supabase client and do not need this transformation.
 */
export function sanitizePostgrestSearchTerm(value: string, maxLength = 100): string {
  return value
    .normalize('NFKC')
    .trim()
    .slice(0, maxLength)
    .replace(/[,%_*()\\"]/g, ' ')
    .replace(/[\u0000-\u001f\u007f]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

export function parseBoundedInteger(
  value: string | null | undefined,
  fallback: number,
  minimum: number,
  maximum: number
): number {
  if (!value || !/^-?\d+$/.test(value)) return fallback

  const parsed = Number(value)
  if (!Number.isSafeInteger(parsed)) return fallback

  return Math.min(maximum, Math.max(minimum, parsed))
}

export function isUuid(value: string): boolean {
  return UUID_PATTERN.test(value)
}
