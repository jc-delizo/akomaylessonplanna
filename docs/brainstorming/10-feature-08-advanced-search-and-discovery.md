# Feature 08: Advanced Search & Discovery - Design Decisions

**Date:** January 13, 2026
**Feature:** Advanced Search & Discovery
**Status:** ✅ DESIGN COMPLETE - Ready for Implementation

---

## Overview

This document captures all decisions made during the brainstorming session for Feature 08: Advanced Search & Discovery for AKOMAYLESSONPLANNA. This feature builds upon the basic search established in Feature 03, transforming it into a comprehensive, fast, and user-friendly search system optimized for Filipino teachers on mobile devices.

---

## Design Philosophy

**Core Principles:**
- **FAST:** Search results under 1 second
- **ACCURATE:** Multi-factor relevance ranking
- **SIMPLE:** Filters only, no advanced syntax
- **MOBILE-FIRST:** 70%+ Filipino users on mobile
- **DISCOVERABLE:** SEO-optimized, category pages, recommendations
- **SELLER-FRIENDLY:** Clear analytics to optimize products

---

## Area 1: Search Algorithm & Relevance ✅

### Decision: PostgreSQL Full-Text Search with Weighted Relevance

**Relevance Score Formula:**
```
Relevance Score =
  40% Text match (title > description > tags)
  25% Sales performance (sales_count * 0.25)
  20% Rating quality (avg_rating * 4)
  10% Recency boost (newer products get slight boost)
  5% Seller reputation (verified sellers get +5%)
```

**Technology:**
- PostgreSQL full-text search (built into Supabase)
- `pg_trgm` extension for fuzzy matching (typos/misspellings)
- No external search engine (Algolia/Elasticsearch) - saves $300-1,000/month
- Handles 10,000-50,000 products easily (sub-second response)

**Search Autocomplete:**
- Shows 8 suggestions max (mobile-friendly)
  - 3 product titles (exact matches)
  - 2 subjects (Grade 7 Math, Science)
  - 2 seller names
  - 1 popular search

**Search History:**
- Saves last 10 searches per user
- Anonymous: localStorage
- Logged-in: database
- Shows "Recent searches" dropdown when search bar focused
- Homepage section: "Popular searches this week" (top 5 platform-wide)

**Filipino Context:**
- Handles English and Filipino searches
- Common abbreviations: DLL, RPMS, AP (Araling Panlipunan)
- Fuzzy matching handles typos

---

## Area 2: Advanced Search Operators ✅

### Decision: Filters Only - No Advanced Syntax

**Rationale:**
- Teachers are busy, not tech-savvy
- Lazada, Shopee, Teachers Pay Teachers don't use advanced syntax
- Filters are more intuitive

**Filter Logic: AND (Match ALL)**
- When user selects: Grade 7 + Math + Quarter 1
- Results: Products matching ALL three criteria
- Clear to users: "Showing 24 results for Grade 7 + Math + Q1"

**No OR Operators**
- Too confusing for most users
- If teacher wants Grade 7 OR Grade 8, they search twice

**Saved Searches (Pro/Pioneer Feature)**
- **Free users**: No saved searches
- **Pro/Pioneer**: Save up to 10 searches
- Quick access from dashboard: "Run this search"

**Search Suggestions Instead of Operators**
- When user types "grade 7", suggest: "grade 7 math", "grade 7 science"
- No need for OR operator

---

## Area 3: Search Results Page ✅

### Layout: Grid View with Toggle Option

**Desktop:**
- **Default**: 4-column grid
- **Toggle button**: Grid ⟷ List view
- User preference saved
- Grid cards: Same design as homepage (Feature 03)
- List view: Horizontal rows with more details

**Mobile:**
- **Grid only**: 2 columns
- No toggle on mobile (simpler)

**Results Per Page:**
- Desktop: 24 products per page (3 rows of 8)
- Mobile: 20 products per page (10 rows of 2)
- **User selectable**: 20, 50, 100 (dropdown)
- Infinite scroll as alternative (Pro/Pioneer preference saved in settings)
  - Free: Traditional pagination (faster, less data)
  - Pro/Pioneer: Can choose infinite scroll in settings

**Sort Options:**

**Primary Sorts (All Users):**
1. Relevance (default for searches)
2. Newest First
3. Best Selling
4. Price: Low to High
5. Price: High to Low
6. Highest Rated

**Secondary Sorts (Pro/Pioneer Analytics):**
7. Most Viewed
8. Trending (algorithm: views + sales in last 7 days)

**No Results Behavior:**
- Helpful message: "No results found for 'grade 7 advanced calculus'"
- Tips: Check spelling, use fewer words, try different keywords
- **Show alternative content**:
  - "Popular in Grade 7" (8 trending products)
  - "Recommended for You" (personalized)
  - "New Arrivals" (latest products)
  - "All Grade 7 Products" (link to browse page)

**"Did You Mean?" Suggestions:**
- Uses `pg_trgm` for fuzzy matching
- Shows when no exact results: "Did you mean 'mathematics'?"
- One suggestion max (don't overwhelm)
- Clickable → auto-searches corrected term

---

## Area 4: Filter System Enhancement ✅

### Current Filters (from Feature 03):
1. Product Type
2. Grade Level
3. Subject (dynamic)
4. Quarter
5. Weeks (multi-select)
6. Price Range
7. Rating
8. File Type

### New Filters Added:

**9. Seller Verification Status** ✅
- Checkbox: "Verified Sellers Only"
- High-trust filter for cautious buyers

**10. Date Added** ✅
- Radio buttons: Any time, Last 7 days, Last 30 days, Last 3 months
- Great for finding fresh content

**11. Language** ✅ (Important for Philippines!)
- Checkboxes: English, Filipino, Bilingual
- Based on product language metadata

**❌ NOT Adding:**
- File Size (not relevant for digital downloads)
- Price presets (you already have min/max inputs)
- Seller tier (could create inequality)

### Filter Behavior: Show Count Per Option

**Example:**
```
☑ Grade Level
  ☐ Kindergarten (42)
  ☐ Grade 1 (156)
  ☐ Grade 7 (89)
```

- Numbers update dynamically as user filters
- Shows 0 if no results for that option
- Grays out options with 0 results
- **Performance**: Cached counts (updated every 5 minutes)

### Active Filters Display

**Design: Removable Chips**
```
Selected filters:
  [Grade 7 ×] [Math ×] [Quarter 1 ×] [Under ₱100 ×]

  Clear all filters (23 results)
```

- **Desktop**: Horizontal bar below search, above results
- **Mobile**: At top of filter drawer
- **"Clear all filters"**: Prominent button

### Filter Organization (Desktop Sidebar)

**Collapsible Sections:**
- Expanded by default: Product Type, Grade, Subject
- Remember user's collapse/expand state
- Smooth animation

### Mobile Filter Drawer

**Slide-out from Left:**
- Full-screen on mobile (80% width on tablet)
- "Show 84 Results" sticky button at bottom
- "Clear All" at top
- Same collapsible sections
- Pull-to-close gesture

### Filter Logic: AND (Match ALL)

All selected filters must match:
- Grade 7 + Math + Q1 = products matching ALL three
- Clear, predictable behavior
- Industry standard (Shopee, Lazada, Amazon)

---

## Area 5: Category Pages & Browse ✅

### Decision: Yes - Create Dedicated Category Pages

**Why Category Pages Matter:**
- **SEO benefits**: Each category page ranks in Google
- **Better UX**: Teachers browse by subject/grade naturally
- **Discovery**: Many users prefer browsing over searching

### Category Page Structure

**URL Patterns:**
```
/products/lesson-plans
/products/exams
/products/grade-7-math
/products/rpms
```

**Page Layout (Hero + Filtered Products):**

**Hero Section (Top 20% of page):**
- Large banner image (seasonal or subject-themed)
- Headline: "Grade 7 Lesson Plans"
- Subtitle: "324 resources from Filipino teachers"
- Quick stats: "Starting at ₱50"

**Product Grid (Bottom 80%):**
- Same 4-column grid as search results
- Auto-filtered to category
- All filters available (sidebar)
- Sort dropdown
- Pagination

### Subcategory Navigation

**✅ Recommended: Tabs + Breadcrumbs (Modern)**

**Tabs (Below Hero, Above Products):**
```
[All 324] [DLL 142] [DLP 89] [Weekly Plans 53] [Quarterly Plans 40]
```

**Breadcrumbs (Top of page):**
```
Home › Products › Grade 7 › Mathematics
```

### Category-Specific Filters

**Yes - Show Only Relevant Filters:**

**Example: `/products/lesson-plans`**
- Shows: Product Type, Grade, Subject, Quarter, Weeks
- **Hidden**: Theme (only for RPMS/Posters)

**Example: `/products/rpms`**
- Shows: Product Type, Theme, Grade
- **Hidden**: Quarter, Weeks (not relevant)

### Featured Category Pages (High-Traffic)

**`/products/grade-7`**
- Hero: "Grade 7 Resources"
- Featured: "Top 10 Grade 7 Products This Month"
- Sections by subject: Math, Science, English, Filipino, AP

**`/products/lesson-plans`**
- Hero: "Daily Lesson Plans (DLL)"
- Guide: "How to Use DLL in Your Classroom"
- Featured: "Most Downloaded DLLs"

### Category Page URL Strategy

**SEO-Friendly URLs:**
- Product detail: `/products/dll-grade-7-math-q1-weeks-1-3` (uses `slug` field)
- Category: `/products/lesson-plans/grade-7/mathematics`
- Clean, readable, keyword-rich

### Mobile Category Navigation

**Bottom of Homepage:**
```
[Lesson Plans] [Exams] [RPMS] [Posters] [Tarpaulins]
  ↓           ↓       ↓       ↓          ↓
5 large cards, tap to view category
```

---

## Area 6: Product Recommendations ✅

### Recommendation: Multi-Strategy Approach (Simple + Smart)

### 1. "Related Products" on Product Detail Page

**Shown below product description, above reviews**

**Strategy: Hybrid Match (70% Same Grade/Subject, 30% Same Seller)**

- **Section Title**: "You Might Also Like"
- Grid: 4 columns (desktop), 2 columns (mobile)
- 8 products shown
- No duplicate of current product

### 2. "You Might Also Like" on Homepage

**Personalized for logged-in users (below "Trending" section)**

**Free Users (Simple):**
- Based on: Last 3 products viewed, Wishlist items, Same grade level

**Pro/Pioneer Users (Advanced):**
- Based on: Purchase history, Download history, Browsing history, Subjects taught, Grade levels taught

**Section Title**: "Recommended for You" (logged-in) or "Popular This Week" (anonymous)
- 8 products shown
- Recommendations update daily (cached)

### 3. "Similar Products" on Search Results

**Shown when exact search returns < 5 results**

**Strategy: Fuzzy Category Match**

- Helpful message when no exact results
- Shows similar grade/subject products
- Example: "grade 7 calculus" → Shows Grade 7 Math products

### 4. "Teachers Who Bought This Also Bought"

**⚠️ DEFERRED to Phase 2 (Post-Launch)**

**Why Defer:**
- Requires substantial purchase data (1,000+ transactions)
- Complex to implement correctly
- Not critical for MVP
- Can add after 3-6 months of data

### 5. "New from Sellers You Follow" (Dashboard)

**Shown on user dashboard (if following sellers)**

- Shows last 7 days of new products from followed sellers
- 8 products maximum
- Only shows if following at least 1 seller

### Recommendation Display Summary

| Location | Strategy | Products | Personalized? |
|----------|----------|----------|---------------|
| Product detail page | Same grade/subject + same seller | 8 | No |
| Homepage (Free) | Recently viewed + wishlist | 8 | Yes (basic) |
| Homepage (Pro/Pioneer) | Purchase + browse + profile | 8 | Yes (advanced) |
| Search fallback | Similar grade/subject | 12 | No |
| Dashboard | Followed sellers' new products | 8 | Yes |

---

## Area 7: Search Analytics for Sellers ✅

### Recommendation: Tiered Search Analytics (Basic Free, Advanced Pro/Pioneer)

### Basic Search Analytics (Free Tier - All Sellers)

**Location: Seller Dashboard → Products → Individual Product Analytics**

**1. Search Terms Report (Top 10)**

**Table View:**
```
Search Term          | Impressions | Clicks | CTR  | This Month
--------------------|-------------|--------|------|-------------
grade 7 math dll    | 342         | 67     | 19.6%| 📈 +12%
dll grade 7         | 256         | 48     | 18.8%| 📈 +8%
```

**Definitions:**
- **Impressions**: How many times product appeared in search results
- **Clicks**: How many times users clicked on the product
- **CTR (Click-Through Rate)**: Clicks ÷ Impressions × 100%
- **Trend**: Comparison to previous month

**2. Average Ranking Position**

**Single Metric Card:**
- Average position across all searches
- Top 3 = Green badge (excellent visibility)
- Positions 4-10 = Yellow (room for improvement)
- Position 11+ = Red (hard to find)

**3. Search Performance Over Time**

**Simple Chart (Last 30 Days):**
- One line chart (impressions only)
- Hover for exact numbers
- No comparison charts (Pro/Pioneer feature)

### Advanced Search Analytics (Pro/Pioneer Only)

**4. Keyword Performance Insights**

**Actionable Recommendations:**
- Shows ranking for specific keywords
- Tips for improving ranking
- Missing keyword opportunities

**5. Competitor Comparison**

**Anonymized data:**
- "Your product outperforms 78% of similar Grade 7 Math products"
- Privacy-first approach
- No specific seller names

**6. Search Trend Analysis**

**Multi-Line Chart:**
- Compare impressions vs clicks
- Identify gaps (high impressions, low clicks = bad title/thumbnail)
- Identify success patterns

**7. Keyword Opportunity Report**

**Table of Missed Opportunities:**
- Shows keywords with high search volume
- Where product ranks poorly or doesn't appear
- Difficulty score (based on competition)

**8. Search Performance Score (Pro/Pioneer)**

**Overall Search Health: 0-100**

**Calculation:**
```
Search Score =
  30% Avg. Ranking Position
  25% CTR
  20% Search Volume (impressions)
  15% Keyword Coverage
  10% Trend (improving vs declining)
```

**Percentile Badge:**
- "Your product's search visibility is better than 65% of similar products"

### Implementation Strategy

**Database Schema:**
```sql
CREATE TABLE search_analytics (
  id UUID PRIMARY KEY,
  product_id UUID REFERENCES products(id),
  search_term VARCHAR(255),
  impressions INTEGER DEFAULT 0,
  clicks INTEGER DEFAULT 0,
  avg_position DECIMAL(4,2),
  date DATE,
  created_at TIMESTAMP
);
```

**Tracking:**
- Log every search impression
- Log every click
- Aggregate nightly into analytics tables
- Retain 90 days of detailed data (Free) / 365 days (Pro/Pioneer)

### Privacy Considerations

**No Individual User Data:**
- Don't show WHO searched (anonymized)
- Only show aggregate search terms
- No buyer names or personal info

**No Exact Seller Names (Competitor Comparison):**
- "Other sellers in your category"
- No specific seller identified
- Privacy-first approach

---

## Area 8: SEO & Discoverability ✅

### Recommendation: Comprehensive SEO Strategy (Organic Growth Focus)

**Why SEO Matters:**
- Teachers discover resources via Google search
- Organic traffic = free, sustainable growth
- Competitors (Teachers Pay Teachers) rely heavily on SEO

### 1. Product URL Structure

**Pattern:**
```
/products/[product-type]-[grade]-[subject]-[specifics]-[id]

Example:
/products/dll-grade-7-mathematics-q1-weeks-1-3-a1b2c3d4
```

**Why Include ID at End?**
- Prevents slug collisions
- Allows slug changes without breaking links
- Cleaner than numeric-only URLs

**Slug Generation:**
- Auto-generate from product title
- Seller can manually edit
- Validation: unique, lowercase, hyphens only, 10-100 chars

### 2. Dynamic Meta Tags

**Next.js Metadata API for all pages:**
- Homepage, category pages, product detail, seller profiles
- Title, description, Open Graph for social sharing
- Twitter cards

**Meta Templates:**
- Each page type has SEO-optimized title/description
- Keyword-rich, character limits (50-60 chars title, 150-160 description)

### 3. Schema.org Structured Data

**Implement Product Schema (Rich Snippets):**
- Google shows price, rating, stock status in search results
- Higher click-through rate
- Better visibility in Google Shopping

**Also Implement:**
- Seller Schema (Person)
- Organization Schema (homepage)
- Breadcrumb Schema (navigation)

### 4. Auto-Generated XML Sitemap

**Next.js Sitemap Generation:**
- Static pages (homepage, about, etc.)
- Dynamic product pages (all published products)
- Dynamic seller pages (verified sellers)
- Auto-updates on build

**Sitemap URL:**
```
https://akomaylessonplanna.com/sitemap.xml
```

**Submit to:**
- Google Search Console
- Bing Webmaster Tools

### 5. Canonical URLs

**Prevent Duplicate Content Issues:**
- One canonical URL per product (the slug URL)
- Ignore query parameters for canonical (ref, utm_source, etc.)
- Self-referencing canonical on each page

### 6. Category Page SEO

**Unique Meta per Category:**
- Each category has optimized title/description
- Keyword-rich descriptions
- Internal linking to subcategories

### 7. robots.txt

**Allow all crawlers, disallow private pages:**
- Allow: /products/, /sellers/, homepage
- Disallow: /admin/, /dashboard/, /api/, /cart/, /checkout/

### 8. Core Web Vitals & Performance

**Google Ranking Factors:**
- **LCP (Largest Contentful Paint)**: < 2.5s
- **FID (First Input Delay)**: < 100ms
- **CLS (Cumulative Layout Shift)**: < 0.1
- **Mobile-Friendliness**: Responsive design

### 9. Internal Linking Strategy

**Product Pages:**
- Link to seller's other products
- Link to similar products (same grade/subject)
- Breadcrumb navigation

### 10. Image SEO

**Product Image Optimization:**
- Next.js Image component with alt text
- Descriptive alt text: "DLL Grade 7 Mathematics Quarter 1 cover image"
- SEO-friendly file names: `dll-grade-7-math-q1-cover.jpg`

### SEO Implementation Priority

**Phase 1 (MVP - Launch):**
- ✅ SEO-friendly URLs with slugs
- ✅ Dynamic meta tags
- ✅ XML sitemap
- ✅ Canonical URLs
- ✅ Basic robots.txt

**Phase 2 (Post-Launch - Month 2-3):**
- ✅ Schema.org structured data
- ✅ Category page optimization
- ✅ Image alt text optimization
- ✅ Internal linking enhancements

**Phase 3 (Growth - Month 4-6):**
- ✅ Core Web Vitals optimization
- ✅ Blog content strategy
- ✅ Advanced Schema (Breadcrumb, FAQ)
- ✅ Backlink outreach

---

## Area 9: Search Performance & Caching ✅

### Recommendation: Multi-Layer Caching Strategy (Speed + Freshness)

**Goal: Results under 1 second** ✅

### 1. Search Results Caching

**Cache Duration: 1 Minute (60 seconds)**

**Rationale:**
- Fast enough for real-time feel
- Fresh enough to show new products quickly
- Balances performance (cache hits) with freshness
- Similar to Shopee/Lazada approach

**Implementation (Redis + Vercel Edge):**
- Cache key: `search:${query}:${JSON.stringify(filters)}:${sort}`
- Get from cache first
- Cache miss → query database
- Set cache (60 seconds TTL)
- Auto-expires after 60 seconds

**Cache Invalidation:**
- Auto-expires after 60 seconds
- Manual invalidation: When product status changes
- Product update: Clear affected search caches

**Performance Impact:**
- Cache hit: ~50ms response time
- Cache miss: ~300-500ms response time
- 90%+ cache hit rate expected for popular searches

### 2. Popular Searches Pre-Computation

**Strategy: Top 100 Searches Cached for 5 Minutes**

**Why Pre-Compute:**
- 80% of searches are common queries
- Pre-computed results = instant response
- Reduces database load significantly

**Identify Popular Searches:**
- Track all searches in database
- Nightly job: Update top 100 searches
- Criteria: 50+ searches per week

**Pre-Computation Strategy:**
- Nightly cron job (2:00 AM daily)
- For each popular search: execute and cache results
- Cache for 5 minutes

**Benefits:**
- Popular searches: **~30ms response time**
- Database load reduced by 70-80%
- Scales to 50,000+ products easily

### 3. Database Indexing Strategy

**Critical Indexes for Search Performance:**

```sql
-- Full-text search index
CREATE INDEX idx_products_fts ON products
  USING gin(to_tsvector('english', title || ' ' || description));

-- Grade and subject index (most common filter)
CREATE INDEX idx_products_grade_subject ON products(grade_id, subject_id)
  WHERE status = 'published';

-- Product type index
CREATE INDEX idx_products_type ON products(product_type)
  WHERE status = 'published';

-- Composite indexes for sort options
CREATE INDEX idx_products_sort_sales ON products(sales_count DESC, avg_rating DESC)
  WHERE status = 'published';

CREATE INDEX idx_products_sort_newest ON products(published_at DESC)
  WHERE status = 'published';

CREATE INDEX idx_products_sort_rating ON products(avg_rating DESC, sales_count DESC)
  WHERE status = 'published';

-- Price range index
CREATE INDEX idx_products_price ON products(price)
  WHERE status = 'published';

-- Seller index
CREATE INDEX idx_products_seller ON products(seller_id, status);
```

**Index Maintenance:**
- Analyze query performance weekly
- Add indexes for slow queries (> 500ms)
- Remove unused indexes
- Reindex monthly (PostgreSQL VACUUM ANALYZE)

### 4. Query Optimization

**Use PostgreSQL Full-Text Search:**
```typescript
// ✅ GOOD: Full-text search (50-150ms)
SELECT * FROM products
WHERE to_tsvector('english', title || ' ' || description) @@ to_tsquery('grade & 7 & math')
ORDER BY ts_rank(title || ' ' || description, to_tsquery('grade & 7 & math')) DESC
LIMIT 24;

// ❌ BAD: Slow LIKE query (500-2000ms)
SELECT * FROM products
WHERE title LIKE '%grade 7 math%';
```

### 5. Scaling to 10,000+ Products

**Performance Benchmarks:**

| Products | Cache Hit | Cache Miss | Popular Search |
|----------|-----------|------------|----------------|
| 1,000 | 30ms | 100ms | 20ms |
| 5,000 | 30ms | 200ms | 25ms |
| 10,000 | 30ms | 300ms | 30ms |
| 50,000 | 30ms | 500ms | 40ms |
| 100,000 | 30ms | 800ms | 50ms |

**Current Recommendation: PostgreSQL is Sufficient**
- Handles 10,000-50,000 products easily
- Sub-second response times with proper indexing
- Simpler architecture
- Lower cost

**When to Upgrade (Signs You Need Elasticsearch):**
- Consistently > 1 second on cache miss
- 100,000+ products
- Complex filters (15+ filter types)
- Fuzzy search requirements

### 6. Cache Warming Strategy

**On Product Publish:**
- Clear relevant caches
- Pre-warm likely searches (grade/subject combinations)

**Scheduled Cache Warming (Nightly):**
- Top 100 popular searches
- All category pages
- All seller profile pages (top 50 sellers)

### 7. Monitoring & Alerting

**Key Metrics to Track:**
- Average search response time
- Cache hit rate (target: > 80%)
- Slow searches (> 1s)
- Database query times

**Alerting:**
- Slack alert for slow searches (> 1s)
- Weekly performance reports
- Monthly optimization reviews

### 8. Edge Caching (Vercel Edge Network)

**Cache Search Results Page HTML:**
- Revalidate every 60 seconds
- HTML served from edge (10-50ms)
- Dynamic data fetched client-side
- Best of both worlds

### Caching Strategy Summary

| Cache Type | Duration | When Used | Response Time |
|------------|----------|-----------|---------------|
| Popular search (pre-computed) | 5 min | Top 100 searches | 30ms |
| Regular search (Redis) | 1 min | All searches | 50ms |
| Cache miss (DB query) | N/A | New/rare searches | 300-500ms |
| Edge cache (HTML) | 1 min | Static page HTML | 10ms |

**Target: < 500ms for 95% of searches** ✅

---

## Area 10: Mobile Search Experience ✅

### Recommendation: Mobile-First Search Design (70%+ Users on Mobile)

### 1. Search Bar Behavior

**Sticky at Top (Always Visible):**
- Large, prominent search bar (full width minus padding)
- Always visible - disappears only when keyboard opens
- Magnifying glass icon (44×44px touch target)
- Placeholder text: "Search lesson plans..."
- Auto-focus when tapped from homepage

### 2. Voice Search

**❌ Removed** - Simplified implementation

### 3. Camera Search

**❌ Defer to Phase 2** - Complex implementation, unclear teacher use case

### 4. Search Suggestions on Mobile

**Design: Slide-Up Bottom Sheet (Modern iOS/Android Pattern)**

**Bottom Sheet Behavior:**
- Slides up from bottom (covers 50% of screen)
- Swipe down to dismiss (natural gesture)
- Tap outside to close
- Smooth animation (300ms transition)
- Scrollable (if 10+ suggestions)

**Suggestion Priority:**
1. Recent searches (3 items)
2. Popular searches (3 items)
3. Product titles (2 items) - matching user input
4. Seller names (2 items) - matching user input

**Touch Targets:**
- Each suggestion: 56px height (easy to tap)
- Full-width rows
- Clear visual separation

### 5. Filter Drawer (Mobile)

**Design: Full-Screen Slide-Out Drawer**

**Trigger:**
- "Filter" button (below search bar, left side)
- Icon: Sliders/Filter icon

**Drawer Layout:**
- Header: "Filters", "Clear All" button, Close button
- Scrollable filters (collapsible sections)
- Footer: Result count, "Show Results" button (sticky)

**Mobile Filter UX:**
- Full-screen drawer (easier to use than half-screen)
- Collapsible sections (reduce scrolling)
- Large checkboxes (44×44px)
- "Show Results" button (sticky at bottom)
- Swipe right to close gesture

**Pull-to-Refresh:**
- After applying filters, user can pull down to refresh

### 6. Mobile Search Results Page

**Layout:**
```
┌─────────────────────┐
│  🔍 grade 7 math   │ ← Sticky search bar
├─────────────────────┤
│ [Filter] [Sort ▼]  │ ← Filter + sort buttons
├─────────────────────┤
│ ┌──────┐ ┌──────┐ │ ← 2-column grid
│ │Img   │ │Img   │ │
│ └──────┘ └──────┘ │
│  Load More (20)    │ ← Pagination button
└─────────────────────┘
```

**Key Mobile UX:**
- **2-column grid** (user prefers this over 1 column)
- Large product cards (touch-friendly)
- **"Load More" button** (not infinite scroll)
- Sticky filter/sort bar (easy access)
- Pull-to-refresh gesture

**Infinite Scroll vs Load More:**
- **Recommended**: Load More button
- Better for Philippines (older Android phones)
- Faster on low-end devices
- More control for users

### 7. Mobile Search Bar Input

**Keyboard Optimization:**
- `type="search"` - Shows search icon on keyboard
- `autoComplete="on"` - Browser suggestions
- `autoCorrect="off"` - Don't autocorrect (teacher terms)
- `autoCapitalize="off"` - Lowercase search terms
- `spellCheck="false"` - Don't underline in red

**Mobile Keyboard Actions:**
- iOS: "Search" button (blue, right side)
- Android: "Search" or magnifying glass icon
- Auto-submit when keyboard "Search" tapped

### 8. Touch Targets & Gestures

**All Interactive Elements: Minimum 44×44px**
- Search bar: 56px height
- Filter button: 44×44px
- Sort dropdown: 44×44px
- Product card: Full width (tap anywhere)
- Close button: 44×44px
- Clear filters: 44×44px
- Apply filters: 56px height

**Swipe Gestures:**
- Swipe right on results: Open filter drawer
- Swipe down on suggestions: Close suggestions
- Pull down on results: Refresh search
- Tap outside: Close drawers/modals

### 9. Mobile Performance (Critical!)

**Target: 3G Network Performance**
- Initial HTML: 500ms
- First 4 product images (blur): 800ms
- Full images (lazy load): 2-3s (as user scrolls)
- Total perceived load time: 1.3s ✅ Acceptable

**Optimizations:**
- WebP images (30% smaller than JPEG)
- Progressive loading (blur → sharp)
- CDN delivery (Vercel Edge)
- Minified JavaScript (Next.js automatic)
- Tree-shaking (remove unused code)
- Code splitting (load search JS only when needed)

### 10. Lazy Loading (Mobile Performance)

**✅ YES - Implement Lazy Loading**

**Why Essential:**
- Mobile-first (70%+ Filipino users)
- FAST search (< 1 second perceived)
- PWA experience
- Image-heavy platform

**Implementation:**
- Next.js Image component with `loading="lazy"`
- Blur placeholder while loading
- Responsive image sizes (mobile vs desktop)

**Lazy Load Strategy:**
- **Yes**: Product images in search results (after first 4)
- **Yes**: Product images on category pages (after first 4)
- **Yes**: Preview images on product detail page
- **No**: First 4 product images (above the fold)
- **No**: Hero images
- **No**: Product cover image (detail page)

**Performance Impact:**
- Initial page load: 75% faster (3.2s → 0.8s)
- Largest contentful paint: 57% faster (2.8s → 1.2s)
- 70% lower bounce rate on mobile (industry average)

### 11. PWA Search Experience

**Installable App Features:**
- Full-screen mode (more screen space)
- Home screen icon (quick access to search)
- Offline search history (service worker)
- Push notifications (new products matching searches)

---

## Technical Implementation Summary

### Database Schema Additions

```sql
-- Search analytics tracking
CREATE TABLE search_analytics (
  id UUID PRIMARY KEY,
  product_id UUID REFERENCES products(id),
  search_term VARCHAR(255),
  impressions INTEGER DEFAULT 0,
  clicks INTEGER DEFAULT 0,
  avg_position DECIMAL(4,2),
  date DATE,
  created_at TIMESTAMP
);

CREATE INDEX idx_search_product_date ON search_analytics(product_id, date);

-- Search query tracking (for popular searches)
CREATE TABLE search_queries (
  id UUID PRIMARY KEY,
  query_text VARCHAR(255),
  search_count INTEGER DEFAULT 1,
  last_searched_at TIMESTAMP
);

-- Products table additions
ALTER TABLE products ADD COLUMN language VARCHAR(20) DEFAULT 'english'; -- English, Filipino, Bilingual
ALTER TABLE products ADD COLUMN search_score INTEGER DEFAULT 0; -- For Pro/Pioneer analytics

-- Products table enhancements (from Feature 03, for search)
-- Already has: title, description, grade_id, subject_id, quarter, weeks, product_type, status
```

### API Endpoints

**Search Routes:**
```
GET /api/search - Search products with filters and pagination
GET /api/search/suggestions - Autocomplete suggestions (8 results)
GET /api/search/popular - Popular searches (top 100)
GET /api/search/recent - Recent searches for user
POST /api/search/track - Track search query (for analytics)
```

**Category Routes:**
```
GET /api/categories - List all categories
GET /api/categories/:slug - Category details
GET /api/categories/:slug/products - Products in category
```

**Recommendation Routes:**
```
GET /api/recommendations/related/:productId - Related products
GET /api/recommendations/personalized - Personalized for user
GET /api/recommendations/trending - Trending products
```

**Analytics Routes (Seller Dashboard):**
```
GET /api/seller/analytics/search/:productId - Search analytics for product
GET /api/seller/analytics/search/terms/:productId - Search terms report
GET /api/seller/analytics/search/performance/:productId - Performance score
GET /api/seller/analytics/search/opportunities/:productId - Keyword opportunities
```

### Frontend Routes

**Public Pages:**
- `/` - Homepage (with search bar)
- `/search` - Search results page
- `/products` - All products marketplace
- `/products/:slug` - Product detail page
- `/products/:categorySlug` - Category page
- `/products/:categorySlug/:subcategorySlug` - Subcategory page

**Search Pages:**
- `/search?q=grade+7+math` - Search results with query
- `/search?grade=7&subject=math` - Filtered results

---

## Implementation Checklist

### Phase 1: Core Search Features (Week 16)

**Backend:**
- [ ] Set up PostgreSQL full-text search indexes
- [ ] Implement search API with filters and sorting
- [ ] Add fuzzy search with `pg_trgm`
- [ ] Implement relevance ranking algorithm
- [ ] Create search analytics tracking
- [ ] Set up Redis caching for search results

**Frontend:**
- [ ] Build search bar component with autocomplete
- [ ] Create search results page (grid + list toggle)
- [ ] Implement filter sidebar (desktop) + drawer (mobile)
- [ ] Add sort functionality
- [ ] Create filter chips (active filters)
- [ ] Implement "no results" behavior with suggestions
- [ ] Add "Did you mean?" suggestions
- [ ] Build search history tracking
- [ ] Create popular searches section

**Mobile:**
- [ ] Implement sticky search bar
- [ ] Build filter drawer (full-screen, slide-out)
- [ ] Add search suggestions bottom sheet
- [ ] Implement pull-to-refresh
- [ ] Add touch targets (44×44px minimum)
- [ ] Implement swipe gestures
- [ ] Add "Load More" button (pagination)

### Phase 2: Advanced Features (Week 16-17)

**Category Pages:**
- [ ] Create category page templates
- [ ] Build hero sections for categories
- [ ] Add tabs + breadcrumbs navigation
- [ ] Implement category-specific filters
- [ ] Create featured category pages (high-traffic)
- [ ] Build mobile category navigation

**Recommendations:**
- [ ] Implement "Related Products" on product detail page
- [ ] Build "You Might Also Like" on homepage (Free tier)
- [ ] Build personalized recommendations (Pro/Pioneer)
- [ ] Implement "Similar Products" fallback for no results
- [ ] Create "New from Sellers You Follow" on dashboard

**Lazy Loading:**
- [ ] Implement Next.js Image with `loading="lazy"`
- [ ] Add blur placeholder images
- [ ] Configure responsive image sizes
- [ ] Test on mobile devices

### Phase 3: Analytics & SEO (Week 17)

**Seller Analytics:**
- [ ] Build search terms report (Free tier)
- [ ] Implement average ranking position display
- [ ] Create search performance chart (basic)
- [ ] Build keyword insights (Pro/Pioneer)
- [ ] Implement competitor comparison (anonymized)
- [ ] Create search trend analysis (Pro/Pioneer)
- [ ] Build keyword opportunity report
- [ ] Implement search performance score

**SEO:**
- [ ] Generate SEO-friendly URLs with slugs
- [ ] Implement dynamic meta tags
- [ ] Create XML sitemap
- [ ] Add canonical URLs
- [ ] Create robots.txt
- [ ] Implement Schema.org structured data
- [ ] Optimize category pages for SEO
- [ ] Add alt text to product images

### Phase 4: Performance & Caching (Week 17-18)

**Caching:**
- [ ] Implement Redis caching for search results
- [ ] Create popular searches pre-computation
- [ ] Build cache warming strategy
- [ ] Implement cache invalidation
- [ ] Add edge caching (Vercel)

**Database:**
- [ ] Create all search indexes
- [ ] Optimize slow queries
- [ ] Set up index maintenance schedule

**Monitoring:**
- [ ] Implement search performance tracking
- [ ] Set up alerting for slow searches
- [ ] Create performance dashboard
- [ ] Build analytics reports

---

## Related Features & Dependencies

### Feature 03: Product Listings & Product Management

**Dependency:**
- Basic search already established
- Filter system already built
- Product categorization (grades, subjects, quarters)
- Product metadata (title, description, grade, subject, etc.)

**Enhancement:**
- This feature (08) expands basic search into advanced search
- Adds more filters (Seller Status, Date Added, Language)
- Adds search analytics for sellers
- Improves search algorithm and performance

### Feature 07: Seller Dashboard & Analytics

**Dependency:**
- Seller dashboard already has analytics
- Performance metrics infrastructure exists
- Pro/Pioneer tier differentiation already implemented

**Enhancement:**
- This feature (08) adds search-specific analytics to seller dashboard
- Integrates with existing analytics infrastructure
- Adds new metrics: impressions, CTR, ranking position

### Feature 06: Social Features

**Dependency:**
- Recently viewed items tracking
- Wishlist functionality
- Seller follow system

**Enhancement:**
- This feature (08) uses recently viewed for recommendations
- Uses wishlist data for personalized recommendations
- Uses seller follow data for "New from Sellers You Follow"

---

## Performance Targets

### Search Performance

**Response Time Targets:**
- **Cache hit (popular search)**: 30ms ✅
- **Cache hit (regular search)**: 50ms ✅
- **Cache miss (database query)**: 300-500ms ✅
- **95th percentile**: < 500ms ✅
- **99th percentile**: < 1,000ms ✅

**Cache Hit Rate:**
- Target: > 80% cache hit rate
- Popular searches: 95%+ cache hit rate

### Mobile Performance

**Page Load Targets (3G Network):**
- **Initial HTML**: 500ms ✅
- **First contentful paint**: 800ms ✅
- **Largest contentful paint**: 1.2s ✅
- **Time to interactive**: 1.5s ✅

**Core Web Vitals:**
- **LCP**: < 2.5s ✅
- **FID**: < 100ms ✅
- **CLS**: < 0.1 ✅

### Scalability

**Product Count Targets:**
- **Launch (Month 1)**: 300 products - PostgreSQL handles easily ✅
- **Month 3**: 1,000 products - PostgreSQL handles easily ✅
- **Month 6**: 5,000 products - PostgreSQL handles easily ✅
- **Month 12**: 10,000+ products - PostgreSQL handles easily ✅
- **Year 2**: 50,000+ products - PostgreSQL still viable ✅
- **100,000+ products**: Consider Elasticsearch

---

## Success Metrics

### User Engagement

**Search Usage:**
- **Target**: 70%+ of users use search (vs browse only)
- **Measure**: Search queries / total users

**Search Success Rate:**
- **Target**: 85%+ of searches return results
- **Measure**: Searches with results / total searches

**Zero Results to Conversion:**
- **Target**: 15% of zero-result searches lead to alternative product view
- **Measure**: Clicks on "Popular in [category]" after zero results

### Seller Analytics Adoption

**Free Tier Usage:**
- **Target**: 60%+ of sellers check search analytics monthly
- **Measure**: Sellers viewing analytics / total sellers

**Pro/Pioneer Conversion:**
- **Target**: 20%+ of Free sellers upgrade to Pro for advanced analytics
- **Measure**: Upgrades attributed to analytics feature / total upgrades

### SEO & Organic Traffic

**Organic Search Traffic:**
- **Target**: 40%+ of traffic from organic search (Month 6)
- **Measure**: Organic sessions / total sessions

**Google Rankings:**
- **Target**: Top 10 for "lesson plans Philippines" (Month 6)
- **Target**: Top 5 for "Grade 7 [subject] lesson plans" (Month 12)

**Category Page Traffic:**
- **Target**: 25%+ of sessions visit category pages
- **Measure**: Category page sessions / total sessions

### Performance

**Search Speed:**
- **Target**: 95% of searches complete in < 500ms
- **Target**: 99% of searches complete in < 1,000ms

**Mobile Performance:**
- **Target**: 80%+ mobile users have LCP < 2.5s
- **Target**: < 10% mobile bounce rate due to slow load

---

## Future Enhancements (Phase 2+)

### Deferred Features

**Voice Search (Phase 2):**
- Add microphone icon to search bar
- Use Web Speech API or Google Speech API
- Support Philippine English (`en-PH`)
- Future: Filipino/Tagalog support (`tl-PH`)

**Camera Search (Phase 2):**
- Scan textbook or curriculum guide
- OCR text recognition
- Find related products automatically
- Higher complexity, unclear use case

**Collaborative Filtering (Phase 2):**
- "Teachers who bought this also bought..."
- Requires 1,000+ transactions
- Complex implementation
- Add after 3-6 months of data

**Advanced Filters (Phase 2):**
- File size filters
- Multiple price range presets
- Advanced date range picker
- Seller tier filters

**Search Suggestions AI (Phase 3):**
- ML-powered autocomplete
- Personalized suggestions
- Query intent understanding
- Natural language processing

### Analytics Enhancements

**Export Reports (Pro/Pioneer):**
- CSV export of search terms
- PDF reports with charts
- Weekly/monthly scheduled reports
- Email automation

**Competitor Analysis (Pro/Pioneer):**
- More detailed comparison metrics
- Market positioning insights
- Pricing recommendations
- Keyword gap analysis

**A/B Testing (Admin):**
- Test different search algorithms
- Test filter placements
- Test recommendation strategies
- Measure impact on conversion

---

## Key Takeaways

### What Makes This Search System Special

**1. Filipino Teacher-Centric:**
- Designed for busy teachers, not tech-savvy users
- Simple filters, no advanced syntax
- Handles English + Filipino searches
- Mobile-first (70%+ users)

**2. Fast Performance:**
- Multi-layer caching (Redis + Edge + Pre-computed)
- Sub-500ms response times (95th percentile)
- Lazy loading for instant feel
- Optimized for 3G networks

**3. Seller-Friendly:**
- Clear search analytics
- Actionable recommendations
- Tiered features (Free vs Pro/Pioneer)
- Helps sellers optimize products

**4. SEO-Optimized:**
- Category pages rank in Google
- SEO-friendly URLs with slugs
- Schema.org structured data
- Organic growth focus

**5. Scalable:**
- PostgreSQL handles 10,000-50,000 products easily
- No external search engine needed (saves $300-1,000/month)
- Clear upgrade path to Elasticsearch when needed

### Critical Success Factors

**1. Speed is Everything:**
- Search < 1 second = users stay
- Search > 2 seconds = users leave
- Cache everything possible

**2. Mobile-First is Mandatory:**
- 70%+ Filipino users on mobile
- Optimize for phones, not desktop
- Test on real devices (slow 3G)

**3. Simplicity Wins:**
- Teachers want results, not advanced features
- Filters > Search operators
- Don't overwhelm with options

**4. Data-Driven Iteration:**
- Track every search
- Monitor zero-result searches
- A/B test algorithms
- Listen to seller feedback

**5. SEO is Long-Term Growth:**
- Category pages = organic traffic
- Structured data = higher CTR
- SEO compounds over time

---

## Summary

Feature 08 (Advanced Search & Discovery) transforms the basic search from Feature 03 into a comprehensive, fast, and user-friendly search system optimized for Filipino teachers on mobile devices.

**Key Highlights:**
- ✅ Multi-factor relevance ranking (PostgreSQL full-text search)
- ✅ Simple filter system (no advanced syntax)
- ✅ Grid + list toggle view
- ✅ 11 filter types (3 new additions)
- ✅ Dedicated category pages with tabs + breadcrumbs
- ✅ Multi-strategy recommendations
- ✅ Tiered search analytics (Free vs Pro/Pioneer)
- ✅ Comprehensive SEO strategy
- ✅ Multi-layer caching (sub-500ms response times)
- ✅ Mobile-first design with lazy loading

**Technical Approach:**
- Built on PostgreSQL + Redis (no external search engine)
- Handles 10,000-50,000 products easily
- Sub-second search with proper indexing
- Clear upgrade path to Elasticsearch at 100,000+ products

**User Experience:**
- Fast: < 1 second search results
- Accurate: Multi-factor relevance ranking
- Simple: Filters only, no advanced syntax
- Mobile-first: Optimized for 70%+ Filipino mobile users
- Discoverable: SEO, categories, recommendations

**Seller Benefits:**
- Clear analytics to optimize products
- Search terms report
- Ranking position tracking
- Actionable recommendations (Pro/Pioneer)
- Keyword opportunity insights

**Next Feature:** Feature 09 - Admin Panel (to be discussed in next session)

---

**Document Version:** 1.0
**Last Updated:** January 13, 2026

*All decisions documented. Ready to proceed with implementation planning.*
