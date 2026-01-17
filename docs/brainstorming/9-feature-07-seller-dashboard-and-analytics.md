# Feature 07: Seller Dashboard & Analytics - Design Decisions

**Date:** January 13, 2026
**Feature:** Seller Dashboard & Analytics
**Status:** ✅ DESIGN COMPLETE - Ready for Implementation

---

## Overview

This document captures all decisions made during the brainstorming session for Feature 07: Seller Dashboard & Analytics for AKOMAYLESSONPLANNA.

The seller dashboard is the central hub where teachers manage their business - tracking sales, viewing earnings, managing products, analyzing performance, and making data-driven decisions to grow their income.

**Existing Foundation:**
- Feature 03: Basic product analytics and dashboard foundation
- Feature 04: Order tracking, earnings calculations, payout system
- Feature 05: Review analytics (can be integrated)
- Feature 06: Seller notifications (new sale, new review)

**This Feature Expands:**
- Comprehensive overview dashboard
- Advanced product management (grid view, bulk actions, duplicate)
- Enhanced order history with geographic insights
- Tiered analytics (Free vs Pro/Pioneer - critical for subscriptions)
- Complete navigation system
- Export and reporting capabilities

---

## Decisions Made

### 1. Dashboard Overview Layout ✅

**Decision:** Balanced Overview Dashboard (Option B)

**Main Dashboard Components:**

**Top Section - Metric Cards (4 cards in horizontal row):**
1. **Revenue Card**
   - Current balance: "₱2,340 available"
   - Sparkline trend indicator: 📈 +15% this week
   - Time range: Today | This Week | This Month | All Time | Custom

2. **Sales Count Card**
   - Number of orders: "24 sales"
   - Sparkline: 📈 +8% this week

3. **Product Views Card**
   - Total views: "1,234 views"
   - Sparkline: 📈 +23% this week

4. **Average Rating Card**
   - Overall rating: "4.7★ from 18 reviews"
   - No sparkline (static metric)

**Middle Section - Charts (Tier-Based):**
- **Free tier:** Static 7-day revenue chart (simple line chart, non-interactive)
- **Pro/Pioneer tier:** Interactive revenue chart (zoom, filter, compare time periods)

**Bottom Section - Recent Activity Feed:**
- Last 10 items combined: Sales, new reviews, follower notifications
- Each item: Icon, brief description, time ago, "View" link
- Example: "🎉 New sale: Grade 7 Math DLL sold to Teacher Maria (₱80) • 2 min ago"

**Quick Actions Bar:**
- "Upload Product" button
- "View Orders" button
- "Request Withdrawal" button (disabled if < ₱500, shows "Need ₱XXX more")

**Rationale:**
- Balanced view without overwhelming
- Time range selector lets sellers dive deeper when needed
- Sparklines give Free tier a taste of analytics (upgrade motivation)
- Activity feed combines all notifications in one place
- Quick actions provide easy access to common tasks

**Rejected Options:**
- ❌ Revenue-first dashboard (too narrow focus)
- ❌ Action-oriented dashboard (tasks already in notifications)

---

### 2. Product Management Section ✅

**Decision:** Grid View with Quick Actions (Option B)

**Product Display Options:**

**View Toggle:**
- Switch between Grid view and List view
- Grid view: 2 columns on mobile, 3 on tablet, 4 on desktop
- User preference saved

**Grid View Cards (Default):**
Each product card shows:
- Thumbnail (cover image)
- Product title (truncated to 2 lines)
- Price
- Status badge: Published (green), Draft (blue), Pending (yellow), Rejected (red)
- Mini stats row:
  - 👁️ Views: 1,234
  - 💰 Sales: 24
  - ⭐ Rating: 4.8★
  - 📊 Conversion: 7.2%
- Quick actions (icons):
  - ✏️ Edit (opens edit wizard from Feature 03)
  - 📤 Unpublish/Publish toggle
  - 📋 Duplicate (create similar product faster)
- Performance indicator badges (Pro/Pioneer only):
  - 🔥 "Trending" (if views/sales increased 50%+ this week)
  - ⚠️ "Low conversion" (if conversion rate < 2% and views > 100)

**List View:**
Traditional table with columns:
- Thumbnail | Title | Price | Status | Views | Sales | Rating | Conversion | Actions

**Bulk Actions (Checkbox Mode):**
- Select multiple products via checkboxes
- Bulk actions bar appears: "X selected"
- Actions available:
  - Unpublish selected
  - Delete selected (with confirmation)
  - Move to draft selected

**Duplicate Product Feature:**
- Creates copy of product with "[Copy]" appended to title
- Copies all fields: title, description, files, categorization, pricing
- Reset status to "Draft"
- Seller edits and publishes
- Saves time creating similar products (e.g., Grade 7 Math Q2 → Q3)

**Product Performance Indicators (Pro/Pioneer Only):**
- Trending badge: Views/sales increased 50%+ week-over-week
- Low conversion warning: Conversion rate < 2% with 100+ views
- Price comparison: "Similar products average ₱120 (yours: ₱100)"

**Rationale:**
- Visual grid is faster to scan than table
- Duplicate feature saves huge amount of time
- Performance indicators help sellers improve
- Bulk actions for power users
- Mobile: 2 columns work well on modern phones

**Rejected Options:**
- ❌ Simple list view only (not visual, harder to scan)
- ❌ Inline editing (more complex, modal editing from Feature 03 works well)

---

### 3. Order History & Details ✅

**Decision:** Simple Order List with Location (Option A + location)

**Orders List Display:**

**Table Columns:**
- Order ID (clickable → opens detail modal)
- Date and time
- Product sold (thumbnail + title, linked to product)
- Buyer info: "Teacher Maria M." (anonymized)
- Buyer location: "NCR" or "Cebu" or "Davao" (region only, not city)
- Product price: ₱100
- Commission rate: 20% (or 15% for Pioneer)
- **Net earnings** (prominent, bold): ₱80
- Payment method: GCash/Maya icon
- Order status badge: Completed (green), Pending (yellow), Failed (red)
- Download count: "Downloaded 3 times"

**Order Detail Modal:**

**Modal Content:**
```
Order #ORD-12345
January 11, 2026 at 3:45 PM

PRODUCT
[Thumbnail] Grade 7 Math DLL Q1 Weeks 1-8
Cover image displayed

PRICING
Product price: ₱100
Platform commission (20%): -₱20
─────────────────────
Your earnings: ₱80

BUYER INFORMATION
Teacher Maria M. (anonymized)
Location: NCR
Member since: January 2025
Downloaded: 3 times

PAYMENT
Method: GCash
Status: Completed

[Contact Buyer] (opens messaging - Feature 14)
[View Product Listing] (goes to product page)
```

**Filters:**
- All orders (default)
- Completed orders
- Pending orders
- Failed orders
- Date range picker (Last 7 days, Last 30 days, This month, Last month, Custom)
- Product filter (dropdown of seller's products)
- Location filter (All regions, NCR, Luzon, Visayas, Mindanao)

**Export Order History:**
- "Export to CSV" button
- Exports all filtered orders
- Includes: Order ID, Date, Product, Buyer (anonymized), Location, Price, Commission, Earnings, Payment Method, Status
- Useful for tax purposes and record-keeping

**Rationale:**
- Clean, scannable table
- Location (region) provides useful geographic insights without being invasive
- Modal keeps context (can return to list easily)
- Export essential for business records
- Privacy-first (buyer anonymized)

**Location Data Benefits:**
- Sellers see: "Oh, my products sell well in NCR and Cebu"
- Helps create targeted products for regions
- Not too invasive (no exact city, just region)

**Rejected Options:**
- ❌ Detailed order analytics (buyer's teaching level, traffic source) - too invasive for MVP
- ❌ Full order intelligence (time series charts, repeat customer indicators) - can add later

---

### 4. Earnings & Payouts Section ✅

**Decision:** Split by tier (Free: Option A, Pro/Pioneer: Option B)

**Free Tier - Clean Earnings Display:**

**3 Cards at Top:**
- **Available Balance:** "₱2,340 available for withdrawal"
- **Pending Balance:** "₱560 processing"
- **Lifetime Earnings:** "₱15,780 total"

**Withdrawal Section:**
- "Request Withdrawal" button
- Disabled if available balance < ₱500
- Shows: "Need ₱XXX more to withdraw" when below threshold
- When enabled, opens withdrawal form:
  - Amount input (prefilled with available balance)
  - Payment method selection: GCash (09XX-XXX-XXXX) | Maya (09XX-XXX-XXXX)
  - "Request Withdrawal" button

**Withdrawal History Table:**
- Date | Amount | Method | Status | Notes
- Example rows:
  - Jan 10 | ₱1,500 | GCash | Completed | Sent to 09XX-XXX-XXXX
  - Jan 3 | ₱800 | Maya | Completed | Sent to 09XX-XXX-XXXX
  - Dec 28 | ₱500 | GCash | Processing | Expected by Jan 2

**Commission Reminder:**
- Small text below withdrawal section:
  - "20% commission on all sales (₱20 on ₱100 sale)"
  - Pioneer sellers see: "15% commission (₱15 on ₱100 sale)"

**Pro/Pioneer Tier - Earnings with Visual Charts:**

**Everything in Free tier, plus:**

**Interactive Charts:**
- **Revenue by Month** (bar chart, last 6 months)
- **Sales by Product Category** (pie chart)
  - Breakdown: Lesson Plans (45%), Exams (30%), RPMS (15%), Posters (10%)
- **Earnings Trend** (line chart, last 30 days)
  - Hover to see daily earnings
  - Zoom in on specific date range

**Enhanced Withdrawal Section:**
- Same as Free tier
- PLUS: "Projected earnings this month"
  - Based on current pace: "On track for ₱3,200 this month (+37% vs last month)"

**Monthly Performance Summary (Export to PDF):**
- Beautiful PDF report with:
  - Revenue chart
  - Top 5 products
  - Sales breakdown
  - Comparison to previous month
  - Print-ready, can share or save for records

**Rationale:**
- Free tier meets basic needs (get paid, see history)
- Pro/Pioneer charts feel premium and worth ₱249/month
- Visual analytics provide clear upgrade motivation
- Projected earnings helps sellers plan
- Monthly reports save time (business intelligence)

**Rejected Options:**
- ❌ Full financial dashboard (tax helpers, instant payouts) - defer to post-launch

---

### 5. Analytics Tiers (Free vs Pro/Pioneer) - CRITICAL ✅

**Decision:** Sparklines for Free tier, Full Interactive Charts for Pro/Pioneer

**This is THE KEY subscription motivator.**

### Free Tier Analytics (All Sellers):

**Per-Product Metrics (Table View Only):**
- Views (total, unique)
- Sales count
- Revenue
- Rating (average)
- Reviews count
- Downloads
- Conversion rate (purchases ÷ views × 100%)
- Product status

**Time Period Filters:**
- Today, This Week, This Month, All Time, Custom Range

**Sparklines (Mini Trend Indicators):**
- Small line charts next to each metric
- Shows: 📈 +15% or 📉 -5%
- Example: "Views: 1,234 📈 +23% this week"
- Simple, non-interactive, just visual indicator
- Built with CSS/SVG (no heavy charting libraries)

**Display:**
- Simple table view
- Sortable by any column
- Export to CSV

**Mobile:**
- Sparklines scale well (tiny, don't break layout)

### Pro/Pioneer Tier Analytics:

**ALL Free tier features, plus:**

**Interactive Visual Charts:**

**A) Revenue Over Time (Line Chart)**
- Last 7 days, 30 days, 90 days, This year, Custom
- Zoom, pan, hover for details
- Compare periods (this month vs last month)
- Data points clickable (click day → see orders that day)

**B) Sales by Product (Bar Chart)**
- Top 10 products by revenue
- Horizontal bars (easier to read product names)
- Color-coded by performance:
  - Green: Above average
  - Yellow: Average
  - Red: Below average
- Click bar → go to product details

**C) Sales by Category (Pie Chart)**
- Lesson Plans, Exams, RPMS, Posters, Tarpaulins
- Percentage breakdown
- Hover for details

**D) Conversion Funnel (Funnel Chart)**
- Product views → Add to cart → Purchase
- Shows drop-off at each stage
- Example:
  - Views: 1,000 (100%)
  - Add to cart: 150 (15%)
  - Purchase: 70 (7%)
- Helps identify bottlenecks

**E) Traffic Sources (Bar Chart)**
- Search: 45%
- Homepage: 25%
- Direct link: 20%
- Profile: 10%
- Where buyers found products

**F) Buyer Demographics (Anonymized)**
- Grade levels taught (bar chart)
- - Grade 7: 35%
- - Grade 8: 25%
- - Grade 9: 20%
- Regions (pie chart)
- - NCR: 40%
- - Luzon: 30%
- - Visayas: 20%
- - Mindanao: 10%

**G) Performance Score**
- Each product: 0-100 score
- Based on: views (20%), sales (40%), conversion (20%), rating (20%)
- Badge system:
  - 90+: "Top Product" ⭐⭐⭐
  - 70-89: "Strong Seller" ⭐⭐
  - 50-69: "Average" ⭐
  - Below 50: "Needs Improvement" (no star)

**H) Comparison to Other Sellers (Pro/Pioneer Only)**
- Percentile ranking: "Your Grade 7 Math DLL is in top 20%"
- Performance comparison: "Your conversion rate (7.1%) is above average (4.5%)"
- Privacy-first (no specific seller names, just percentiles)
- Motivational, not discouraging

**I) Performance Recommendations**
- Automated insights based on data:
  - "High views, low conversion - consider lowering price from ₱100 to ₱80"
  - "Grade 7 Math trending - create more products for this grade"
  - "Products with previews sell 3x more - add preview images"
  - "Your response time is 12 hours - faster responses could increase sales"
- Actionable, specific tips

**Export Reports (Pro/Pioneer Only):**
- CSV, Excel (.xlsx), PDF formats
- Monthly performance summary (beautiful PDF)
- Scheduled reports:
  - Email weekly/monthly report automatically
  - "Your weekly performance is ready! You made ₱450 this week 🎉"
  - Configurable (every Monday morning, first of month, etc.)

**Dashboard Layout (Pro/Pioneer):**

**Overview Tab:**
- Summary cards: Revenue, Sales, Products, Rating (with sparklines)
- Main charts: Revenue over time, Sales by product, Traffic sources
- Bottom: Recent orders, Recent reviews

**Products Tab:**
- Product performance table
- Click product → Detailed view (charts, analytics, recommendations)
- Performance score for each product

**Analytics Tab (Pro/Pioneer only):**
- All advanced charts and insights
- Deep dive into metrics
- Comparison tools
- Export and scheduling

**Rationale:**

**Why Sparklines for Free:**
- Cheap to build (CSS/SVG, no heavy libraries)
- Give Free sellers a "taste" of trends
- Pro charts are FULLY interactive = clear upgrade value
- Sparklines work great on mobile (tiny, don't break layout)
- Keeps Free tier functional but Pro feels premium

**Why Pro/Pioneer gets Full Analytics:**
- Charts and visualizations feel premium
- Actionable insights (recommendations) provide real value
- Percentile comparisons create motivation (not discouragement)
- Scheduled reports save time (worth ₱249/month)
- Clear subscription motivation

**Subscription Motivation:**
- Free seller sees sparkline: "Views: 1,234 📈 +23%"
- Thinks: "Interesting, but I don't know WHY it increased"
- Pro preview: "See detailed charts, traffic sources, and recommendations"
- Clicks preview → Sees beautiful interactive charts
- Thinks: "This is amazing! Worth ₱249/month to grow my business"
- Upgrades to Pro

**Rejected Options:**
- ❌ Zero charts for Free (feels crippled, bad UX)
- ❌ Basic charts for Free (static charts feel incomplete, not enough upgrade motivation)
- ❌ Same charts for all tiers (no subscription motivation)

---

### 6. Performance Metrics & KPIs ✅

**Decision:** Essential + Engagement Metrics (Option B), split by tier

### Free Tier Metrics (Top 6):

**Main Dashboard Shows:**
1. **Total Revenue** - Current month + sparkline trend
2. **Net Earnings** - After commission
3. **Orders/Sales Count** - Number of products sold
4. **Products Count** - Published products only
5. **Average Rating** - Overall seller rating
6. **Product Views** - Total views across all products
7. **Conversion Rate** - Views to purchases percentage

**All metrics show:**
- Current value
- Time period selector (Today, This Week, This Month, All Time)
- Sparkline trend indicator (📈 +15% or 📉 -5%)

### Pro/Pioneer Tier Metrics (All 10+):

**Everything in Free tier, plus:**
8. **Repeat Customer Rate** - Percentage of buyers who purchased multiple times
9. **Average Order Value** - Average amount per order
10. **Response Time** - Average time to respond to buyer messages
11. **Follower Count** - From Feature 02 (social features)
12. **Wishlist Adds** - How many times products saved (demand indicator)
13. **Profile Views** - How many times seller profile viewed
14. **Traffic Sources** - Where buyers find products (search, homepage, direct)
15. **Active Products** - Published vs Draft ratio

**Percentile Rankings (Pro/Pioneer Only):**
- "Your Grade 7 Math DLL is in top 20% of similar products"
- "Your conversion rate (7.1%) is above average (4.5%)"
- "You're in the top 10% of sellers this month"
- Privacy-first (no specific seller names)
- Motivational, not discouraging

**Should we rank/compare sellers to each other?**
- **YES for Pro/Pioneer** - Percentiles create motivation
- **NO for Free** - Keep it simple, focus on own metrics

**Rationale:**
- Conversion rate is critical - helps sellers optimize
- Response time + followers = social proof
- Wishlist adds = product demand indicator
- Percentile rankings = "you're doing better than 80%" → motivation
- Don't overwhelm Free tier, but don't cripple them
- Pro/Pioneer gets business intelligence

**Rejected Options:**
- ❌ Essential metrics only (missing engagement data)
- ❌ Comprehensive metrics (too overwhelming for MVP)

---

### 7. Dashboard Navigation ✅

**Decision:** Sidebar Navigation (Option A) with Mobile Enhancement

### Desktop Navigation:

**Fixed Sidebar (Left side):**
- 280px wide
- Collapsible to narrow icons-only (75px)
- User profile at bottom (avatar, name, role badge)
- Sections (top to bottom):
  1. 🏠 Overview (main dashboard)
  2. 📦 Products (product management)
  3. 📋 Orders (sales history)
  4. 💰 Earnings (payouts)
  5. 📊 Analytics (Pro/Pioneer badge shown)
  6. ⭐ Reviews (from Feature 05)
  7. 💬 Messages (from Feature 14)
  8. ⚙️ Settings

**Active Section Highlighted:**
- Bold text, left border indicator (4px blue bar)
- Background color slightly darker

**Breadcrumbs:**
- Top of page: "Dashboard > Products" or "Dashboard > Orders > #ORD-12345"
- Clickable to navigate back
- Helps with orientation

### Mobile Navigation:

**Bottom Tab Bar (PWA style):**
- Fixed at bottom of screen
- 5 icons (most important sections):
  1. 🏠 Home (Overview)
  2. 📦 Products
  3. 📋 Orders
  4. 💰 Earnings
  5. 👤 Profile (Settings, Messages, Reviews accessible from here)
- Analytics accessible from Profile (Pro/Pioneer badge shown)
- Active tab highlighted (blue icon)
- Standard mobile pattern (Instagram, Facebook, Twitter)

**Slide-Out Menu (Alternative):**
- Hamburger menu at top-left
- Full-screen navigation when opened
- Shows all sections (including Analytics)
- Swipe to close

**We chose Bottom Tab Bar:**
- More accessible (thumb-friendly)
- Always visible (no extra tap to access)
- Familiar pattern (Instagram, Facebook app)
- Faster navigation

**Rationale:**
- Sidebar scales better with many sections (can add more later)
- Teachers Pay Teachers uses sidebar - familiar to target users
- Breadcrumbs show location clearly
- Mobile: Bottom tab bar is best practice for PWAs
- Both patterns industry-standard and proven

**Rejected Options:**
- ❌ Top tab navigation (tabs get cramped with 5+ sections)
- ❌ Card-based navigation (doesn't scale, harder to navigate)

---

### 8. Data Strategy: Real-Time vs Cached ✅

**Decision:** Smart Hybrid Approach (Option C)

### Caching Strategy:

**Dashboard Overview:**
- Metric cards: **15-minute cache**
- Charts: **15-minute cache**
- Activity feed: **5-minute cache**
- Reason: Data doesn't change that frequently; 15 minutes is acceptable

**Orders Page:**
- Orders list: **5-minute cache**
- Order details: **No cache** (fresh data)
- "Refresh" button available (pulls fresh data immediately)
- Reason: Orders come in throughout the day; 5-minute balance

**Products Page:**
- Products list: **10-minute cache**
- Product stats (views, sales): **15-minute cache**
- Reason: Product performance updates slowly

**Analytics Data:**
- Calculation-heavy queries: **Pre-calculated nightly**
- Quick metrics (today's sales): **15-minute cache**
- Charts: **15-minute cache**
- Reason: Analytics don't need real-time accuracy

### Real-Time Push Notifications:

**From Feature 06 (already implemented):**
- Instant notifications for:
  - "You made a sale! 🎉 ₱80 from Grade 7 Math DLL"
  - "New 5-star review on Grade 7 Science Exam"
  - "Teacher Maria started following you"
- Push notification → Click → Opens app → Dashboard refreshes automatically
- Sellers trust notifications, not constant refreshing

### Smart Hybrid Flow:

**Example:**
1. Teacher is checking Facebook on phone
2. Push notification arrives: "You made a sale! 🎉 ₱80 from Grade 7 Math DLL"
3. Teacher gets excited, taps notification
4. App opens, dashboard refreshes automatically (shows latest data)
5. Teacher sees new order in activity feed
6. Feels excited and motivated

**Why This Works:**
- Notifications create **emotional excitement** (instant gratification)
- Dashboard shows **accurate-enough data** (15-minute cache is fine)
- No need for WebSockets or Server-Sent Events (complexity)
- Massive performance savings (caching reduces database load)
- Sellers don't obsessively refresh (check dashboard a few times/day, not every minute)

### "Refresh" Button:

**Available on all dashboard pages:**
- Top-right of page: "🔄 Refresh"
- Pull-to-refresh on mobile (standard pattern)
- Clicking/pulling fetches fresh data immediately
- Useful when seller expects new data

**Rationale:**
- Real-time dashboards are overkill for this use case
- Teachers check dashboard a few times/day, not every minute
- Feature 06 already has notification system (use it!)
- Cached data = fast page loads
- Notifications provide real-time feel without real-time infrastructure
- Huge cost savings (database queries reduced by 90%+)

**Performance Benefits:**
- Database query load: Reduced by 90%+
- Page load time: < 500ms (vs 3-5 seconds for real-time)
- Server costs: Much lower (Vercel/Supabase free tier sufficient longer)
- User experience: Faster, more responsive

**Rejected Options:**
- ❌ Real-time dashboard (expensive, overkill)
- ❌ Simple cached data (no notification excitement factor)

---

### 9: Mobile Dashboard Experience ✅

**Decision:** Full Dashboard Mobile (Option B) with 2-column grid

**Philosophy:**
- 70%+ of Filipino users on mobile
- This IS the primary experience, not secondary
- Mobile users need full dashboard functionality
- Responsive + PWA = app-like experience

### Mobile Layout:

**Bottom Tab Bar (5 icons):**
- Fixed at bottom
- Always accessible
- Home | Products | Orders | Earnings | Profile
- Active tab highlighted (blue icon)
- Pro/Pioneer badge on Analytics (accessible from Profile)

**Main Dashboard (Overview) on Mobile:**
- Metric cards: **Stacked vertically** (one per row)
- Each card takes full width
- Sparkline visible next to metric
- Tap card → Expand to see more details
- Charts:
  - Free tier: Static chart, tap to expand fullscreen
  - Pro/Pioneer: Interactive chart, pinch to zoom, tap for details
- Activity feed: Single column list
- Quick actions: Large buttons below activity feed

**Products Grid on Mobile:**
- **2 columns** (user choice, not default 1)
- Product cards compact but readable
- Thumbnail, title (2 lines max), price, status badge
- Stats shown as icons + numbers:
  - 👁️ 1.2K | 💰 24 | ⭐ 4.8
- Tap card → Opens bottom sheet with quick actions:
  - Edit | Unpublish | Duplicate | Delete
- Swipe actions on cards:
  - Swipe left = Quick actions menu
  - Swipe right = Select (for bulk actions)

**Orders List on Mobile:**
- Single column list
- Each order shows:
  - Product thumbnail (small, left)
  - Product title + buyer info (right)
  - Net earnings (prominent)
  - Status badge (pill)
- Tap order → Opens detail modal (fullscreen)
- Filters: Horizontal scrollable chips at top
  - [All] [Completed] [Pending] [This Month]

**Earnings on Mobile:**
- 3 metric cards stacked vertically
- Withdrawal button large, prominent
- Charts: Tap to expand fullscreen
- Withdrawal history: Simple table (scrollable)

**Analytics on Mobile (Pro/Pioneer):**
- Charts take full width
- Tap chart → Expand to fullscreen (interactive)
- Landscape mode: Rotate phone for better chart viewing
- Export reports: "Email report" button (easier than download on mobile)

### Mobile Optimizations:

**Pull-to-Refresh:**
- All dashboard pages support pull-to-refresh
- Standard mobile gesture (pull down from top)
- Spinner appears, data refreshes
- "Last updated: 2 minutes ago" shown at top

**Swipe Actions:**
- Products: Swipe left = actions, swipe right = select
- Orders: Swipe left = view details
- Fast, intuitive gestures

**Bottom Sheets:**
- Tap product → Bottom sheet slides up
- Shows: Quick actions, mini stats, "View full details" button
- Swipe down to dismiss
- Common mobile pattern (iOS, Android)

**Large Touch Targets:**
- Minimum 44x44px (iOS/Android guideline)
- Buttons easy to tap
- No tiny links

**Performance:**
- Lazy load charts (only load when visible)
- Optimize images (WebP, compression)
- Minimal JavaScript (fast page loads)

**Progressive Enhancement:**
- Core functionality works offline (view cached dashboard)
- Sync when back online
- PWA features: Add to home screen, full-screen mode

**2-Column Grid on Mobile:**
- User's choice (we decided this in the discussion)
- Modern phones have larger screens (iPhone 14 Pro Max, Samsung Galaxy S23 Ultra)
- 2 columns utilize screen space better
- Still readable (cards compact but not cramped)
- Fallback to 1 column on smaller phones (iPhone SE, older Androids)

**Rationale:**
- Mobile users need full functionality (not crippled)
- PWA + responsive design = app-like experience
- Filipino teachers rely on phones (this is PRIMARY, not secondary)
- Bottom tab bar is best practice for mobile apps
- 2-column grid works well on modern phones
- Swipe actions and pull-to-refresh = native app feel

**Rejected Options:**
- ❌ Simplified mobile view (cripples mobile users)
- ❌ 1-column grid only (wastes screen space on modern phones)

---

### 10. Export & Reports ✅

**Decision:** Split by tier (Free: Option A, Pro/Pioneer: Option B)

### Free Tier Exports:

**Basic Exports Available:**

**Order History Export:**
- Format: **CSV only**
- Includes: Order ID, Date, Product (title, ID), Buyer (anonymized), Location, Price, Commission, Net Earnings, Payment Method, Status
- Custom date range selector
- "Export Order History" button on Orders page
- Useful for tax records and bookkeeping

**Product List Export:**
- Format: **CSV only**
- Includes: Title, ID, Price, Status, Views, Sales, Revenue, Rating, Reviews, Conversion Rate, Created Date
- "Export Products" button on Products page

**Earnings Report Export:**
- Format: **CSV only**
- Includes: Date range, Total Revenue, Commission Deducted, Net Earnings, Withdrawals, Current Balance
- "Export Earnings" button on Earnings page

**All CSV exports:**
- Open in Excel, Google Sheets, Numbers
- Comma-separated values
- UTF-8 encoding (Filipino characters supported)
- Downloadable file, not emailed

### Pro/Pioneer Tier Exports:

**Everything in Free tier, plus:**

**Multiple Formats:**
- **CSV** (same as Free)
- **Excel (.xlsx)** - Formatted spreadsheet with:
  - Multiple sheets (Orders, Products, Earnings)
  - Formatted columns (currency, dates, percentages)
  - Charts on summary sheet
  - Professional appearance
- **PDF** - Print-ready reports with:
  - Company branding (AKOMAYLESSONPLANNA logo)
  - Charts and visualizations
  - Summary metrics at top
  - Detailed data tables below
  - Professional, can share with stakeholders

**Analytics Report (PDF):**
- Monthly performance summary
- Beautiful layout with:
  - Revenue chart (last 6 months)
  - Top 5 products table
  - Sales breakdown by category
  - Traffic sources pie chart
  - Key metrics summary
  - Comparison to previous month
- "Generate Monthly Report" button on Analytics page
- Select month/year to generate
- Download or email report

**Scheduled Reports (Time-Saver!):**
- **Email weekly/monthly report automatically**
- Configuration:
  - Frequency: Weekly (every Monday) or Monthly (1st of month)
  - Format: PDF attachment
  - Content: Performance summary, charts, insights
- Example email:
  - Subject: "Your weekly performance report is ready! 📊"
  - Body:
    ```
    Hi Teacher Maria,

    Your weekly performance report is attached.

    This week you made ₱450 from 6 sales! 🎉

    Highlights:
    - Your Grade 7 Math DLL is trending (↑ 50% views)
    - You're in the top 15% of sellers this week

    Keep up the great work!

    AKOMAYLESSONPLANNA
    ```
- PDF attached: Full report with charts and tables
- Saves time (don't need to log in to check performance)

**Custom Date Range for Exports:**
- All exports support custom date range
- "From [date picker] To [date picker]"
- Useful for quarterly reports, annual summaries

**Export Features:**
- All exports include seller info (name, ID for reference)
- Automatic filename: `akomaylessonplanna-orders-2026-01-13.csv`
- Export history (recent exports listed, can re-download)
- Export limits: Max 10,000 rows per export (pagination for larger datasets)

### Rationale:

**Free Tier:**
- CSV meets everyone's basic needs (tax, record-keeping)
- Opens in any spreadsheet software
- Simple to implement and maintain

**Pro/Pioneer Tier:**
- PDF reports feel premium → upgrade motivation
- Excel format with charts = professional
- Scheduled reports save time (worth ₱249/month for busy teachers)
- Multiple formats = flexibility

**Subscription Motivation:**
- Free seller: "I can export CSV, good enough for taxes"
- Pro seller: "Wow, beautiful PDF reports + automatic weekly emails! Worth every peso."

**Rejected Options:**
- ❌ Comprehensive reporting suite (tax reports, custom report builder) - too complex for MVP
- ❌ No exports for Free tier (cripples basic functionality)

---

## Technical Implementation Details

### Database Schema Updates

**New tables needed:**

**1. Dashboard Metrics Cache (Optional - for performance):**
```sql
CREATE TABLE seller_metrics_cache (
  seller_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  metric_type VARCHAR(50) NOT NULL, -- 'revenue', 'sales', 'views', etc.
  time_period VARCHAR(20) NOT NULL, -- 'today', 'week', 'month', 'all'
  value DECIMAL(15,2) NOT NULL,
  previous_value DECIMAL(15,2), -- For trend calculation
  last_calculated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMP NOT NULL DEFAULT (NOW() + INTERVAL '15 minutes')
);

CREATE INDEX idx_metrics_cache_seller ON seller_metrics_cache(seller_id);
CREATE INDEX idx_metrics_cache_expires ON seller_metrics_cache(expires_at);
```

**2. Export Jobs (for async export generation):**
```sql
CREATE TABLE export_jobs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  export_type VARCHAR(50) NOT NULL, -- 'orders', 'products', 'earnings', 'analytics_report'
  format VARCHAR(10) NOT NULL, -- 'csv', 'xlsx', 'pdf'
  date_from DATE,
  date_to DATE,
  status VARCHAR(20) NOT NULL DEFAULT 'pending', -- 'pending', 'processing', 'completed', 'failed'
  file_url TEXT, -- Download link when completed
  error_message TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMP
);

CREATE INDEX idx_export_jobs_user ON export_jobs(user_id);
CREATE INDEX idx_export_jobs_status ON export_jobs(status);
```

**3. Scheduled Reports (Pro/Pioneer):**
```sql
CREATE TABLE scheduled_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  report_type VARCHAR(50) NOT NULL, -- 'weekly_performance', 'monthly_summary'
  frequency VARCHAR(20) NOT NULL, -- 'weekly', 'monthly'
  format VARCHAR(10) NOT NULL DEFAULT 'pdf', -- 'pdf', 'xlsx'
  is_active BOOLEAN DEFAULT true,
  next_send_at TIMESTAMP NOT NULL,
  last_sent_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_scheduled_reports_user ON scheduled_reports(user_id);
CREATE INDEX idx_scheduled_reports_next ON scheduled_reports(next_send_at);
```

**Existing tables enhancements:**

**`products` table** - Already has most analytics fields from Feature 03:
```sql
-- Already exists:
views_count INTEGER DEFAULT 0,
sales_count INTEGER DEFAULT 0,
avg_rating DECIMAL(3,2),
reviews_count INTEGER DEFAULT 0,
conversion_rate DECIMAL(5,2),
```

**`orders` and `order_items`** - Already has detailed breakdown from Feature 04:
```sql
-- Already exists:
total_amount DECIMAL(10,2),
total_commission DECIMAL(10,2),
net_earnings DECIMAL(10,2),
```

### API Endpoints

**Dashboard Endpoints:**

```
GET /api/seller/dashboard/overview
- Get dashboard overview data
- Query params: time_period (today, week, month, all)
- Response: Summary metrics, recent activity, chart data
- Auth required (seller only)

GET /api/seller/dashboard/metrics/:metricType
- Get specific metric with historical data
- Params: metricType (revenue, sales, views, etc.), time_period, days
- Response: Current value, historical data points for chart
- Auth required (seller only)

GET /api/seller/dashboard/activity-feed
- Get recent activity feed items
- Query params: limit (default 20), offset
- Response: List of activity items (sales, reviews, followers)
- Auth required (seller only)

POST /api/seller/dashboard/refresh
- Force refresh dashboard data (bypasses cache)
- Response: Fresh dashboard data
- Auth required (seller only)
```

**Product Management Endpoints:**

```
GET /api/seller/products
- Get seller's products with stats
- Query params: status, sort_by, sort_order, page, per_page
- Response: List of products with views, sales, rating, conversion
- Auth required (seller only)

POST /api/seller/products/duplicate/:productId
- Duplicate a product
- Creates draft copy with "[Copy]" appended to title
- Response: New product object
- Auth required (seller only)

PUT /api/seller/products/bulk
- Bulk action on multiple products
- Body: { product_ids: UUID[], action: 'unpublish'|'delete'|'publish' }
- Response: Success message with affected count
- Auth required (seller only)

GET /api/seller/products/:productId/performance
- Get detailed product performance (Pro/Pioneer only)
- Response: Advanced metrics, charts, comparisons, recommendations
- Auth required (Pro/Pioneer seller only)
```

**Orders Endpoints:**

```
GET /api/seller/orders
- Get seller's order items
- Query params: status, date_from, date_to, product_id, location, page, per_page
- Response: List of order items with buyer info (anonymized), location
- Auth required (seller only)

GET /api/seller/orders/:orderItemId
- Get detailed order item info
- Response: Full order details, pricing breakdown, buyer info
- Auth required (seller only)
```

**Earnings Endpoints:**

```
GET /api/seller/earnings
- Get seller's earnings dashboard
- Response: Current balance, pending balance, total earnings, chart data (Pro/Pioneer)
- Auth required (seller only)

GET /api/seller/earnings/projected
- Get projected earnings for current month (Pro/Pioneer only)
- Response: Projected amount, pace, comparison to last month
- Auth required (Pro/Pioneer seller only)

POST /api/seller/withdrawal
- Request withdrawal
- Body: { amount: decimal, payment_method: 'gcash'|'maya' }
- Validates minimum threshold (₱500)
- Creates withdrawal request, processes via GCash/Maya Disbursement API
- Response: Withdrawal details
- Auth required (seller only)

GET /api/seller/withdrawals
- Get withdrawal history
- Response: List of withdrawals with status
- Auth required (seller only)
```

**Analytics Endpoints (Pro/Pioneer):**

```
GET /api/seller/analytics/revenue
- Get revenue analytics
- Query params: time_period, group_by (day, week, month)
- Response: Revenue data points for chart, comparison to previous period
- Auth required (Pro/Pioneer seller only)

GET /api/seller/analytics/products
- Get product performance analytics
- Response: Top products, worst products, sales by category, performance scores
- Auth required (Pro/Pioneer seller only)

GET /api/seller/analytics/traffic
- Get traffic sources analytics
- Response: Traffic sources breakdown chart
- Auth required (Pro/Pioneer seller only)

GET /api/seller/analytics/demographics
- Get buyer demographics (anonymized)
- Response: Grade levels, regions, repeat customer rate
- Auth required (Pro/Pioneer seller only)

GET /api/seller/analytics/comparison
- Get comparison to other sellers (percentile rankings)
- Response: Percentile rankings, benchmarks, "above/below average" indicators
- Auth required (Pro/Pioneer seller only)

GET /api/seller/analytics/recommendations
- Get performance recommendations
- Response: List of actionable tips based on data
- Auth required (Pro/Pioneer seller only)
```

**Export Endpoints:**

```
POST /api/seller/export
- Request export generation
- Body: { export_type, format, date_from, date_to }
- Creates async export job
- Response: Export job ID
- Auth required (seller only)

GET /api/seller/export/:jobId
- Get export job status
- Response: Status, file_url (if completed), error_message (if failed)
- Auth required (seller only)

GET /api/seller/export/:jobId/download
- Download exported file
- Response: File stream (CSV, Excel, or PDF)
- Auth required (seller only)

POST /api/seller/reports/schedule
- Schedule automated reports (Pro/Pioneer only)
- Body: { report_type, frequency, format }
- Response: Scheduled report object
- Auth required (Pro/Pioneer seller only)

GET /api/seller/reports/scheduled
- Get scheduled reports (Pro/Pioneer only)
- Response: List of scheduled reports
- Auth required (Pro/Pioneer seller only)

PUT /api/seller/reports/scheduled/:reportId
- Update scheduled report (Pro/Pioneer only)
- Body: { frequency, format, is_active }
- Response: Updated scheduled report
- Auth required (Pro/Pioneer seller only)

DELETE /api/seller/reports/scheduled/:reportId
- Cancel scheduled report (Pro/Pioneer only)
- Response: Success message
- Auth required (Pro/Pioneer seller only)
```

### Frontend Routes

**Seller Dashboard Routes:**
- `/dashboard` - Overview (main dashboard)
- `/dashboard/products` - Product management
- `/dashboard/products/new` - Upload new product (from Feature 03)
- `/dashboard/products/:productId/edit` - Edit product (from Feature 03)
- `/dashboard/orders` - Orders list
- `/dashboard/orders/:orderItemId` - Order detail modal
- `/dashboard/earnings` - Earnings & payouts
- `/dashboard/analytics` - Advanced analytics (Pro/Pioneer only)
- `/dashboard/reviews` - Reviews management (from Feature 05)
- `/dashboard/settings` - Account settings

**Mobile Routes (same, different layout):**
- All routes accessible on mobile
- Bottom tab bar navigation
- Mobile-specific components (swipe actions, pull-to-refresh, bottom sheets)

### Caching Strategy

**Cache TTL (Time To Live):**

**Dashboard Overview:**
- Metric cards: 15 minutes
- Activity feed: 5 minutes
- Charts: 15 minutes

**Orders Page:**
- Orders list: 5 minutes
- Order details: No cache (fresh)

**Products Page:**
- Products list: 10 minutes
- Product stats: 15 minutes

**Analytics:**
- Pre-calculated nightly for heavy queries
- Quick metrics: 15 minutes
- Charts: 15 minutes

**Cache Invalidation:**
- Manual refresh: Clear cache immediately
- New order: Invalidate orders cache
- New sale: Invalidate dashboard metrics cache
- Product update: Invalidate products cache

**Implementation:**
- Use Redis for caching (Vercel Edge Config or separate Redis instance)
- Cache key pattern: `seller:{seller_id}:dashboard:{time_period}`
- Background jobs to pre-calculate heavy analytics (nightly)

---

## User Interface Components

### 1. Dashboard Overview Component

**Route:** `/dashboard`

**Layout (Desktop):**
```
┌────────────┬─────────────────────────────────────────┐
│            │  Overview               [🔄 Refresh]     │
│   Sidebar  │  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│            │                                           │
│  🏠 Home   │  [Time Range: This Month ▼]              │
│  📦 Prod   │                                           │
│  📋 Orders │  ┌────────┐  ┌────────┐  ┌─────────┐   │
│  💰 Earn   │  │ Revenue│  │ Sales  │  │ Views   │   │
│  📊 Anal   │  │ ₱2,340 │  │  24    │  │ 1,234   │   │
│  ⭐ Rev    │  │ 📈+15% │  │ 📈+8%  │  │ 📈+23%  │   │
│  💬 Msg    │  └────────┘  └────────┘  └─────────┘   │
│  ⚙️ Set    │                                           │
│            │  ┌─────────┐  ┌────────┐                 │
│            │  │ Rating  │  │This Wk │                 │
│            │  │  4.7★   │  │Chart📊 │                 │
│            │  │18 reviews│  │[interactive]│          │
│            │  └─────────┘  └────────┘                 │
│            │                                           │
│  👤 Prof   │  Recent Activity                         │
│  Maria M.  │  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│  📷        │                                           │
│            │  🎉 New sale: Grade 7 Math DLL            │
│            │     sold to Teacher Maria (₱80)          │
│            │     2 min ago [View]                     │
│            │                                           │
│            │  ⭐ New 5-star review on Science Exam    │
│            │     from Teacher Juan                    │
│            │     15 min ago [View]                    │
│            │                                           │
│            │  👤 Teacher Ana started following you     │
│            │     1 hour ago [View Profile]            │
│            │                                           │
│            │  Quick Actions:                          │
│            │  [Upload Product] [View Orders]          │
│            │  [Request Withdrawal]                    │
│            │                                           │
└────────────┴─────────────────────────────────────────┘
```

**Mobile Layout:**
- Bottom tab bar instead of sidebar
- Metric cards stacked vertically (one per row)
- Charts fullscreen when tapped
- Activity feed single column
- Pull-to-refresh

---

### 2. Products Grid Component

**Route:** `/dashboard/products`

**Grid View (Desktop - 4 columns):**
```
┌────────────┬─────────────────────────────────────────┐
│            │  Products          [Grid⚬] [List⚪]     │
│   Sidebar  │  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│            │                                           │
│  📦 Prod   │  Filter: [All Status ▼] [All Types ▼]   │
│            │  Search: [Search products...]            │
│            │                                           │
│            │  ☑ Select All (0 selected)              │
│            │                                           │
│  ┌─────┐  │  ┌────────────┐  ┌────────────┐         │
│  │Card │  │  │ [Thumbnail]│  │ [Thumbnail]│         │
│  │     │  │  │ Grade 7    │  │ Science    │         │
│  │View │  │  │ Math DLL   │  │ Periodical │         │
│  └─────┘  │  │ Q1 Weeks 1-8│ │ Exam       │         │
│            │  │ ₱100  🟢 Pub│  │ ₱50  🟢 Pub│         │
│            │  │ 👁1.2K💰24⭐4.8│ │ 👁856💰12⭐4.5│      │
│            │  │ 📊7.2%      │  │ 📊6.1%      │         │
│            │  │ [✏️][📤][📋]│  │ [✏️][📤][📋]│         │
│            │  └────────────┘  └────────────┘         │
│            │                                           │
│            │  ┌────────────┐  ┌────────────┐         │
│            │  │ [Thumbnail]│  │ [Thumbnail]│         │
│            │  │ RPMS Cover │  │ Filipino   │         │
│            │  │ Safari     │  │ Lesson Plan│         │
│            │  │ Theme      │  │ Grade 8    │         │
│            │  │ ₱75  🔵 Draft│  │ ₱120 🟢 Pub│         │
│            │  │ 👁456💰0⭐0.0│  │ 👁2.3K💰38⭐4.9│      │
│            │  │ 📊0.0%      │  │ 📊8.3%      │         │
│            │  │ [✏️][📤][📋]│  │ [✏️][📤][📋]│         │
│            │  └────────────┘  └────────────┘         │
│            │                                           │
│            │  [Load more products...]                 │
└────────────┴─────────────────────────────────────────┘
```

**Mobile (2 columns):**
- 2 cards per row
- Compact but readable
- Tap card → Bottom sheet with actions
- Swipe left = Quick actions menu
- Swipe right = Select for bulk actions

---

### 3. Orders List Component

**Route:** `/dashboard/orders`

**Table View (Desktop):**
```
┌────────────┬─────────────────────────────────────────┐
│            │  Orders                 [Export CSV]    │
│   Sidebar  │  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│            │                                           │
│  📋 Orders │  Filter: [All ▼] [Completed] [Pending]  │
│            │  Date: [Last 30 days ▼]                  │
│            │  Location: [All regions ▼]               │
│            │                                           │
│            │  ┌─────────────────────────────────────┐ │
│            │  │ Order ID  │ Product  │ Buyer  │Earn │ │
│            │  │ ORD-12345 │ [Img] G7 │ Maria M│₱80 │ │
│            │  │ Jan 11    │ Math DLL │ NCR   │    │ │
│            │  │ [View]    │ ₱100     │ [Detail]│    │ │
│            │  └─────────────────────────────────────┘ │
│            │                                           │
│            │  ┌─────────────────────────────────────┐ │
│            │  │ ORD-12346 │ [Img] Sci│ Juan B │₱40 │ │
│            │  │ Jan 10    │ Exam     │ Cebu   │    │ │
│            │  │ [View]    │ ₱50      │ [Detail]│    │ │
│            │  └─────────────────────────────────────┘ │
│            │                                           │
│            │  [Load more orders...]                   │
└────────────┴─────────────────────────────────────────┘
```

**Order Detail Modal:**
```
┌──────────────────────────────────────────┐
│ Order #ORD-12345        [×] Close        │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│                                           │
│ January 11, 2026 at 3:45 PM              │
│                                           │
│ PRODUCT                                   │
│ [Thumbnail] Grade 7 Math DLL Q1 Weeks 1-8 │
│                                           │
│ PRICING                                   │
│ Product price:    ₱100                   │
│ Platform commission (20%): -₱20          │
│ Net earnings:     ₱80                    │
│                                           │
│ BUYER INFORMATION                         │
│ Teacher Maria M. (anonymized)            │
│ Location: NCR                             │
│ Member since: January 2025               │
│ Downloaded: 3 times                      │
│                                           │
│ PAYMENT                                   │
│ Method: GCash                             │
│ Status: ✅ Completed                     │
│                                           │
│ [Contact Buyer] [View Product Listing]    │
└──────────────────────────────────────────┘
```

**Mobile:**
- Single column list
- Each order: Thumbnail + Title + Buyer + Earnings
- Tap → Fullscreen modal
- Filters: Horizontal scrollable chips

---

### 4. Earnings Dashboard Component

**Route:** `/dashboard/earnings`

**Layout:**
```
┌────────────┬─────────────────────────────────────────┐
│            │  Earnings & Payouts                      │
│   Sidebar  │  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│            │                                           │
│  💰 Earn   │  ┌──────────┐  ┌──────────┐  ┌────────┐│
│            │  │Available │  │ Pending  │  │Lifetime││
│            │  │  ₱2,340  │  │  ₱560    │  │ ₱15,780││
│            │  └──────────┘  └──────────┘  └────────┘│
│            │                                           │
│            │  [Request Withdrawal] (enabled)          │
│            │                                           │
│            │  Earnings Breakdown:                     │
│            │  This Week:   ██████  ₱450              │
│            │  This Month:  ████████████ ₱2,340       │
│            │  All Time:    ██████████████ ₱15K       │
│            │                                           │
│            │  Pro/Pioneer Features:                   │
│            │  ┌────────────────────────────────┐      │
│            │  │ Revenue by Month (Bar Chart)   │      │
│            │  │ ████████████████████          │      │
│            │  │ [Interactive chart]            │      │
│            │  └────────────────────────────────┘      │
│            │                                           │
│            │  Withdrawal History:                     │
│            │  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│            │  Date        Amount  Method  Status      │
│            │  Jan 10      ₱1,500  GCash   ✅ Done    │
│            │  Jan 3       ₱800    Maya    ✅ Done    │
│            │  Dec 28      ₱500    GCash   ⏳ Processing│
│            │                                           │
│            │  Commission reminder:                     │
│            │  20% commission (₱20 on ₱100 sale)       │
└────────────┴─────────────────────────────────────────┘
```

**Withdrawal Form Modal:**
```
┌──────────────────────────────────────────┐
│ Request Withdrawal        [×] Close     │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│                                           │
│ Available balance: ₱2,340                 │
│ Pending balance: ₱560 (not available)     │
│                                           │
│ Withdrawal amount:                        │
│ [₱2,340] (editable)                      │
│                                           │
│ Withdraw to:                              │
│ ○ GCash (09XX-XXX-XXXX)                   │
│ ● Maya (09XX-XXX-XXXX)                    │
│                                           │
│ Processing time: 1-3 business days        │
│                                           │
│ [Cancel] [Request Withdrawal]             │
└──────────────────────────────────────────┘
```

---

### 5. Analytics Dashboard Component (Pro/Pioneer Only)

**Route:** `/dashboard/analytics`

**Layout:**
```
┌────────────┬─────────────────────────────────────────┐
│            │  Analytics            [Export Report]    │
│   Sidebar  │  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│            │                                           │
│  📊 Anal   │  Time Period: [Last 30 days ▼]           │
│  (Pro)     │                                           │
│            │  ┌────────────────────────────────┐      │
│            │  │ Revenue Over Time              │      │
│            │  │ ████████████████████████████   │      │
│            │  │ [Interactive line chart]        │      │
│            │  │ Zoom: [7d][30d][90d][This Year] │      │
│            │  └────────────────────────────────┘      │
│            │                                           │
│            │  ┌─────────────────┐  ┌───────────────┐ │
│            │  │ Sales by Product│  │Traffic Sources│ │
│            │  │ [Bar chart]     │  │ [Pie chart]   │ │
│            │  │ 1. G7 Math      │  │ Search 45%    │ │
│            │  │ 2. Sci Exam     │  │ Home 25%      │ │
│            │  │ 3. RPMS Cover   │  │ Direct 20%    │ │
│            │  └─────────────────┘  │ Profile 10%   │ │
│            │                       └───────────────┘ │
│            │                                           │
│            │  Performance Score: 82/100 ⭐⭐          │
│            │  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│            │  You're in the top 15% of sellers! 🎉   │
│            │                                           │
│            │  Recommendations:                         │
│            │  • High views, low conversion - consider │
│            │    lowering price of Science Exam from  │
│            │    ₱50 to ₱40                           │
│            │  • Grade 7 Math trending - create more   │
│            │    products for this grade               │
│            │  • Products with previews sell 3x more   │
│            │                                           │
│            │  [Schedule Weekly Report]                │
└────────────┴─────────────────────────────────────────┘
```

---

## Related Features & Dependencies

### Feature 03: Product Listings & Product Management

**Dependency:**
- Basic product analytics already exist
- Product upload wizard (multi-step) already built
- Product status workflow (6 states) already implemented
- Version management system already exists

**Integration:**
- Product management section uses existing upload/edit flows
- Product analytics enhanced (not replaced)
- Grid view NEW (was table-only before)
- Bulk actions NEW
- Duplicate feature NEW

### Feature 04: Shopping Cart & Checkout Flow

**Dependency:**
- Orders system already exists
- Earnings calculations already implemented
- Withdrawal request system already built
- Commission tracking already done

**Integration:**
- Order history uses existing `orders` and `order_items` tables
- Earnings dashboard expands existing payout system
- Geographic insights NEW (buyer location added)
- Export functionality NEW

### Feature 05: Reviews & Ratings

**Dependency:**
- Review analytics already exist
- Seller rating calculation already implemented
- Review responses already possible

**Integration:**
- Review management accessible from dashboard
- Review stats integrated into overview metrics
- Enhanced analytics (Pro/Pioneer) include review trends

### Feature 06: Social Features

**Dependency:**
- Notification system already exists
- Push notifications already implemented
- Follower system already built

**Integration:**
- Activity feed combines notifications (sales, reviews, followers)
- Real-time updates via push notifications (no WebSocket needed)
- Follower count shown in metrics

---

## Implementation Checklist

When implementing this feature:

### Phase 1: Dashboard Overview

- [ ] Create 4 metric cards (Revenue, Sales, Views, Rating)
- [ ] Implement time range selector (Today, Week, Month, All, Custom)
- [ ] Add sparkline indicators (Free tier)
- [ ] Build interactive revenue chart (Pro/Pioneer)
- [ ] Create recent activity feed (combined sales, reviews, followers)
- [ ] Add quick action buttons
- [ ] Implement caching strategy (15-minute cache)
- [ ] Add "Refresh" button
- [ ] Mobile responsive (cards stacked vertically)

### Phase 2: Product Management

- [ ] Build product grid view (2/3/4 columns responsive)
- [ ] Implement list view alternative
- [ ] Add view toggle (Grid/List)
- [ ] Create product cards with stats
- [ ] Implement bulk actions (checkboxes, select all)
- [ ] Build duplicate product functionality
- [ ] Add performance indicators (Pro/Pioneer)
- [ ] Implement swipe actions (mobile)
- [ ] Create bottom sheet for quick actions (mobile)
- [ ] Add export products to CSV
- [ ] Test on all screen sizes

### Phase 3: Order History

- [ ] Build orders table with buyer location
- [ ] Implement order detail modal
- [ ] Add filters (status, date range, product, location)
- [ ] Create export orders to CSV
- [ ] Add "Contact Buyer" button (integration prep for Feature 14)
- [ ] Implement pull-to-refresh (mobile)
- [ ] Optimize table for mobile
- [ ] Test pagination

### Phase 4: Earnings & Payouts

- [ ] Build earnings dashboard (3 cards: Available, Pending, Lifetime)
- [ ] Create withdrawal request form
- [ ] Implement minimum threshold validation (₱500)
- [ ] Add withdrawal history table
- [ ] Build revenue charts (Pro/Pioneer)
- [ ] Create earnings breakdown charts
- [ ] Add projected earnings (Pro/Pioneer)
- [ ] Implement commission reminder display
- [ ] Test withdrawal flow

### Phase 5: Analytics (Tier-Based)

**Free Tier:**
- [ ] Ensure all metrics display in table format
- [ ] Implement sparkline indicators
- [ ] Add time period filters
- [ ] Create export to CSV functionality
- [ ] Test performance

**Pro/Pioneer Tier:**
- [ ] Build interactive revenue chart (zoom, pan, hover)
- [ ] Create sales by product bar chart
- [ ] Implement sales by category pie chart
- [ ] Build conversion funnel chart
- [ ] Add traffic sources chart
- [ ] Create buyer demographics charts
- [ ] Implement performance score (0-100)
- [ ] Add percentile rankings
- [ ] Build recommendation engine
- [ ] Create export to Excel/PDF
- [ ] Implement scheduled reports (email automation)
- [ ] Test all charts interactivity
- [ ] Verify access control (Pro/Pioneer only)

### Phase 6: Navigation

- [ ] Build sidebar navigation (desktop)
- [ ] Create bottom tab bar (mobile)
- [ ] Implement breadcrumbs
- [ ] Add collapse/expand sidebar
- [ ] Optimize for mobile (PWA style)
- [ ] Test navigation across all pages

### Phase 7: Data & Performance

- [ ] Implement caching strategy (Redis)
- [ ] Create background jobs for pre-calculation
- [ ] Add cache invalidation logic
- [ ] Implement pull-to-refresh (mobile)
- [ ] Optimize database queries
- [ ] Add database indexes
- [ ] Load test dashboard
- [ ] Monitor cache hit rates

### Phase 8: Export & Reports

**Free Tier:**
- [ ] Implement CSV export for orders
- [ ] Implement CSV export for products
- [ ] Implement CSV export for earnings
- [ ] Add custom date range selector
- [ ] Test CSV parsing

**Pro/Pioneer Tier:**
- [ ] Build Excel export with formatting
- [ ] Create PDF report generator
- [ ] Implement analytics report (PDF)
- [ ] Build scheduled reports system
- [ ] Add email automation for reports
- [ ] Test report generation
- [ ] Verify report quality

### Phase 9: Testing

- [ ] Unit tests for all dashboard components
- [ ] Integration tests for API endpoints
- [ ] E2E tests for key user flows
- [ ] Test caching behavior
- [ ] Load test dashboard (simulate concurrent users)
- [ ] Test export generation (large datasets)
- [ ] Mobile responsiveness testing
- [ ] Cross-browser testing
- [ ] Accessibility testing (screen reader)
- [ ] Performance testing (page load time)

---

## Notes from Planning Session

1. **Balanced Overview Dashboard:** 4 metric cards with sparklines (Free) or interactive charts (Pro/Pioneer). Not too overwhelming, not too simple.

2. **Grid View with Quick Actions:** Visual grid faster to scan than table. Duplicate feature saves huge time. Performance indicators (Pro/Pioneer) help sellers improve.

3. **Simple Order List + Location:** Clean, scannable. Buyer location (region only) provides useful insights without being invasive. Export essential for business records.

4. **Tiered Earnings Display:** Free tier gets numbers only. Pro/Pioneer gets beautiful charts. Clear upgrade motivation. Scheduled reports save time.

5. **CRITICAL - Sparklines for Free, Charts for Pro:** This is THE subscription motivator. Sparklines give taste without full value. Pro charts are fully interactive = premium feel. Monthly revenue reports = business intelligence.

6. **Essential + Engagement Metrics:** Conversion rate critical. Response time + followers = social proof. Percentile rankings (Pro/Pioneer) = motivation. Don't overwhelm Free tier.

7. **Sidebar Navigation:** Scales better with many sections. Teachers Pay Teachers uses it (familiar). Breadcrumbs show location. Mobile: Bottom tab bar is PWA best practice.

8. **Smart Hybrid Data Strategy:** Cached data (15 min) + push notifications = best of both worlds. No WebSocket needed. Massive performance savings. Notifications create excitement.

9. **Full Dashboard Mobile:** 70%+ users on mobile = this IS primary experience. 2-column grid on modern phones. All features available. Swipe actions + pull-to-refresh = native app feel.

10. **Tiered Exports:** CSV for all sellers. Pro/Pioneer gets Excel + PDF + scheduled reports. Beautiful PDF reports feel premium. Automatic weekly emails = time-saver (worth ₱249/month).

---

## Summary

Feature 07 (Seller Dashboard & Analytics) is now fully designed and ready for implementation. Key highlights:

- ✅ Balanced overview dashboard (4 metric cards with sparklines)
- ✅ Grid view product management with bulk actions and duplicate
- ✅ Enhanced order history with buyer location insights
- ✅ Tiered earnings display (Free: numbers, Pro/Pioneer: charts)
- ✅ CRITICAL: Sparklines for Free, full interactive charts for Pro/Pioneer
- ✅ Essential + engagement metrics (split by tier)
- ✅ Sidebar navigation (desktop) + bottom tab bar (mobile)
- ✅ Smart hybrid data strategy (cached + push notifications)
- ✅ Full dashboard mobile (2-column grid, all features)
- ✅ Tiered exports (CSV for Free, Excel/PDF + scheduled reports for Pro/Pioneer)
- ✅ Complete technical implementation plan documented
- ✅ Subscription motivation: Clear differentiation between Free and Pro/Pioneer

**Next Feature:** Feature 08 - Advanced Search & Discovery (to be discussed in next session)

---

**Document Version:** 1.0
**Last Updated:** January 13, 2026

*All decisions documented. Ready to proceed with implementation planning.*
