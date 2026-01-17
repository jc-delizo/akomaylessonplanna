# AKOMAYLESSONPLANNA - Complete Design Summary

**Date:** January 13, 2026
**Project:** Filipino Teacher Lesson Plan Marketplace
**Status:** Design Complete - Ready for Implementation

---

## Table of Contents

1. [Platform Overview](#platform-overview)
2. [Business Model & Pricing](#business-model--pricing)
3. [Technical Architecture](#technical-architecture)
4. [Database Schema](#database-schema)
5. [API Endpoints](#api-endpoints)
6. [Security & Compliance](#security--compliance)
7. [Payment Integration](#payment-integration)
8. [File Handling & Watermarking](#file-handling--watermarking)
9. [User Experience](#user-experience)
10. [Admin Panel](#admin-panel)
11. [Onboarding Flows](#onboarding-flows)
12. [Customer Support](#customer-support)
13. [Legal Documents](#legal-documents)
14. [Dispute Resolution](#dispute-resolution)
15. [Analytics & KPIs](#analytics--kpis)
16. [SEO & Discovery](#seo--discovery)
17. [Launch Strategy](#launch-strategy)
18. [Development Roadmap](#development-roadmap)

---

## Platform Overview

**AKOMAYLESSONPLANNA** is a digital marketplace where Filipino K-12 teachers can buy and sell educational resources.

### Core Value Proposition

**For Sellers:**
- Monetize lesson plans, worksheets, presentations, and classroom materials they've already created
- Earn 80% of each sale (20% platform commission)
- Reach thousands of Filipino teachers nationwide
- Simple upload process, automated delivery

**For Buyers:**
- Save time by accessing quality, teacher-tested resources
- Affordable prices starting at ₱50
- Instant digital delivery after purchase
- Permanent access to purchases in account library

### Target Market

**Primary:** K-12 teachers (Kindergarten through Grade 12)
- Public and private school teachers
- All subjects (Math, Science, English, Filipino, Araling Panlipunan, MAPEH, etc.)
- All grade levels

**Secondary (Future):** College professors
- Mentioned on landing page as "coming soon"
- Expansion opportunity after platform validation

### Platform Type

Digital marketplace combining:
- **Gumroad-style** simplicity for creators
- **Lazada-style** e-commerce features (cart, wishlist, reviews)
- **Teachers Pay Teachers** model for educational resources

### Problem Solved

1. **Income Generation** - Teachers earn money from materials they've already created
2. **Time Savings** - New/busy teachers buy ready-made materials instead of creating from scratch
3. **Resource Sharing** - Community where teachers can access and share quality resources
4. **Quality Access** - Verified teachers ensure high-quality educational content

---

## Business Model & Pricing

### Revenue Streams

**1. Platform Commission**
- **Free/Pro Tier:** 20% commission on each sale
- **Pioneer Tier:** 15% commission (first 20 invited sellers only)
- Example: ₱100 sale → ₱20 commission → Seller keeps ₱80

**2. Subscription Tiers**

**Free Tier (All Sellers)**
- 20% commission on all sales
- ~~Bulk upload up to 10 products at once~~ *(Future feature - good to have)*
- Unlimited product uploads
- Basic seller dashboard (sales count, total revenue)
- Standard support (email, 48-hour response)
- Community forum access
- Upload all file types (PDF, DOCX, PPTX, images, videos, ZIP)
- Product customization (descriptions, featured images)

**Pro Tier - ₱249/month or ₱2,490/year (save 17%)**
- 20% commission on all sales (same as Free)
- ~~Bulk upload up to 50 products at once~~ *(Future feature - good to have)*
- Advanced analytics dashboard:
  - Views, conversion rates, popular products
  - Buyer demographics, sales trends
- Priority support (chat, 12-hour response)
- 10 featured product placements per month
- Custom seller profile (banner, colors, about section)
- Monthly performance tips via email
- Special "Pro Seller" badge on profile

**Pioneer Tier (Invite Only - 20 teachers max)**
- 15% commission (exclusive lifetime discount!)
- Same features as Pro tier
- Invite-only for first 20 experienced sellers
- Special "Pioneer Seller" badge on profile
- Goal: Attract high-quality sellers to launch platform

### Commission Examples

**At ₱10,000 monthly sales:**
- Free/Pro: ₱2,000 commission (20%)
- Pioneer: ₱1,500 commission (15%) → Saves ₱500/month

**Break-even for Pro tier:**
- ₱5,000 monthly sales: Save ₱250/month, breaks even with subscription
- ₱10,000 monthly sales: Save ₱500/month, ₱251 net profit after subscription

### Payment Methods

**Launch:**
- GCash
- Maya

**Future Expansion:**
- Credit/Debit cards
- Bank transfers
- Other e-wallets (Dana, ShopeePay, etc.)

---

## Technical Architecture

### Tech Stack

**Frontend:**
- **Framework:** Next.js 14 (React)
- **Language:** TypeScript
- **Styling:** Tailwind CSS or CSS Modules
- **State Management:** React Context/Zustand
- **Forms:** React Hook Form
- **Image Optimization:** Next.js Image component

**Backend:**
- **API:** Next.js API Routes (serverless functions)
- **Database:** Supabase (PostgreSQL)
- **Authentication:** Supabase Auth
- **File Storage:** Supabase Storage
- **Real-time:** Supabase Realtime (if needed)

**Mobile:**
- **Approach:** Progressive Web App (PWA)
- **Framework:** Next.js (same codebase)
- **Service Worker:** Next.js PWA plugin
- **Installable:** Add to home screen on Android/iOS

**Infrastructure:**
- **Hosting:** Vercel
- **Database Hosting:** Supabase Cloud
- **CDN:** Vercel Edge Network
- **Error Tracking:** Sentry
- **Analytics:** Vercel Analytics + Google Analytics
- **Email:** Resend or SendGrid

### Why This Stack?

**Next.js + Supabase:**
- Fastest development time
- Built-in authentication
- Serverless API (no server management)
- Excellent SEO support
- Easy deployment (Vercel)
- Scalable database
- File storage included

**PWA over Native Apps:**
- Single codebase (web + mobile)
- No app store approval needed
- Instant updates
- Lower development cost
- Works offline
- Installable on phones

### Architecture Diagram

```
┌─────────────────┐
│   Users         │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   Vercel Edge   │ ← CDN, SSL, DDoS protection
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   Next.js App   │ ← Serverless API routes
│   (Vercel)      │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   Supabase      │ ← Database, Auth, Storage
│   (Cloud)       │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   GCash API     │ ← Payment processing
│   Maya API      │
└─────────────────┘
```

---

## Database Schema

### Core Tables

**1. users**
```sql
- id (UUID, PK)
- email (VARCHAR, unique)
- password_hash (VARCHAR)
- name (VARCHAR)
- username (VARCHAR, unique, nullable)  <!-- Feature 02: For profile URLs /sellers/[username] -->
- avatar_url (TEXT)

-- Role & Permissions (Feature 01)
- role (ENUM: buyer, seller, admin)
- verification_status (ENUM: pending, verified, rejected)
- is_verified_teacher (BOOLEAN, default false)  <!-- Feature 01 -->
- can_sell (BOOLEAN, default false)  <!-- Feature 01 -->

-- Profile (Feature 01 & 02)
- bio (TEXT)
- subjects_taught (TEXT[])
- grade_levels_taught (TEXT[])
- location_city (VARCHAR(100))  <!-- Feature 02: City/municipality -->
- location_region (VARCHAR(100))  <!-- Feature 02: Region -->
- social_links (JSONB)  <!-- Feature 01 & 02: {facebook, instagram, youtube} -->
- banner_url (TEXT)  <!-- Feature 02: Pro/Pioneer custom banner -->
- custom_accent_color (VARCHAR(7))  <!-- Feature 02: Hex color for Pro/Pioneer -->
- profile_completion_percent (INTEGER, default 0)  <!-- Feature 02 -->
- followers_count (INTEGER, default 0)  <!-- Feature 02 -->
- response_time_hours (INTEGER)  <!-- Feature 02: Average response time -->

-- Subscription
- subscription_tier (ENUM: free, pro, pioneer)
- custom_commission_rate (DECIMAL(5,2))
- is_pioneer (BOOLEAN, default false)

-- Payment
- gcash_number (VARCHAR)
- maya_number (VARCHAR)

-- Admin
- is_banned (BOOLEAN, default false)
- ban_reason (TEXT)

-- Timestamps
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

**2. teacher_id_verifications**
```sql
- id (UUID, PK)
- user_id (UUID, FK → users)
- document_url (TEXT)
- prc_license_number (VARCHAR(50))  <!-- Feature 01: PRC license number -->
- prc_license_expiry (DATE)  <!-- Feature 01: License expiration date -->
- verification_grace_period_ends (DATE)  <!-- Feature 01: 1-month grace period -->
- status (ENUM: pending, approved, rejected)
- rejection_reason (TEXT)
- reviewed_by (UUID, FK → users)
- reviewed_at (TIMESTAMP)
- created_at (TIMESTAMP)
```

**3. products** <!-- Feature 03: Enhanced with all product types, categorization, versioning, analytics -->
```sql
- id (UUID, PK)
- seller_id (UUID, FK → users)
- title (VARCHAR)
- description (TEXT)
- price (DECIMAL(10,2))

-- Categorization (Feature 02.5)
- grade_id (UUID, FK → grades)  <!-- Changed from grade_level VARCHAR -->
- subject_id (UUID, FK → subjects)  <!-- Changed from subject VARCHAR -->
- quarter (INTEGER)  <!-- 1, 2, 3, 4 -->
- weeks (INTEGER[])  <!-- Multi-select: [1, 2, 3] for Weeks 1-3 -->

-- Product Types (Feature 03)
- product_type (VARCHAR)  <!-- Exams, Lesson Plans, RPMS, Poster, Tarpaulin -->
- specific_type (VARCHAR)  <!-- DLL, DLP, Periodical Exam, Summative Test, etc. -->

-- Type-specific metadata
- theme (VARCHAR)  <!-- For RPMS/Posters: Safari, Abstract, Floral, etc. -->
- size (VARCHAR)  <!-- For Posters/Tarpaulins: A4, 8x10, 3x5 feet, etc. -->
- season (VARCHAR)  <!-- For Tarpaulins: Christmas, Summer, etc. -->
- occasion (VARCHAR)  <!-- For Tarpaulins: Birthday, Graduation, etc. -->

-- Files & Media
- file_urls (TEXT[])  <!-- Main product files (private) -->
- cover_image_url (TEXT)  <!-- Cover image (public) -->
- preview_images (TEXT[])  <!-- First 3 pages as images (public) -->
- watermark_enabled (BOOLEAN, default true)

-- Version Management (Feature 03)
- current_version (INTEGER, default 1)
- changelog (TEXT)  <!-- Latest version description -->
- original_created_at (TIMESTAMP)  <!-- Track when first version was created -->

-- Status & Moderation (Feature 03)
- status (ENUM: draft, pending_review, published, rejected, suspended, deleted)
- rejection_reason (TEXT)
- suspension_reason (TEXT)
- review_count (INTEGER, default 0)  <!-- Track how many times submitted for review -->
- deleted_at (TIMESTAMP)  <!-- For 30-day soft delete -->

-- Analytics (Feature 03)
- views_count (INTEGER, default 0)
- unique_views_count (INTEGER, default 0)
- sales_count (INTEGER, default 0)
- conversion_rate (DECIMAL(5,2))  <!-- Calculated: sales / views -->

-- Rating & Reviews
- avg_rating (DECIMAL(3,2))
- reviews_count (INTEGER, default 0)

-- SEO & Discovery (Feature 03 + Feature 08)
- badges (TEXT[])  <!-- ["new", "featured", "trending", "bestseller"] -->
- slug (VARCHAR)  <!-- SEO-friendly URL: /products/dll-grade-7-math-q1 -->
- language (VARCHAR, default 'english')  <!-- Feature 08: english, filipino, bilingual -->
- search_score (INTEGER, default 0)  <!-- Feature 08: For Pro/Pioneer search analytics -->

-- Timestamps
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
- published_at (TIMESTAMP)
```

**4. product_updates** <!-- Feature 03: Enhanced version tracking -->
```sql
- id (UUID, PK)
- product_id (UUID, FK → products)
- version_number (INTEGER)
- changelog (TEXT)  <!-- Required: "What's new in this version?" -->
- file_urls (TEXT[])  <!-- Files for this version -->
- cover_image_url (TEXT)  <!-- Cover image for this version -->
- previous_version (INTEGER)  <!-- Link to previous version -->
- is_major_update (BOOLEAN, default false)  <!-- v1.0 → v2.0 vs v1.0 → v1.1 -->
- created_at (TIMESTAMP)
- created_by (UUID, FK → users)  <!-- Seller who created this version -->
```

**5. product_views**
```sql
- id (UUID, PK)
- product_id (UUID, FK → products)
- user_id (UUID, FK → users, nullable)
- viewed_at (TIMESTAMP)
```

**6. orders** <!-- Feature 04: Enhanced with refund support -->
```sql
- id (UUID, PK)
- buyer_id (UUID, FK → users)

-- Order details
- total_amount (DECIMAL(10,2))
- total_commission (DECIMAL(10,2))
- item_count (INTEGER)

-- Payment
- payment_method (ENUM: gcash, maya)
- payment_status (ENUM: pending, completed, failed)
- payment_reference (VARCHAR)
- payment_expires_at (TIMESTAMP)  <!-- Feature 04: 15-min timeout -->

-- Buyer info
- buyer_mobile_number (VARCHAR)  <!-- Feature 04: GCash/Maya number -->

-- Refund (Feature 04)
- refund_status (ENUM: none, requested, approved, rejected, default 'none')
- refund_reason (TEXT)
- refund_requested_at (TIMESTAMP)
- refund_processed_at (TIMESTAMP)
- refund_reference (VARCHAR)  <!-- Refund transaction ID -->

-- Timestamps
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
- completed_at (TIMESTAMP)
```

**7. order_items** <!-- Feature 04: Enhanced with download tracking -->
```sql
- id (UUID, PK)
- order_id (UUID, FK → orders)
- product_id (UUID, FK → products)
- seller_id (UUID, FK → users)

-- Product snapshot (at time of purchase)
- product_title (VARCHAR)  <!-- Feature 04: Snapshot -->
- product_cover_image_url (TEXT)  <!-- Feature 04: Snapshot -->

-- Pricing
- price_at_purchase (DECIMAL(10,2))
- commission_rate (DECIMAL(5,2))
- commission_amount (DECIMAL(10,2))
- net_earnings (DECIMAL(10,2))  <!-- Feature 04: For seller dashboard -->

-- Version tracking
- product_version_at_purchase (INTEGER)

-- Download tracking (Feature 04)
- download_count (INTEGER, default 0)
- last_downloaded_at (TIMESTAMP)

- created_at (TIMESTAMP)
```

**8. user_library**
```sql
- id (UUID, PK)
- user_id (UUID, FK → users)
- product_id (UUID, FK → products)
- purchased_at (TIMESTAMP)
- download_count (INTEGER, default 0)
- last_downloaded_at (TIMESTAMP)
```

**9. reviews** <!-- Feature 05: Enhanced with moderation and editing -->
```sql
- id (UUID, PK)
- product_id (UUID, FK → products)
- buyer_id (UUID, FK → users)
- rating (INTEGER, 1-5)
- comment (TEXT)
- verified_purchase (BOOLEAN)
- seller_response (TEXT)
- is_edited (BOOLEAN, default false) <!-- Feature 05: Track edited reviews -->
- is_flagged (BOOLEAN, default false) <!-- Feature 05: Moderation system -->
- flag_reason (TEXT) <!-- Feature 05: Why review was flagged -->
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
- UNIQUE(product_id, buyer_id) <!-- Feature 05: One review per product per buyer -->
```

**9b. review_flags** <!-- Feature 05: New table for moderation -->
```sql
- id (UUID, PK)
- review_id (UUID, FK → reviews)
- flag_type (VARCHAR) <!-- profanity, spam, excessive_caps, etc. -->
- flag_source (VARCHAR) <!-- automatic or manual -->
- reporter_id (UUID, FK → users) <!-- If manual flag -->
- reason (TEXT)
- status (VARCHAR) <!-- pending, approved, dismissed -->
- reviewed_by (UUID, FK → users)
- reviewed_at (TIMESTAMP)
- created_at (TIMESTAMP)
```

**10. cart_items**
```sql
- id (UUID, PK)
- user_id (UUID, FK → users)
- product_id (UUID, FK → products)
- created_at (TIMESTAMP)
```

**11. wishlist**
```sql
- id (UUID, PK)
- user_id (UUID, FK → users)
- product_id (UUID, FK → products)
- created_at (TIMESTAMP)
```

**12. recently_viewed**
```sql
- id (UUID, PK)
- user_id (UUID, FK → users)
- product_id (UUID, FK → products)
- viewed_at (TIMESTAMP)
```

**13. followers** <!-- Renamed from 'follows' for consistency with Feature 02 -->
```sql
- id (UUID, PK)
- follower_id (UUID, FK → users)
- following_id (UUID, FK → users)
- created_at (TIMESTAMP)
```

**14. categories**
```sql
- id (UUID, PK)
- name (VARCHAR)
- parent_id (UUID, FK → categories, nullable)
- slug (VARCHAR)
```

**14a. grades** <!-- Feature 02.5: System Configuration - Grade & Subject Management -->
```sql
- id (UUID, PK)
- name (VARCHAR, 50)  -- "Grade 7", "Kindergarten"
- sort_order (INTEGER)
- is_active (BOOLEAN, default true)
- created_at (TIMESTAMP)
```

**14b. subjects** <!-- Feature 02.5: System Configuration - Grade & Subject Management -->
```sql
- id (UUID, PK)
- name (VARCHAR, 100)  -- "Mathematics", "Science"
- code (VARCHAR, 20)   -- "MATH", "SCI"
- is_active (BOOLEAN, default true)
- created_at (TIMESTAMP)
```

**14c. grade_subjects** <!-- Feature 02.5: Many-to-many relationship -->
```sql
- grade_id (UUID, FK → grades, PK part 1)
- subject_id (UUID, FK → subjects, PK part 2)
- created_at (TIMESTAMP)
```

**15. seasonal_collections**
```sql
- id (UUID, PK)
- title (VARCHAR)
- description (TEXT)
- image_url (TEXT)
- is_active (BOOLEAN)
- start_date (DATE)
- end_date (DATE)
- created_by (UUID, FK → users)
- created_at (TIMESTAMP)
```

**16. collection_items**
```sql
- id (UUID, PK)
- collection_id (UUID, FK → seasonal_collections)
- product_id (UUID, FK → products)
- sort_order (INTEGER)
- added_at (TIMESTAMP)
```

**17. withdrawal_requests**
```sql
- id (UUID, PK)
- user_id (UUID, FK → users)
- amount (DECIMAL(10,2))
- payment_method (ENUM: gcash, maya)
- payment_number (VARCHAR)
- status (ENUM: pending, processing, completed, rejected)
- rejection_reason (TEXT)
- processed_at (TIMESTAMP)
- created_at (TIMESTAMP)
```

**18. reports**
```sql
- id (UUID, PK)
- reporter_id (UUID, FK → users)
- reported_user_id (UUID, FK → users, nullable)
- reported_product_id (UUID, FK → products, nullable)
- report_type (ENUM: reselling, inappropriate_content, fraud, other)
- description (TEXT)
- status (ENUM: pending, under_review, resolved, dismissed)
- resolution_notes (TEXT)
- created_at (TIMESTAMP)
```

**19. notifications**
```sql
- id (UUID, PK)
- user_id (UUID, FK → users)
- type (ENUM: new_product, price_drop, review, collection, system)
- title (VARCHAR)
- message (TEXT)
- link_url (TEXT)
- is_read (BOOLEAN, default false)
- created_at (TIMESTAMP)
```

**20. conversations** <!-- Feature 11: Messaging System -->
```sql
- id (UUID, PK)
- buyer_id (UUID, FK → users)
- seller_id (UUID, FK → users)
- product_id (UUID, FK → products, nullable)
- order_id (UUID, FK → orders, nullable)
- status (VARCHAR, default 'active') -- active, archived, blocked
- archived_by (UUID, FK → users, nullable)
- blocked_by (UUID, FK → users, nullable)
- last_message_at (TIMESTAMP)
- created_at (TIMESTAMP)
- UNIQUE(buyer_id, seller_id, product_id)
```

**20b. messages** <!-- Feature 11: Enhanced messaging system -->
```sql
- id (UUID, PK)
- conversation_id (UUID, FK → conversations)
- sender_id (UUID, FK → users)
- content (TEXT, max 1000 chars)
- message_type (VARCHAR, default 'user') -- user, system, admin
- attachments (TEXT[]) -- Array of image URLs
- is_read (BOOLEAN, default false)
- read_at (TIMESTAMP)
- is_flagged (BOOLEAN, default false)
- flag_reason (VARCHAR)
- is_deleted (BOOLEAN, default false)
- deleted_by (UUID, FK → users)
- deleted_at (TIMESTAMP)
- admin_joined (BOOLEAN, default false)
- admin_id (UUID, FK → users)
- created_at (TIMESTAMP)
```

**20c. message_templates** <!-- Feature 11: Quick replies for sellers -->
```sql
- id (UUID, PK)
- seller_id (UUID, FK → users, nullable) -- NULL for system templates
- name (VARCHAR)
- content (TEXT)
- template_type (VARCHAR, default 'custom') -- system, custom
- is_active (BOOLEAN, default true)
- usage_count (INTEGER, default 0)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

**20d. message_reports** <!-- Feature 11: User reports -->
```sql
- id (UUID, PK)
- reporter_id (UUID, FK → users)
- reported_user_id (UUID, FK → users)
- conversation_id (UUID, FK → conversations, nullable)
- message_id (UUID, FK → messages, nullable)
- report_type (VARCHAR) -- harassment, fraud, inappropriate, spam, other
- description (TEXT)
- status (VARCHAR, default 'pending') -- pending, under_review, resolved, dismissed
- reviewed_by (UUID, FK → users)
- resolution (TEXT)
- resolved_at (TIMESTAMP)
- created_at (TIMESTAMP)
```

**20e. user_blocks** <!-- Feature 11: Blocking users -->
```sql
- id (UUID, PK)
- blocker_id (UUID, FK → users)
- blocked_id (UUID, FK → users)
- conversation_id (UUID, FK → conversations, nullable)
- created_at (TIMESTAMP)
- UNIQUE(blocker_id, blocked_id)
- CHECK (blocker_id != blocked_id)
```

**20f. seller_response_times** <!-- Feature 11: Response time analytics -->
```sql
- id (UUID, PK)
- seller_id (UUID, FK → users)
- conversation_id (UUID, FK → conversations, nullable)
- first_message_at (TIMESTAMP)
- first_response_at (TIMESTAMP)
- response_seconds (INTEGER)
- created_at (TIMESTAMP)
```

**21. profile_views** <!-- Feature 02: Analytics for profile views -->
```sql
- id (UUID, PK)
- profile_user_id (UUID, FK → users)
- viewer_id (UUID, FK → users, nullable)  <!-- NULL for anonymous views -->
- viewed_at (TIMESTAMP)
- ip_address (INET)  <!-- For anonymous views -->
- user_agent (TEXT)  <!-- For analytics -->
```

**22. admin_notes** <!-- Feature 02: Internal admin communication -->
```sql
- id (UUID, PK)
- user_id (UUID, FK → users)  <!-- User being noted about -->
- admin_id (UUID, FK → users)  <!-- Admin writing the note -->
- note (TEXT)
- created_at (TIMESTAMP)
```

**23. audit_log** <!-- Feature 02: Admin action audit trail -->
```sql
- id (UUID, PK)
- admin_id (UUID, FK → users)
- action (VARCHAR(100))  <!-- Type of action taken -->
- target_type (VARCHAR(50))  <!-- 'user', 'product', etc. -->
- target_id (UUID)
- changes (JSONB)  <!-- Before/after values -->
- reason (TEXT)
- ip_address (INET)
- created_at (TIMESTAMP)
```

**24. user_sessions** <!-- Feature 01: Optional - for advanced session management -->
```sql
- id (UUID, PK)
- user_id (UUID, FK → users)
- token (VARCHAR(255))
- remember_me (BOOLEAN, default false)
- expires_at (TIMESTAMP)
- created_at (TIMESTAMP)
```

**25. search_analytics** <!-- Feature 08: Search analytics tracking -->
```sql
- id (UUID, PK)
- product_id (UUID, FK → products)
- search_term (VARCHAR(255))
- impressions (INTEGER, default 0)
- clicks (INTEGER, default 0)
- avg_position (DECIMAL(4,2))
- date (DATE)
- created_at (TIMESTAMP)
```

**26. search_queries** <!-- Feature 08: Search query tracking for popular searches -->
```sql
- id (UUID, PK)
- query_text (VARCHAR(255), unique)
- search_count (INTEGER, default 1)
- last_searched_at (TIMESTAMP)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

### Row Level Security (RLS)

**Users can only:**
- See their own cart, wishlist, library
- Edit their own products (if seller)
- See their own orders
- Manage their own profile

**Sellers can:**
- Create/update/delete their own products
- View their own sales and analytics
- Respond to reviews of their products

**Admins can:**
- View and moderate all content
- Manage all users
- Access platform analytics
- Process withdrawals

---

## API Endpoints

### Authentication

**POST /api/auth/signup** - Register new user
**POST /api/auth/login** - Email/password login
**POST /api/auth/google** - Google OAuth
**POST /api/auth/facebook** - Facebook OAuth
**POST /api/auth/logout** - Logout user
**GET /api/auth/me** - Get current user

### User Management

**GET /api/users/:id** - Get user profile
**PUT /api/users/:id** - Update user profile
**POST /api/users/verify-teacher** - Upload teacher ID
**GET /api/users/:id/products** - Get seller's products
**GET /api/users/:id/reviews** - Get seller's reviews

### Product Management

**GET /api/products** - List products (with filters, pagination)
**GET /api/products/:id** - Get product details
**POST /api/products** - Create new product (seller only)
**PUT /api/products/:id** - Update product (seller only)
**DELETE /api/products/:id** - Delete product (seller only)
**POST /api/products/bulk-upload** - Bulk import (seller only)
**GET /api/products/:id/preview** - Get product preview
**POST /api/products/:id/update** - Create new version (seller only)
**GET /api/products/:id/updates** - Get version history

### Shopping & Orders

**GET /api/cart** - Get user's cart
**POST /api/cart/add** - Add to cart
**DELETE /api/cart/:id** - Remove from cart
**POST /api/orders/checkout** - Create order + initiate payment
**POST /api/orders/:id/payment-callback** - GCash/Maya webhook
**GET /api/orders** - Get user's orders
**GET /api/orders/:id** - Get order details

### User Library

**GET /api/library** - Get purchased products
**GET /api/library/:id/download** - Download (with watermark)
**GET /api/library/:id/download/progress** - Download progress

### Reviews

**GET /api/products/:id/reviews** - Get product reviews
**POST /api/products/:id/reviews** - Create review (verified buyer only)
**PUT /api/reviews/:id** - Edit review (within 7 days only, Feature 05)
**POST /api/reviews/:id/flag** - Flag review for moderation (Feature 05)
**PUT /api/reviews/:id/response** - Seller responds to review (500 char max, Feature 05)
**GET /api/seller/reviews** - Get reviews for seller's products (seller only, Feature 05)
**GET /api/seller/reviews/analytics** - Review analytics (Pro/Pioneer only, Feature 05)
**GET /api/admin/reviews/flagged** - Get flagged reviews for moderation (Feature 05)
**PUT /api/admin/reviews/:id/moderate** - Admin decision on flagged review (Feature 05)
**DELETE /api/admin/reviews/:id** - Admin deletes review (emergency removal, Feature 05)

### Social Features

**POST /api/wishlist/add** - Add to wishlist
**DELETE /api/wishlist/:id** - Remove from wishlist
**GET /api/wishlist** - Get wishlist
**POST /api/users/:id/follow** - Follow seller
**DELETE /api/users/:id/unfollow** - Unfollow seller
**GET /api/recently-viewed** - Get recently viewed
**POST /api/products/:id/share** - Generate share link

### Seller Dashboard

**GET /api/seller/analytics** - Sales analytics
**GET /api/seller/reports** - Generate sales report
**GET /api/seller/earnings** - Current balance
**POST /api/seller/withdrawal** - Request withdrawal
**GET /api/seller/messages** - Buyer messages

### Admin

**GET /api/admin/pending-reviews** - Products pending review
**PUT /api/admin/products/:id/approve** - Approve product
**PUT /api/admin/products/:id/reject** - Reject product
**GET /api/admin/reports** - User reports
**PUT /api/admin/reports/:id/resolve** - Resolve report
**POST /api/admin/collections** - Create collection
**POST /api/admin/users/:id/ban** - Ban user
**POST /api/admin/users/:id/unban** - Unban user
**GET /api/admin/pioneers** - Manage Pioneers
**POST /api/admin/pioneers/add** - Add Pioneer
**DELETE /api/admin/pioneers/:id** - Remove Pioneer

### Search & Discovery (Feature 08)

**GET /api/search** - Search products with filters and pagination
**GET /api/search/suggestions** - Autocomplete suggestions (8 results)
**GET /api/search/popular** - Popular searches (top 100)
**GET /api/search/recent** - Recent searches for user
**POST /api/search/track** - Track search query (for analytics)
**GET /api/categories** - List all categories
**GET /api/categories/:slug** - Category details
**GET /api/categories/:slug/products** - Products in category
**GET /api/recommendations/related/:productId** - Related products
**GET /api/recommendations/personalized** - Personalized for user
**GET /api/recommendations/trending** - Trending products
**GET /api/seller/analytics/search/:productId** - Search analytics for product (owner only)
**GET /api/seller/analytics/search/terms/:productId** - Search terms report (owner only)
**GET /api/seller/analytics/search/performance/:productId** - Performance score (owner only, Pro/Pioneer)
**GET /api/seller/analytics/search/opportunities/:productId** - Keyword opportunities (Pro/Pioneer only)

### Notifications

**GET /api/notifications** - Get notifications
**PUT /api/notifications/:id/read** - Mark as read
**DELETE /api/notifications/:id** - Delete notification
**PUT /api/notifications/read-all** - Mark all as read

### Messages (Feature 11 - Messaging System)

**Conversations:**
**GET /api/messages/conversations** - Get user's conversations (buyer/seller)
**GET /api/messages/conversations/:id** - Get single conversation with all messages
**POST /api/messages/conversations** - Create new conversation
**PUT /api/messages/conversations/:id/archive** - Archive conversation
**PUT /api/messages/conversations/:id/unarchive** - Unarchive conversation
**DELETE /api/messages/conversations/:id** - Delete conversation (soft delete)

**Messages:**
**GET /api/messages/conversations/:id/messages** - Get all messages in conversation
**POST /api/messages/conversations/:id/messages** - Send new message
**GET /api/messages/new** - Poll for new messages (30-second intervals)
**PUT /api/messages/:id/read** - Mark message as read
**PUT /api/messages/conversations/:id/read-all** - Mark all messages in conversation as read
**DELETE /api/messages/:id** - Delete message (soft delete)

**Image Uploads:**
**POST /api/messages/upload** - Upload image attachment (max 5MB, JPG/PNG/WebP)
**DELETE /api/messages/images/:url** - Delete uploaded image before sending

**Templates (Pro/Pioneer):**
**GET /api/messages/templates** - Get user's custom templates + 5 system templates
**POST /api/messages/templates** - Create custom template (Pro/Pioneer only, max 5)
**PUT /api/messages/templates/:id** - Update custom template
**DELETE /api/messages/templates/:id** - Delete custom template
**GET /api/messages/templates/system** - Get 5 system quick reply templates

**Blocking & Reporting:**
**POST /api/messages/conversations/:id/block** - Block other participant
**POST /api/messages/conversations/:id/unblock** - Unblock user
**GET /api/messages/blocks** - Get list of blocked users
**POST /api/messages/report** - Report user or message
**GET /api/messages/reports** - Get user's own reports

**Admin Messaging:**
**GET /api/admin/messages/conversations** - Get all conversations (admin view)
**GET /api/admin/messages/conversations/:id** - View any conversation (admin access)
**GET /api/admin/messages/flagged** - Get flagged messages queue
**PUT /api/admin/messages/flagged/:id/dismiss** - Dismiss flag
**DELETE /api/admin/messages/:id** - Delete any message (admin action)
**POST /api/admin/messages/conversations/:id/join** - Admin joins conversation as mediator
**POST /api/admin/messages/conversations/:id/message** - Admin sends message to conversation
**GET /api/admin/messages/reports** - Get all user reports
**PUT /api/admin/messages/reports/:id/resolve** - Resolve report

**Seller Analytics:**
**GET /api/seller/messages/analytics** - Get seller messaging analytics (response time, conversations, etc.)
**GET /api/seller/messages/templates/analytics** - Get template usage stats (Pro/Pioneer)

**Settings:**
**PUT /api/messages/settings/away-message** - Set away/auto-reply message (seller only)
**GET /api/messages/settings/away-message** - Get current away message status

### Reports

**POST /api/reports** - Submit report
**GET /api/reports/:id** - Get report details

---

## Security & Compliance

### Authentication & Authorization

- **JWT tokens** stored in httpOnly cookies
- **Role-based access control** (buyer, seller, admin)
- **Protected routes** with middleware
- **OAuth 2.0** for Google/Facebook
- **Password requirements:** Min 8 chars, uppercase, lowercase, number
- **Token refresh mechanism**
- **Session timeout:** 7 days inactivity
- **Logout from all devices** option

### File Upload Security

- **Allowed file types:** PDF, DOCX, PPTX, JPG, PNG, MP4, ZIP
- **File size limit:** 500MB per product
- **Virus scanning** on uploads
- **Private storage** (Supabase Storage with access controls)
- **S3-compatible storage** for migration

### Watermarking (Anti-Piracy)

**Files watermarked:**
- PDFs: Buyer email on first/last page
- DOCX: Watermark in header/footer
- PPTX: Subtle watermark on slides

**Implementation:**
- On-demand generation (when buyer downloads)
- Cached for 24 hours (avoid reprocessing)
- Buyer's email embedded visibly

**Benefits:**
- Deters unauthorized reselling
- Traceable if files shared
- No shareable download links (files in account only)

### Payment Security

- **Direct integration** with GCash and Maya APIs
- **Webhook signature verification**
- **Idempotency keys** prevent duplicate payments
- **Never store** full payment details
- **Secure payment flow** with tokens

### Data Protection

- **Encryption at rest** (Supabase)
- **Encryption in transit** (HTTPS/TLS 1.3)
- **PII protection** (phone numbers encrypted)
- **Input validation** (sanitize all inputs)
- **SQL injection prevention**
- **XSS protection**
- **CORS configuration** (allow only your domain)

### Rate Limiting

- **100 requests/minute** per user
- **Captcha** on signup, login, upload
- **Suspicious activity detection**
- **Account lockout** after 5 failed logins
- **IP ban** for abusive behavior

### Content Moderation

- **Manual review** of first 3 products from new sellers
- **Automated filtering** for inappropriate content
- **Community reporting** system
- **Quick takedown** of violating content
- **Rejection criteria** clearly documented

### Legal Compliance

**Terms of Service:**
- 18+ requirement for sellers
- Content ownership confirmation
- No refunds for digital goods (except defects)
- Platform can suspend/ban for violations
- Philippine courts jurisdiction

**Privacy Policy:**
- Data collected (name, email, teacher ID, GCash/Maya)
- Data usage (payments, verification, analytics)
- No data selling
- User rights (access, correction, deletion)
- 7-year retention (tax compliance)

**Seller Agreement:**
- Must be licensed teacher
- Own content rights
- Appropriate content only
- 20% commission (15% for Pioneers)
- Responsible for tax declarations

**Data Privacy Act (DPA) Compliance:**
- Register with NPC (if 250+ users)
- Designate Data Protection Officer
- Privacy Management Program
- Data breach response (72-hour notification)
- User data rights implementation

---

## Payment Integration

### Payment Flow

**For GCash:**
1. Buyer selects GCash payment
2. Buyer enters GCash mobile number
3. System initiates via GCash API
4. Buyer receives push notification in app
5. Buyer approves (PIN/biometric)
6. GCash sends webhook confirmation
7. Order completed, products delivered

**For Maya:**
1. Buyer selects Maya payment
2. Buyer enters Maya mobile number
3. System initiates via Maya API
4. Buyer receives OTP in app
5. Buyer enters OTP to confirm
6. Maya sends webhook confirmation
7. Order completed, products delivered

### Direct Integration Benefits

**No payment gateway fees:**
- ~1.5-2% per transaction (vs 2.5% + ₱15-25 with gateway)
- Example: ₱50 sale → ₱1 fee (2%) vs ₱16.25 fee with gateway

**Example math:**
```
₱50 product with direct integration:
- Fee: ~₱1 (2%)
- Seller keeps: ₱49

₱50 product with payment gateway:
- Fee: ₱1.25 (2.5%) + ₱15 = ₱16.25
- Seller keeps: ₱33.75 (32.5% fee!)
```

### Seller Payouts

**Payout calculation:**
- Product price: ₱500
- Platform commission (20%): ₱100
- Withholding tax: Variable per seller
- Net payout: ₱400 (before tax)

**Withdrawal options:**
- **Standard:** Free, 5-7 business days
- **Instant:** Small fee, processed in minutes (future)

**Minimum withdrawal:** ₱500

**Payout flow:**
1. Seller reaches minimum threshold
2. Requests withdrawal via dashboard
3. Admin reviews (can automate for trusted sellers)
4. Funds transferred via GCash/Maya Disbursement API
5. Payout recorded in system

---

## File Handling & Watermarking

### File Upload Flow

**Seller uploads:**
1. Selects files (PDF, DOCX, PPTX, images, videos, ZIP)
2. Client validates types and sizes (max 500MB)
3. Uploads to Supabase Storage (private bucket)
4. Stores file URLs in database

**Preview generation:**
1. Extract first 3 pages of PDFs as images
2. Convert document first page to image
3. Store in separate public bucket
4. Display on product page

### Watermarking on Purchase

**Process:**
1. Buyer clicks "Download"
2. System retrieves original file
3. Adds watermark with buyer's email
4. Generates progress indicator (0-100%)
5. Delivers watermarked file
6. Caches for 24 hours (if downloaded again)

**Watermarking libraries:**
- PDFs: `pdf-lib`
- DOCX: `docx` or custom
- PPTX: `PptxGenJS` or similar

**Storage structure:**
```
Supabase Storage:
├── products/original/{productId}/
├── products/previews/{productId}/
└── products/watermarked/{productId}/{buyerId}/
```

### Download Progress UI

```javascript
<download-progress>
  <p>Preparing your files...</p>
  <progress value={progress} max="100">{progress}%</progress>
  <p>{progress}% complete</p>
</download-progress>
```

---

## Shopping & Orders (Feature 04)

### Shopping Cart

**Cart Behavior:**
- One copy per product only (digital goods, unlimited downloads)
- Unlimited items per cart, persists indefinitely
- Account required to purchase (no guest checkout in MVP)
- Separate cart page at `/cart`
- "Buy Now" button on product pages (skips cart, goes to checkout)

**Cart Page Features:**
- Checkboxes to select items for checkout
- "Select All" / "Deselect All" buttons
- "Remove Selected" button
- "Move to Wishlist" functionality
- Subtotal display: "Total for X items: ₱XXX"
- "Checkout [X] Selected Items" CTA button

**Cart Persistence:**
- Cart saved in database for logged-in users
- Returning users see their previous cart
- Cart only clears when: items purchased, manually removed, or products deleted

### Wishlist

**Wishlist Features:**
- Heart icon on each product card (toggle save/unsave)
- Separate wishlist page at `/wishlist`
- "Add to Cart" button for each wishlist item
- Same persistence as cart (database, indefinite)
- Independent from cart (can have item in both)

**Wishlist Page:**
- Similar layout to cart page
- Shows product thumbnail, title, seller, price
- "Add to Cart" and "Remove from Wishlist" actions

### Checkout Flow

**Multi-Step Checkout (2 steps):**

**Step 1: Review Order**
- Progress indicator: "Step 1 of 2"
- Order summary:
  - List of selected items with prices
  - Subtotal and total
- "Continue to Payment" button

**Step 2: Payment Method**
- Progress indicator: "Step 2 of 2"
- Large clickable cards: GCash | Maya
- Payment instructions appear **after** selection
- Mobile number input field
- "Pay Now" button (color-coded by payment method)

**Order Summary Display:**
- Simple summary only (no commission shown to buyer)
- Itemized list with prices
- Subtotal and **Total** (final amount to pay)

### Payment Integration

**GCash Payment Flow:**
1. Buyer selects GCash, enters mobile number
2. System initiates via GCash API
3. Buyer receives push notification in GCash app
4. Buyer approves (PIN/biometric)
5. GCash sends webhook confirmation
6. Order completed, products delivered

**Maya Payment Flow:**
1. Buyer selects Maya, enters mobile number
2. System initiates via Maya API
3. Buyer receives OTP in Maya app
4. Buyer enters OTP to confirm
5. Maya sends webhook confirmation
6. Order completed, products delivered

**Payment Timeout:**
- 15-minute window to complete payment
- Countdown timer: "Complete payment in 14:59"
- Order status: `payment_pending`
- After 15 min: `payment_failed`, cart items **not** cleared
- Email sent: "Payment not completed. Your cart is waiting!"

**Payment Retry:**
- Unlimited retry attempts
- "Try Again" button returns to payment selection
- No limit on retries (technical glitches happen)
- User can cancel order anytime

### Order Confirmation & Fulfillment

**Thank You Page:**
- Route: `/orders/[orderId]/success`
- Large success message: "Payment Successful! 🎉"
- Order details: ID, date, items, total
- Download buttons for each product (prominent)
- "Go to My Library" button
- "View Order Receipt" button
- "Email confirmation sent" message

**Email Confirmation (Immediate):**
- Subject: "Order Confirmation - Your AKOMAYLESSONPLANNA Purchase"
- Order details (ID, items, total)
- Direct download links (expire after 24 hours)
- "Go to My Library" button
- Support contact info

### User Library & Downloads

**Library Page:**
- Route: `/library`
- Grid of purchased products (2/3/4 columns responsive)
- Filter: All, Recently Purchased, Most Downloaded
- Search within library
- Each item shows: thumbnail, title, purchase date, "Download" button

**Download Behavior:**
- **Unlimited downloads** per product
- No time limit (permanent access)
- Download count tracked (for seller analytics)
- "Last downloaded" timestamp

**Download Process:**
1. User clicks "Download"
2. System validates purchase
3. Generates watermarked file (if not cached)
4. Progress indicator: "Preparing your files... 45%"
5. File downloads when ready
6. Caches for 24 hours (faster re-downloads)

### Cart Abandonment Recovery

**Abandoned Cart Email:**
- Trigger: Items in cart for 24 hours without checkout
- Subject: "You left items in your cart! 💭"
- Shows cart items and total
- "Complete your purchase" CTA
- ONE email only (not spammy)
- 10-15% typical recovery rate

### Seller Order Management

**Seller Dashboard - Orders:**
- List of orders with items sold
- Each order shows:
  - Order ID, date, time
  - Product sold (thumbnail + title)
  - Price, commission rate, **net earnings**
  - Buyer info: "Teacher Maria M." (anonymized)
  - Payment method: GCash/Maya
  - Order status: Completed/Pending/Failed
  - Download count
- "View Details" button
- "Contact Buyer" button (messaging)

**Order Detail Modal:**
- Full order information
- Pricing breakdown: Product price → Commission → **Net earnings**
- Commission rate shown (20% or 15% for Pioneers)
- Anonymized buyer information
- Download count and last download time

### Seller Payouts

**Earnings Dashboard:**
- Current balance: "₱2,340 available for withdrawal"
- Pending balance: "₱560 processing"
- Total lifetime earnings
- "Request Withdrawal" button (enabled if ≥ ₱500)

**Withdrawal Request:**
- Minimum: ₱500 threshold
- Seller selects amount and payment method (GCash/Maya)
- Automatic processing via GCash/Maya Disbursement API
- No admin review needed
- Processing time: 1-3 business days
- Seller notified: "Withdrawal successful!"

**Withdrawal History:**
- Table shows: date, amount, method, status
- Status: Processing, Completed, Failed

### Refund Policy & Process

**Public Refund Policy:**
- "All sales final due to digital nature"
- Exceptions: Defective products, not as described, technical issues
- 7-day window to request refund
- Buyer contacts seller first (48-hour response)
- Escalation to platform if needed

**Refund Request Process:**
1. Buyer goes to `/orders/[orderId]/request-refund`
2. Selects reason, enters description
3. Seller notified (email + in-app)
4. Seller has 48 hours to respond:
   - Approve: Automatic refund via API
   - Offer fix: "I can send corrected file"
   - Dispute: "Product as described"
5. If no response or disputed: Buyer can escalate
6. Platform mediates (3-5 business days)

**Refund Processing:**
- Automatic via GCash/Maya Refund API
- Money returned to buyer's wallet (1-3 business days)
- Buyer's library access revoked immediately
- Commission returned to seller
- Email notifications to both parties

### Email Notifications

**Buyer Notifications:**
- Order confirmation (immediate)
- Payment failed (timeout/declined)
- Abandoned cart reminder (24 hours)
- Refund approved

**Seller Notifications:**
- New sale (immediate): "You made a sale! 🎉"
- Refund requested
- Withdrawal complete
- Product updated (from Feature 03)

### Mobile Experience

**PWA Benefits:**
- Add to home screen
- Full-screen mode
- Offline capability (view cart, wishlist)

**Mobile Checkout:**
- Responsive design (2/3/4 columns)
- Large touch targets (44x44px minimum)
- Numeric keyboard for mobile number input
- Sticky "Pay" button (bottom of screen)
- Seamless app switching (checkout ↔ GCash/Maya)

**No Special Features:**
- No deep linking to GCash/Maya apps
- Responsive + PWA is sufficient for MVP

---

## User Experience

### Buyer Journey

**Browse & Discover:**
- Homepage with seasonal collections, featured products
- Search by subject, grade level, keywords
- Filter by price, ratings, file type, seller
- Product details with preview (first 3 pages)
- Add to cart or wishlist
- Share to Messenger/Facebook

**Purchase:**
- Checkout from cart (multiple products)
- Payment via GCash/Maya
- Instant access in "My Purchases"
- Download anytime
- Rate and review purchased items

**Post-Purchase:**
- Access all purchases in library
- Notifications from followed sellers
- Personalized recommendations
- Leave reviews

### Seller Journey

**Onboarding:**
- Sign up and verify teacher ID
- Complete profile (subjects, grades, bio)
- Get "Verified Teacher" badge
- First 3 products require manual review

**Product Creation:**
- Single product upload (multi-step wizard)
- ~~Bulk upload~~ *(Future feature - good to have)*
- Set price, description, preview images
- Organize by category
- Save as draft or publish
- First 3 reviewed manually

**Sales Management:**
- Dashboard shows sales, revenue, popular products
- View orders and buyer info
- Generate sales reports
- Update products (buyers get latest version)
- Respond to reviews and questions

### E-commerce Features

**Shopping:**
- Shopping cart (multiple products, one checkout)
- Wishlist/save for later
- Recently viewed items
- Order history with receipts

**Social:**
- Share to Messenger, Facebook
- Copy link to clipboard
- Follow favorite sellers
- Notifications (new products, price drops)

**Discovery:**
- Category browsing with subcategories
- Search with filters
- Recommended products
- Seasonal collections (Back to School, etc.)
- Followed seller updates

**Trust:**
- "Best Seller" badges
- "New Arrival" tags
- "Verified Teacher" badges
- Sales count displayed
- Seller ratings
- Seller response time

---

## Admin Panel (Feature 09 - COMPLETED ✅)

**Documentation:** `docs/brainstorming/11-feature-09-admin-panel-and-content-moderation.md`

---

## Email System (Feature 10 - COMPLETED ✅)

**Documentation:** `docs/brainstorming/12-feature-10-email-system-transactional-and-notification-emails.md` & `docs/email-templates-specifications.md`

### Overview

Comprehensive email system handling **26 distinct email types** across authentication, transactions, notifications, and administrative functions.

### Key Design Decisions

**Hybrid Email Approach:**
- **Supabase Auth** for authentication emails (4 types) - built-in, free
- **Resend** for transactional/marketing emails (22+ types) - flexible, cost-effective

**Two-Tier Preference System:**
- **User Preferences:** Category-based controls (4 categories) - simple, user-friendly
- **Admin Configuration:** Individual toggles (26 email types) - granular platform control

**Email Queue System:**
- Priority-based queue (1-10)
- Rate limiting (per user + platform-wide)
- Scheduled emails (cart abandonment, review reminders)
- Batch sending for announcements
- Retry logic (exponential backoff, max 3 attempts)

### Email Categories (26 Types)

**1. Authentication Emails (4)**
- Welcome email
- Email verification (sellers only)
- Password reset request
- Password reset confirmation

**2. Product Management Emails (5)**
- Product submitted for review
- Product approved notification
- Product rejected notification
- Product version update (to previous buyers)
- Product suspended notification

**3. Shopping Cart & Checkout Emails (6)**
- Cart abandonment reminder (24 hours)
- Order confirmation
- Payment successful
- Payment failed
- Download ready
- Refund approved/processed

**4. Reviews & Ratings Emails (3)**
- Review reminder (24h after download)
- Review response notification
- Review flagged notification

**5. Social Features Emails (5)**
- New sale notification
- New review notification
- New follower notification
- Price drop notification
- New product from followed seller

**6. Admin Panel Emails (3)**
- Teacher verification approved
- Teacher verification rejected
- Account ban notification

### Email Infrastructure

**Email Service Provider:**
- **Resend** (recommended) - $20/month for 50,000 emails
- Generous free tier: 3,000 emails/month
- Good PH deliverability (@gmail, @yahoo, @outlook)
- Developer-friendly DX, excellent Next.js integration

**Email Queue System:**
- Database table: `email_queue` (8 tables total)
- Processor runs every 1 minute (cron job)
- Priority-based sending (1=highest, 10=lowest)
- Rate limiting: 10 emails/hour/user, 50 emails/day/user
- Platform limits: 100 emails/minute, 3,000 emails/hour

**Template Management:**
- Rich text editor (no coding needed)
- Version control (unlimited versions)
- Template cloning
- Preview & test send
- Variable system for personalization

### Email Analytics

**Metrics Tracked:**
- Sent count, delivery rate, bounce rate
- Open rate, click rate, unsubscribe rate
- Performance by email type
- Platform health (queue depth, processing time)

**Admin Dashboard:**
- `/admin/analytics/email` - comprehensive dashboard
- Metric cards, performance tables
- Queue status, recent failures
- Alert system (high bounces, queue backlogs)

### Email Security & Compliance

**Email Authentication:**
- SPF (Sender Policy Framework)
- DKIM (DomainKeys Identified Mail)
- DMARC (Domain-based Message Authentication)
- DMARC policy rollout: Month 1 `p=none` → Month 2 `p=quarantine` → Month 4 `p=reject`

**Data Privacy Act (DPA) Compliance:**
- One-click unsubscribe (24-hour processing)
- Consent management
- Data protection (encryption, no sharing)
- Data retention (queue: 30 days, logs: 1 year)

**Spam Prevention:**
- Suppression list (hard bounces, spam complaints)
- Email validation (format checking)
- Rate limiting (per user + platform-wide)

### Cost & Budget

**Monthly Cost:**
- Months 1-6: $20/month (~₱1,200) - 50,000 emails
- Months 7-12: $40/month (~₱2,400) - 100,000 emails
- Year 1 Total: ~$360 (~₱21,600)

**Email Volume Estimation:**
- Month 1 (500 users): ~7,000 emails
- Month 6 (2,000 users): ~39,000 emails
- Month 12 (5,000 users): ~119,000 emails

### Implementation Priority

**MVP Critical (12 types):**
1. Auth emails (4) - Supabase Auth built-in
2. Transactional emails (8): Order confirmation, Payment status, Download ready, Refunds, Product approved/rejected, New sale, Cart abandonment, Verification emails

**Post-Launch Month 1-3 (3 types):**
- Review reminder
- New review notification
- Product version update

**Post-Launch Month 4-6 (4 types):**
- Review response
- Price drop
- New follower
- New product from followed seller

---

## Messaging System (Feature 11 - COMPLETED ✅)

**Documentation:** `docs/brainstorming/13-feature-11-messaging-system.md`

### Overview

Buyer-seller messaging system with **Messenger-like UX** for pre-purchase inquiries, post-purchase support, and custom requests. Filipino teachers are highly social and familiar with Messenger, so the design mimics Facebook Messenger while keeping all transactions on-platform.

### Key Design Decisions

**Conversation Organization:**
- **One conversation per buyer-seller-product pair** - keeps discussions organized
- **Three states:** Active, Archived (90-day auto-archive), Blocked
- **Product-linked or general** conversations

**Messaging Approach:**
- **30-second polling** for MVP (not WebSockets) - simpler, better battery life
- **No email notifications** for messages (user decision) - in-app bell badge only
- **Images only** for file sharing (3 images, 5MB max, no virus scanning needed)

**Privacy & Safety:**
- **Anonymized communication** - no email/phone exposure
- **Auto-flag external links** (GCash numbers, email addresses)
- **Profanity filter** (Tagalog + English)
- **Block/report functionality**
- **Admin dispute resolution** - admin can join conversations as mediator

### Message Types

**4 Categories:**
1. **Product Inquiries** - Pre-purchase questions ("Does this include answer keys?")
2. **Order Support** - Post-purchase help ("I can't download the file")
3. **Custom Requests** - Personalization ("Can you modify this for Grade 8?")
4. **Platform Messages** - System-generated (admin notifications, auto-replies)

### Seller Tools

**Quick Replies (5 system templates for all sellers):**
- "Yes, this product is available! 💚"
- "Yes, this includes answer keys."
- "I can customize this for you. What changes do you need?"
- "Please check your library for downloads."
- "Thank you for your purchase! Let me know if you need help."

**Custom Templates (Pro/Pioneer only):**
- Create up to 5 custom templates
- Template variables: {{buyer_name}}, {{product_title}}, {{seller_name}}
- Template usage analytics

**Response Time Tracking:**
- Automatic tracking of seller response times
- Display to buyers: "⏱️ Responds within 1 hour"
- Badges: Lightning fast (< 1hr), Very responsive (< 3hrs), Responsive (< 6hrs)
- Calculated from last 50 responses, rolling 30-day window

**Away Messages (Auto-Reply):**
- Optional feature for all sellers
- Set return date, custom message
- Auto-reply when buyer messages while seller is away

### User Interface

**Desktop (Two-column layout):**
- **Left Panel (40%):** Conversation list with search, filters (Active/Archived/All), unread badges
- **Right Panel (60%):** Conversation view with chat bubbles, product context card, message input with image upload

**Mobile (70%+ of users - Full-screen like Messenger):**
1. **Message list view** (default) - Full-width cards, swipe actions (archive/delete)
2. **Conversation view** (tap to open) - Full-screen chat, back button, product context
3. **Bottom sheet** - Quick replies menu, block/report options

**Swipe Actions:**
- Swipe left → Archive (primary), Delete (secondary)
- Swipe right → Mark as read/unread

### Admin Tools

**Flagged Messages Queue:**
- Auto-flag: External links, profanity, spam patterns
- Admin actions: View, Dismiss, Delete, Warn User, Ban User
- Severity levels: High (fraud, harassment), Medium (copyright), Low (inappropriate)

**Dispute Resolution:**
- Admin joins conversation as mediator (gold border + Admin badge)
- Resolution options: Mediate, Refund, Warn Buyer/Seller, Ban
- 7-day appeal process (different admin reviews)

**Conversation Search:**
- Advanced search by buyer name, seller name, product ID, message content
- Filters: Date range, flagged status, dispute status
- View any conversation (admin has full access)

### Integration Points

**Feature 01:** Messages require login, blocked users cannot message
**Feature 02:** "Contact Seller" button on profile, response time badge visible
**Feature 03:** "Ask a Question" button on product page, product-linked conversations
**Feature 04:** "Contact Buyer" in order history, post-purchase auto-message option
**Feature 05:** Seller responds to review → "Message me for help" link
**Feature 06:** Bell badge shows message count, notifications link to conversations
**Feature 07:** Messages navigation in seller dashboard, unread badge
**Feature 09:** Flagged messages queue in admin panel, dispute resolution

### Success Metrics

**Most Important:** **Conversation → Purchase rate (target: 15%+)**

**Week 1 Targets:**
- Messages sent: 500+, Active conversations: 200+, Sellers using quick replies: 30%+

**Month 1 Targets:**
- Messages sent: 5,000+, Active conversations: 1,500+, Sellers with 10+ conversations: 50+

**Month 3 Targets:**
- Daily active users (messaging): 200+, Messages sent per day: 500+, Conversion rate: 15%+

**Month 6 Targets:**
- Daily active users: 500+, Total conversations: 10,000+, Sellers using templates: 40%+

### Database Tables (6 new tables)

**1. conversations** - One per buyer-seller-product pair
**2. messages** - Enhanced with attachments, flagging, admin intervention
**3. message_templates** - Quick replies for sellers
**4. message_reports** - User reports for moderation
**5. user_blocks** - Blocking users
**6. seller_response_times** - Response time analytics

**Storage:**
- **Supabase Storage bucket:** `message-images` (image attachments)
- **Retention:** 90 days (auto-delete)
- **Size limit:** 5 MB per image, 3 images per message

### Implementation Timeline

**6-8 weeks for MVP (15 must-have features):**
- Week 1-2: Foundation (database + API structure)
- Week 3-4: Core messaging (send/receive + polling)
- Week 5-6: UI components (inbox + mobile)
- Week 7: Safety & admin tools
- Week 8: Polish & testing

**Post-Launch Features (Month 1-6):**
- Month 1-3: Custom templates, away messages, enhanced analytics, emoji picker, conversation export
- Month 3-6: Browser push notifications, reply with quote, bulk messages, typing indicators, read receipts

**Never Build:**
- ❌ Video/voice calling (use external tools)
- ❌ SMS integration (too expensive)
- ❌ Email messaging (keep email for support@ only)
- ❌ Anonymous messaging (all users authenticated)
- ❌ Public chat rooms (private buyer-seller only)

**Post-Launch Month 7+ (7 types):**
- New follower, Review flagged, Product suspended, Product submitted, Analytics enhancements, Behavioral emails, A/B testing

### Database Schema

**New Tables (8):**
1. `email_queue` - Queue for sending emails
2. `email_templates` - Template definitions
3. `email_template_versions` - Version history
4. `email_configuration` - Admin settings per email type
5. `user_email_preferences` - User preferences (4 categories)
6. `email_analytics` - Delivery and engagement metrics
7. `email_daily_stats` - Daily aggregations
8. `email_suppression_list` - Hard bounces, spam complaints

### Documentation

- **Feature Design:** `docs/brainstorming/12-feature-10-email-system-transactional-and-notification-emails.md`
- **Email Templates:** `docs/email-templates-specifications.md` (all 26 email types with full specifications)

---

### Admin Panel - Feature 09 ✅

---

### Navigation Structure

**Sidebar Navigation (collapsible on mobile):**
- Dashboard
- Users (All Users, Verification Queue, Banned Users, Admin Notes)
- Products (Pending Reviews, All Products, Suspended Products, Review History)
- Reviews (Flagged Reviews queue)
- Reports (User Reports, Resolved Items, Moderation Stats)
- Pioneers (Current Pioneers, Pioneer Candidates, Pioneer History)
- Financials (Revenue Overview, Withdrawal Requests, Payout History, Financial Reports)
- Announcements (Create, All Announcements, Templates)
- Analytics (Platform Growth, Seller Performance, Product Insights, Buyer Behavior, Geographic Data)
- Settings (Platform, Feature Flags, Email, Payments, System Status, Admin Management)

**Top Bar (persistent):**
- Platform logo/name
- Quick search (users by email/name, products by title)
- Notifications bell (urgent items: high-priority reports, many pending reviews)
- Admin profile dropdown

**Quick Action Cards (Dashboard):**
- Pending Products (count with badge)
- Verification Queue (count with badge)
- Flagged Reviews (count with badge)
- Withdrawal Requests (count with badge)

---

### 1. Dashboard Overview

**Metric Cards (8 cards, 2 rows of 4):**
- Row 1 (Revenue & Growth): Total Revenue, Total Orders, New Signups, Products Listed
- Row 2 (Platform Health): Active Sellers, Approval Rate, Platform Rating, Support Tickets

**Quick Action Cards (top row, with counts):**
- Pending Products (orange badge)
- Verification Queue (blue badge)
- Flagged Reviews (red badge)
- Withdrawal Requests (green badge)

**Charts (4 total):**
- User Growth Over Time (line chart)
- Sales by Category (bar chart)
- Order Volume (line chart)
- Seller Performance (bar chart - top 10)

**Recent Activity Feed (bottom, full width):**
- Shows last 20 activities (hybrid feed)
- Filterable: All, Approvals, Issues, Sales
- Color-coded by type

**Time Range Selector:**
- Default: Last 30 Days
- Options: Today, Yesterday, This Week, Last 7 Days, This Month, Last 30 Days, This Year, All Time, Custom

**Data Strategy:**
- Quick Action badges: 1-minute cache
- Metric cards: 5-minute cache
- Charts: 15-minute cache
- Activity feed: 1-minute cache
- Real-time features: Refresh button + auto-refresh every 5 minutes

---

### 2. User Management

**Tab Structure:**
1. **All Users** - Main user list with search/filters/bulk actions
2. **Verification Queue** - Teacher ID approvals (Feature 01)
3. **Banned Users** - Manage suspended accounts
4. **Admin Notes** - Internal communication (Feature 02)

**All Users Tab:**
- Search: Name, email, username, PRC license
- Filters: Role, verification status, tier, banned status, signup date, last active
- Table columns: Avatar, Name, Email, Role, Verification, Tier, Products, Sales, Joined, Status, Actions
- Bulk actions: Ban, Unban, Change tier, Export CSV
- **Instant actions with 10-second undo toast** (no confirmation dialogs)

**Verification Queue Tab:**
- Oldest first (FCFS fairness)
- Card-based layout (not table)
- Each card: User info, submitted timestamp, PRC license, expiry date, grace period, document preview, rejection count
- Quick actions: Approve (one-click), Reject (requires reason)
- **Unlimited resubmission attempts** (no 3-strike limit - seller-friendly)
- Email notifications: Immediate on approve/reject

**User Detail Modal (7 tabs):**
1. Overview (profile, stats, verification)
2. Products (all their products)
3. Orders (purchase history)
4. Sales (sales history if seller)
5. Reviews (given/received)
6. Activity Log (comprehensive audit trail)
7. Admin Notes (internal communication)

**Admin Notes System:**
- Shared across all admins (full transparency)
- @mention support (autocomplete)
- 500 char max per note
- Notes visible immediately to all admins
- Note types: General, Warning flag, VIP user, Quality concern, Follow-up needed

---

### 3. Product Moderation

**Tab Structure:**
1. **Pending Reviews** - First 3 products from new sellers (Feature 03)
2. **All Products** - Searchable database
3. **Suspended Products** - Taken down content
4. **Review History** - Audit log

**Pending Reviews Queue:**
- Oldest first (FCFS)
- Card-based layout (not table - needs preview)
- Priority badges: Orange if >24 hours, Red if >48 hours
- Target review time: 24-48 hours
- **Bulk approval available** for trusted sellers

**Product Preview Modal:**
- Two-column (70-30 split)
- Left: Cover image, preview images, **file list (downloadable for admin)**, full description
- Right: Product metadata, seller info, submission history, quality checks
- Actions: Approve & Publish, Reject Product, Request Changes

**Rejection Workflow:**
- Required reason (dropdown + custom text)
- **Unlimited resubmission attempts** (removed 3-strike rule)
- Email notification: Immediate with feedback
- Seller can edit and resubmit (no count limit)

**Quality Guidelines:**
- Visible to both sellers (before upload) and admins (review checklist)
- Link from Pending Reviews page
- Checklist: Cover quality, complete files, accurate description, educational content, no copyrighted material, virus-free, reasonable pricing, correct categorization

---

### 4. Content Moderation

**Tab Structure:**
1. **Flagged Reviews** - Feature 05 moderation queue
2. **User Reports** - Product/user reports
3. **Resolved Items** - History
4. **Moderation Stats** - Analytics

**Flagged Reviews Queue:**
- Severity levels: High (profanity, threats), Medium (spam, excessive caps), Low (mild)
- Auto-flagged: Profanity filter, spam patterns
- User-reported: **Reporter visible to admins** (accountability)
- Actions: Dismiss Flag, Delete Review
- **No Edit Review feature** (dismiss or delete only - keep it simple)

**User Reports Queue:**
- Report types: Products (inappropriate, copyright), Users (harassment, fraud, reselling), Reviews
- Severity: High (fraud, harassment), Medium (copyright, reselling), Low (wrong category)
- Escalation: 3+ reports → High Priority, Pioneer reports → Higher priority
- Response targets: High 4 hours, Medium 24 hours, Low 48 hours
- Actions: Dismiss, Warn User, Suspend/Ban, Contact Reporter

**Appeals Process:**
- **Formal 7-day window** to appeal
- Different admin reviews (not same one who made decision)
- Appeal submitted via support email
- Admin reviews: Can uphold or modify resolution
- Final decision: Platform decision is final

**Admin Notes:**
- Shared across all admins
- @mention support
- Used for collaboration

**Reporter Abuse:**
- Manual review only (no auto-restrict)
- Admin discretion to restrict

---

### 5. Pioneer Management

**Tab Structure:**
1. **Current Pioneers** - Manage existing 20
2. **Pioneer Candidates** - Track and invite
3. **Pioneer History & Analytics** - Performance

**Current Pioneers:**
- **20-slot maximum (hard limit - exclusive)**
- Pioneer card: Avatar, name, since date, performance metrics, commission saved
- **Standard commission: 15% for all Pioneers** (simple, fair, equal)
- Actions: View Profile, View Analytics, Edit Commission, Remove Pioneer

**Add Pioneer Workflow:**
- **Invite-only** (no applications - admin-curated quality)
- Search eligible sellers
- Quality indicators: Verified, no rejected products, no flags/reports, professional profile
- Minimum requirements: Verified, 5+ products, 4.0+ rating, active in 30 days, no violations
- **Can rejoin later if removed** (not permanent)
- Email invitation with benefits

**Remove Pioneer:**
- Reasons: Inactive (60+ days), Quality issues, Terms violation, Requested, Other
- Commission reverts to 20% immediately
- Pioneer badge removed
- Products remain live
- Email notification: Immediate

**Pioneer Benefits:**
- 15% commission (vs 20% standard)
- **Pro features free automatically** (no upgrade button shown to Pioneers)
- Pioneer badge on profile
- Priority support (8-hour response)

---

### 6. Financial Overview

**Tab Structure:**
1. **Revenue Overview** - Platform metrics and charts
2. **Withdrawal Requests** - Payout queue
3. **Payout History** - Completed withdrawals
4. **Financial Reports** - Exportable reports

**Revenue Overview:**
- 8 metric cards (2 rows of 4)
- Charts: Revenue Over Time, Revenue by Category, Top Sellers, Payment Method Split

**Withdrawal Requests:**
- **Manual processing only** (admin clicks "Process" - full control)
- **Super Admin access only** (Moderators cannot see financial data)
- Minimum withdrawal: Configurable (default ₱500)
- Process: Admin initiates → GCash/Maya API → Webhook confirms → Completed
- **Failed withdrawals: Manual retry only** (admin handles each failure)

**Financial Reports:**
- Revenue Report (sales, commission, profit by category/tier/payment method)
- Commission Report (commission by seller, Pioneer savings)
- Tax Report (BIR informational - raw data only, accountant handles)
- Seller Payout Report (earnings, payouts, transaction IDs)
- Payment Method Report (GCash vs Maya, success rates, fees)
- **Export formats: CSV, Excel, PDF**

---

### 7. System Announcements (Feature 06)

**Tab Structure:**
1. **Create Announcement** - Compose new
2. **All Announcements** - List, edit, schedule, stats
3. **Announcement Templates** - Reusable templates

**Create Announcement:**
- **Full rich text editor** (bold, italic, links, images)
- **Advanced segmentation** (custom filters: active sellers, specific grades/subjects, etc.)
- Delivery: In-App + Email (both required)
- **Respect email preferences** (users with email off: in-app only)
- Scheduling: Send immediately OR Schedule for later
- Display duration: 1/3/7/14/30 days or Never
- Priority: Normal, Important, Urgent

**Templates:**
- Variables: {{date}}, {{time}}, {{feature_name}}, {{promo_code}}, custom
- Reusable templates with variables
- Example: "Scheduled Maintenance - {{date}}"

**Announcement Stats:**
- Recipients, In-App Views, Email Opens, Link Clicks, Engagement Rate

---

### 8. Settings & Configuration

**Tab Structure:**
1. **Platform Settings** - Commission, pricing, rules
2. **Feature Flags** - Enable/disable features
3. **Email Settings** - SMTP, templates
4. **Payment Settings** - GCash, Maya
5. **System Status** - Maintenance, monitoring
6. **Admin Management** - Create admins, roles

**Platform Settings:**
- Commission: Standard 20%, Pioneer 15% (configurable)
- **Immediate effect** (no approval needed)
- Pricing: Min ₱50, Max ₱1,000 (configurable)
- Upload limits: 500 MB max, PDF/DOCX/PPTX/MP4/ZIP
- Moderation: First 3 products require review, **Unlimited resubmission attempts**
- Withdrawals: Min configurable (default ₱500)
- **Log everything in audit trail** (full accountability)

**Feature Flags:**
- Optional Features: Reviews, Follow, Wishlist, Social Sharing, Recently Viewed, Seller Dashboard, Advanced Analytics, Bulk Upload, Coupons, Referrals
- Beta Features: Enable for specific users (allowlist)
- Maintenance Mode: When ON, maintenance page to all except admins
- **Global only** (no per-tier flags)

**Email Settings:**
- Provider: Resend, SendGrid, AWS SES, Custom SMTP
- **Edit templates in admin panel** (no coding needed)
- Template editor: Subject, body (rich text), variables, preview, test send
- Statistics: Sent today/week, Open rate, Click rate, Failed sends

**System Status:**
- Maintenance mode toggle with custom message
- System health: Database, Storage, Email, Payment APIs, Cache
- Recent errors list
- Performance metrics: Response time, Query time, Uptime, Error rate
- Storage usage: 15 GB / 100 GB

---

### 9. Admin Roles & Permissions

**3 Roles:**

**Super Admin:**
- ✅ **Can do EVERYTHING** (no restrictions)
- Full financial access
- Process withdrawals
- Change commission rates
- Edit all settings
- Ban users (no approval)
- Manage Pioneers
- Create/delete admins
- Send urgent announcements
- **Minimum: 1 (you) | Maximum: 2-3**

**Moderator:**
- ✅ View Dashboard (basic metrics, **no financials**)
- ✅ View all Users (read-only)
- ✅ Approve/reject verifications, products, reviews
- ✅ Resolve user reports (warn only, **suspend/ban requires Super Admin approval**)
- ✅ Create basic announcements (Normal priority only)
- ✅ View own audit log
- ⚠️ **Requires approval**: Ban users, Suspend products, Resolve with bans
- ❌ **No access**: Financials, Settings, Pioneer management, Urgent announcements
- **Minimum: 0 | Maximum: 5**

**Content Manager:**
- ✅ View Dashboard (basic metrics only)
- ✅ View Users, Products (read-only)
- ✅ Approve/reject verifications, products, reviews
- ✅ Resolve user reports (warn only, **no suspensions/bans**)
- ✅ Create basic announcements (Normal priority only)
- ✅ View own audit log
- ❌ **No access**: Financials, Settings, Pioneer management, Bans, Suspensions, Urgent announcements
- **Minimum: 0 | Maximum: 10**

**Approval Workflow (Restricted Actions):**
- Moderator clicks restricted action
- Modal: "Requires Super Admin approval"
- Provide: Reason, Evidence, Request approval from [Super Admin]
- Super Admin: Approve (performs action) or Deny
- All requests logged (even if denied)

**Admin Account Creation:**
- **Invite-only** (Super Admin creates all admins - no self-service signup)
- Roles: Super Admin, Moderator, Content Manager
- Welcome email with admin guide

**Session Management:**
- **4-hour timeout** (balance security vs convenience)
- Require re-auth for sensitive actions
- Device tracking, remote logout
- **Cannot self-demote** (another Super Admin must do it)
- **"View as User" toggle** (quick testing, no logout)

**Audit Logging:**
- EVERY admin action logged
- Each admin sees OWN log
- Super Admin sees ALL logs
- Filters: Admin, Action, Target, Date

---

### 10. Search & Discovery Admin Tools (Feature 08)

**Tab Structure:**
1. **Search Analytics** - What users search for
2. **Popular Searches** - Trending terms
3. **Category Management** - Manage category pages
4. **SEO Tools** - Platform-wide SEO

**Search Analytics:**
- Top metrics: Total searches, Unique terms, Zero results, Avg results, CTR
- Charts: Search volume over time, Top search terms (with CTR color coding), Searches by category, Search funnel
- **Zero Results Report**: Identifies content gaps, Suggested actions
- **Email alerts** when term has 50+ zero-result searches

**Category Management:**
- List all category pages with URLs
- **Both custom and system categories** (full flexibility)
- Edit category: Name, URL slug, SEO (meta title/description), Hero image
- **Featured products: Auto-selected by algorithm** (top performers)
- Display settings: Show on homepage, Sort by, Which filters to show

**SEO Tools:**
- Platform-wide SEO settings (name, tagline, homepage title/description)
- Sitemap management (auto-generated, regenerate button)
- Canonical URLs, Robots.txt editor
- Schema.org markup (Product, Organization, Breadcrumb, Seller)
- **Product-level SEO editing** (admins can override product metadata)

**Access:**
- Super Admin + Moderator
- Real-time analytics (few admins = no performance issue)
- **Full export** (CSV/Excel/PDF)

---

### 11. Data & Analytics Dashboard

**Tab Structure:**
1. **Platform Growth** - User acquisition, retention, churn
2. **Seller Performance** - Seller health, top performers
3. **Product Insights** - Best-selling products, categories
4. **Buyer Behavior** - Purchase patterns, funnels
5. **Geographic Data** - Users by region

**Platform Growth:**
- Metric cards: Total users, New signups, Seller conversion rate, Active users (DAU/MAU), Retention rate, Churn rate, Session duration, Bounce rate
- Charts: User growth over time, Signup sources, Conversion funnel, Retention cohorts (heat map)

**Seller Performance:**
- Metric cards: Total sellers, Active sellers, Top sellers, Inactive sellers, Avg revenue, Pioneer vs Standard
- Charts: Performance distribution, Pioneer vs Standard comparison, Top 10 sellers, Tier distribution
- Seller Leaderboard (table): Rank, Seller, Tier, Products, Sales, Revenue, Rating, Growth
- **Show own rank** + top 10 (personalized: "You're #45 of 500 sellers")

**Product Insights:**
- Metric cards: Total products, Published, Avg per seller, Best-selling category, Avg price, Approval rate
- Charts: Sales by type, Sales by grade, Sales by subject, Price distribution
- Top Products table

**Buyer Behavior:**
- Metric cards: Total buyers, Repeat buyers, Avg order value, Products per order, Cart abandonment, Review rate
- Charts: Purchase funnel, Traffic sources, Purchase by day, Repeat purchase timeline

**Geographic Data:**
- Philippines map with region shading
- Region breakdown table: NCR (40%), Calabarzon (15%), Central Luzon (10%), etc.

**Data Strategy:**
- **Real-time** (few admins = no issue)
- **1-year retention** (balance storage vs insights)
- **Full export** (CSV/Excel/PDF for all data)

---

### 12. Admin Support & Communication

**Tab Structure:**
1. **Admin Notes** - Internal communication
2. **Support Tickets** - Email only (users email support@)
3. **Dispute Resolution** - Formal mediation
4. **Admin Activity Log** - Audit trail

**Admin Notes:**
- Search users/products
- Filters: @mentions, By you, Recent
- Cards show entity + all notes (chronological)
- Add Note Modal: Note type, Text (500 chars), Priority
- **Immediate visibility to all admins** (full transparency)
- @mention sends notification

**Support Tickets:**
- **Email-only support** (users email support@akomaylessonplanna.com)
- Admins create tickets manually from emails
- Ticket types: Technical, Billing, Content, Account
- Ticket conversation thread (public replies + internal notes)
- Workflows: Troubleshoot, Verify & Process, Review & Mediate, Verify & Change

**Dispute Resolution:**
- Types: Product quality, Payment, Copyright, Harassment
- Severity: High, Medium, Low
- **Max timeline: 7 days** for final decision
- Resolution workflow: Propose → 48hr to accept → If objection → Continue → Final decision
- **Formal 7-day appeal** to different admin
- Admin can propose: Full/partial refund, Product replacement, Take down, Ban user
- Final decision: Binding, implementation via API

**Admin Activity Log:**
- Every admin action logged (timestamp, admin, action, target, changes, reason, IP)
- Filters: Admin, Action, Target, Date, Keywords
- **1-year retention**
- Export: CSV

**Real-Time Admin Chat:**
- **External tool only** (Slack or Discord)
- Don't build internal chat system
- Admins communicate in real-time via external platform

---

### 13. Mobile Admin Experience

**Current Scope (MVP): Responsive Design**

**Works on Mobile:**
- Admin panel loads (no broken layout)
- Dashboard metrics viewable (cards stack)
- Lists browsable (tables scroll horizontally)
- Sidebar becomes hamburger menu
- Basic actions work

**Awkward but Acceptable:**
- Tables require horizontal scrolling
- Modals small (may need zooming)
- Buttons < 44px (but usable)
- Desktop-first layout (shrunk down)

**Deferred to Phase 2 (3-6 months after launch):**
- Mobile-optimized navigation
- Card-based queues with swipe gestures
- Push notifications
- Touch actions (44x44px targets)
- Offline mode
- Quick actions (one-tap approve)

**Responsive Breakpoints:**
- Desktop (1280px+): Full sidebar, 4-column cards, large modals
- Tablet (768-1279px): Collapsible sidebar, 2-3 column cards, medium modals
- Mobile (<768px): Hamburger menu, single-column cards, full-width modals, 32x32px buttons

**Tablet Treatment:**
- **Tablets as small desktops** (no tablet-specific optimizations)

**Mobile Quality:**
- **Must be usable** (basic tasks work, nothing broken)

**Revisit:**
- **Phase 2** (3-6 months after launch)

---

### Database Tables (Admin Panel)

**New Tables:**
1. **announcements** - System announcements
2. **announcement_stats** - Announcement performance
3. **categories** - Category pages management
4. **support_tickets** - Support requests
5. **ticket_messages** - Support conversation
6. **disputes** - Dispute resolution

**Enhanced Tables:**
- **users** - Add `admin_role` ENUM

**Existing Tables Used:**
- All tables from Features 01-08
- audit_log, admin_notes (Feature 02)
- teacher_id_verifications (Feature 01)
- reviews, review_flags (Feature 05)
- reports (new)
- products, orders, withdrawal_requests (Features 03-04)
- notifications, messages (Feature 06)
- search_queries, search_analytics (Feature 08)

---

### Admin Panel - Feature 09 ✅

---

## Onboarding Flows

### Seller Onboarding

**Step 1: Sign Up**
- Name, email, password
- Accept Terms of Service
- Accept Seller Agreement
- Social login (Google/Facebook)

**Step 2: Teacher Verification**
- Upload teacher ID (PDF, JPG, PNG)
- 24-48 hour review time
- Can't sell until verified
- Can skip and do later

**Step 3: Complete Profile**
- Profile picture
- Bio (teaching experience)
- Subjects taught
- Grade levels
- Custom banner (Pro/Pioneer)

**Step 4: First Product Upload**
- Guided upload
- Title, description, price
- Files upload
- Pricing tips (₱100-₱500)
- Can skip for later

**Step 5: Welcome Dashboard**
- Account under review notification
- Upload more products while waiting
- Browse other products
- Pending review status

### Buyer Onboarding

**Step 1: Sign Up**
- Simple registration
- Social login prominent
- Value proposition clear

**Step 2: Welcome Tour (Optional)**
- Browse Products
- My Library
- Wishlist
- Can skip tour

**Step 3: Browse & Discover**
- Search functionality
- Categories
- Popular products
- Featured products

### Progressive Profiling

- Don't ask for everything at once
- Collect basic info first
- Details later
- Non-essential steps skippable
- Tooltips and hints

### Email Welcome Sequence

**Email 1 (Immediate):** Welcome + getting started
**Email 2 (24 hours):** Tips for first upload/sale
**Email 3 (3 days):** Optimize listings
**Email 4 (7 days):** Community resources

---

## Customer Support

### Support Channels

**1. Contact Support Form**
- Topic selection
- Order ID
- Description
- Attachments
- Response: 24-48 hours

**2. Live Chat (Pro users only)**
- Real-time messaging
- 4-hour response
- Chat history saved

**3. Email Support**
- General: support@akomaylessonplanna.com
- Abuse: abuse@akomaylessonplanna.com
- Partners: partners@akomaylessonplanna.com

### Support Tiers

**Free Users:**
- Email only
- 48-hour response

**Pro Users:**
- Priority email (12 hours)
- Live chat (4 hours)

**Pioneer Users:**
- Priority email (8 hours)
- Live chat (2 hours)
- Direct founder access (critical issues)

### Common Issues

**Can't download:**
- Verify payment
- Check library access
- Check login status
- Clear cache
- Escalate if persists

**Payment failed:**
- Check GCash/Maya status
- Verify sufficient funds
- Retry payment
- Contact provider

**Product quality issues:**
- Get details from buyer
- Contact seller
- Offer options (refund, fix, partial refund)
- Mediate if needed

### Admin Support Dashboard

**Metrics:**
- Open tickets by priority
- Today's new tickets
- Average response time

**Ticket Management:**
- Assign to team members
- Set priorities
- Canned responses
- Internal notes
- Reopen closed tickets

---

## Legal Documents

### Terms of Service (Key Clauses)

**1. Acceptance**
- Must be 18+ to sell
- Teachers under 18 need parent permission to buy

**2. Account Responsibilities**
- Account security
- Accurate information
- One account per person

**3. Seller Obligations**
- Must be verified teacher
- Own content rights
- Appropriate content only
- Platform license to display/sell
- Can remove content anytime

**4. Buyer Rights**
- Personal/classroom use only
- Cannot resell or redistribute
- Violation = account ban

**5. Platform Fees**
- 20% commission (15% Pioneers)
- Can change with 30-day notice
- No listing fees

**6. Payment Terms**
- GCash/Maya only
- Earnings available after download
- Minimum withdrawal: ₱500
- 5-7 business days processing

**7. Refund Policy**
- All sales final (digital goods)
- Exceptions: defective products
- Case-by-case review
- Seller can approve refund

**8. Prohibited Activities**
- Inappropriate content
- Reselling purchases
- Multiple accounts
- Fraud
- Harassment
- Illegal activities

**9. Content Moderation**
- First 3 products reviewed
- Right to remove content
- Can suspend/ban accounts

**10. Limitation of Liability**
- Platform "as is"
- Not responsible for quality, disputes
- Max liability: amount paid in 12 months

**11. Termination**
- Can terminate for violations
- Can delete account anytime
- Outstanding payments within 30 days
- Banned users forfeit earnings

**12. Dispute Resolution**
- Platform mediates
- Final decision with platform
- Philippine courts jurisdiction

### Privacy Policy

**Information Collected:**
- Account: Name, email, phone, GCash/Maya
- Verification: Teacher ID
- Payment: GCash/Maya numbers (encrypted)
- Usage: Pages visited, products viewed
- Transactions: Purchases, sales, earnings

**How It's Used:**
- Process transactions
- Verify credentials
- Send notifications
- Improve features
- Prevent fraud
- Legal compliance

**Information Sharing:**
- DON'T sell data
- Share with: GCash/Maya, service providers, law enforcement
- Never share for marketing

**Data Security:**
- Encryption at rest and in transit
- Secure payment processing
- Restricted access
- Regular security audits

**Your Rights (DPA Compliant):**
- Right to know what's collected
- Right to access
- Right to correct
- Right to delete
- Right to object
- Right to file NPC complaint

**Data Retention:**
- Active: While account exists
- Transaction: 7 years (tax)
- Teacher IDs: Deleted after verification or deletion
- Deleted accounts: Anonymized within 30 days

### Seller Agreement

**1. Eligibility**
- Licensed Philippine teacher
- Valid teacher ID
- 18+ years old

**2. Content Ownership**
- You own all rights
- Original work or permission
- Not plagiarized
- Third-party copyright free

**3. Content Standards**
- Educational and appropriate
- No offensive/illegal content
- Accurate descriptions
- Virus-free files

**4. Pricing & Earnings**
- You set prices
- 20% commission (15% Pioneers)
- Tracked in dashboard
- Min withdrawal: ₱500

**5. Taxes**
- You declare income
- Platform issues statements
- Withholding may apply

**6. Platform Rights**
- License to display/market/sell
- Right to review and moderate
- Can remove violating content

**7. Responsibilities**
- Keep products updated
- Respond to questions
- Deliver quality
- Professional conduct

**8. Termination**
- Can stop selling anytime
- Platform can suspend for violations
- Banned = forfeited earnings

---

## Dispute Resolution

### Dispute Types

**Type 1: Product Quality Issues**
- Buyer claims product doesn't match description
- Platform notifies seller (48-hour response)
- Seller responds: clarify, fix, refund, or dispute
- Platform mediates if disputed
- Resolutions: full refund, partial refund, fix, or no action

**Type 2: Payment Issues**
- Buyer charged but no product
- Or seller not paid
- Platform investigates (GCash/Maya, logs)
- Resolution: grant access, cancel order, or wait 24 hours

**Type 3: Copyright/Plagiarism**
- Original author reports infringement
- Platform reviews evidence
- Valid claim: Remove product, notify seller, option to appeal
- Invalid claim: Dismiss report
- Repeat offender: Permanent ban, forfeit earnings

**Type 4: Harassment/Abuse**
- User reports inappropriate behavior
- Platform reviews evidence
- Minor: Warning
- Moderate: 7-day suspension
- Severe: Immediate permanent ban
- Report to authorities if needed

### Timelines

**Standard disputes:**
- Initial response: 24 hours
- Seller response: 48 hours
- Platform investigation: 3-5 business days
- Total: Within 7 days

**Urgent (payment, harassment):**
- Initial: 12 hours
- Investigation: 24-48 hours
- Total: Within 3 days

**Complex (copyright, fraud):**
- Initial: 24 hours
- Investigation: 7-14 business days
- Total: Within 21 days

### Appeals Process

**Submit appeal:**
- Explain why unfair
- Provide evidence
- Within 7 days of resolution

**Platform review:**
- Different moderator
- May interview both parties
- 3-5 business days

**Final decision:**
- Can uphold original
- Can modify resolution
- Platform decision is final

### Refund Process

1. Platform initiates refund via GCash/Maya
2. Buyer receives in 5-7 business days
3. Product access revoked immediately
4. Seller notified
5. Commission returned to seller (if applicable)

---

## Analytics & KPIs

### Platform Metrics (Founder Dashboard)

**Growth Metrics:**
- Total users (sellers, buyers)
- Total products listed
- Daily/weekly/monthly signups
- Week-over-week growth rates

**Financial KPIs:**
- Total revenue (all-time, monthly)
- Commission collected
- Net profit (revenue - costs)
- Average order value
- Revenue per seller
- Revenue growth rate

**User Acquisition:**
- New signups per day/week/month
- Signup conversion rate
- Seller conversion rate
- Buyer conversion rate
- Traffic sources
- Cost per acquisition (if paid ads)

**Engagement Metrics:**
- Daily Active Users (DAU)
- Monthly Active Users (MAU)
- DAU/MAU ratio (target: 20%+)
- Session duration
- Pages per session
- Bounce rate (target: <50%)

**Marketplace Health:**
- Products sold (all-time)
- Sell-through rate (30%+ target)
- Active sellers (sold in 30 days)
- Inactive sellers (no sales in 60+ days)
- Product reviews and ratings

**Payment Metrics:**
- Successful payments (95%+ target)
- Failed payments and reasons
- Payment method split (GCash vs Maya)
- Withdrawal requests (pending, processing, completed)
- Average withdrawal amount

### Seller Analytics (Dashboard)

**Basic (Free Tier):**
- Total sales (count)
- Total revenue
- Commission paid
- Net earnings
- Recent orders

**Advanced (Pro/Pioneer):**
- Revenue charts (daily, weekly, monthly)
- Sales by product
- Sales by subject
- Sales by grade level
- Revenue trends
- Product performance table
- Conversion rates (view-to-purchase)
- Buyer demographics
- Repeat purchase rate
- Pricing analytics
- Top buyers
- Referral traffic

**Performance Alerts:**
- Sales increased/decreased
- Views dropped
- New reviews received
- Reached milestones
- Optimization suggestions

### Buyer Analytics

- Total spent
- Products purchased
- Download count
- Average purchase amount
- Browsing behavior
- Recommendations

---

## SEO & Discovery

*(Enhanced by Feature 08: Advanced Search & Discovery)*

### Target Keywords

**Primary (High Volume):**
- "lesson plans Philippines"
- "teacher resources Philippines"
- "Filipino lesson plans"
- "educational materials Philippines"
- "teaching resources Philippines"

**Secondary (Specific):**
- "Grade 7 lesson plans Philippines"
- "Math lesson plans Philippines"
- "Science lesson plans Philippines"
- "English lesson plans Philippines"
- "Filipino lesson plans"
- "Araling Panlipunan lesson plans"
- "MAPEH lesson plans"

**Long-Tail (High Intent):**
- "where to buy lesson plans in Philippines"
- "sell lesson plans online Philippines"
- "download lesson plans Philippines"
- "teacher worksheets Philippines"

### On-Page SEO

**Title Tags & Meta Descriptions:**
- Homepage: "AKOMAYLESSONPLANNA - Quality Lesson Plans from Filipino Teachers"
- Categories: "Grade 7 Lesson Plans | AKOMAYLESSONPLANNA" (dynamic)
- Products: "{Product Title} by {Seller Name} | AKOMAYLESSONPLANNA" (dynamic)
- Sellers: "{Seller Name} | AKOMAYLESSONPLANNA" (dynamic)

**Content Strategy:**
- Blog posts for SEO
- Educational content
- Buyer guides
- Seller tips
- Platform updates

### Technical SEO

**Site Structure:**
- Clear hierarchy
- XML sitemap (auto-generated: products, sellers, categories)
- Schema.org markup (Product, Seller, Organization, Breadcrumb)
- Canonical URLs (prevent duplicate content)

**URL Structure (SEO-Friendly):**
- Product detail: `/products/dll-grade-7-math-q1-weeks-1-3-[id]`
- Category pages: `/products/lesson-plans`, `/products/grade-7-math`
- Seller profiles: `/sellers/[username]`
- Slugs: Auto-generated from titles, editable by sellers

**Page Speed Optimization:**
- Lazy loading (Next.js Image component)
- Image compression (WebP format, progressive loading)
- Minification (automatic)
- Multi-layer caching (Redis + Edge + CDN)
- Target: LCP < 2.5s, FID < 100ms, CLS < 0.1

### Content Marketing

**Blog Topics:**
- How to create effective lesson plans
- Best resources for Filipino teachers
- Where to find lesson plans
- Teaching Math in Philippines
- Supplement teaching income

**Social Media:**
- Facebook teacher groups
- Instagram teacher content
- TikTok educational videos
- YouTube tutorials

### Link Building

- Guest posts on education blogs
- Teacher organization partnerships
- Educational directories
- Teacher forums (helpful posts)
- Original research

### Discovery Strategies

**For Buyers:**
- Google search (SEO) - *Category pages rank for keywords*
- Facebook groups
- Word of mouth
- Social media
- Influencer partnerships
- Paid ads (if budget)

**For Sellers:**
- Direct outreach
- Pioneer program
- Teacher organizations
- Success stories
- Incentives
- Educational content

### Referral Program

**Seller Referrals:**
- Refer seller → 5% bonus on first 10 sales
- Pioneer badge + lower commission for top referrers

**Buyer Referrals:**
- Refer buyer → ₱50 credit after first purchase
- Referred buyer gets ₱25 credit

### Search Performance & Accessibility

**Search Speed:**
- Target: < 500ms for 95% of searches
- Cache hit (popular): 30ms
- Cache hit (regular): 50ms
- Cache miss (DB): 300-500ms

**Scalability:**
- PostgreSQL handles 10,000-50,000 products easily
- Clear upgrade path to Elasticsearch at 100,000+ products
- No external search engine needed for MVP (saves $300-1,000/month)

**Mobile Experience:**
- 70%+ Filipino users on mobile
- Sticky search bar (always visible)
- Full-screen filter drawer
- Touch targets: 44×44px minimum
- Lazy loading for 75% faster loads

---

## Launch Strategy

### Pre-Launch Phase (4-6 weeks)

**Week 1-2: Foundation & Content**
- Complete MVP development
- Set up analytics
- Create social media accounts
- Build landing page
- Write 5-10 blog posts
- Set up help docs
- Test all features

**Week 3-4: Pioneer Recruitment**
- Identify 20 target teachers
- Create outreach message
- DM potential Pioneers
  - Facebook groups
  - Instagram
  - Existing marketplaces
- Get 10-15 commitments
- Onboard Pioneers (early access)
- Help upload 5-10 products each

**Week 5-6: Marketing & Testing**
- Pioneers test and give feedback
- Fix critical bugs
- Create launch graphics
- Prepare social content
- Write press release
- Set up email automation
- Final testing

### Launch Day Checklist

**Technical:**
- ✅ Domain configured
- ✅ SSL active
- ✅ Email working
- ✅ Payments tested
- ✅ Database backups
- ✅ Error tracking
- ✅ Analytics verified
- ✅ 50-100 products ready
- ✅ Load testing done

**Content:**
- ✅ Homepage complete
- ✅ About page
- ✅ Terms published
- ✅ Privacy policy
- ✅ Help articles (10-15)
- ✅ Blog posts (5-10)
- ✅ Social profiles complete

**Outreach:**
- ✅ Email list ready
- ✅ Pioneer announcements
- ✅ Facebook groups identified
- ✅ Influencer contacts

### Launch Week Strategy

**Day 1 (Launch Day):**
- 🚀 Go live
- 📧 Launch email to list
- 📱 Social announcements
- 💬 5-10 Facebook groups
- 👉 Pioneers share
- 📢 Ask Pioneers to post

**Day 2-3:**
- Monitor and fix issues
- Respond to comments
- Share behind-the-scenes
- Highlight first sales
- Publish blog post

**Day 4-5:**
- Showcase Pioneers
- Share tips
- Share testimonials
- Launch promo (10% off)

**Day 6-7:**
- Share Week 1 stats
- Feature top products
- Celebrate milestones
- Weekly recap email

### Post-Launch (Weeks 2-4)

**Week 2:** Engagement & trust building
**Week 3:** Growth (referral program, content, contests)
**Week 4:** Stabilization (review metrics, double down on what works)

### Launch Month Targets

**Week 1:**
- 100 signups
- 20 verified sellers
- 100 products
- 50 purchases
- ₱5,000+ sales

**Month 1:**
- 500 signups
- 50 verified sellers
- 300 products
- 200 purchases
- ₱25,000+ sales

**Month 3:**
- 2,000 signups
- 150 verified sellers
- 1,000 products
- 1,000 purchases
- ₱100,000+ sales

### Risk Mitigation

**Technical issues:**
- 2 developers on call
- Rollback plan ready
- Status page for users
- Communication plan

**Low sales:**
- Pioneer incentives
- Price adjustments
- More promotional content
- Direct outreach

**Seller churn:**
- Quick feedback loops
- Better onboarding
- Success stories
- Direct support

**Payment issues:**
- Test extensively
- Backup manual option
- Clear communication
- Close GCash/Maya contact

---

## Development Roadmap

### Phase 1: Foundation (Weeks 1-8)

**Week 1-2: Project Setup & Database**
- Set up Next.js 14 + TypeScript
- Initialize Supabase
- Create database schema
- Configure RLS
- Set up environment variables
- Create Git repo
- Configure Vercel

**Week 3-4: Authentication & User System**
- Email/password auth (Supabase)
- Google OAuth
- Facebook OAuth
- User profiles
- Teacher ID upload
- Verification workflow
- Protected routes

**Week 5-6: Core Product Features**
- Product upload (single files)
- File upload to Supabase Storage
- Product detail pages
- Edit/delete products
- Draft/published status
- Preview generation
- Categorization
- Basic search

**Week 7-8: Basic Shopping Experience**
- Product listing page
- Shopping cart
- Checkout page
- Order creation
- Basic UI components
- Mobile-responsive design

### Phase 2: Payments & Library (Weeks 9-12)

**Week 9: GCash Integration**
- Apply for developer account
- Implement payment flow
- Webhook handling
- Error handling
- Sandbox testing

**Week 10: Maya Integration**
- Apply for business account
- Implement payment flow
- Webhook handling
- Sandbox testing

**Week 11: User Library & Downloads**
- Order completion
- User library
- Watermarking implementation
- Download endpoint
- Progress indicator
- Purchase history

**Week 12: Testing & Bug Fixes**
- E2E payment testing
- Watermarking testing
- Load testing
- Security audit
- Bug fixes
- Performance optimization

### Phase 3: Enhanced Features (Weeks 13-16)

**Week 13: Reviews & Ratings** (Feature 05 - COMPLETED ✅)
- 5-star rating system (simple scale)
- Review eligibility: after download only
- Rating required, comment optional (500 char max)
- Seller responses (500 char limit, one-level chain only)
- Top 3 recent reviews + "See all" link
- Review summary card (avg + distribution chart)
- Automatic flagging system (profanity, spam patterns)
- Admin moderation queue (hidden immediately)
- 7-day edit window (no deletion), "Edited" timestamp
- Single 24h reminder email (no incentives)
- Seller reputation: simple average calculation
- Enhanced analytics for Pro/Pioneer (distribution, keywords, trends)
- Reviews on seller profile (hybrid with product links)
- Trust-based approach (no rate limiting)
- Mobile-first responsive design

**Week 14: Social Features** (Feature 06 - COMPLETED ✅)
- In-app notifications (bell icon + dropdown + notifications page)
- Email notifications (8 types: sales, reviews, followers, approvals, rejections, price drops, new products, announcements)
- Simple on/off toggle for email notifications
- Admin panel for system announcements
- Social sharing: Facebook, Messenger, Copy Link
- Share tracking analytics
- Recently viewed items (homepage section, sidebar, dedicated page)
- Social proof elements (static badges: Trending, Bestseller, Popular, New)
- View counts, sales counts, wishlist counts
- Mobile-first responsive design

**Week 15: Seller Dashboard** (Feature 07 - COMPLETED ✅)
- **Dashboard Overview:** Balanced layout with 4 metric cards (Revenue, Sales, Views, Rating)
  - Time range selector: Today | This Week | This Month | All Time | Custom
  - Sparkline indicators (Free tier) or interactive charts (Pro/Pioneer)
  - Recent activity feed (sales + reviews + followers combined)
  - Quick action buttons: Upload Product, View Orders, Request Withdrawal
- **Product Management:** Grid view with quick actions
  - 2/3/4 column responsive grid (2 columns on mobile)
  - View toggle: Grid | List
  - Product cards with stats: Views, Sales, Rating, Conversion rate
  - Bulk actions: Unpublish, Delete (checkbox selection)
  - Duplicate product feature (create similar products faster)
  - Performance indicators (Pro/Pioneer): Trending, Low conversion warnings
- **Order History:** Enhanced with geographic insights
  - Orders table: Order ID, Date, Product, Buyer (anonymized), Location (region), Price, Commission, Net Earnings, Payment Method, Status, Download count
  - Order detail modal with full breakdown
  - Filters: Status, Date range, Product, Location
  - Export to CSV (tax purposes)
  - "Contact Buyer" button (integration for Feature 14)
- **Earnings & Payouts:** Split by tier
  - **Free tier:** 3 cards (Available, Pending, Lifetime), Withdrawal history table, Commission reminder
  - **Pro/Pioneer tier:** Everything in Free + Interactive charts (Revenue by Month, Sales by Category, Earnings Trend), Projected earnings, Monthly PDF reports
  - Withdrawal request: ₱500 minimum, GCash/Maya selection, Automatic processing via Disbursement API
  - Withdrawal history: Date, Amount, Method, Status
- **Analytics Tiers - CRITICAL for subscriptions:**
  - **Free tier:** Per-product metrics in table format, Time period filters, Sparkline trend indicators (📈 +15%), Export to CSV
  - **Pro/Pioneer tier:** ALL Free features + Interactive visual charts (Revenue over time, Sales by product, Conversion funnel, Traffic sources, Buyer demographics), Performance score (0-100), Percentile rankings (top 20%), Performance recommendations, Export to Excel/PDF, Scheduled reports (email weekly/monthly)
- **Performance Metrics:** 6 core metrics (Free) to 15+ metrics (Pro/Pioneer)
  - Free: Revenue, Net Earnings, Orders, Products, Rating, Views, Conversion rate
  - Pro/Pioneer: + Repeat customer rate, Average order value, Response time, Follower count, Wishlist adds, Profile views, Traffic sources, Active products, Percentile rankings
- **Navigation:** Sidebar (desktop) with sections: Overview, Products, Orders, Earnings, Analytics (Pro badge), Reviews, Messages, Settings; Bottom tab bar (mobile, PWA style): Home, Products, Orders, Earnings, Profile
- **Data Strategy:** Smart hybrid approach
  - Dashboard metrics: 15-minute cache
  - Orders list: 5-minute cache
  - Real-time push notifications (from Feature 06): "You made a sale! 🎉"
  - "Refresh" button + pull-to-refresh (mobile)
  - Pre-calculated heavy analytics (nightly)
- **Mobile Experience:** Full dashboard mobile (not simplified)
  - Bottom tab bar navigation (5 icons)
  - Metric cards stacked vertically
  - Products grid: 2 columns (user's choice, modern phones)
  - Charts: Tap to expand fullscreen (interactive for Pro/Pioneer)
  - Swipe actions on products/orders
  - Pull-to-refresh on all pages
  - Bottom sheets for quick actions
- **Export & Reports:** Split by tier
  - **Free tier:** Order history, Product list, Earnings reports (CSV only, custom date range)
  - **Pro/Pioneer tier:** Everything in Free + Excel (.xlsx) with formatting, PDF reports with charts, Monthly performance summary (beautiful PDF), Scheduled reports (email weekly/monthly automatically), Export formats: CSV, Excel, PDF

**Week 16: Search & Discovery** (Feature 08 - COMPLETED ✅)
- **Search Algorithm:** PostgreSQL full-text search with weighted relevance (40% text match, 25% sales, 20% rating, 10% recency, 5% seller reputation)
  - `pg_trgm` extension for fuzzy matching (typos/misspellings)
  - No external search engine needed (saves $300-1,000/month)
  - Sub-500ms response times with proper indexing
  - Handles 10,000-50,000 products easily
- **Search Autocomplete:** 8 suggestions max (3 product titles, 2 subjects, 2 seller names, 1 popular search)
- **Search History:** Saves last 10 searches per user, "Recent searches" dropdown, "Popular searches this week" section
- **Advanced Search Operators:** Filters only, no advanced syntax (SIMPLE over complex)
  - AND logic (match ALL filters)
  - Saved searches (Pro/Pioneer): Up to 10 saved searches
- **Search Results Page:** Grid + list toggle, 24 per page (desktop), 20 per page (mobile)
  - Sort options: Relevance, Newest, Best Selling, Price (low-high, high-low), Highest Rated, Most Viewed, Trending
  - "Load More" button pagination (not infinite scroll)
  - "No results" behavior: Helpful message + alternative content (Popular in [category], Recommended, New Arrivals)
  - "Did you mean?" suggestions for misspellings
- **Filter System:** 11 filters total (8 from Feature 03 + 3 new)
  - New filters: Seller Verification Status, Date Added (7/30/90 days), Language (English/Filipino/Bilingual)
  - Filter counts shown per option ("Math (124)")
  - Active filters as removable chips with "Clear all filters" button
  - Collapsible sections, mobile filter drawer (full-screen, slide-out)
- **Category Pages:** Dedicated pages with hero + filtered products
  - URL pattern: /products/lesson-plans, /products/grade-7-math
  - Tabs + breadcrumbs navigation
  - Category-specific filters (hide irrelevant filters)
  - Featured category pages for high-traffic (Grade 7, Lesson Plans)
  - Mobile category navigation (5 large cards at bottom of homepage)
- **Product Recommendations:** Multi-strategy approach
  - "Related Products" on product detail page (8 products: 70% same grade/subject, 30% same seller)
  - "You Might Also Like" on homepage (Free: recently viewed + wishlist; Pro/Pioneer: purchase + browse + profile)
  - "Similar Products" on search results fallback (< 5 exact results)
  - "New from Sellers You Follow" on dashboard
  - "Teachers Who Bought This Also Bought" DEFERRED to Phase 2
- **Search Analytics for Sellers:** Tiered (Free vs Pro/Pioneer)
  - **Free:** Search terms report (top 10), average ranking position, search performance chart (basic)
  - **Pro/Pioneer:** Keyword insights, competitor comparison (anonymized), search trend analysis, keyword opportunity report, search performance score (0-100)
  - Privacy: No individual user data, no exact seller names
- **SEO & Discoverability:** Comprehensive strategy
  - SEO-friendly URLs with slugs: /products/dll-grade-7-math-q1-weeks-1-3-[id]
  - Dynamic meta tags (title, description, Open Graph, Twitter cards)
  - Schema.org structured data (Product, Seller, Organization, Breadcrumb)
  - Auto-generated XML sitemap (products, sellers, categories)
  - Canonical URLs, robots.txt
  - Category page optimization (unique meta per category)
  - Image SEO (alt text, file names)
  - Core Web Vitals optimization (LCP < 2.5s, FID < 100ms, CLS < 0.1)
  - Internal linking strategy
- **Search Performance & Caching:** Multi-layer strategy
  - Search results cache: 1 minute (Redis) - 50ms response time
  - Popular searches: Top 100 pre-computed, cached 5 minutes - 30ms response time
  - Cache miss: 300-500ms (database query with proper indexing)
  - Target: < 500ms for 95% of searches
  - Database indexes: Full-text search, grade/subject, product type, sort options, price
  - Query optimization: PostgreSQL full-text search (not LIKE queries)
  - Cache warming: On product publish, scheduled nightly (top 100 searches, categories, sellers)
  - Edge caching: Vercel Edge Network for HTML (10ms)
  - Monitoring: Search performance tracking, alerting for slow searches (> 1s)
- **Mobile Search Experience:** Mobile-first design (70%+ Filipino users)
  - Sticky search bar (always visible at top, 56px height)
  - Search suggestions: Slide-up bottom sheet (10 max), swipe down to dismiss
  - Filter drawer: Full-screen slide-out, collapsible sections, "Show Results" sticky button
  - Swipe gestures: Right to open filters, down to close suggestions, pull-to-refresh
  - Touch targets: 44×44px minimum (all interactive elements)
  - Mobile keyboard: Search button (auto-submit), autoCorrect off, spellCheck off
  - 2-column grid results, "Load More" button (not infinite scroll)
  - Lazy loading: Next.js Image with loading="lazy" (75% faster mobile loads)
  - PWA features: Full-screen mode, home screen icon, offline search history

### Phase 4: Admin & Pioneer (Weeks 17-20)

**Week 17: Admin - User Management**
- Admin auth
- User list
- Edit tiers/commissions
- Ban/unban
- Verification queue
- Activity logs

**Week 18: Admin - Content Moderation**
- Pending reviews queue
- Approval workflow
- Report management
- Resolve reports
- Ban violators

**Week 19: Pioneer System**
- Pioneer tier
- 15% commission
- 20 max slots
- Pioneer badge
- Admin management

**Week 20: Admin Dashboard**
- Platform overview
- Revenue tracking
- Withdrawal requests
- Financial reports

### Phase 5: Polish & PWA (Weeks 21-24)

**Week 21: PWA**
- Service worker
- Offline support
- Add to home screen
- App manifest
- Background sync

**Week 22: Pro Tier Features**
- Advanced analytics
- ~~Bulk upload (50)~~ *(Future feature - good to have)*
- Weekly reports
- Product insights
- Performance tips

**Week 23: Email & Notifications**
- Transactional emails
- Welcome sequence
- Notification system
- Push notifications
- Templates
- Preferences

**Week 24: Testing**
- Comprehensive testing
- Unit tests
- Integration tests
- E2E tests
- Optimization
- Security audit
- Bug fixes

### Phase 6: Pre-Launch (Weeks 25-26)

**Week 25: Content & Docs**
- Help docs (15 articles)
- FAQ
- Terms of Service
- Privacy Policy
- Seller Agreement
- Landing page
- Blog posts (5-10)
- Launch graphics

**Week 26: Pioneer Recruitment**
- Identify 20 Pioneers
- Outreach
- Onboard
- Early access
- Upload products
- Feedback
- Fix issues

### Phase 7: Launch (Weeks 27-30)

**Week 27: LAUNCH WEEK**
- Go live
- Email list
- Social media
- Facebook groups
- Monitor
- Fix issues

**Week 28: Rapid Response**
- Daily bug fixes
- Feedback collection
- UX improvements
- Performance tuning
- Customer support

**Week 29: Stabilization**
- Fix bugs
- Improve slow pages
- Optimize images
- Database indexing
- Caching
- Onboarding improvements

**Week 30: Review**
- Month 1 metrics
- Feedback review
- Identify issues
- Plan Month 2
- Celebrate milestones

### Feature Timeline

**MVP (Month 1-6):**
- Auth, product upload/purchase
- Payments (GCash/Maya)
- Library with watermarking
- Reviews, basic search
- Admin panel, Pioneers
- PWA

**Post-Launch (Month 7-12):**
- Advanced analytics
- ~~Bulk upload~~ *(Future feature - good to have)*
- Seasonal collections
- Live chat
- Referral program
- SEO optimization

**Future (Year 2+):**
- College professors
- Video content
- Custom storefronts
- Affiliate program
- International expansion

---

## Cost & Timeline Summary

### Startup Costs

**Monthly (Launch Phase):**
- Vercel Pro: $20 (₱1,200)
- Supabase Pro: $25 (₱1,500) - can start free
- Domain: $1-2 (₱60-120)
- Email: Free tier initially
- Sentry: Free tier
- **Total: ~$46/month (₱2,600)**

**One-Time Setup:**
- DTI Registration: ₱1,000-2,000
- BIR Registration: ₱500-1,500
- Mayor's Permit: ₱2,000-5,000/year
- **Total: ~₱10,000-20,000**

### Revenue & Break-Even

**Platform Commission:**
- 20% on each sale
- Example: ₱100 sale → ₱20 commission

**Break-even:**
- Fixed costs: ₱2,600/month
- Commission needed: ₱2,600 ÷ 0.20 = ₱13,000 sales
- Or 130 sales at ₱100 each
- Or 260 sales at ₱50 each

**Profit Examples:**
- 10 sales at ₱100 = ₱1,000 revenue → ₱200 commission → ₱1,980 loss (after costs)
- 50 sales at ₱100 = ₱5,000 revenue → ₱1,000 commission → ₱1,580 profit
- 100 sales at ₱100 = ₱10,000 revenue → ₱2,000 commission → ₱4,180 profit

### Development Timeline

**6 Months to Launch:**
- Phase 1 (Weeks 1-8): Foundation
- Phase 2 (Weeks 9-12): Payments
- Phase 3 (Weeks 13-16): Enhanced Features
- Phase 4 (Weeks 17-20): Admin & Pioneer
- Phase 5 (Weeks 21-24): Polish & PWA
- Phase 6 (Weeks 25-26): Pre-Launch
- Phase 7 (Weeks 27-30): Launch & Stabilize

### Resource Requirements

**Phase 1-6 (Development):**
- 1 Full-time developer (you + Cursor)
- 6 months to MVP
- ₱2,600/month hosting

**Post-Launch:**
- 1 Part-time developer (maintenance)
- Customer support (can start part-time)
- Marketing budget (optional ₱5,000-20,000/month)

**When to Hire:**
- 1,000+ daily users → Consider support
- 5,000+ users → Consider second developer
- ₱100,000+ monthly → Small team

---

## Final Notes

### Key Success Factors

1. **Pioneer Quality** - First 20 sellers set platform quality
2. **User Experience** - Simple, fast, mobile-friendly
3. **Trust & Safety** - Verification, moderation, reviews
4. **Seller Success** - Analytics, tips, fair commission
5. **Community Building** - Engagement, support, communication

### Critical Metrics to Track

**Month 1:**
- Signups (target: 500)
- Sellers (target: 50)
- Products (target: 300)
- Purchases (target: 200)
- Revenue (target: ₱25,000+)

**Month 3:**
- Signups (target: 2,000)
- Sellers (target: 150)
- Products (target: 1,000)
- Purchases (target: 1,000)
- Revenue (target: ₱100,000+)

### Next Steps

1. **Create Implementation Plan** - Detailed task breakdown for developers
2. **Set Up Development Environment** - Initialize Next.js + Supabase
3. **Start Phase 1** - Begin with project setup and database
4. **Pioneer Recruitment** - Start outreach during development
5. **Pre-Launch Marketing** - Build email list and social following

### Questions Before Implementation

1. **Domain Name:** Is akomaylessonplanna.com confirmed?
2. **GCash/Maya Applications:** Have you started developer account applications?
3. **Business Registration:** Will you register before or after launch?
4. **Bank Account:** Do you have a business bank account for payouts?
5. **Time Commitment:** Can you dedicate full-time (40hrs/week) to development?
6. **Technical Skills:** Are you comfortable with Next.js/TypeScript/Supabase?
7. **Design Skills:** Do you have UI/UX designs or will you create during development?
8. **Legal Review:** Will you consult a lawyer for legal documents?
9. **Marketing Budget:** Do you have budget for paid ads (optional)?
10. **Support:** Will you handle support yourself initially?

---

## Document Status

**Status:** ✅ Design Complete
**Last Updated:** January 13, 2026
**Version:** 1.2

**Features Completed:** 01-11 (11 features designed)
**Next Feature:** Feature 12 - Advanced Seller Tools

**Next Document:** Implementation Plan (docs/implementation-plan/)

**Ready for:** Development, Pioneer Recruitment, Pre-Launch Marketing

---

*This document contains the complete design specification for AKOMAYLESSONPLANNA. All major decisions have been documented. Use this as the single source of truth during implementation.*
