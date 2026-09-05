const REDIRECT_BASE_URL = 'https://redirect.invalid'

/**
 * Only allow same-site absolute paths in post-authentication redirects.
 */
export function getSafeRedirectPath(
  candidate: string | null | undefined,
  fallback = '/marketplace'
): string {
  if (!candidate || !candidate.startsWith('/') || candidate.startsWith('//') || candidate.includes('\\')) {
    return fallback
  }

  try {
    const parsed = new URL(candidate, REDIRECT_BASE_URL)
    if (parsed.origin !== REDIRECT_BASE_URL) return fallback

    return `${parsed.pathname}${parsed.search}${parsed.hash}`
  } catch {
    return fallback
  }
}
