# Feature 05: Reviews & Ratings - Design Decisions

**Date:** January 12, 2026
**Feature:** Reviews & Ratings
**Status:** ✅ DESIGN COMPLETE - Ready for Implementation

---

## Overview

This document captures all decisions made during the brainstorming session for Feature 05: Reviews & Ratings for AKOMAYLESSONPLANNA.

Reviews are critical for marketplace success - they provide social proof, help buyers make informed decisions, give sellers feedback for improvement, and build community trust.

---

## Decisions Made

### 1. Rating System ✅

**Decision:** Simple 5-star scale only

**Scale Options:**
- ★☆☆☆☆ (1 star) - Poor
- ★★☆☆☆ (2 stars) - Fair
- ★★★☆☆ (3 stars) - Good
- ★★★★☆ (4 stars) - Very Good
- ★★★★★ (5 stars) - Excellent

**Rationale:**
- Universally understood by Filipino teachers (Amazon, Lazada, Shopee)
- Simple UI implementation
- Matches Teachers Pay Teachers model
- Half-stars and 10-point scales add complexity without proportional benefit

**Rejected Options:**
- ❌ Half-star support (★★★★☆.5) - adds complexity
- ❌ 10-point scale (8.5/10) - not standard for e-commerce

---

### 2. Review Eligibility ✅

**Decision:** Reviews allowed only after download

**Requirements:**
- User must have purchased the product (verified via `order_items`)
- User must have clicked "Download" at least once
- One review per product per buyer (database constraint)
- Reviews tied to specific product, not seller

**Rationale:**
- Ensures buyer has accessed the file before reviewing
- Shows genuine interest in the resource
- Teachers know what they need - if they bought "Grade 7 Math DLL Q1", they can assess quality immediately
- Prevents fake reviews from non-purchasers

**Rejected Options:**
- ❌ Review immediately after purchase (may not have viewed product)
- ❌ Review after 24-hour delay (significantly reduces review volume)
- ❌ No restrictions (allows spam/competitor reviews)

**Database Implementation:**
```sql
-- Check eligibility: user must have download_count > 0 in order_items
SELECT COUNT(*) FROM order_items
WHERE user_id = ? AND product_id = ? AND download_count > 0
```

---

### 3. Review Content & Structure ✅

**Decision:** Rating required, comment optional (500 char max)

**Required Fields:**
- `rating` (INTEGER 1-5) - **Required**
- `comment` (TEXT) - Optional

**Optional Fields:**
- Written review/comment
- Maximum 500 characters (mobile-friendly, sufficient for detail)
- Character counter visible while typing

**Rationale:**
- Low friction = more reviews
- Star ratings valuable even without text
- Captures quick feedback from busy teachers
- Optional comments mean detailed reviews still come from motivated buyers

**Comment Character Limit:**
- **500 characters** chosen for balance
- Mobile-friendly (less scrolling)
- Sufficient for meaningful feedback
- Common industry standard

**Rejected Options:**
- ❌ Both required (higher barrier, fewer reviews, "good good good" spam)
- ❌ No character limit (can be abused, overwhelming)
- ❌ 2,000+ chars (too long for mobile)

---

### 4. Seller Responses ✅

**Decision:** Allowed, 500 char limit, one-level chain only

**Seller Response Rules:**
- Seller can respond to any review on their products
- Response limit: 500 characters
- Publicly visible under the review
- Buyer gets notification when seller responds
- Seller can edit their response anytime
- **No conversation threads** - buyer cannot reply to seller response

**Response Chain Structure:**
```
Buyer Review (5★, comment)
  → Seller Response (500 char max)
      → [END] - Buyer cannot reply
```

**Rationale:**
- Seller responses build trust and show engagement
- Filipino teachers appreciate personal connection
- One-level prevents disputes from becoming public arguments
- Character limit prevents abuse
- No threading keeps it simple and manageable

**Notifications:**
- Buyer notified: "Teacher Maria responded to your review"
- In-app + email notification

**Rejected Options:**
- ❌ No character limit (lengthy disputes possible)
- ❌ Conversation threads (complex, can escalate)
- ❌ Not allowed in MVP (loses seller engagement)

---

### 5. Review Display & Sorting ✅

**Decision:** Top 3 most recent reviews + "See all reviews" link

**Product Detail Page:**
- Review section appears below product description
- Shows **top 3 most recent reviews** by default
- Each review shows:
  - Buyer name (anonymized: "Teacher Maria A.")
  - Rating stars
  - Comment (if provided)
  - Date posted
  - "Verified Purchase" badge
  - Seller response (if any)
- "See all [count] reviews" link → full reviews page

**Review Summary Card** (above individual reviews):
```
⭐ 4.8 out of 5 (124 reviews)

★★★★★ 85 reviews (68%)
★★★★☆  24 reviews (19%)
★★★☆☆☆  10 reviews (8%)
★★☆☆☆☆   4 reviews (3%)
★☆☆☆☆☆   1 review (1%)
```

**Full Reviews Page Sorting Options:**
- Newest first (default)
- Highest rated first
- Lowest rated first

**Rationale:**
- Newest reviews show current product quality
- "Most helpful" voting adds complexity and can be gamed
- Simple sorting works well for educational resources
- Review summary card gives quick overview

**Mobile Display:**
- Reviews stacked vertically
- Large touch targets (44x44px minimum)
- Truncated comments with "Read more" link

**Rejected Options:**
- ❌ Most helpful reviews (voting system complexity)
- ❌ Summary card only (no individual reviews shown)
- ❌ Random selection (confusing)

---

### 6. Review Moderation ✅

**Decision:** Automatic flagging + Admin moderation queue, hidden immediately

**Automatic Flagging Triggers:**
- Profanity filter (Tagalog + English inappropriate words)
- Excessive caps (e.g., "VERY BAD VERY BAD")
- Spam patterns (e.g., "great great great great great")
- Same buyer reviewing same product multiple times
- Excessive punctuation (!????!!!!!)

**Flagged Review Behavior:**
- **Hidden immediately** (invisible to public until admin reviews)
- Admin sees flagged reviews in moderation queue
- Admin decides: Approve (restore) or Delete (permanent removal)
- If approved: Review becomes visible again
- If deleted: Review removed permanently, buyer notified

**Seller Reporting:**
- Sellers can "Report" reviews on their products
- Report requires: Reason (dropdown) + Description (textarea)
- Reported reviews go to same admin queue
- Seller cannot directly delete reviews

**Admin Moderation Queue:**
- Route: `/admin/reviews/flagged`
- Shows: Review content, flagging reason, product, buyer
- Actions: Approve (restore), Delete (remove), Escalate
- Filter: All, Flagged, Reported

**Rationale:**
- Protects marketplace from spam and inappropriate content
- Hidden immediately prevents public exposure to bad content
- Profanity filter is straightforward to implement
- Seller reporting gives them control over their product reviews

**Follow-up Response Times:**
- Admin target: Review flagged reviews within 24 hours
- Buyer notified of decision: "Your review was removed due to violation of our review policy"

**Rejected Options:**
- ❌ Community reporting only (sellers need direct reporting)
- ❌ Visible but marked while flagged (inappropriate content shouldn't be seen)
- ❌ Seller-only reporting (community should help moderate too)

---

### 7. Review Editing & Deletion ✅

**Decision:** Can edit within 7 days only, cannot delete

**Editing Rules:**
- Buyer can edit their review within **7 days of posting**
- After 7 days: Review becomes permanent
- Can edit: Rating, comment, or both
- Shows "Edited on [date]" timestamp on review (transparency)
- Seller notified when buyer edits review
- **No deletion option** - reviews are permanent once posted

**7-Day Window Rationale:**
- Teachers may use resource and realize "better/worse than thought"
- Allows correction within reasonable timeframe
- Maintains historical integrity after window closes
- Prevents retroactive changes months later

**No Deletion Rationale:**
- Prevents "angry 1-star → calm → delete" abuse
- Maintains review history and accuracy
- If review violates policy, admin can delete (buyer can't self-delete)

**Version History:**
```sql
-- reviews table tracks edits
updated_at TIMESTAMP -- Shows when edited
is_edited BOOLEAN DEFAULT false -- True if edited after posting
```

**Database Implementation:**
```sql
UPDATE reviews
SET rating = ?, comment = ?, updated_at = NOW(), is_edited = true
WHERE id = ? AND created_at > NOW() - INTERVAL '7 days'
```

**Rejected Options:**
- ❌ Edit anytime (historical accuracy issues)
- ❌ Delete anytime (abuse potential, loses seller feedback)
- ❌ Cannot edit (no correction for mistakes)

---

### 8. Review Reminders ✅

**Decision:** Single reminder after 24 hours, no incentives

**Reminder Email:**

**Subject:** "How was your purchase? Leave a review!"

**Send Timing:** 24 hours after successful download

**Email Content:**
```
Hi [Buyer Name],

We hope you're enjoying your new resource!

Product: [Product Title]
Seller: [Seller Name]

Your feedback helps other Filipino teachers find quality resources.
Leave a quick review:

[⭐⭐⭐⭐⭐] Rate this product

[Write a review (optional)]

[Leave Review Button]

This is the only reminder you'll receive from us about this purchase.
Your honest opinion helps our community grow.

Thank you for supporting Filipino teachers!

AKOMAYLESSONPLANNA
```

**Email Behavior:**
- **ONE email only** (not spammy)
- Buyer unsubscribes? Still sent (transactional, not marketing)
- If buyer leaves review: No more emails for that product
- If buyer doesn't leave review: No follow-up emails

**No Incentives Policy:**
- No reward points for reviews
- No discounts for reviews
- No giveaway entries
- No gamification
- Reviews must be unbiased and authentic

**Rationale:**
- 24h gives buyer time to download and preview
- Single email is polite and respectful
- Teachers Pay Teachers model works successfully
- Incentives create bias (5-star reviews for rewards)

**Rejected Options:**
- ❌ Multiple reminders (24h + 7d + 14d) - spammy
- ❌ No email reminders (passive, low review volume)
- ❌ Incentives (biases reviews, violates authenticity)

---

### 9. Impact on Seller Stats ✅

**Decision:** Simple average calculation for seller reputation

**Seller Rating Calculation:**
```
avg_rating = SUM(all product ratings) ÷ total review count
```

**How It Works:**
- Each product review contributes to seller's overall rating
- Simple average across all products
- Updated in real-time when new review posted
- Displayed on seller profile and product cards

**Example:**
```
Teacher Maria's Reviews:
- Grade 7 Math DLL: 5★, 4★, 5★, 4★ (avg: 4.5)
- Science Exam: 5★, 5★ (avg: 5.0)
- RPMS Cover: 4★, 3★ (avg: 3.5)

Overall Seller Rating:
(5+4+5+4+5+5+4+3) ÷ 8 = 35 ÷ 8 = 4.375 → 4.4★
```

**Database Fields:**
```sql
-- users table
avg_rating DECIMAL(3,2) -- Seller's overall rating
reviews_count INTEGER -- Total reviews received
```

**Recalculation Trigger:**
- After new review posted: Update seller's `avg_rating` and `reviews_count`
- After review deleted: Recalculate

**Rationale:**
- Transparent and easy to understand
- Sellers know exactly how rating calculated
- Improvement over time naturally pulls average up
- Industry standard (Amazon, Etsy)

**Rejected Options:**
- ❌ Weighted average (recent reviews count more) - complex, less transparent
- ❌ Separate product ratings only - harder to assess seller quality

---

### 10. Review Analytics for Sellers ✅

**Decision:** Basic for all sellers, Enhanced (A+B+C) for Pro/Pioneer

**Basic Analytics** (All Sellers - Free Tier):

Seller Dashboard → Reviews section shows:
- Total reviews count
- Average rating (overall)
- Recent reviews list (last 10)
- Response rate (% of reviews you've responded to)
- Unresponded reviews count

**Enhanced Analytics** (Pro/Pioneer Tier Only):

**A) Rating Distribution Breakdown:**
```
Your Rating Distribution:

★★★★★ 85 reviews (68%) ████████████████
★★★★☆  24 reviews (19%) ██████
★★★☆☆☆  10 reviews (8%)  ██
★★☆☆☆☆   4 reviews (3%)  █
★☆☆☆☆☆   1 review (1%)   ▌
```

**B) Most Common Keywords** (Word Cloud):
```
Common words in your reviews:

"clear"      mentioned 45 times
"helpful"    mentioned 38 times
"organized"  mentioned 29 times
"saves time" mentioned 22 times
"easy to use" mentioned 19 times
```

**C) Review Trends Over Time:**
```
Your Average Rating by Month:

Jan: 4.2 ★★★★☆
Feb: 4.5 ★★★★☆
Mar: 4.8 ★★★★★
Apr: 4.9 ★★★★★
```

**Why A+B+C:**
- Actionable insights for sellers
- See what's working ("clear lesson plans" praised often)
- See improvement over time
- Not overwhelming (4-5 visuals max)

**Not Included (Rejected):**
- ❌ Comparison to other sellers ("Your 4.8★ is in top 20%") - demotivating
- ❌ Low-rated review alerts - creates anxiety, sellers already see all reviews

**Access:**
- Route: `/seller/dashboard/reviews`
- Pro/Pioneer see enhanced charts/visuals
- Free sellers see basic list only

---

### 11. Fake Review Prevention ✅

**Decision:** Trust-based approach (no additional safeguards)

**Built-in Protections (Already Implemented):**
- ✅ Verified purchase only (from Feature 04)
- ✅ Must download before reviewing (from this session)
- ✅ One review per product per buyer (database unique constraint)
- ✅ Real users only (authenticated via Feature 01)

**Philosophy:**
- Teachers are honest professionals
- Build culture of trust, not suspicion
- Filipino teacher community values integrity
- Avoid over-policing that creates friction

**No Additional Safeguards:**
- ❌ No rate limiting (max 3 reviews per day)
- ❌ No review streak detection (flagging 5+ consecutive 5★)
- ❌ No self-review prevention (beyond verified purchase check)

**Rationale:**
- Unnecessary safeguards add complexity without proportional benefit
- Teachers buying from teachers = community trust
- If abuse becomes problem later, can add safeguards
- Early marketplace: focus on growth, not restriction

**Database Constraint:**
```sql
CREATE UNIQUE INDEX idx_reviews_unique ON reviews(product_id, buyer_id);
-- One review per product per buyer
```

**Future Consideration:**
- If fake reviews become problem (>5% reported): Add rate limiting
- Monitor: Admin reviews flagged reviews monthly for patterns

---

### 12. Reviews on Seller Profile ✅

**Decision:** Hybrid approach - reviews from all products with product links

**Seller Profile Page:**

**Reviews Section** (at bottom of profile, below products):

**Header:**
```
Recent Reviews (124 total)
⭐ 4.8 average rating
```

**Review Display:**
```
Teacher Maria A. reviewed Grade 7 Math DLL Q1 Weeks 1-8
⭐⭐⭐⭐⭐
"Very clear and well-organized. Saved me hours of prep time!"
Posted 2 days ago

[View Product] → Links to product page

---

Teacher Juan B. reviewed Science Periodical Exam Grade 7
⭐⭐⭐⭐☆
"Good exam but some questions were too advanced for my students."
Posted 5 days ago

[View Product] → Links to product page

---

Teacher Ana C. reviewed RPMS Cover Page - Safari Theme
⭐⭐⭐⭐⭐
"Beautiful design! My principal loved it."
Posted 1 week ago

[View Product] → Links to product page

[View all 124 reviews] → Full reviews page
```

**Why Hybrid Works:**
- Shows seller quality across all products
- Maintains context (which product review is for)
- Links back to product (SEO + user flow)
- Social proof for seller reputation

**Full Reviews Page:**
- Route: `/sellers/[username]/reviews`
- Shows all reviews across all products
- Filter by product, rating, date
- Each review links to product

**Rationale:**
- Best of both worlds (seller + product focus)
- Contextually accurate
- More social proof than product-only reviews
- Similar to Etsy/Amazon seller profiles

**Rejected Options:**
- ❌ Reviews from ALL products aggregated (loses context which product)
- ❌ Product-specific only on product pages (profile looks sparse)

---

## Technical Implementation Details

### Database Schema Updates

**Existing `reviews` table** (from main design doc):
```sql
CREATE TABLE reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  buyer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  verified_purchase BOOLEAN NOT NULL DEFAULT true,
  seller_response TEXT,
  is_edited BOOLEAN DEFAULT false,
  is_flagged BOOLEAN DEFAULT false,
  flag_reason TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE(product_id, buyer_id) -- One review per product per buyer
);

CREATE INDEX idx_reviews_product ON reviews(product_id);
CREATE INDEX idx_reviews_buyer ON reviews(buyer_id);
CREATE INDEX idx_reviews_created ON reviews(created_at DESC);
CREATE INDEX idx_reviews_flagged ON reviews(is_flagged);
```

**New fields added:**
```sql
ALTER TABLE reviews ADD COLUMN is_edited BOOLEAN DEFAULT false;
ALTER TABLE reviews ADD COLUMN is_flagged BOOLEAN DEFAULT false;
ALTER TABLE reviews ADD COLUMN flag_reason TEXT;
```

**New `review_flags` table** (for admin moderation):
```sql
CREATE TABLE review_flags (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  review_id UUID NOT NULL REFERENCES reviews(id) ON DELETE CASCADE,
  flag_type VARCHAR(50) NOT NULL, -- 'profanity', 'spam', 'excessive_caps', etc.
  flag_source VARCHAR(20) NOT NULL, -- 'automatic' or 'manual'
  reporter_id UUID REFERENCES users(id), -- If manual flag
  reason TEXT,
  status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'approved', 'dismissed'
  reviewed_by UUID REFERENCES users(id), -- Admin who reviewed
  reviewed_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_review_flags_status ON review_flags(status);
```

**Update `users` table** (ensure review-related fields exist):
```sql
-- These should already exist from Feature 02
ALTER TABLE users ADD COLUMN IF NOT EXISTS avg_rating DECIMAL(3,2) DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS reviews_count INTEGER DEFAULT 0;
```

**Recalculate seller rating trigger/function:**
```sql
-- Function to update seller's avg_rating and reviews_count
CREATE OR REPLACE FUNCTION update_seller_review_stats()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE users
  SET avg_rating = (
    SELECT COALESCE(AVG(r.rating), 0)
    FROM reviews r
    JOIN products p ON r.product_id = p.id
    WHERE p.seller_id = users.id
  ),
  reviews_count = (
    SELECT COUNT(*)
    FROM reviews r
    JOIN products p ON r.product_id = p.id
    WHERE p.seller_id = users.id
  )
  WHERE id IN (
    SELECT seller_id FROM products WHERE id = NEW.product_id
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger: Update seller stats after review insert/update/delete
CREATE TRIGGER trigger_update_seller_stats
AFTER INSERT OR UPDATE OR DELETE ON reviews
FOR EACH ROW
EXECUTE FUNCTION update_seller_review_stats();
```

### API Endpoints

**Review Endpoints:**

```
GET /api/products/:productId/reviews
- Get reviews for a product
- Query params: sort (newest, highest, lowest), limit, offset
- Response: List of reviews with buyer info (anonymized), seller responses

POST /api/products/:productId/reviews
- Create a new review (verified buyer who downloaded only)
- Body: { rating: 1-5, comment?: string }
- Checks: User purchased + downloaded product, not already reviewed
- Response: Created review

PUT /api/reviews/:reviewId
- Edit existing review (within 7 days only)
- Body: { rating?: 1-5, comment?: string }
- Checks: User owns review, created_at < 7 days ago
- Response: Updated review with is_edited=true, updated_at=NOW()

DELETE /api/reviews/:reviewId
- NOT ALLOWED (reviews cannot be deleted by buyer)
- Only admin can delete (via moderation)

POST /api/reviews/:reviewId/flag
- Flag a review for moderation (anyone can flag)
- Body: { reason: string, description?: string }
- Response: Flag created, review hidden

PUT /api/reviews/:reviewId/response
- Seller responds to a review (seller of product only)
- Body: { response: string (max 500 chars) }
- Response: Updated review with seller_response
- Buyer notified

GET /api/seller/reviews
- Get reviews for seller's products (seller only)
- Query params: product_id, rating, status
- Response: List of reviews with product info
- Auth required (seller only)

GET /api/seller/reviews/analytics
- Get review analytics (Pro/Pioneer only)
- Response: Rating distribution, keywords, trends
- Auth required (Pro/Pioneer seller only)
```

**Admin Endpoints:**

```
GET /api/admin/reviews/flagged
- Get all flagged reviews for moderation
- Query params: status, flag_type
- Response: List of flagged reviews
- Auth required (admin only)

PUT /api/admin/reviews/:reviewId/moderate
- Admin decision on flagged review
- Body: { action: 'approve' | 'delete', notes?: string }
- If approve: Restore review, is_flagged=false
- If delete: Permanent removal, buyer notified
- Response: Updated review
- Auth required (admin only)

DELETE /api/admin/reviews/:reviewId
- Admin deletes any review (emergency removal)
- Response: Success
- Auth required (admin only)
```

### Frontend Routes

**Public Pages:**
- `/products/[productId]` - Product detail page with reviews section
- `/products/[productId]/reviews` - Full reviews page for product
- `/sellers/[username]` - Seller profile with reviews section
- `/sellers/[username]/reviews` - All reviews for seller

**Authenticated Pages:**
- `/library` - Shows purchased products with "Leave a Review" button
- `/orders/[orderId]/review` - Quick review page from email link

**Seller Pages:**
- `/seller/dashboard/reviews` - Reviews management
- `/seller/dashboard/reviews/analytics` - Enhanced analytics (Pro/Pioneer)

**Admin Pages:**
- `/admin/reviews/flagged` - Moderation queue

### Email Templates

**Review Reminder Email:**

**Subject:** "How was your purchase? Leave a review!"

**Template:**
```html
Hi {{buyer_name}},

We hope you're enjoying your new resource!

<table>
<tr>
<td width="150">
<img src="{{product_cover_image}}" alt="{{product_title}}">
</td>
<td>
<h3>{{product_title}}</h3>
<p>By {{seller_name}}</p>
</td>
</tr>
</table>

Your feedback helps other Filipino teachers find quality resources.

<a href="{{review_link}}">⭐⭐⭐⭐⭐ Rate this product</a>

Or write a detailed review:
<a href="{{review_link}}">Write a review</a>

<small>This is the only reminder you'll receive from us about this purchase.</small>

Thank you for supporting Filipino teachers!

AKOMAYLESSONPLANNA
```

**Seller Response Notification:**

**Subject:** "{{seller_name}} responded to your review"

**Template:**
```html
Hi {{buyer_name}},

Great news! {{seller_name}} responded to your review of {{product_title}}.

<h3>Your Review:</h3>
⭐⭐⭐⭐⭐
"{{buyer_review_comment}}"

<h3>Seller Response:</h3>
{{seller_response}}

<a href="{{product_link}}">View on product page</a>

AKOMAYLESSONPLANNA
```

---

## User Interface Components

### 1. Review Submission Form

**Location:** Modal or separate page from library/email link

**Form Layout:**
```
┌─────────────────────────────────────┐
│                                     │
│  Rate: [Product Title]              │
│                                     │
│  [Cover Image]                      │
│                                     │
│  How would you rate this resource?  │
│                                     │
│  [☆] [☆] [☆] [☆] [☆]               │
│  Tap to rate                        │
│                                     │
│  Write a review (optional)          │
│  ┌─────────────────────────────┐   │
│  │                             │   │
│  │ Share your thoughts...      │   │
│  │                             │   │
│  └─────────────────────────────┘   │
│  0 / 500 characters                │
│                                     │
│  ☑ I confirm I have downloaded     │
│  and used this resource             │
│                                     │
│  [Submit Review]  [Cancel]          │
│                                     │
└─────────────────────────────────────┘
```

**Mobile:**
- Full-screen modal
- Large star touch targets (44x44px minimum)
- Auto-expanding text area
- Character counter always visible

---

### 2. Reviews Section on Product Page

**Location:** Below product description, above related products

**Layout:**
```
┌─────────────────────────────────────────┐
│  Reviews & Ratings                      │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│                                         │
│  ⭐ 4.8 out of 5 (124 reviews)          │
│                                         │
│  Rating Distribution:                   │
│  ★★★★★ 85 (68%) ████████████           │
│  ★★★★☆  24 (19%) ███                   │
│  ★★★☆☆  10 (8%)  ██                   │
│  ★★☆☆☆   4 (3%)  █                     │
│  ★☆☆☆☆   1 (1%)  ▌                     │
│                                         │
│  Recent Reviews:                        │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│                                         │
│  Teacher Maria A.  ⭐⭐⭐⭐⭐             │
│  ✓ Verified Purchase                    │
│  "Very clear and well-organized. Saved  │
│   me hours of prep time!"               │
│  Posted 2 days ago                      │
│                                         │
│  Seller Response:                       │
│  "Thank you Teacher Maria! We're glad   │
│   it helped you. God bless!"            │
│                                         │
│  ─────────────────────────────────────  │
│                                         │
│  Teacher Juan B.  ⭐⭐⭐⭐☆              │
│  ✓ Verified Purchase                    │
│  "Good exam but some questions were      │
│   too advanced for my students."        │
│  Posted 5 days ago                      │
│                                         │
│  ─────────────────────────────────────  │
│                                         │
│  Teacher Ana C.  ⭐⭐⭐⭐⭐               │
│  ✓ Verified Purchase                    │
│  "Beautiful design! My principal loved  │
│   it."                                  │
│  Posted 1 week ago                      │
│                                         │
│  [See all 124 reviews →]                │
│                                         │
└─────────────────────────────────────────┘
```

---

### 3. Full Reviews Page

**Route:** `/products/[productId]/reviews`

**Layout:**
```
┌─────────────────────────────────────────┐
│  Reviews for Grade 7 Math DLL Q1        │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│                                         │
│  ⭐ 4.8 out of 5 (124 reviews)          │
│                                         │
│  Sort by: [Newest ▼] [Highest] [Lowest]│
│                                         │
│  Review Distribution Chart...           │
│                                         │
│  ─────────────────────────────────────  │
│                                         │
│  Teacher Maria A.  ⭐⭐⭐⭐⭐             │
│  ✓ Verified Purchase                    │
│  "Very clear and well-organized. Saved  │
│   me hours of prep time! Exactly what   │
│   I needed for Quarter 1."              │
│                                         │
│  Posted 2 days ago                      │
│  [Helpful ♥] [Report 🚩]                │
│                                         │
│  Seller Response:                       │
│  "Thank you Teacher Maria! We're glad   │
│   it helped you. God bless! Let us know │
│   if you need anything."                │
│  [Reply] (grayed out - one-level only)  │
│                                         │
│  ─────────────────────────────────────  │
│                                         │
│  [Load more reviews...]                 │
│                                         │
└─────────────────────────────────────────┘
```

---

### 4. Seller Dashboard - Reviews

**Route:** `/seller/dashboard/reviews`

**Layout:**
```
┌─────────────────────────────────────────┐
│  Seller Dashboard > Reviews              │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│                                         │
│  Overview:                              │
│  ┌──────┐ ┌──────┐ ┌────────┐          │
│  │124   │ │ 4.8  │ │  85%   │          │
│  │Reviews│ │Stars │ │Response│          │
│  └──────┘ └──────┘ │  Rate  │          │
│                  └────────┘          │
│                                         │
│  Filter: [All Products ▼] [All ▼]      │
│                                         │
│  Recent Reviews:                        │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│                                         │
│  Grade 7 Math DLL Q1                    │
│  Teacher Maria A.  ⭐⭐⭐⭐⭐             │
│  "Very clear..."                        │
│  Posted 2 days ago                      │
│                                         │
│  [Respond] (500 char max)               │
│  [View Product]                         │
│                                         │
│  ─────────────────────────────────────  │
│                                         │
│  Science Periodical Exam                │
│  Teacher Juan B.  ⭐⭐⭐⭐☆              │
│  "Good exam but..."                     │
│  Posted 5 days ago                      │
│                                         │
│  ✓ You responded 2 days ago             │
│  [Edit Response] [View Product]         │
│                                         │
│  ─────────────────────────────────────  │
│                                         │
│  [View all reviews analytics →]         │
│  (Pro/Pioneer only)                     │
│                                         │
└─────────────────────────────────────────┘
```

---

## Related Features & Dependencies

### Feature 04: Shopping Cart & Checkout Flow

**Dependency:**
- Reviews can only be left after successful purchase
- `verified_purchase` field linked to `order_items` table
- Review eligibility: `download_count > 0` in `order_items`

### Feature 02: User Profiles & Profile Management

**Integration:**
- Reviews displayed on seller profile (hybrid approach)
- Seller's `avg_rating` and `reviews_count` shown on profile
- Seller response time tracked (from Feature 02)
- Recent reviews section on profile page

### Feature 03: Product Listings & Product Management

**Integration:**
- Reviews appear on product detail pages
- Product's `avg_rating` and `reviews_count` displayed on cards
- Reviews factor into product search/sort (highest rated option)

---

## Implementation Checklist

When implementing this feature:

### Phase 1: Core Review System

- [ ] Update `reviews` table schema (add is_edited, is_flagged, flag_reason)
- [ ] Create `review_flags` table
- [ ] Implement review eligibility check (purchased + downloaded)
- [ ] Create review submission form (rating required, comment optional)
- [ ] Add character counter (500 max)
- [ ] Implement unique constraint (one review per product per buyer)
- [ ] Create seller response functionality (500 char limit)
- [ ] Add 7-day edit window enforcement
- [ ] Show "Edited on [date]" timestamp
- [ ] Test review submission flow

### Phase 2: Review Display

- [ ] Create review summary card component (avg + distribution chart)
- [ ] Implement "Top 3 recent reviews" section on product page
- [ ] Create full reviews page (sorting: newest, highest, lowest)
- [ ] Add "Verified Purchase" badge
- [ ] Implement seller response display
- [ ] Create reviews section on seller profile (hybrid with links)
- [ ] Mobile optimization (2/3/4 columns, large touch targets)
- [ ] Test review display across devices

### Phase 3: Moderation System

- [ ] Implement automatic flagging (profanity filter, spam patterns)
- [ ] Create admin moderation queue (`/admin/reviews/flagged`)
- [ ] Hide flagged reviews immediately
- [ ] Build admin approve/delete interface
- [ ] Add seller reporting functionality
- [ ] Create flag reason dropdown
- [ ] Implement admin decision workflow
- [ ] Test moderation flow

### Phase 4: Notifications & Reminders

- [ ] Create review reminder email template
- [ ] Implement 24-hour delay trigger
- [ ] Add one-time send logic (no spam)
- [ ] Create seller response notification email
- [ ] Add in-app notifications for responses
- [ ] Test email sending
- [ ] Verify unsubscribe behavior (still send - transactional)

### Phase 5: Seller Analytics

- [ ] Build basic review analytics (all sellers)
- [ ] Implement rating distribution breakdown (Pro/Pioneer)
- [ ] Create keyword extraction (Pro/Pioneer)
- [ ] Build review trends chart (Pro/Pioneer)
- [ ] Create response rate tracking
- [ ] Test analytics calculations
- [ ] Verify Pro/Pioneer access control

### Phase 6: Database & Performance

- [ ] Create seller rating recalculation trigger
- [ ] Add database indexes for performance
- [ ] Implement caching for review counts
- [ ] Optimize review queries (pagination)
- [ ] Load test review submission
- [ ] Monitor database performance

### Phase 7: Testing

- [ ] Unit tests for review eligibility
- [ ] Integration tests for review submission
- [ ] Moderation flow testing
- [ ] Email send testing
- [ ] Mobile responsiveness testing
- [ ] Cross-browser testing
- [ ] Accessibility testing (screen reader)

---

## Notes from Planning Session

1. **Trust-Based Philosophy:** No rate limiting or excessive fake review prevention. Teachers are honest professionals building a community of trust.

2. **Download Requirement:** Reviews only after download ensures buyer has accessed the resource. Teachers know quality immediately.

3. **One-Level Responses:** Buyer → Seller → Done. No threading to prevent public disputes.

4. **7-Day Edit Window:** Balances buyer flexibility with historical integrity. No deletion to prevent abuse.

5. **Single Reminder:** One email after 24h. Polite, not spammy. No incentives to keep reviews unbiased.

6. **Simple Average:** Transparent rating calculation. Sellers understand exactly how reputation works.

7. **Pro/Pioneer Analytics:** Rating distribution + keywords + trends provide actionable insights without overwhelming.

8. **Hybrid Profile Display:** Reviews from all products with product links. Best of seller reputation + product context.

---

## Summary

Feature 05 (Reviews & Ratings) is now fully designed and ready for implementation. Key highlights:

- ✅ Simple 5-star rating scale (universally understood)
- ✅ Reviews after download only (ensures access)
- ✅ Rating required, comment optional (500 char max)
- ✅ Seller responses allowed (500 char, one-level only)
- ✅ Top 3 recent reviews + "See all" link
- ✅ Auto-flag + Admin moderation (hidden immediately)
- ✅ 7-day edit window, no deletion, "Edited" timestamp
- ✅ Single 24h reminder, no incentives
- ✅ Simple average for seller reputation
- ✅ Enhanced analytics for Pro/Pioneer (distribution, keywords, trends)
- ✅ Trust-based approach (no rate limiting)
- ✅ Hybrid profile display (all products with links)
- ✅ Mobile-first responsive design
- ✅ Full technical implementation plan documented

**Next Feature:** Feature 06 - Social Features (to be discussed in next session)

---

**Document Version:** 1.0
**Last Updated:** January 12, 2026

*All decisions documented. Ready to proceed with implementation planning.*
