/**
 * Get platform settings (static defaults). Safe to call from server components or API routes.
 * No fetch required - returns same shape as GET /api/admin/settings/platform.
 */
export function getPlatformSettingsData() {
  return {
    commissionRates: {
      standard: 20,
      pioneer: 15,
    },
    pricing: {
      minProductPrice: 50,
      maxProductPrice: 1000,
      recommendedRange: { min: 100, max: 500 },
    },
    uploadLimits: {
      maxFileSize: 500 * 1024 * 1024,
      allowedTypes: ['pdf', 'docx', 'pptx', 'jpg', 'png', 'mp4', 'zip'],
    },
    moderation: {
      firstNProductsRequireReview: 3,
      autoApproveTrustedSellers: false,
      resubmissionAttempts: 'unlimited',
    },
    withdrawals: {
      minWithdrawal: 500,
      processingTime: '1-3 business days',
    },
    platformRules: {
      accountCreationEnabled: true,
      sellerVerificationRequired: true,
      buyerRequirements: {
        accountRequired: true,
        emailRequired: true,
      },
    },
    content: {
      watermarkDownloads: true,
      previewPages: 3,
    },
    seo: {
      platformName: 'Ako may lesson plan na!',
      tagline: 'Quality Lesson Plans from Filipino Teachers',
    },
  }
}
