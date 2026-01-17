# Feature 06: Social Features - Complete Design

**Project:** AKOMAYLESSONPLANNA - Filipino Teacher Lesson Plan Marketplace
**Date:** January 12, 2026
**Status:** ✅ Design Complete - Ready for Implementation
**Session:** Feature design brainstorming

---

## Table of Contents

1. [Overview](#overview)
2. [Components Included](#components-included)
3. [Components Deferred](#components-deferred-to-post-launch)
4. [Notification System](#notification-system)
5. [Social Sharing](#social-sharing)
6. [Recently Viewed Items](#recently-viewed-items)
7. [Social Proof Elements](#social-proof-elements)
8. [Database Schema](#database-schema)
9. [API Endpoints](#api-endpoints)
10. [UI Components](#ui-components)
11. [Implementation Notes](#implementation-notes)

---

## Overview

Feature 06 brings community engagement and social interaction to AKOMAYLESSONPLANNA. Filipino teachers are highly social and active in Facebook groups, so these features enable discovery, sharing, and keeping users engaged on the platform.

**Target Audience:** Filipino K-12 teachers
**Mobile-First:** 70%+ of users on mobile
**Platform Heaviness:** Heavy Facebook/Messenger usage (80%+ penetration)

---

## Components Included

✅ **Notification System** (In-App + Email)
- Bell icon with unread count
- Notification dropdown and dedicated page
- Email notifications for important events
- Admin panel for system announcements

✅ **Social Sharing**
- Facebook, Messenger, Copy Link
- Share buttons on product pages and seller profiles
- Share tracking analytics

✅ **Recently Viewed Items**
- Homepage section, product page sidebar, dedicated page
- Tracks last 20 items for 30 days
- Logged-in users only

✅ **Social Proof Elements**
- Static badges: Trending, Bestseller, Popular, New
- View counts, sales counts, wishlist counts
- Hourly updates (not real-time)

---

## Components Deferred to Post-Launch

❌ **Activity Feed**
- Notifications serve the same purpose
- Can add post-launch if users request it

❌ **"Tell a Friend" Email Sharing**
- Facebook and Messenger sharing are sufficient
- Wishlist sharing provides "hinting" functionality

❌ **Gift Purchases**
- Checkout complexity not justified for MVP
- Will add for Teacher's Day/Christmas season post-launch

❌ **Real-Time Counters**
- "X people viewing this now" requires WebSockets
- Static badges work just as well for MVP

---

## Notification System

### Notification Types

**Seller Notifications (5 types):**

1. **new_sale** - "You made a sale! 🎉"
   - Trigger: Order payment completed via GCash/Maya webhook
   - Delivery: In-app (immediate) + Email (immediate)

2. **new_review** - "New review on [Product Name]"
   - Trigger: Buyer submits review after download
   - Delivery: In-app (immediate) + Email (immediate)

3. **new_follower** - "[Name] started following you"
   - Trigger: User clicks "Follow" (from Feature 02)
   - Delivery: In-app only (less urgent)

4. **product_approved** - "Your product [Product Name] was approved!"
   - Trigger: Admin approves product (first 3 require review)
   - Delivery: In-app (immediate) + Email (immediate)

5. **product_rejected** - "Your product [Product Name] needs changes"
   - Trigger: Admin rejects product with reason
   - Delivery: In-app (immediate) + Email (immediate with reason)

**Buyer Notifications (2 types):**

6. **price_drop** - "[Product Name] is now ₱XX (was ₱YY)"
   - Trigger: Seller lowers price on product in buyer's wishlist
   - Delivery: In-app (immediate) + Email (immediate or batch)

7. **new_product** - "[Seller Name] uploaded a new product"
   - Trigger: Seller publishes new product
   - Delivery: In-app only (bell only - not urgent, avoids spam)

**System-Wide:**

8. **system_announcement** - Platform updates, maintenance, policy changes
   - Trigger: Admin creates announcement via admin panel
   - Delivery: In-app (immediate) + Email (immediate or batch)

### Notification Triggers & Delivery Flow

```
1. new_sale (Order completed)
   Order payment_webhook → mark order completed
   → create notification for seller
   → send email immediately
   → real-time bell update (if seller is online)

2. new_review (Buyer submits review)
   Buyer submits review → save to reviews table
   → create notification for seller
   → send email immediately

3. new_follower (User follows seller)
   User clicks "Follow" → save to followers table
   → create notification for seller
   → no email (bell only - less urgent)

4. product_approved (Admin approves)
   Admin clicks "Approve" → update product status
   → create notification for seller
   → send email immediately

5. product_rejected (Admin rejects)
   Admin rejects with reason → update product status
   → create notification for seller
   → send email immediately with rejection reason

6. price_drop (Seller lowers price)
   Seller updates price to lower amount
   → check all wishlists containing this product
   → create notification for each interested buyer
   → send email immediately (or batch every hour if many)

7. new_product (Seller publishes)
   Product status → published
   → find all users following this seller
   → create notification for each follower
   → no email (bell only - not urgent, avoids overwhelming followers)

8. system_announcement (Admin creates)
   Admin creates announcement → bulk insert notifications
   → send emails immediately (or batch if thousands of users)
```

### User Preferences

**Route:** `/settings/notifications`

**UI:**
```
🔔 Notification Preferences

☑️ Email notifications
   Turn on to receive notifications about sales, reviews,
   price drops, and platform updates via email.

In-App Notifications
   Always on (bell icon in header)
```

**Simplified approach:** Single toggle for email on/off. In-app notifications are always on (no toggle needed).

### In-App Notification UI

**Bell Icon (Header)**
- Location: Top right, next to user avatar
- No notifications: Gray bell outline, no badge
- Has unread: Red badge showing count (e.g., "3" or "9+")
- Mobile: Optimized for touch (44x44px minimum)

**Notification Dropdown**
```
┌─────────────────────────────┐
│ Notifications          Mark  │
│                     all read │
├─────────────────────────────┤
│ 🎉 You made a sale!         │
│ Teacher Maria M. purchased  │
│ your Grade 7 Math DLL       │
│ 2 minutes ago     [View]     │
├─────────────────────────────┤
│ ⭐ New review on Algebra    │
│ "Great resource! Thank      │
│ you!" - Teacher Ana         │
│ 1 hour ago        [View]     │
├─────────────────────────────┤
│ 💰 Price drop: Science Q1   │
│ Now ₱150 (was ₱200)         │
│ 3 hours ago       [View]     │
├─────────────────────────────┤
│ [See all notifications →]   │
└─────────────────────────────┘
```
- Shows 5 most recent notifications
- "Mark all read" button
- Each notification: icon, title, preview, time ago, action link
- Unread = background tint + blue dot
- Click → mark read + navigate to link

**Full Notifications Page**
- Route: `/notifications`
- Filter tabs: All | Unread
- Paginated list (20 per page)
- Each card: icon, title, details, CTA button, timestamp

### Email Notification Templates

**Brand-aligned:** Platform colors, logo in header, mobile-responsive, warm tone ("Teacher Maria" not "Dear User")

**Template Examples:**

**1. New Sale Email**
```
Subject: You made a sale! 🎉 ₱150.00

Hi [Seller Name],

Great news! You just made a sale.

[Product Image]
Grade 7 Math DLL (Q1 Weeks 1-10)

Sold to: Teacher Maria M.
Amount: ₱150.00
Commission (20%): ₱30.00
Your earnings: ₱120.00

[View Order Details]
[View Your Products]

Congratulations! 🎉

— The AKOMAYLESSONPLANNA Team
```

**2. New Review Email**
```
Subject: New review on [Product Name]

Hi [Seller Name],

Someone just reviewed your product!

⭐⭐⭐⭐⭐ "Great resource! Thank you!"
- Teacher Ana S.

Grade 7 Math DLL (Q1 Weeks 1-10)

You can respond to this review on your product page.

[View Review & Respond]

Keep creating amazing content! 🌟

— The AKOMAYLESSONPLANNA Team
```

**3. Price Drop Email**
```
Subject: Price drop! [Product Name] is now ₱150

Hi [Buyer Name],

A product in your wishlist just dropped in price!

[Product Image]
Grade 7 Math DLL (Q1 Weeks 1-10)

Was: ₱200.00
Now: ₱150.00
You save: ₱50.00 💰

[View Product]
[Remove from Wishlist]

Don't miss out!

— The AKOMAYLESSONPLANNA Team
```

**4. Product Approved Email**
```
Subject: Your product was approved! 🎉

Hi [Seller Name],

Great news! Your product has been approved and is now live.

[Product Image]
Grade 7 Math DLL (Q1 Weeks 1-10)

[View Product on Marketplace]
[Share Your Product]

Tips for your first sale:
- Share to Facebook teacher groups
- Pin to your profile
- Set competitive pricing

Good luck! 🍀

— The AKOMAYLESSONPLANNA Team
```

**5. Product Rejected Email**
```
Subject: Action needed: Your product needs changes

Hi [Seller Name],

Your product submission needs some changes before it can be approved.

Grade 7 Math DLL (Q1 Weeks 1-10)

Reason: [Rejection reason from admin]
• "Preview images don't match the file content"
• "Description needs more detail"

Please update your product and resubmit for review.

[Edit Product]
[View Submission Guidelines]

Questions? Contact us anytime.

— The AKOMAYLESSONPLANNA Team
```

**6. System Announcement Email**
```
Subject: [Announcement Title]

Hi [User Name],

[Announcement content]

[CTA button if needed]

Thank you for being part of our community! 🌟

— The AKOMAYLESSONPLANNA Team
```

**Email Footer (All Emails):**
```
─────

AKOMAYLESSONPLANNA
Filipino Teacher Lesson Plan Marketplace

[Update your notification preferences]
[Unsubscribe from all emails]

Questions? Contact us at support@akomaylessonplanna.com

© 2026 AKOMAYLESSONPLANNA. All rights reserved.
```

### Admin Panel - System Announcements

**Route:** `/admin/announcements` (Admin only)

**Create Announcement Form:**
```
┌───────────────────────────────────┐
│ Create System Announcement        │
├───────────────────────────────────┤
│                                   │
│ Title                              │
│ [Scheduled Maintenance - Jan 15]  │
│                                   │
│ Message                            │
│ [Platform will be down for 2      │
│  hours for system updates...]     │
│                                   │
│ Target Audience                    │
│ ⦿ All users                       │
│ ○ Sellers only                    │
│ ○ Buyers only                     │
│                                   │
│ Delivery                           │
│ ⦿ Send immediately                │
│ ○ Schedule for later              │
│   [Date picker] [Time picker]     │
│                                   │
│                    [Cancel] [Send] │
└────────────────────────────────────┘
```

**Announcement History Page:**
- Route: `/admin/announcements/history`
- Shows all past/scheduled announcements
- Status (Sent, Scheduled, Draft)
- Date sent/scheduled
- Target audience
- Open rate, click rate

---

## Social Sharing

### Share Platforms

**1. Facebook** (Essential - 80%+ Filipino users)
- Opens Facebook share dialog
- Pre-filled with product image, title, price
- User can add their own message
- Link: `https://www.facebook.com/sharer/sharer.php?u=[product_url]`

**2. Messenger** (Essential for teachers)
- Opens Messenger with product link pre-filled
- User selects recipient(s)
- Great for 1-on-1 sharing with colleague
- Link: `fb-messenger://share/?link=[product_url]`

**3. Copy Link** (Universal fallback)
- One click, copies URL to clipboard
- Toast confirmation: "Link copied!"
- User can paste anywhere (email, Viber, text, etc.)

### Where Share Buttons Appear

**1. Product Detail Page**
- Prominent "Share" button near "Add to Cart" and "Buy Now"
- Also in product preview modal/image gallery

**2. Seller Profile**
- "Share profile" button
- Helps promote favorite sellers

**3. Order Confirmation / Thank You Page**
- "Share your purchase" (optional)
- "Tell friends about AKOMAYLESSONPLANNA"

### Share Button UI

**Desktop:** Icon buttons with tooltips
**Mobile:** Full-size buttons with labels (easier to tap)

```
Share this product

[Facebook] [Messenger] [🔗 Copy Link]
```

### Open Graph Metadata

When shared to Facebook/Messenger, the preview shows:

```
┌─────────────────────────────┐
│ [Product Cover Image]       │
│                             │
│ Grade 7 Math DLL (Q1 Weeks  │
│ 1-10)                       │
│ ₱150 • AKOMAYLESSONPLANNA   │
│                             │
│ Complete lesson plans for   │
│ Grade 7 Mathematics, First  │
│ Quarter...                  │
└─────────────────────────────┘
```

**Meta tags:**
```html
<meta property="og:title" content="Grade 7 Math DLL (Q1 Weeks 1-10)">
<meta property="og:description" content="Complete lesson plans...">
<meta property="og:image" content="[product_cover_image_url]">
<meta property="og:url" content="[product_page_url]">
<meta property="og:type" content="product">
<meta property="product:price:amount" content="150">
<meta property="product:price:currency" content="PHP">
```

### Share Tracking & Referral Links

**Track what's being shared:**
```sql
CREATE TABLE product_shares (
  id UUID PRIMARY KEY,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  platform VARCHAR, -- 'facebook', 'messenger', 'copy_link'
  shared_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW()
);
```

**Referral Links:**
Add `?ref=username` to shared URLs:
```
https://akomaylessonplanna.com/products/123?ref=teacher_maria
```

**Why track:**
- Know which products are most shareable
- See which platforms teachers use most
- Track who's driving traffic/sales (for future reward program)

---

## Recently Viewed Items

### Where Recently Viewed Appears

**1. Homepage Section**
```
┌──────────────────────────────────────┐
│ Recently Viewed                      │
│                                      │
│ [Product Card] [Product Card] [Prod] │
│ [Product Card] [Product Card] [Prod] │
│                                      │
│ [See all recently viewed →]          │
└──────────────────────────────────────┘
```
- Shows 6 most recent items
- Appears below "New Arrivals" section
- Only shows if user has viewed 3+ products

**2. Product Detail Page Sidebar**
- "You recently viewed:" (horizontal scroll)
- Shows 4 items on desktop, 2 on mobile
- Appears below product description

**3. Dedicated Page**
- Route: `/recently-viewed`
- Full grid of all viewed items (paginated, 20 per page)
- Filter: All time | This week | This month
- Empty state: "No recently viewed items yet. Start browsing!"

### Tracking Behavior

**Who to track:** Logged-in users only
**How many items:** Last 20 items viewed
**How long to retain:** 30 days, then automatically removed
**What counts as "viewed":** User visits product detail page

### How It Works

**When user views a product:**
1. Check if product already in `recently_viewed` for this user
2. If yes: Update `viewed_at` timestamp (move to top)
3. If no: Insert new row
4. If user has 20+ items: Delete oldest (keep newest 20)

**Query for homepage:**
```sql
SELECT p.*, rv.viewed_at
FROM recently_viewed rv
JOIN products p ON rv.product_id = p.id
WHERE rv.user_id = [current_user]
ORDER BY rv.viewed_at DESC
LIMIT 6;
```

---

## Social Proof Elements

### Social Proof Locations & Types

**1. Product Detail Page**
```
┌─────────────────────────────────────┐
│ Grade 7 Math DLL (Q1)  ₱150         │
│                                     │
│ ⭐⭐⭐⭐⭐ (24 reviews)              │
│                                     │
│ 🔥 Trending in Grade 7 Math         │
│ 👁️ 1,234 views                      │
│ 📦 89 sales                         │
│ ❤️ 156 people wishlisted this       │
└─────────────────────────────────────┘
```

**2. Product Card (Browse/Grid)**
```
┌─────────────────────┐
│ [Product Image]     │
│                     │
│ 🔥 Trending         │
│ Grade 7 Math DLL    │
│ ⭐ 4.8 (24)         │
│ 👁️ 1.2k  📦 89     │
│ ₱150                │
└─────────────────────┘
```

**3. Seller Profile**
```
Teacher Maria Santos
🎓 Verified Teacher

⭐ 4.9 average rating
📦 234 total sales
👁️ 5,678 profile views
❤️ 89 followers
```

### Badge Logic

**Trending Badge:**
- Sales + views in last 7 days > 2x average in category
- OR Top 20 products by views in last 7 days
- Calculated every hour by cron job

**Bestseller Badge:**
- Top 10% of sales in its grade+subject category
- Minimum 10 sales required
- Calculated daily

**Popular Badge:**
- 50+ wishlist adds
- OR 100+ views in 30 days
- Real-time check (cached)

**New Badge:**
- Published within last 30 days
- Auto-removed after 30 days
- Simple date check

### Display Style

**Static, not real-time:**
- Numbers update every hour (cron job)
- No "X people viewing this right now" (too complex for MVP)
- View counts, sales counts, wishlist counts updated periodically

---

## Database Schema

### Enhanced Tables

**1. notifications (enhanced)**
```sql
ALTER TABLE notifications ADD COLUMN email_sent BOOLEAN DEFAULT false;
```

**2. users (enhanced)**
```sql
ALTER TABLE users ADD COLUMN email_notifications BOOLEAN DEFAULT true;
```

### New Tables

**3. recently_viewed**
```sql
CREATE TABLE recently_viewed (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  viewed_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, product_id)
);

CREATE INDEX idx_recently_viewed_user ON recently_viewed(user_id, viewed_at DESC);
```

**4. product_shares**
```sql
CREATE TABLE product_shares (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  platform VARCHAR NOT NULL, -- 'facebook', 'messenger', 'copy_link'
  shared_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_product_shares_product ON product_shares(product_id, created_at);
CREATE INDEX idx_product_shares_user ON product_shares(shared_by, created_at);
```

### Existing Tables Used

- `notifications` - Already exists in schema
- `followers` - Already exists from Feature 02
- `wishlist` - Already exists from Feature 04
- `products` - Already exists from Feature 03
- `orders` - Already exists from Feature 04

---

## API Endpoints

### Notification Endpoints

**GET /api/notifications**
- Get current user's notifications (paginated)
- Query params: `?filter=all|unread&page=1&limit=20`
- Auth required

**GET /api/notifications/unread-count**
- Get count of unread notifications
- For bell badge
- Auth required

**PUT /api/notifications/:id/read**
- Mark notification as read
- Auth required
- User can only mark their own notifications

**PUT /api/notifications/read-all**
- Mark all notifications as read for current user
- Auth required

**DELETE /api/notifications/:id**
- Delete notification
- Auth required
- User can only delete their own notifications

**PUT /api/settings/notifications**
- Update email notification preference
- Body: `{ "email_notifications": true }`
- Auth required

### Social Sharing Endpoints

**POST /api/products/:id/share**
- Track when user shares a product
- Body: `{ "platform": "facebook" }`
- Auth optional (track if logged in)
- Returns: `{ "success": true, "share_url": "https://..." }`

**GET /api/products/:id/share-stats**
- Get share statistics for a product (seller only)
- Returns: `{ "facebook": 45, "messenger": 23, "copy_link": 12, "total": 80 }`
- Auth required (seller or admin)

### Recently Viewed Endpoints

**POST /api/products/:id/view**
- Track product view (called when user visits product page)
- Auth required (logged-in users only)
- Automatically handled by frontend on product page load

**GET /api/recently-viewed**
- Get current user's recently viewed products
- Query params: `?limit=6` (for homepage)
- Auth required

**DELETE /api/recently-viewed**
- Clear all recently viewed items
- Auth required
- (Optional for MVP - can be added post-launch)

### Admin Endpoints

**POST /api/admin/announcements**
- Create system announcement
- Body: `{ title, message, target_audience, delivery_type, scheduled_for }`
- Auth required (admin only)

**GET /api/admin/announcements**
- List all announcements (sent and scheduled)
- Auth required (admin only)

**GET /api/admin/announcements/:id/stats**
- Get announcement statistics (open rate, click rate)
- Auth required (admin only)

---

## UI Components

### Notification Bell Icon Component

**Location:** Header (top right)

**Props:**
- `unreadCount: number`

**Behavior:**
- Shows red badge if `unreadCount > 0`
- Badge shows "9+" if count >= 10
- On click: Opens dropdown

### Notification Dropdown Component

**Trigger:** Bell icon click

**Features:**
- Shows 5 most recent notifications
- "Mark all read" button
- Each notification clickable (mark read + navigate)
- "See all notifications" link to full page

### Notifications Page Component

**Route:** `/notifications`

**Features:**
- Filter tabs: All | Unread
- Paginated list (20 per page)
- Each notification card: icon, title, message, time ago, CTA button
- Empty state illustration

### Share Buttons Component

**Locations:** Product page, seller profile, thank you page

**Props:**
- `productUrl: string`
- `productId: string`
- `platform?: 'product' | 'seller'`

**Behavior:**
- Facebook: Opens FB sharer in new tab
- Messenger: Opens Messenger app/web
- Copy Link: Copies to clipboard, shows toast

### Recently Viewed Components

**1. Homepage Section Component**
- Grid of 6 product cards
- "See all recently viewed →" link
- Hidden if < 3 items

**2. Product Page Sidebar Component**
- Horizontal scroll
- 4 items desktop, 2 items mobile
- Label: "You recently viewed"

**3. Recently Viewed Page Component**
- Route: `/recently-viewed`
- Full grid with pagination
- Filter tabs: All time | This week | This month

### Social Proof Badges Component

**Product Card Badge:**
- Shows: Trending 🔥, Bestseller 🏆, Popular ⭐, or New ✨
- Priority: New > Trending > Bestseller > Popular
- Only show one badge per product

**Product Page Stats:**
- View count, sales count, wishlist count
- Formatted: "1.2k views", "89 sales", "156 wishlisted"

---

## Implementation Notes

### Tech Stack Considerations

**Email Service:**
- Use Resend or SendGrid (already in design doc)
- Transactional emails only
- Templates stored as files or in email service

**Real-Time Updates (Optional):**
- In-app notifications don't need real-time WebSockets for MVP
- Poll every 30 seconds for new notifications
- Or use Supabase Realtime for instant updates (post-launch optimization)

**Cron Jobs:**
- Hourly job: Calculate trending badges, update view/sales/wishlist counts
- Daily job: Calculate bestseller badges
- Keep queries optimized to avoid performance issues

### Performance Considerations

**Notification Queries:**
- Index `notifications(user_id, is_read, created_at)`
- Pagination essential (don't load all notifications)
- Cache unread count in Redis (post-launch)

**Recently Viewed:**
- Limit to 20 items per user
- Auto-delete old entries (cron job)
- Consider caching for homepage

**Share Tracking:**
- Don't block UI on share tracking (fire and forget)
- Batch insert if needed (high traffic scenarios)

### Mobile Optimization

**Touch Targets:**
- Minimum 44x44px for all buttons
- Larger buttons for sharing (Facebook, Messenger)
- Bell icon with generous tap area

**Horizontal Scrolling:**
- Recently viewed sidebar on mobile
- Smooth scroll, momentum scrolling

**Email Templates:**
- Mobile-first design
- Single column layout
- Large CTA buttons

### Analytics to Track

**Engagement Metrics:**
- Notification open rate
- Notification click-through rate
- Share rate (shares per 1,000 page views)
- Recently viewed click-through rate

**Conversion Impact:**
- Do shared products convert better?
- Does social proof increase sales?
- Which badges drive most clicks?

---

## Success Metrics

Post-launch, measure:

**Notification System:**
- Email open rate (> 40% target)
- Email click rate (> 10% target)
- In-app notification click rate (> 25% target)
- Notification preferences opt-out rate (< 5% target)

**Social Sharing:**
- Share rate (shares per 1,000 page views)
- Platform breakdown (Facebook vs Messenger vs Copy Link)
- Referral traffic from shares
- Conversion rate of shared products

**Recently Viewed:**
- Percentage of users who revisit recently viewed items
- Click-through rate from recently viewed section
- Impact on discoverability

**Social Proof:**
- Do trending/bestseller badges increase conversion?
- A/B test badge placement and design
- Track badge performance over time

---

## Dependencies on Previous Features

- **Feature 02:** Followers table, follow/unfollow functionality
- **Feature 03:** Products table, product detail pages
- **Feature 04:** Orders table (for new_sale notifications)
- **Feature 05:** Reviews table (for new_review notifications)
- **Feature 04:** Wishlist table (for price_drop notifications)

---

## Future Enhancements (Post-Launch)

**Activity Feed:**
- Facebook-style feed of followed seller activity
- Algorithmic ranking of feed items
- Filter feed by type (products, reviews, etc.)

**Real-Time Social Proof:**
- "X people viewing this right now"
- Live notification count updates via WebSocket
- Real-time view counters

**Advanced Sharing:**
- More platforms (Twitter/X, WhatsApp, Pinterest)
- Scheduled sharing
- Share templates with custom messages

**Gift Purchases:**
- Buy product as gift for another teacher
- Gift delivery scheduling
- Gift message customization

---

## Document Status

**Status:** ✅ Design Complete
**Date:** January 12, 2026
**Version:** 1.0
**Next:** Feature 07 - Seller Dashboard & Analytics

---

*This document contains the complete design specification for Feature 06: Social Features. All major decisions have been documented and validated through brainstorming session.*
