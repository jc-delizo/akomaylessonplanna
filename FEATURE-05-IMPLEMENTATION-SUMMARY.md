# Feature 05: Reviews & Ratings - Implementation Summary

**Date:** January 31, 2026  
**Status:** ✅ Implementation Complete (core + display + moderation)  
**Feature:** Reviews & Ratings

---

## Overview

Feature 05 (Reviews & Ratings) has been substantially implemented according to the design in `docs/brainstorming/7-feature-05-reviews-and-ratings.md`. Users review **products** (not sellers); seller reputation is an aggregate of product reviews. Reviews are allowed only after purchase and at least one download.

---

## Components

| Component | Path | Purpose |
|----------|------|---------|
| `ReviewsSection` | `components/reviews/reviews-section.tsx` | Product page: summary + top N reviews, "See all" link |
| `ReviewCard` | `components/reviews/review-card.tsx` | Single review: stars, comment, verified badge, seller response |
| `ReviewSubmissionForm` | `components/reviews/review-submission-form.tsx` | Rating (required) + optional comment (500 char max) |
| `ReviewSummaryCard` | `components/reviews/review-summary-card.tsx` | Average rating + distribution chart |
| `ReviewEligibilityCheck` | `components/reviews/review-eligibility-check.tsx` | Wraps form; checks purchase + download before allowing review |
| `SellerResponseForm` | `components/reviews/seller-response-form.tsx` | Seller response (500 char limit) |
| `StarRating` | `components/reviews/star-rating.tsx` | Star display |
| `FlaggedReviewCard` | `components/admin/flagged-review-card.tsx` | Admin moderation queue card |
| `SellerReviewsSection` | `components/sellers/seller-reviews-section.tsx` | Seller profile: recent reviews with product links |

---

## API Routes

| Route | Methods | Purpose |
|-------|---------|---------|
| `/api/products/[id]/reviews` | GET, POST | List reviews (sort: newest/highest/lowest), create review |
| `/api/reviews/[reviewId]` | PUT | Edit review (7-day window, is_edited set) |
| `/api/reviews/[reviewId]/response` | PUT | Seller response (500 char) |
| `/api/reviews/[reviewId]/flag` | POST | Flag/report review |
| `/api/seller/reviews` | GET | Seller dashboard: reviews for seller's products |
| `/api/seller/reviews/analytics` | GET | Seller analytics (Pro/Pioneer) |
| `/api/sellers/[username]/reviews` | GET | Public: reviews for seller's products |
| `/api/admin/reviews/flagged` | GET | Admin: flagged reviews queue |
| `/api/admin/reviews/[reviewId]/moderate` | PUT | Admin: approve/dismiss flag |
| `/api/admin/reviews/[reviewId]/delete` | DELETE | Admin: delete review |
| `/api/admin/reviews/[reviewId]/dismiss` | PUT | Admin: dismiss flag |

---

## Pages

| Route | Purpose |
|-------|---------|
| `/library/[productId]/review` | Review submission (with eligibility check) |
| `/products/[id]/reviews` | Full product reviews page (sort, pagination) |
| `/shop/reviews` | Seller dashboard: reviews for my products, respond |
| `/shop/reviews/analytics` | Seller analytics (Pro/Pioneer) |
| `/sellers/[username]/reviews` | Public: all reviews for seller |
| `/admin/reviews/flagged` | Admin: moderation queue |

Product detail page includes `ReviewsSection` (top 3 recent + summary). Seller profile includes `SellerReviewsSection`.

---

## Database Tables and Migrations

**Migration:** `supabase/migrations/008_feature_05_reviews.sql` (✅ Applied)

**Tables:**

- **`reviews`** – Product reviews  
  - `product_id`, `buyer_id`, `rating` (1–5), `comment` (optional, 500 char in API), `verified_purchase`, `seller_response`, `is_edited`, `is_flagged`, `flag_reason`, `created_at`, `updated_at`  
  - Unique `(product_id, buyer_id)`  
  - Indexes: product, buyer, created, flagged, rating  

- **`review_flags`** – Moderation queue  
  - `review_id`, `flag_type`, `flag_source` (automatic/manual), `reporter_id`, `reason`, `status` (pending/approved/dismissed), `reviewed_by`, `reviewed_at`  

**Users table:** `avg_rating`, `reviews_count` (seller aggregate).  
**Products table:** `avg_rating`, `reviews_count` (product aggregate).

**Functions:**

- `check_review_eligibility(p_user_id, p_product_id)` – true if purchased and downloaded (order_items.download_count > 0).
- `auto_flag_review(p_review_id, p_flag_type, p_reason)` – sets `is_flagged`, inserts `review_flags`.
- `update_product_review_stats()` – trigger on reviews; updates product `avg_rating`, `reviews_count`.
- `update_seller_review_stats()` – trigger on reviews; updates seller `avg_rating`, `reviews_count`.

**RLS:** Public sees non-flagged reviews for published products; buyers see own; sellers see reviews on their products; admins full access.

---

## Moderation and Eligibility

**Eligibility (per design):**

- User must have purchased the product (completed order).
- User must have downloaded at least once (`order_items.download_count > 0`).
- Enforced in API via `check_review_eligibility` RPC before POST review.
- One review per product per buyer (DB unique + API check).

**Automatic flagging** (`lib/utils/review-moderation.ts`):

- Profanity (Tagalog/English list).
- Excessive caps (>50% uppercase).
- Spam patterns (repeated chars, repeated words).
- Excessive punctuation (e.g. !????!!!!!).

On flag: review hidden (`is_flagged = true`), row in `review_flags` with `flag_source = 'automatic'`. Manual reports use same table with `flag_source = 'manual'`.

**Admin:** `/admin/reviews/flagged` – list pending flags; approve (restore) or delete review; dismiss flag.

---

## Email Integration

| Email | Status | Notes |
|-------|--------|--------|
| **Review reminder** (24h after download) | ✅ Implemented | `lib/emails/review-notifications.ts` → `sendReviewReminderEmail`; triggered from `app/api/library/[productId]/download/route.ts`; scheduled 24h via `scheduleEmail`; template `lib/emails/templates/review-reminder.tsx`; type `review_reminder` in Feature 10. |
| **Seller response notification** | ⏳ TODO | `sendSellerResponseNotificationEmail` exists but only logs; not wired to queue. |
| **Review removed notification** | ⏳ TODO | `sendReviewRemovedEmail` exists but only logs; not wired when admin deletes review. |

---

## Remaining Gaps (left for later)

- **Seller response notification email** – Implement and wire to email queue when seller responds (e.g. in `/api/reviews/[reviewId]/response`).
- **Review removed notification email** – Implement and call when admin deletes a review (e.g. in `/api/admin/reviews/[reviewId]/delete`).

All other design items (5-star scale, purchase+download requirement, 500 char comment/seller response, 7-day edit window, anonymized names, seller stats triggers, admin moderation, review reminder) are implemented.

---

## Reference

- Design: [docs/brainstorming/7-feature-05-reviews-and-ratings.md](docs/brainstorming/7-feature-05-reviews-and-ratings.md)
- Schema: [docs/implementationplan/database-schema-complete.md](docs/implementationplan/database-schema-complete.md) (reviews, review_flags)
- Migration: [supabase/migrations/008_feature_05_reviews.sql](supabase/migrations/008_feature_05_reviews.sql)
