/**
 * Review Moderation Utilities
 * Automatic flagging for inappropriate content
 */

// Profanity filter (Tagalog + English)
const PROFANITY_WORDS = [
  // English
  'damn', 'hell', 'crap', 'stupid', 'idiot', 'moron',
  // Add more as needed
]

// Spam patterns
const SPAM_PATTERNS = [
  /(.)\1{4,}/, // Same character repeated 5+ times (e.g., "aaaaaa")
  /(great|good|bad|excellent|terrible)\s+\1\s+\1\s+\1/i, // Same word repeated 4+ times
]

/**
 * Check if text contains profanity
 */
export function containsProfanity(text: string): boolean {
  const lowerText = text.toLowerCase()
  return PROFANITY_WORDS.some((word) => lowerText.includes(word))
}

/**
 * Check if text has excessive caps (more than 50% uppercase)
 */
export function hasExcessiveCaps(text: string): boolean {
  if (text.length < 10) return false // Ignore short texts
  
  const upperCaseCount = (text.match(/[A-Z]/g) || []).length
  const letterCount = (text.match(/[A-Za-z]/g) || []).length
  
  if (letterCount === 0) return false
  
  const upperCasePercentage = (upperCaseCount / letterCount) * 100
  return upperCasePercentage > 50
}

/**
 * Check if text matches spam patterns
 */
export function matchesSpamPattern(text: string): boolean {
  return SPAM_PATTERNS.some((pattern) => pattern.test(text))
}

/**
 * Check if text has excessive punctuation
 */
export function hasExcessivePunctuation(text: string): boolean {
  const punctuationCount = (text.match(/[!?]{3,}/g) || []).length
  return punctuationCount > 0
}

/**
 * Auto-flag review based on content
 * Returns flag type and reason if review should be flagged, null otherwise
 */
export function autoFlagReview(comment: string | null): {
  flagType: string
  reason: string
} | null {
  if (!comment) return null

  const checks = [
    {
      check: () => containsProfanity(comment),
      flagType: 'profanity',
      reason: 'Contains inappropriate language',
    },
    {
      check: () => hasExcessiveCaps(comment),
      flagType: 'excessive_caps',
      reason: 'Excessive use of capital letters',
    },
    {
      check: () => matchesSpamPattern(comment),
      flagType: 'spam',
      reason: 'Matches spam patterns',
    },
    {
      check: () => hasExcessivePunctuation(comment),
      flagType: 'excessive_punctuation',
      reason: 'Excessive punctuation',
    },
  ]

  for (const { check, flagType, reason } of checks) {
    if (check()) {
      return { flagType, reason }
    }
  }

  return null
}
