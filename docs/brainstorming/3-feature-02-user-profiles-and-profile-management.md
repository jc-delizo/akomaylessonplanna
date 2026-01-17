# Feature 02: User Profiles & Profile Management - Design Decisions

**Date:** January 11, 2026
**Feature:** User Profiles & Profile Management
**Status:** ✅ DESIGN COMPLETE - Ready for Implementation

---

## Overview

This document captures all decisions made during the brainstorming session for Feature 02: User Profiles & Profile Management for AKOMAYLESSONPLANNA.

---

## Decisions Made

### 1. Profile Privacy & Visibility ✅

**Decision:** Open Profiles (Teachers Pay Teachers model)

**What's Public (Visible to Everyone - Including Unauthenticated Users):**
- Display name (not email/username)
- Avatar URL (profile picture)
- Banner image URL (if set)
- Bio text
- Subjects taught (array of tags)
- Grade levels taught (array of tags)
- Location (city/municipality + region only)
- Member since date
- Products (title, thumbnail, price, rating, sales count)
- Seller stats (total products, total sales, average rating)
- Badges (verification, tier, achievements)
- Social links (Facebook, Instagram, YouTube URLs only)
- Response time indicator
- Followers count (not the list of followers)
- Recent reviews (3 most recent, buyer names anonymized)

**What's Private (Only Account Owner & Admins):**
- Email address
- Password hash
- PRC ID number
- GCash/Maya numbers
- Phone number (if collected)
- Full address
- Login history/session data
- Earnings/revenue data
- Document URLs (PRC ID upload, etc.)

**What's Authenticated-Only (Visible Only to Logged-In Users):**
- Follow/Unfollow button
- Contact Seller button (messaging interface)
- Detailed profile view analytics (for own profile only)
- "View all reviews" link (full reviews page)

**Profile Viewing Rules:**
- No "who viewed your profile" feature (privacy concern)
- Unauthenticated users can browse all seller profiles (max discoverability)
- No profile can be completely private (sellers need to be discoverable to sell)
- Opt-out from "Featured Sellers" or directory listings (but profile still viewable via direct link)

**Rationale:**
- Maximum discoverability for sellers = more sales
- Filipino teachers value transparency and trust
- Proven model by Teachers Pay Teachers
- Reduces friction for potential buyers

---

### 2. Seller Profile Page Layout ✅

**Decision:** Comprehensive Storefront (Etsy/Teachers Pay Teachers hybrid)

**Profile Page Sections:**

**Header Section:**
- Banner image (1200x300px, Pro/Pioneer feature)
- Profile picture (circular, 200x200px)
- Display name + username (@handle)
- Badges (Pioneer → Pro → Verified → Top Seller → Fast Responder → Rising Star)
- Follow button (logged-in users only, shows follower count)
- Contact Seller button
- Share Profile button

**Stats Section:**
- Total products listed
- Total sales count
- Average rating (⭐ 4.8/5 from 124 reviews)
- Response time indicator ("Usually responds within 24 hours")
- Followers count

**About Section:**
- Bio (500 char limit, supports line breaks, no HTML)
- Subjects taught (badges/tags - from Feature 02.5 system)
- Grade levels taught (badges/tags - from Feature 02.5 system)
- Location (city/region only)
- Member since date
- Social links (Facebook, Instagram, YouTube - icon buttons)

**Featured Products Section (Pro/Pioneer Only):**
- Up to 6 manually selected products
- Carousel or grid layout
- Incentive for Pro/Pioneer subscriptions

**All Products Section:**
- Product grid (2 columns mobile, 3 tablet, 4 desktop)
- Each product: thumbnail, title (truncated), price, rating, sales count
- 12 products per page, infinite scroll or pagination
- Sort options: Newest, Best-selling, Price Low-High, Price High-Low, Highest Rated
- Filter by subject/grade (if seller has multiple categories)

**Reviews Section:**
- Top 3 most recent reviews
- Anonymous buyer names ("Teacher Maria A.")
- Each review: rating, comment, date
- "View all reviews" link

**Rationale:**
- Comprehensive pages help buyers feel confident purchasing
- Gives Pro/Pioneer subscribers tangible value (custom banners, featured products)
- Badges and verification build trust
- Proven successful model in education space

---

### 3. Badge System ✅

**Decision:** Tiered Badges Based on Seller Status

**Badge Structure:**

| User Type | Badges Displayed |
|-----------|------------------|
| Buyers only (no selling) | No badges (or "Buyer" badge if needed) |
| Sellers (All) | ✅ **Verified Teacher** (required to sell) |
| Pro Sellers | ✅ **Verified Teacher** + **Pro Seller** |
| Pioneer Sellers | ✅ **Verified Teacher** + **Pioneer Seller** |
| + Achievement Badges | Top Seller, Fast Responder, Rising Star |

**Badge Display Order (most prominent first):**
1. **Pioneer Seller** (gold/special styling - highest tier)
2. **Pro Seller** (silver/special styling)
3. **Verified Teacher** (baseline for all sellers)
4. **Top Seller** (50+ sales)
5. **Fast Responder** (responds within 24h)
6. **Rising Star** (new seller with 4.5+ rating)

**Badge Logic:**
- ALL sellers must verify PRC ID → ALL have Verified badge
- Pro subscription → Pro badge
- Pioneer invitation → Pioneer badge
- Achievements earned based on performance

---

### 4. Username Field Addition ✅

**Decision:** Add `username` field to `users` table

**Schema Addition:**
```sql
username VARCHAR(20) UNIQUE
- 3-20 characters
- Alphanumeric + underscores only
- Must be unique
- Optional initially (generated from email if not set)
- Used for profile URLs: /sellers/[username]
```

**Rationale:**
- `/sellers/odvip` looks professional and shareable
- `/sellers/550e8400-e29b-41d4-a716-446655440000` is NOT user-friendly
- Allows privacy (display name can be different from username)
- Enables SEO-friendly URLs

---

### 5. Responsive Design Strategy ✅

**Decision:** Mobile-First with Stunning Desktop Enhancement

**Product Grid Layout:**
- Mobile (320px-767px): **2 columns** (~170-190px per card)
- Tablet (768px-1023px): **3 columns** (~240px per card)
- Desktop (1024px-1439px): **4 columns** (~250px per card)
- Large Desktop (1440px+): **4 columns** in max-width 1400px container (~330px per card)

**Mobile Layout:**
- Single column, stacked sections
- Banner: 400x200px (smaller file size)
- Avatar: 150x150px
- Stats: Horizontal scroll or wrap to 2 rows
- Products: 2 per row
- Bottom navigation bar (PWA app-like feel)
- Sticky "Contact" button (FAB - Floating Action Button)

**Desktop Layout (Two-Column):**
- Left sidebar: Profile info (sticky)
- Right content: Products, reviews
- Banner full-width (1200x300px)
- Avatar overlaid on banner
- More information visible at once
- Hover effects on product cards

**Rationale:**
- Teachers lesson planning = laptop/desktop primary use
- Mobile-first doesn't mean mobile-only
- Progressive enhancement for larger screens
- Desktop looks like proper marketplace, not stretched mobile app

---

### 6. Profile Customization Options ✅

**All Sellers (Free/Pro/Pioneer):**
- Display Name (3-50 chars)
- Username (3-20 chars, unique)
- Avatar (upload max 5MB, auto-cropped to square)
- Bio (max 500 chars, line breaks supported, no HTML)
- Subjects Taught (select from dropdown - Feature 02.5)
- Grade Levels Taught (select from dropdown - Feature 02.5)
- Location (city/municipality + region - Feature 02.5)
- Social Links (Facebook, Instagram, YouTube - optional)

**Pro & Pioneer Only:**
- Banner Image (upload max 5MB, 1200x300px recommended, auto-resized)
- Custom Accent Color (select from preset palette - 12 brand colors)
- Featured Products (select up to 6 products to highlight)
- Profile Completion Goals (set targets, track progress)

**Pioneer Only:**
- Verified Badge Priority (badge shown first/most prominent)
- Early Access Features (new profile features rolled out first)

---

### 7. Profile Completion Calculator ✅

**Decision:** Point-Based Completion System with Incentives

**Point System:**

| Field | Points | Required for 100%? |
|-------|--------|-------------------|
| Display Name | 10 | ✅ Yes |
| Avatar | 15 | ✅ Yes |
| Bio (50+ chars) | 15 | ✅ Yes |
| Subjects Taught (1+) | 15 | ✅ Yes |
| Grade Levels (1+) | 15 | ✅ Yes |
| Location | 10 | ✅ Yes |
| Social Link (1+) | 10 | ❌ No (bonus) |
| Banner (Pro/Pioneer) | 10 | ❌ No (bonus) |

**Completion Levels:**
- **0-49%:** "Complete your profile" (red warning)
- **50-79%:** "Almost there!" (yellow)
- **80-99%:** "Looking good!" (blue)
- **100%:** "All set!" (green confetti animation)

**Minimum Profile for Selling:**
- Must have: Display Name, Avatar, Bio, 1+ Subject, 1+ Grade Level
- If not complete: Block product upload with "Complete your profile first" modal

---

### 8. User-to-User Interactions ✅

**Follow System:**
- Follow/Unfollow button (logged-in users only)
- Shows follower count (but NOT who follows - privacy)
- Notifications when followed seller uploads new product
- "Following" tab in buyer's profile
- No "Followers" list visible to anyone

**Contact Seller:**
- "Contact Seller" button opens message form
- Email sent to seller's registered email (initial simple implementation)
- Buyer's email visible to seller (can reply)
- Full messaging system deferred to future feature (Feature 05+)

**Share Profile:**
- Share link to profile
- Copy URL to clipboard
- Share to Facebook/Messenger (deep links)
- Share with QR code (mobile)

**Report User:**
- Report button for policy violations
- Reasons: Fake credentials, inappropriate content, suspicious activity, harassment
- Requires description
- Sent to admins for review
- Admins can ban users if warranted

**Badge Display:**
- All sellers: Verified Teacher badge
- Pro: Verified + Pro badges
- Pioneer: Verified + Pioneer badges
- Achievement badges (optional): Top Seller, Fast Responder, Rising Star

---

### 9. Profile Analytics (For Sellers Viewing Own Profile) ✅

**"View as Public" Toggle:**
- Switch between Edit Mode (see analytics) and Public View (see what buyers see)

**Analytics Metrics:**
- Profile views (total, daily/weekly graph)
- Traffic sources (product pages, search, direct link, social media)
- Most viewed products (top 10)
- Conversion rate (profile views → sales)
- Comparison to other sellers (percentile ranking)
- Time range filters (Today, This Week, This Month, All Time)

**Pro/Pioneer Enhanced Analytics:**
- Detailed demographics
- Performance recommendations
- Advanced insights

---

### 10. Search & Discovery ✅

**Seller Search Page:** `/sellers` or `/find-teachers`

**Search Options:**
- Search bar (autocomplete: display name, username, bio)
- Filters:
  - By Subject (multi-select)
  - By Grade Level (multi-select)
  - By Location (region + city)
  - By Seller Tier (All/Pioneer/Pro/Verified)
  - By Rating (4+, 4.5+, 5 stars)
- Sort By: Relevance, Most Products, Highest Rated, Most Followers, Recently Joined

**Search Results Layout:**
- Mobile: 2 columns
- Desktop: 4 columns
- Each result: Avatar, Name, Username, Rating, Products count, Subjects, Grades, Follow button

**"Similar Sellers" Recommendations:**
- Same subjects (at least 1 match)
- Same grade levels (at least 1 match)
- Similar rating (within 0.5 stars)
- Not the same seller
- Randomize order
- Prioritize Pro/Pioneer sellers slightly

**Featured Sellers on Homepage:**
- Pioneers (automatically featured)
- Pro sellers (admin can feature)
- Top performers (admin can feature)
- Carousel: Auto-scroll every 5 seconds

**Top Sellers Leaderboard (Optional):**
- `/sellers/leaderboard`
- Seasonal (monthly/quarterly)
- Gamification to motivate sellers

---

### 11. Admin Profile Management ✅

**Admin Capabilities:**
- View any user profile (including private data)
- Edit any profile field (all changes logged)
- Change verification status (approve/reject PRC ID)
- Ban users (with required reason)
- Feature sellers (add to homepage rotation)
- Add internal admin notes (not visible to users)

**Admin Profile View UI:**
- Quick actions (View Public Profile, Edit, Ban, Feature, etc.)
- Stats overview (products, sales, revenue, rating, followers)
- Verification details (status, document, admin who approved)
- Private data (email, phone, PRC ID, payment info)
- Admin notes (internal communication log)
- Activity log (user actions)

**Audit Trail:**
- All admin actions logged (who, what, when, why, changes)
- Before/after values for edits
- IP address tracking
- Viewable in admin panel

---

## Technical Implementation Details

### Database Schema Updates

**Additions to `users` table:**
```sql
username VARCHAR(20) UNIQUE,
banner_url TEXT,
custom_accent_color VARCHAR(7),
location_city VARCHAR(100),
location_region VARCHAR(100),
profile_completion_percent INTEGER DEFAULT 0,
social_links JSONB,
followers_count INTEGER DEFAULT 0,
response_time_hours INTEGER,

-- Indexes
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_location ON users(location_region, location_city);
CREATE INDEX idx_users_subjects ON users USING GIN(subjects_taught);
CREATE INDEX idx_users_grades ON users USING GIN(grade_levels_taught);
```

**New tables:**
- `followers` (user follow relationships)
- `profile_views` (analytics for profile views)
- `admin_notes` (internal admin communication)
- `audit_log` (admin action audit trail)

### API Routes

**Public Routes (No Auth):**
- `GET /api/sellers/[username]` - Get public seller profile
- `GET /api/sellers` - Search/list sellers
- `GET /api/sellers/[username]/products` - Get seller's products
- `GET /api/sellers/[username]/reviews` - Get seller's reviews

**Authenticated Routes:**
- `POST /api/sellers/[id]/follow` - Follow seller
- `DELETE /api/sellers/[id]/follow` - Unfollow seller
- `POST /api/sellers/[id]/contact` - Send message
- `POST /api/sellers/[id]/report` - Report seller
- `GET /api/me/following` - Get following list

**Owner Routes:**
- `PUT /api/me/profile` - Update profile
- `POST /api/me/profile/avatar` - Upload avatar
- `POST /api/me/profile/banner` - Upload banner
- `GET /api/me/profile/analytics` - Get analytics
- `GET /api/me/profile/views` - Get view stats

**Admin Routes:**
- `GET /api/admin/users/[id]` - Get full user details
- `PUT /api/admin/users/[id]` - Edit user
- `POST /api/admin/users/[id]/ban` - Ban user
- `POST /api/admin/users/[id]/verify` - Approve verification
- `DELETE /api/admin/users/[id]/verify` - Revoke verification
- `POST /api/admin/users/[id]/feature` - Feature seller
- `POST /api/admin/users/[id]/notes` - Add admin note
- `GET /api/admin/audit-log` - Get audit trail

### Frontend Routes

**Public Pages:**
- `/sellers/[username]` - Seller profile page
- `/sellers` - Seller search/discovery
- `/sellers/[username]/products` - All products by seller
- `/sellers/[username]/reviews` - All reviews

**Authenticated Pages:**
- `/profile/edit` - Edit own profile
- `/profile/analytics` - Profile analytics
- `/following` - Following list

**Admin Pages:**
- `/admin/users` - User management
- `/admin/users/[id]` - User detail/edit
- `/admin/audit-log` - Audit trail

### Caching Strategy

**Cache (Redis/CDN):**
- Public seller profile data (TTL: 5 minutes)
- Seller product listings (TTL: 2 minutes)
- Follower count (TTL: 1 minute)
- Profile stats (TTL: 5 minutes)

**Invalidation:**
- Profile update → Clear profile cache
- New product → Clear product listing cache
- New follower → Increment follower count

### Image Optimization

**Avatar sizes:**
- 150x150px (profile card)
- 200x200px (profile page)
- 400x400px (enlarged view)

**Banner sizes:**
- 1200x300px (full size)
- 800x200px (tablet)
- 600x150px (mobile)

**Formats:** WebP with JPEG fallback

### Performance Optimization

- Progressive enhancement (initial HTML, then lazy load)
- Infinite scroll for products (12 per batch)
- Denormalized follower_count (no JOIN)
- Indexed searches (fast filters)

---

## Related Features & Future Work

### Feature 02.5: System Configuration - Grade & Subject Management

**Status:** Deferred to future session

**Scope:**
- Pre-populate all Philippine K-12 grade levels
- Pre-populate all common subjects
- **Create many-to-many relationship between grades and subjects** (subjects vary by grade level based on DepEd curriculum)
- Create management system for admins to add/edit grades & subjects
- Implement dropdown selection in profile editor (subjects filter based on selected grade)
- Allow bulk import/export for curriculum updates

**Database Schema:**
```sql
-- Grade levels managed by admin
grades (
  id UUID PK,
  name VARCHAR(50),  -- "Grade 7", "Kindergarten"
  sort_order INTEGER,
  is_active BOOLEAN
)

-- Subjects managed by admin
subjects (
  id UUID PK,
  name VARCHAR(100),  -- "Mathematics", "Science"
  code VARCHAR(20),   -- "MATH", "SCI"
  is_active BOOLEAN
)

-- Many-to-many: Which subjects apply to which grades
grade_subjects (
  grade_id UUID FK grades,
  subject_id UUID FK subjects,
  PRIMARY KEY (grade_id, subject_id)
)
```

**Admin Interface:**
- Add/Edit/Delete grades and subjects
- Assign subjects to grades (checkbox matrix)
- Bulk import from CSV (for major curriculum updates)
- Preview: Test the grade-subject selector

**Decision:** Use Option B (Pre-Defined Dropdowns) for consistent data and powerful search

**Enhancement (from Feature 03):** Subjects change dynamically based on grade level selected (e.g., Grade 1 has Mother Tongue, Grade 7 doesn't)

### Feature 03+: Product Detail Pages

**Confirmed User Flow:**
1. User logs in → Homepage/Marketplace
2. Product grid displayed (2/3/4 columns responsive)
3. User clicks product → Product Detail Page
4. Product Detail Page: Preview button, "View Seller Profile" button, Add to Cart/Buy Now
5. User clicks "View Seller Profile" → Seller Profile Page (this feature)

---

## Notes from Planning Session

1. **Username Field Missing:** Current database schema doesn't include `username` field. Must be added before implementation.

2. **User Flow Confirmed:** Homepage → Product Grid → Product Detail → Seller Profile flow is now documented and confirmed for future features.

3. **Mobile-First Doesn't Mean Mobile-Only:** Desktop will have stunning two-column layout with sidebar, not just stretched mobile.

4. **All Sellers = Verified:** Since Feature 01 requires PRC ID verification to sell, ALL sellers have Verified badge.

5. **Privacy-First:** No "who viewed your profile" feature, follower count visible but not follower list.

---

## Implementation Checklist

When implementing this feature:

- [ ] Add `username` field to `users` table
- [ ] Create `followers`, `profile_views`, `admin_notes`, `audit_log` tables
- [ ] Set up indexes for performance
- [ ] Create public seller profile page (/sellers/[username])
- [ ] Create seller search/discovery page (/sellers)
- [ ] Implement profile edit interface (/profile/edit)
- [ ] Add avatar upload functionality
- [ ] Add banner upload (Pro/Pioneer only)
- [ ] Implement follow/unfollow system
- [ ] Create profile analytics dashboard
- [ ] Build admin profile management interface
- [ ] Set up caching strategy
- [ ] Implement image optimization
- [ ] Add profile completion calculator
- [ ] Create "Similar Sellers" recommendation algorithm
- [ ] Add "Featured Sellers" homepage carousel
- [ ] Implement audit logging for admin actions
- [ ] Test responsive design (mobile, tablet, desktop, large desktop)
- [ ] PWA optimization (offline support, install prompts)

---

## Summary

Feature 02 (User Profiles & Profile Management) is now fully designed and ready for implementation. Key highlights:

- ✅ Open profiles for maximum discoverability
- ✅ Comprehensive storefront pages with all relevant seller info
- ✅ Mobile-first responsive design with stunning desktop layout
- ✅ Clear badge system (Verified → Pro → Pioneer + achievements)
- ✅ Profile completion calculator with incentives
- ✅ Follow system, contact seller, share functionality
- ✅ Robust search and discovery for sellers
- ✅ Profile analytics for sellers
- ✅ Complete admin management tools
- ✅ Username field added for SEO-friendly URLs
- ✅ Full technical implementation plan documented

**Next Feature:** Feature 03 - Product Listings & Product Management (to be discussed in next session)

---

**Document Version:** 1.0
**Last Updated:** January 11, 2026
