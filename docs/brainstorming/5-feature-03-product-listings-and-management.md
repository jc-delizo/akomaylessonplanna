# Feature 03: Product Listings & Product Management - Design Decisions

**Date:** January 11, 2026
**Feature:** Product Listings & Product Management
**Status:** ✅ DESIGN COMPLETE - Ready for Implementation

---

## Overview

This document captures all decisions made during the brainstorming session for Feature 03: Product Listings & Product Management for AKOMAYLESSONPLANNA.

---

## Product Types & Categorization

### 5 Product Types (Finalized):

**1. Exams**
- Periodical Exam
- Summative Test
- Filters: Grade, Subject, Quarter
- Images: Yes (cover allowed, but primarily text-based)

**2. Lesson Plans**
- DLL (Daily Lesson Log)
- DLP (Detailed Lesson Plan)
- Filters: Grade, Subject, Quarter, Weeks (multi-select, 1-8)
- Images: Yes (cover allowed, but primarily text-based)

**3. RPMS**
- Cover pages for principal review
- Filters: Theme (Safari, Abstract, Floral, etc.)
- Images: Yes (visual products)

**4. Posters**
- Filters: Theme, Size
- Images: Yes (visual products)

**5. Tarpaulins**
- Filters: Season, Occasion, Size
- Images: Yes (visual products)

### Key Decision:
**All 5 product types can now have images** - initially thought Exams/Lesson Plans wouldn't have images, but decided to allow covers for all product types for consistency and marketing purposes.

### Grade-Subject Relationship (Feature 02.5 Enhancement):
- Subjects change dynamically based on Grade Level selected
- Many-to-many relationship between grades and subjects
- Admin-managed (responds to DepEd curriculum changes)
- Database tables: `grades`, `subjects`, `grade_subjects`

---

## Decisions Made

### 1. Product Detail Page Layout ✅

**Decision:** Hybrid adaptive layout that works for both image-heavy and text-based products

**Layout Structure:**

**Left Column (Desktop):**
- **Image Gallery** (for RPMS/Posters/Tarpaulins) - Up to 5 images, main + thumbnails
- **Document Preview** (for all products) - First 3 pages as scrollable preview
- Preview includes watermark overlay

**Right Column:**
- Product title (H1, SEO-friendly)
- Badges: "New", "Best Seller", "Verified Seller"
- Price (prominent)
- Rating stars + review count
- Sales count
- File type badges (PDF, DOCX, PPTX, ZIP)
- Add to Cart / Buy Now buttons
- Add to Wishlist (heart icon)
- Share button
- "View Seller Profile" button

**Mobile:**
- Stacked vertical layout
- Preview/gallery at top (full width)
- Sticky "Buy Now" button at bottom

**Product Description:**
- Rich text support (bold, italic, bullets, line breaks)
- Character limit: 2,000
- No HTML (security)

**Product Metadata:**
- Product Type Badge
- Specific Type (e.g., "DLL - Grade 7 Math - Quarter 1 - Weeks 1-3")
- Grade Level badge
- Subject badge
- Quarter (Q1/Q2/Q3/Q4)
- Weeks (multi-select, displayed as "Weeks 1, 2, 3")
- File size, Page count, Last updated date

**For Visual Products (RPMS/Posters/Tarpaulins):**
- Dimensions/Size
- Theme
- Format (PDF, PNG, JPG)

---

### 2. Homepage/Marketplace Product Grid ✅

**Decision:** Hero + Featured + New Arrivals + Trending + All Products (Seasonal Collections removed)

**Hero Section:**
- Headline: "Quality Lesson Plans from Filipino Teachers"
- Large search bar with autocomplete
- Quick filter pills (popular searches)
- Seasonal banner (rotates based on time of year)

**Homepage Sections:**
1. **Featured Products** - Admin-selected, 12 items, "Featured" badge
2. **New Arrivals** - Last 7 days, "New" badge, 12 items
3. **Trending Products** - Algorithm-based (most viewed/sold in 30 days), "Trending" 🔥 badge
4. **All Products** - Main marketplace, infinite scroll

**Product Card Design:**

**Image Section (60% of card):**
- Thumbnail (square/4:3 aspect ratio)
- Hover effect: slight zoom + shadow (desktop)
- Badges overlay: "NEW", "FEATURED", "TRENDING", "BESTSELLER"

**Info Section (40% of card):**
- Title (truncated to 2 lines)
- Price (prominent, bold)
- Rating + count
- Sales count
- Seller name (linked to profile)
- File type badges

**Mobile Enhancements:**
- Larger text for readability
- Touch-friendly (entire card clickable)
- Heart icon for wishlist (always visible)
- No hover effects

**Desktop Enhancements:**
- Quick preview on hover (modal)
- "Add to Cart" button appears on hover

**Grid Layout:**
- Mobile (320-767px): 2 columns
- Tablet (768-1023px): 3 columns
- Desktop (1024px+): 4 columns

---

### 3. Filters & Search System ✅

**Search Bar (Sticky Below Hero):**
- Large search input with autocomplete
- Search suggestions (product titles, subjects, sellers)
- Keyboard shortcut: "/" focuses search bar

**Filter Sidebar (Desktop) / Filter Drawer (Mobile):**

**Filter Options:**

**1. Product Type** (Multi-select)
- Exams, Lesson Plans, RPMS, Posters, Tarpaulins

**2. Grade Level** (Multi-select)
- Kindergarten, Grade 1-12

**3. Subject** (Multi-select)
- Dynamically updates based on selected Grade Level
- Mathematics, Science, English, Filipino, Araling Panlipunan, MAPEH, ESP, TLE, Other

**4. Quarter** (Multi-select)
- Quarter 1, 2, 3, 4

**5. Week** (Multi-select, 1-8)
- Maximum 8 weeks per quarter (Philippine school calendar)

**6. Price Range**
- Min/Max inputs
- Presets: Under ₱100, ₱100-₱300, ₱300-₱500, ₱500+

**7. Rating**
- 4+ stars, 4.5+ stars, 5 stars

**8. File Type**
- PDF, DOCX, PPTX, ZIP, JPG/PNG

**Sort Options:**
- Relevance (default)
- Newest First
- Best Selling
- Price: Low to High
- Price: High to Low
- Highest Rated

**Active Filters:**
- Display as removable chips
- "Clear all filters" button

---

### 4. Product Upload Interface ✅

**Decision:** Multi-step wizard (not one long form)

**Wizard Steps:**

**Step 1: Basic Information**
- Product title* (5-100 characters)
- Product type dropdown* (5 types)
- Specific type* (e.g., DLL, DLP, Periodical Exam)
- Description* (50-2,000 characters, rich text)

**Step 2: Categorization**
- Grade Level* (dropdown from Feature 02.5)
- Subject* (dropdown - filters by Grade Level)
- Quarter* (Q1/Q2/Q3/Q4)
- Weeks* (multi-select, at least 1)
- Type-specific filters (Theme, Size, Season, Occasion)

**Step 3: Files & Media**
- Upload product files* (at least 1)
- Upload cover image (optional, manual only)
- Additional gallery images (optional, up to 5)

**Step 4: Pricing & Publishing**
- Price* (₱5 minimum, ₱50,000 maximum)
- Save as Draft / Publish button

**Step 5: Confirmation**
- Preview of listing
- Edit or Confirm buttons

**File Upload Rules:**
- **Supported types**: PDF, DOCX, PPTX, PPT, DOC, JPG, JPEG, PNG, GIF, ZIP, MP4 (future)
- **Size limits**: 100MB per file, 500MB total per product
- **Virus scanning**: ClamAV or similar
- **Storage**: Supabase Storage (private bucket)

**Cover Image:**
- **Manual upload only** (no auto-generation)
- **Rationale**: Products can have multiple files, so the system cannot reliably determine which file should be used for the cover image. Manual upload gives sellers full control over their product presentation.
- **Specifications**: 
  - Custom upload (1200x800px recommended, max 10MB)
  - Supported formats: JPG, PNG, WEBP, GIF
  - Optional field - products can be published without a cover image
  - Auto-crop/resize to standard dimensions (if needed)

**Preview Generation:**
- Automatic after upload
- Extract first 3 pages as images
- Convert to WebP format (72 DPI)
- Watermark overlay: "PREVIEW - Purchase full version"
- Store in public bucket

**Required Fields Validation:**
- Real-time validation as user types
- Clear error messages
- Character counters
- File type/size validation before upload

**Draft System:**
- Save draft at any step (even incomplete)
- Drafts visible in seller dashboard
- "Complete this draft" button

---

### 5. Bulk Upload ✅

**Decision:** DEFERRED - Marked as "Future feature - good to have"

**Rationale:**
- Reduce initial development scope
- Focus on perfecting single product upload first
- Can add post-launch based on seller demand

**Original Plan (for future implementation):**
- Free tier: Up to 10 products
- Pro/Pioneer: Up to 50 products
- ZIP file upload with metadata.csv
- Multiple file selection methods

---

### 6. Product Version Management ✅

**Decision:** Automatic versioning with buyer notifications

**Update Flow:**
1. Seller clicks "Update Product" in dashboard
2. Uploads new/replacement files
3. Version auto-increments (v1.0 → v1.1 → v2.0)
4. Required changelog: "What's new?" (min 20 chars)
5. Publish update

**Version Numbering:**
- **Minor changes** (typos, formatting): v1.0 → v1.1
- **Major changes** (significant content): v1.2 → v2.0
- Seller can manually override

**For Previous Buyers:**
- ✅ Email notification: "Update available for [Product Name]"
- ✅ In-app notification in library
- ✅ Badge: "Update Available"
- ✅ Download new version (no extra cost)
- ✅ View version history

**For New Buyers:**
- Always get latest version
- See: "Version 3.0 (Updated Jan 10, 2026)"

**Version History Display:**
- Product detail page: "Version 3.0 - Updated January 10, 2026"
- "View update history" link → modal with all versions
- In buyer's library: Current version badge, update notification

**Access to Old Versions:**
- No - buyers always get latest version
- Simpler implementation
- Industry standard
- Exception: Seller can rollback via admin (emergency)

**Storage Strategy:**
- Keep latest version active
- Archive old versions for 90 days
- Delete after 90 days (seller notified)
- Pro/Pioneer can keep all versions (future feature)

---

### 7. Product Analytics (For Sellers) ✅

**Decision:** Tiered analytics (Free vs Pro/Pioneer)

**Basic Analytics (Free Tier - All Sellers):**

**Per-Product Metrics:**
- Views (total, unique)
- Sales count
- Revenue
- Rating (average)
- Reviews count
- Downloads
- Conversion rate (purchases ÷ views × 100%)

**Time Periods:**
- Today, This Week, This Month, All Time

**Display:**
- Simple table view
- Sortable by any column

**Advanced Analytics (Pro/Pioneer Tier):**

**Visual Charts:**
- Sales graph (line chart over time)
- Revenue graph (bar chart by month)
- Views trend (area chart)
- Conversion funnel

**Deeper Insights:**
- Top performing products
- Worst performing products
- Traffic sources (search, homepage, profile, direct)
- Buyer demographics (grade levels, subjects - anonymized)
- Peak sales times
- Price comparison vs similar products

**Performance Recommendations:**
- "High views, low conversion - consider lowering price"
- "Grade 7 Math trending - create more"
- "Products with previews sell 3x more"

**Export Reports:**
- CSV/Excel download
- Monthly earnings report (tax purposes)
- Print-ready PDF

**Dashboard Layout:**

**Overview Tab:**
- Summary cards: Revenue, Sales, Products, Rating
- Main charts: Revenue over time, Sales by product, Traffic sources
- Bottom: Recent orders, Recent reviews

**Products Tab:**
- Product performance table
- Click product → Detailed view (charts, analytics)

**Comparison to Other Sellers (Pro/Pioneer):**
- Percentile ranking
- "Your Grade 7 Math DLL is in top 20%"
- "Your conversion rate (7.1%) is above average (4.5%)"
- Privacy-first (no specific seller names)

**Performance Score:**
- Each product: 0-100 score
- Based on: views, sales, conversion, rating
- "Top Product" badge if 90+
- "Needs Improvement" if below 30

---

### 8. Preview Functionality ✅

**Decision:** Automatic preview generation with modal display

**Preview Generation:**

**For PDF Files:**
- Extract first 3 pages → convert to images
- Add watermark overlay
- Store in public bucket

**For DOCX Files:**
- Convert first 3 pages to PDF → images
- Same watermark process
- 10-30 second generation

**For PPTX Files:**
- Export first 3 slides as images
- Watermark overlay
- Fast generation

**For Images (RPMS, Posters, Tarpaulins):**
- Use actual image as preview
- Multiple images = show first 3 as gallery

**For ZIP Files:**
- Extract first file → generate preview
- OR require manual preview upload

**Preview Display on Product Detail Page:**
- **Button**: "👁️ Preview (First 3 Pages)"
- Opens modal/lightbox (not new tab)

**Modal Layout:**
- Desktop: 800px centered modal
- Mobile: Full-screen modal
- Navigation: Arrows or swipe
- Close: X button or click outside

**Preview Content:**
- Page X of 3 counter
- Full page image (scrollable)
- Watermark on all pages
- CTA: "Purchase full version to download all pages"

**Preview Protection:**
- Right-click disabled
- No direct download
- Low-resolution (72 DPI)
- Watermark overlay

**Video Previews (Future Feature):**
- YouTube/Vimeo URL embed
- Show first 30 seconds
- Deferred to Phase 2+

**Preview Optimization:**
- Target: Each preview < 500KB
- WebP format
- 1200px width
- Lazy loading
- CDN caching (7 days)

**Preview Analytics (For Sellers):**
- Track preview clicks
- Scroll-through rate
- Preview → Purchase conversion
- "Products with previews get 3x more sales" insight

**Fallback:**
- Failed generation → Generic placeholder
- Notify seller
- Retry option

---

### 9. Product Status Workflow ✅

**Decision:** 6 status states with clear transitions

**Status States:**

**1. Draft** (`status: 'draft'`)
- Being created or incomplete
- Only visible to seller
- Can edit, delete, publish

**2. Pending Review** (`status: 'pending_review'`)
- First 3 products from new sellers
- Awaiting admin approval (24-48 hours)
- Not visible in marketplace
- Can edit and resubmit

**3. Published** (`status: 'published'`)
- Live in marketplace
- Searchable, purchasable
- Can edit (creates new version)
- Can unpublish

**4. Rejected** (`status: 'rejected'`)
- Admin rejected during review
- Not visible in marketplace
- Seller sees reason
- Can edit and resubmit (max 3 attempts)

**5. Suspended** (`status: 'suspended'`)
- Admin action (policy violation)
- Temporarily hidden
- Existing buyers keep access
- Can appeal

**6. Deleted** (`status: 'deleted'`)
- Soft delete
- Hidden everywhere
- Buyers keep access
- 30-day grace period → hard delete

**Workflow:**
```
Draft → Publish → Pending Review (first 3) → Published
Published → Unpublish → Draft
Published → Suspend (admin)
Rejected → Edit → Pending Review
All → Delete (soft)
```

**Admin Actions:**

**For Pending Review:**
- Approve → Published
- Reject → Rejected (with reason)
- Request Changes → Pending Review

**For Published:**
- Suspend → Suspended (with reason)
- Reinstate → Published
- Delete → Deleted (emergency)

**Seller Options:**

**For Draft:**
- Edit, Delete, Publish

**For Published:**
- Edit (new version), Unpublish, Delete

**For Rejected:**
- View reason, Edit and resubmit, Delete

**For Suspended:**
- View reason, Contact support (appeal)

**Status Badges:**
- 🟢 Published (green)
- 🔵 Draft (blue)
- 🟡 Pending Review (yellow)
- 🔴 Rejected (red)
- ⚫ Suspended (gray)
- 🗑️ Deleted (strikethrough)

---

## Technical Implementation Details

### Database Schema Updates

**Existing Tables (from main design doc):**
- `products` - Core product data
- `product_updates` - Version history
- `product_views` - Analytics

**New Tables (Feature 02.5 Enhancement):**
- `grades` - Philippine K-12 grade levels
- `subjects` - All subjects
- `grade_subjects` - Many-to-many relationship

**products table additions:**
```sql
-- Version management
current_version INTEGER DEFAULT 1,
changelog TEXT,  -- Latest changelog

-- Analytics
views_count INTEGER DEFAULT 0,
conversion_rate DECIMAL(5,2),

-- Status tracking
status ENUM('draft', 'pending_review', 'published', 'rejected', 'suspended', 'deleted'),
rejection_reason TEXT,
suspension_reason TEXT,
deleted_at TIMESTAMP,  -- For 30-day soft delete

-- Categorization
weeks TEXT[],  -- Multi-select weeks array
product_type VARCHAR(50),  -- Exam, Lesson Plan, etc.
specific_type VARCHAR(50),  -- DLL, DLP, Periodical Exam, etc.

-- Type-specific metadata
theme VARCHAR(100),  -- For RPMS/Posters
size VARCHAR(50),  -- For Posters/Tarpaulins
season VARCHAR(50),  -- For Tarpaulins
occasion VARCHAR(50),  -- For Tarpaulins
```

### API Routes

**Product Routes:**
```
GET /api/products - List products (with filters, pagination)
GET /api/products/:id - Get product details
POST /api/products - Create new product (seller only)
PUT /api/products/:id - Update product (seller only)
DELETE /api/products/:id - Delete product (seller only)
POST /api/products/:id/publish - Publish draft
POST /api/products/:id/unpublish - Unpublish to draft
POST /api/products/:id/update - Create new version (seller only)
GET /api/products/:id/updates - Get version history
GET /api/products/:id/preview - Get product preview
```

**Admin Routes:**
```
GET /api/admin/products/pending-review - Get pending queue
PUT /api/admin/products/:id/approve - Approve product
PUT /api/admin/products/:id/reject - Reject product
PUT /api/admin/products/:id/suspend - Suspend product
PUT /api/admin/products/:id/reinstate - Reinstate product
```

**Analytics Routes:**
```
GET /api/products/:id/analytics - Get product analytics (owner only)
GET /api/seller/analytics - Get seller dashboard analytics (Pro/Pioneer)
```

**Search & Filter Routes:**
```
GET /api/search - Search products
GET /api/grades - Get all grades
GET /api/subjects - Get all subjects
GET /api/grades/:gradeId/subjects - Get subjects for specific grade
```

### Frontend Routes

**Public Pages:**
- `/` - Homepage (hero, featured, new, trending, all products)
- `/products` - All products marketplace
- `/products/[id]` - Product detail page
- `/search` - Search results page
- `/sellers/[username]` - Seller profile (from Feature 02)

**Authenticated Pages (Sellers):**
- `/dashboard/products` - Product management
- `/dashboard/products/new` - Upload product (wizard)
- `/dashboard/products/[id]/edit` - Edit product
- `/dashboard/analytics` - Seller analytics dashboard
- `/dashboard/library` - Buyer's library (purchases)

**Admin Pages:**
- `/admin/products/pending-review` - Pending review queue
- `/admin/products/[id]` - Product detail/admin

### Caching Strategy

**Cache (Redis/CDN):**
- Product detail pages (TTL: 5 minutes)
- Product listings (TTL: 2 minutes)
- Search results (TTL: 1 minute)
- Grades and subjects (TTL: 1 hour - rarely changes)
- Preview images (TTL: 7 days)

**Invalidation:**
- Product update → Clear product cache
- New product → Clear listings cache
- Grade/subject change → Clear grade/subject cache

### Image Optimization

**Cover Images:**
- 1200x800px (3:2 ratio)
- WebP format with JPEG fallback
- Lazy loading
- Progressive enhancement (blur → sharp)

**Preview Images:**
- 1200px width (scaled proportionally)
- 72 DPI (web quality)
- WebP format
- Watermark overlay
- Under 500KB each

**Mobile Optimization:**
- 800px width for mobile
- Faster load times
- Progressive loading

---

## Related Features & Dependencies

### Feature 02.5: System Configuration - Grade & Subject Management

**Status:** Must be implemented before or during Feature 03

**Enhancement Added:**
- Many-to-many grade-subject relationship
- Subjects filter based on selected grade
- Admin-managed curriculum
- Responds to DepEd curriculum changes

**Database Tables:**
- `grades` - Grade levels
- `subjects` - Subjects
- `grade_subjects` - Junction table

### Feature 01: Authentication & User Management

**Dependency:**
- Sellers must be verified (PRC ID) to upload products
- Role-based access: `can_sell = true`

### Feature 02: User Profiles & Profile Management

**Dependency:**
- Seller profiles display products
- "View Seller Profile" button links to `/sellers/[username]`
- Seller analytics tie into profile stats

---

## Notes from Planning Session

1. **All Products Can Have Images**: Initially thought Exams/Lesson Plans wouldn't have images, but decided to allow covers for all 5 product types for consistency and marketing.

2. **Grade-Subject Relationship**: Critical enhancement to Feature 02.5. Subjects change based on grade level (e.g., Grade 1 has Mother Tongue, Grade 7 doesn't). This responds to DepEd curriculum changes.

3. **Bulk Upload Deferred**: Marked as "good to have" future feature. Focus on single product upload first. Can add post-launch based on demand.

4. **Week Filter Multi-Select**: Philippines has 8 weeks per quarter in school calendar. Weeks filter is multi-select (e.g., lesson plan can cover Weeks 1-3).

5. **Seasonal Collections Removed**: Originally planned for homepage, removed to reduce scope. Can add post-launch.

6. **Video Previews Deferred**: For Phase 2+ when video products become more popular.

7. **No Old Version Access**: Buyers always get latest version. Industry standard (Teachers Pay Teachers, Gumroad). Simpler implementation.

8. **Manual Cover Image Upload Only**: Cover images are always manually uploaded by sellers. No auto-generation from product files, as products can have multiple files and the system cannot reliably determine which file should be used for the cover. This gives sellers full control over their product presentation.

---

## Implementation Checklist

When implementing this feature:

### Phase 1: Core Product Features
- [ ] Create `grades`, `subjects`, `grade_subjects` tables
- [ ] Implement multi-step product upload wizard
- [ ] File upload to Supabase Storage
- [ ] Manual cover image upload (no auto-generation)
- [ ] Auto-generate previews (first 3 pages)
- [ ] Product detail page (hybrid layout for images/documents)
- [ ] Preview modal with watermark
- [ ] Draft/Publish/Unpublish functionality

### Phase 2: Marketplace & Discovery
- [ ] Homepage with hero, featured, new, trending sections
- [ ] Product grid (2/3/4 responsive columns)
- [ ] Search with autocomplete
- [ ] Filter sidebar (all 8 filters)
- [ ] Sort options (6 options)
- [ ] Active filter chips
- [ ] Product cards with badges

### Phase 3: Product Management
- [ ] First 3 products review workflow
- [ ] Admin approval/rejection interface
- [ ] Product status workflow (6 states)
- [ ] Seller product management dashboard
- [ ] Version management system
- [ ] Changelog requirement
- [ ] Buyer update notifications

### Phase 4: Analytics
- [ ] Basic product analytics (all sellers)
- [ ] Time period filters
- [ ] Advanced analytics dashboard (Pro/Pioneer)
- [ ] Visual charts (line, bar, area, pie)
- [ ] Performance score
- [ ] Comparison to other sellers
- [ ] Export reports (CSV/Excel/PDF)

### Phase 5: Optimizations
- [ ] Image optimization (WebP, compression)
- [ ] CDN caching
- [ ] Lazy loading
- [ ] Mobile optimization
- [ ] Preview fallback handling
- [ ] Performance monitoring

---

## Summary

Feature 03 (Product Listings & Product Management) is now fully designed and ready for implementation. Key highlights:

- ✅ 5 product types with flexible categorization
- ✅ All products can have images (covers)
- ✅ Grade-subject dynamic relationship (Feature 02.5 enhancement)
- ✅ Multi-step upload wizard with validation
- ✅ Comprehensive product detail pages (hybrid layout)
- ✅ Homepage with hero + featured + new + trending + all products
- ✅ Advanced filtering (8 filter types)
- ✅ Automatic preview generation with watermark
- ✅ Version management with buyer notifications
- ✅ Tiered analytics (Free vs Pro/Pioneer)
- ✅ Complete product status workflow (6 states)
- ✅ First 3 products review system
- ✅ Bulk upload deferred (future feature)

**Next Feature:** Feature 04 - Shopping Cart & Checkout Flow (to be discussed in next session)

---

**Document Version:** 1.0
**Last Updated:** January 11, 2026

*All decisions documented. Ready to proceed with implementation planning.*
