# Feature 09: Admin Panel & Content Moderation - Design Decisions

**Date:** January 13, 2026
**Feature:** Admin Panel & Content Moderation
**Status:** ✅ DESIGN COMPLETE - Ready for Implementation

---

## Overview

This document captures all decisions made during the brainstorming session for Feature 09: Admin Panel & Content Moderation for AKOMAYLESSONPLANNA. This feature consolidates and expands admin functions from Features 01-06 into a comprehensive admin center for platform management, content moderation, financial oversight, and operational control.

---

## Design Philosophy

**Core Principles:**
- **POWERFUL BUT NOT OVERWHELMING:** Comprehensive features, clean interface
- **QUICK WORKFLOWS:** Minimize admin time, one-click actions where possible
- **AUDIT EVERYTHING:** Complete accountability, full audit trail
- **ROLE-BASED ACCESS:** Super Admin (unlimited), Moderator (restricted), Content Manager (basic)
- **DATA-DRIVEN:** Rich analytics for informed decisions
- **ESCALATION PATHS:** Clear workflows for urgent issues
- **TRUST BUT VERIFY:** Automated processing + admin oversight where needed
- **SELLER-FRIENDLY:** Unlimited product resubmissions, fair appeals
- **MOBILE-USABLE:** Responsive but not mobile-optimized (deferred to Phase 2)

---

## Section 1: Admin Panel Overview & Navigation ✅

### Decision: Sidebar Navigation with Top Bar

**Navigation Structure:**
- **Left Sidebar** (collapsible on mobile/tablet)
  - Dashboard
  - Users (with sub-navigation)
  - Products (with sub-navigation)
  - Reviews (flagged queue)
  - Reports (user reports)
  - Pioneers
  - Financials
  - Announcements
  - Analytics
  - Settings
- **Top Bar** (persistent)
  - Platform logo/name
  - Search users/products
  - Notifications bell (urgent items)
  - Admin profile dropdown

**Quick Action Buttons (Dashboard):**
- Review Pending Products (shows count in badge)
- Process Withdrawals (shows pending count)
- Handle Flagged Reviews (shows count)
- Verify Teachers (shows pending count)

**Breadcrumb Navigation:**
- Show on all pages except Dashboard
- Example: `Dashboard > Products > Pending Reviews > [Product Title]`
- Clickable to navigate back

**Mobile Navigation:**
- Hamburger menu (slides in from left)
- Full desktop sidebar functionality
- No bottom tab bar (deferred to Phase 2)

---

## Section 2: Dashboard Overview ✅

### Decision: Balanced Metrics with 8 Cards + 4 Charts

**Metric Cards (Row 1 - Revenue & Growth):**
1. Total Revenue (commission collected)
2. Total Orders
3. New Signups
4. Products Listed

**Metric Cards (Row 2 - Platform Health):**
5. Active Sellers
6. Approval Rate
7. Platform Rating
8. Support Tickets

**Quick Action Cards (Top Row):**
- Pending Products (count with orange badge)
- Verification Queue (count with blue badge)
- Flagged Reviews (count with red badge)
- Withdrawal Requests (count with green badge)

**Charts (4 total):**
1. User Growth Over Time (line chart)
2. Sales by Category (bar chart)
3. Order Volume (line chart)
4. Seller Performance (bar chart - top 10)

**Recent Activity Feed:**
- Bottom section, full width
- Shows last 20 activities (hybrid feed)
- Filterable: All, Approvals, Issues, Sales

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

## Section 3: User Management ✅

### Decision: Comprehensive User Management with 4 Tabs

**Tab Structure:**
1. All Users (main list)
2. Verification Queue (teacher ID approvals)
3. Banned Users (manage suspended accounts)
4. Admin Notes (internal communication)

**All Users Tab:**
- Search: Name, email, username, PRC license
- Filters: Role, verification status, tier, banned status, signup date, last active
- Table columns: Avatar, Name, Email, Role, Verification, Tier, Products, Sales, Joined, Status, Actions
- Bulk actions: Ban, Unban, Change tier, Export CSV
- Instant actions with 10-second undo toast (no confirmation dialogs)

**Verification Queue Tab:**
- Oldest first (FCFS fairness)
- Card-based layout (not table)
- Each card: User info, submitted timestamp, PRC license, expiry date, grace period, document preview, rejection count
- Quick actions: Approve (one-click), Reject (requires reason)
- Rejection reasons: Invalid license, Expired, Unclear, Not teaching license, Suspended/Revoked, Other
- Unlimited resubmission attempts (removed 3-strike rule)
- Email notifications: Immediate on approve/reject

**Banned Users Tab:**
- View all banned/suspended users
- Filter by: Ban reason, Banned by, Date range
- Actions: Unban, View ban details, Export

**User Detail Modal (7 tabs):**
1. Overview (profile, stats, verification)
2. Products (all their products)
3. Orders (purchase history)
4. Sales (sales history if seller)
5. Reviews (given/received)
6. Activity Log (comprehensive audit trail)
7. Admin Notes (internal communication)

**Edit Capabilities:**
- Name, Username, Bio, Profile picture, Subscription tier, Custom commission, Ban status, Ban reason
- Not editable: Email (account identifier), Password (use reset), Verification status (use queue)

**Admin Notes System:**
- Shared across all admins (full transparency)
- @mention support (autocomplete)
- 500 char max per note
- Notes visible immediately to all admins
- Used for: Warnings, VIP flags, quality concerns, follow-ups

---

## Section 4: Product Moderation ✅

### Decision: Pending Reviews Queue with Unlimited Resubmissions

**Tab Structure:**
1. Pending Reviews (main queue - first 3 products from new sellers)
2. All Products (searchable database)
3. Suspended Products (taken down content)
4. Review History (audit log)

**Pending Reviews Queue:**
- Oldest first (FCFS)
- Card-based layout (not table - needs preview)
- Priority badges: Orange if >24 hours, Red if >48 hours
- Target review time: 24-48 hours
- Oldest product age tracking (alert if >48 hours)

**Pending Product Card:**
- Left: Cover image (150x200px), product type badge, file count
- Middle: Title, seller (avatar + name + link), grade/subject, price, description (truncated), tags
- Right: Submitted time, Product # (1 of 3), Submission count, Seller stats
- Actions: Approve (one-click), Reject (requires reason), Preview (opens modal)

**Product Preview Modal:**
- Two-column (70-30 split)
- Left: Cover image, preview images, file list (downloadable for admin), full description, changelog
- Right: Product metadata, seller info, submission history, quality checks
- Actions: Approve & Publish, Reject Product, Request Changes, Close

**Rejection Workflow:**
- Required reason (dropdown + custom text)
- Resubmission allowed: Yes (default) or No (permanent)
- No 3-strike limit (unlimited attempts - seller-friendly)
- Email notification: Immediate with feedback
- Seller can edit and resubmit (no count limit)

**Bulk Approvals:**
- Available for trusted sellers (quality + speed balance)
- Checkbox selection, Approve Multiple button
- Not available for first-time sellers

**Quality Guidelines:**
- Visible to both sellers (before upload) and admins (review checklist)
- Link from Pending Reviews page
- Checklist: Cover image quality, complete files, accurate description, educational content, no copyrighted material, virus-free, reasonable pricing, correct categorization

**Suspended Products:**
- Admin can suspend immediately
- Email notification: Immediate (transparency)
- Reinstatement: Admin can reinstate with one click
- Suspension reasons: Quality issues, Copyright, Inappropriate, Terms violation, Seller request, Under investigation

**Actions:**
- Download files: Yes (for thorough review)
- Resubmission: Unlimited attempts (no limit)
- Bulk approval: Yes (for trusted sellers)
- Suspension notification: Immediate email

---

## Section 5: Content Moderation ✅

### Decision: Flagged Reviews + User Reports with Formal Appeals

**Tab Structure:**
1. Flagged Reviews (Feature 05 integration)
2. User Reports (product/user reports)
3. Resolved Items (history)
4. Moderation Stats (analytics)

**Flagged Reviews Queue:**
- Severity levels: High (profanity, threats, hate), Medium (spam, excessive caps), Low (mild)
- Auto-flagged by system: Profanity filter, spam patterns
- User-reported: Reporter visible to admins (accountability)
- Actions: Dismiss Flag (approve review), Delete Review (permanent removal)
- No Edit Review feature (keep it simple - dismiss or delete only)

**Review Moderation Actions:**
- Dismiss: Approve review, remove flag, publish review
- Delete: Permanently remove, option to ban reviewer (repeat offenders)
- Notify seller: Toggle (email seller about action taken)

**User Reports Queue:**
- Report types: Products (inappropriate, copyright), Users (harassment, fraud, reselling, multiple accounts), Reviews
- Severity: High (fraud, harassment, illegal), Medium (copyright, reselling), Low (wrong category, typos)
- Escalation: 3+ reports on same item → High Priority, Pioneer seller reports → Higher priority
- Response targets: High 4 hours, Medium 24 hours, Low 48 hours
- Actions: Dismiss (no action), Warn User, Suspend/Ban, Contact Reporter

**Report Resolution:**
- Investigation notes (admin can add internal notes)
- @mention other admins
- Assign to specific admin
- Status: Pending → Under Review → Resolved
- Resolution options: Dismiss, Warning, Content suspension, Temporary ban (7/30 days), Permanent ban
- Notify users: Email on resolution

**Appeals Process:**
- Formal 7-day window to appeal
- Different admin reviews (not same one who made decision)
- Appeal submitted via support email
- Admin reviews appeal: Can uphold or modify resolution
- Final decision: Platform decision is final

**Admin Notes:**
- Shared across all admins (full collaboration)
- @mention support
- Used for collaboration and context

**Abusive Reporter Handling:**
- Manual review only (no auto-restrict)
- Admin discretion to restrict users who file many false reports

---

## Section 6: Pioneer Management ✅

### Decision: Invite-Only with Flexible Commission

**Tab Structure:**
1. Current Pioneers (manage existing 20)
2. Pioneer Candidates (track and invite)
3. Pioneer History & Analytics (performance)

**Current Pioneers Tab:**
- 20-slot maximum (hard limit - exclusive)
- Pioneer card: Avatar, name, since date, performance metrics, commission saved
- Pioneer-specific stats: Products, sales, revenue, commission saved, rating, response time, followers
- Actions: View Profile, View Analytics, Edit Commission, Remove Pioneer Status

**Commission Management:**
- Standard: 15% for all Pioneers (simple, fair, equal)
- Can edit individual commission rate (rare, flexible)
- Range: 0-20%
- Custom rates: For special cases (promotions, performance bonuses)
- Applies to future sales only (past sales keep original rate)

**Add Pioneer Workflow:**
- Invite-only (no applications - admin-curated quality)
- Search eligible sellers (not already Pioneer)
- Quality indicators: Verified, no rejected products, no flags/reports, professional profile complete
- Minimum requirements (guidelines): Verified, 5+ published products, 4.0+ rating, active in 30 days, no violations
- Invite button sends email with benefits
- Invitation status: Pending, Accepted, Declined
- Can rejoin later if removed (not permanent)

**Remove Pioneer Workflow:**
- Reasons: Inactive (60+ days), Quality issues, Terms violation, Requested by seller, Other
- Commission reverts to 20% starting immediately
- Pioneer badge removed from profile
- Products remain live
- Email notification: Immediate (with reason)

**Pioneer Candidates Tab:**
- Open slots counter: X/20
- Quality Score: Calculated automatically (sales 30%, rating 25%, products 20%, engagement 15%, professionalism 10%)
- Filters: Minimum sales, rating, verification, account age, quality flags
- Invite button available if score >70

**Pioneer History & Analytics:**
- Pioneer growth chart (additions/removals over time)
- Pioneer vs Standard performance comparison
- Pioneer commission cost (platform's loss vs 20% rate)
- Pioneer retention: 80% (12/15 remained)
- Pioneer leaderboard (top 10)
- Additions/Removals log (full audit trail)

**Pro Features:**
- Pioneers get Pro features free automatically
- No upgrade/subscribe button shown to Pioneers
- Bundled into Pioneer tier

**Email Templates:**
- Invitation: "You're invited to become a Pioneer Seller!"
- Accepted: "Welcome to the Pioneer Program!"
- Removed: "Changes to your Pioneer status"

---

## Section 7: Financial Overview ✅

### Decision: Super Admin Only with Manual Processing

**Tab Structure:**
1. Revenue Overview (platform metrics)
2. Withdrawal Requests (payout queue)
3. Payout History (completed withdrawals)
4. Financial Reports (exportable reports)

**Revenue Overview Tab:**
- 8 metric cards (2 rows of 4)
  - Row 1: Total Revenue, Total Sales (GMV), Net Profit, Avg Order Value
  - Row 2: Total Orders, Commission Rate, Active Sellers, Pending Payouts
- Charts:
  - Revenue Over Time (line chart)
  - Revenue by Category (donut chart)
  - Top Sellers by Revenue (bar chart)
  - Payment Method Split (pie chart: GCash vs Maya)
- Time range: This Month, Last 30 Days, All Time

**Withdrawal Requests Tab:**
- Manual processing only (admin clicks "Process" - full control)
- Super Admin access only (Moderators cannot see financial data)
- Minimum withdrawal: Configurable by admin (default ₱500)
- Process: Admin clicks "Process" → Initiates GCash/Maya Disbursement API → Webhook confirms → Status: Processing → Completed
- Failed withdrawals: Manual retry only (admin handles each failure)
- Statuses: Pending, Processing, Completed, Failed, Rejected

**Withdrawal Request Table:**
- Columns: Request ID, Seller, Amount, Payment Method, Payment Number, Requested Date, Status, Actions
- Actions by status:
  - Pending: Process Withdrawal, Reject, Request Info
  - Processing: View Status, Retry, Cancel
  - Completed: View Receipt, Issue Refund
  - Failed: Retry Payment, Mark as Paid (offline), Reject
  - Rejected: View Details

**Payout History Tab:**
- All completed withdrawals (all statuses)
- Filters: Date range, Seller, Payment method, Status, Amount range
- Export: CSV, Excel
- Summary cards: Total paid out, Paid this month, Total withdrawals, Avg withdrawal amount

**Financial Reports Tab:**
- Report types:
  1. Revenue Report (sales, commission, profit by category/tier/payment method)
  2. Commission Report (commission by seller, Pioneer savings)
  3. Tax Report (BIR informational - raw data only, accountant handles filing)
  4. Seller Payout Report (each seller's earnings, payouts, transaction IDs)
  5. Payment Method Report (GCash vs Maya, success rates, transaction fees)
- Export formats: CSV, Excel, PDF
- Date range selector
- Disclaimer: "Informational only, consult tax professional"

**Access Control:**
- Super Admin only (most restrictive, sensitive data)
- Moderators: No access
- Content Managers: No access

**Settings (configured in Settings tab):**
- Minimum withdrawal: Configurable (default ₱500)
- Processing time target: "1-3 business days"
- Auto-processing: OFF (manual only - from earlier decision)
- Payment methods: Enable/disable GCash, Maya

---

## Section 8: System Announcements ✅

### Decision: Advanced Segmentation with Template System

**Tab Structure:**
1. Create Announcement (compose new)
2. All Announcements (list, edit, schedule, stats)
3. Announcement Templates (reusable templates)

**Create Announcement Tab:**
- Two-column form (60-40 split)

**Content Fields:**
- Announcement Type: System Maintenance, New Feature, Platform Update, Promotion, Urgent Notice, Educational, Other
- Title: 100 char max
- Message: Rich text editor (500 char in-app, 2000 email) - full formatting
- Target Audience: Advanced segmentation
  - Basic: All, Buyers, Sellers, Verified Sellers, Pro, Pioneer
  - Advanced: Custom filters (active sellers in last 30 days, specific grades/subjects, etc.)
- Delivery: In-App + Email (both required, but respects email preferences)
- Link URL: Optional (button: "Learn More")
- Priority: Normal, Important, Urgent

**Scheduling:**
- Send Immediately OR Schedule for Later (date/time picker)
- Display Duration: 1/3/7/14/30 days or Never
- Dismissible: Yes (default) or No (forced read for urgent)

**Email Settings:**
- Subject line (auto-populated from title)
- Email preview
- Override email preferences: Optional (for urgent announcements)

**Templates:**
- Save as Template: Checkbox + Template name
- Variables: {{date}}, {{time}}, {{feature_name}}, {{promo_code}}, custom

**All Announcements Tab:**
- Top metrics: Total Sent, Active Now, Scheduled, Drafts
- Filters: Status, Type, Audience, Date range
- Card-based layout (not table)
- Each card: Status badge, Type badge, Priority badge, Title (truncated), Message (truncated), Audience, Stats (if sent)
- Actions: View Details, Edit (if draft/scheduled), View Stats, Expire Now (if active), Delete (if draft)

**Announcement Stats:**
- Recipients: X users
- In-App Views: X (XX%)
- Email Sent: X
- Email Opens: X (XX%)
- Link Clicks: X (XX%)
- Engagement Rate: XX%

**Templates Tab:**
- Reusable templates with variables
- Template card: Name, Type, Title (with placeholders), Message (with variables), Last used
- Actions: Use Template (pre-fills create form), Edit, Delete
- Example: "Scheduled Maintenance - {{date}} from {{start_time}} to {{end_time}}"

**Rich Text Editor:**
- Full formatting: Bold, italic, links, images (from decision 8.1A)
- Live preview
- Character counter

**Advanced Segmentation:**
- Custom filters: Active sellers (last 30 days), Specific grades/subjects, Product count ranges, Sales ranges, Location, etc.
- Build custom audiences dynamically
- From decision 8.3B

**Respect Email Preferences:**
- Users with email notifications off: In-app only (no email)
- From decision 8.4A

---

## Section 9: Settings & Configuration ✅

### Decision: Immediate Changes with Full Audit Logging

**Tab Structure:**
1. Platform Settings (commission, pricing, rules)
2. Feature Flags (enable/disable features)
3. Email Settings (SMTP, templates)
4. Payment Settings (GCash, Maya)
5. System Status (maintenance, monitoring)
6. Admin Management (create admins, roles)

**Platform Settings Tab:**
- Commission Rates:
  - Standard: 20% (configurable 0-30%)
  - Pioneer: 15% (configurable 0-20%, must be < Standard)
  - Immediate effect (no approval - from decision 9.1A)
- Pricing Guidelines:
  - Min product price: ₱50 (configurable ₱1-₱100)
  - Max product price: ₱1,000 (configurable ₱500-₱10,000)
  - Recommended range: ₱100-₱500 (based on sales data)
- Upload Limits:
  - Max file size: 500 MB (configurable 100MB-2GB)
  - Allowed file types: PDF, DOCX, PPTX, JPG/PNG, MP4, ZIP (multi-select)
- Moderation:
  - First N products require review: 3 (configurable 0-10, 0 = no review)
  - Auto-approve trusted sellers: After X approved products (configurable)
  - Resubmission attempts: Unlimited (from earlier decision)
- Withdrawals:
  - Min withdrawal: Configurable (default ₱500, from decision 7.3B)
  - Processing time: "1-3 business days" (displayed to sellers)
- Platform Rules:
  - Account creation: Enable/disable toggle
  - Seller verification: Required before selling (toggle)
  - Buyer requirements: Account required, Email required
- Content:
  - Watermark downloads: Toggle (default ON)
  - Preview pages: 3 (configurable)
- SEO:
  - Platform name: "AKOMAYLESSONPLANNA"
  - Tagline: "Quality Lesson Plans from Filipino Teachers"
- Save button (bottom), Reset to Defaults button

**Feature Flags Tab:**
- Core Features: Always ON (cannot disable)
- Optional Features: Toggle ON/OFF
  - Reviews System, Follow System, Wishlist, Social Sharing, Recently Viewed, Seller Dashboard, Advanced Analytics, Bulk Upload, Coupons, Referrals
- Beta Features: OFF by default, Allowlist user IDs/emails
- Maintenance Mode: Special flag (OFF by default, when ON: maintenance page to all users except admins)
- Global only (no per-tier flags - from decision 9.3A)

**Email Settings Tab:**
- Email Provider: Resend, SendGrid, AWS SES, Custom SMTP
- API Key: Password input, stored securely (environment variable)
- Test Connection button
- From Email: noreply@akomaylessonplanna.com
- From Name: AKOMAYLESSONPLANNA
- Reply-To: support@akomaylessonplanna.com
- Email Preferences:
  - Enabled by default: Toggle
  - Marketing emails: Separate toggle
- Email Templates:
  - List of all templates (Welcome, Order confirmation, Payment failed, Abandoned cart, Product approved, Product rejected, Withdrawal successful, Review reminder, Announcement, etc.)
  - Template editor: Subject line, Body (rich text), Variables ({{user_name}}, {{order_id}}, etc.), Preview, Test Send, Save/Reset to Default
  - Edit in admin panel (from decision 9.4A)
- Statistics: Sent today/week, Open rate, Click rate, Failed sends

**Payment Settings Tab:**
- GCash Integration:
  - Environment: Sandbox/Production
  - API Key, Secret, Merchant ID
  - Test Connection button
- Maya Integration:
  - Environment: Sandbox/Production
  - API Key, Secret, Merchant ID
  - Test Connection button
- Payment Methods:
  - Enabled: GCash, Maya (checkboxes)
  - Primary method: Radio buttons
- Transaction Settings:
  - Payment timeout: 15 minutes (configurable 5-60)
  - Retry attempts: Unlimited (from earlier decision)
  - Auto-processing: OFF (manual only)
- Webhook Settings:
  - Webhook URL: Auto-generated
  - Webhook Secret: Password input

**System Status Tab:**
- Maintenance Mode:
  - Enable toggle
  - Maintenance message (rich text editor)
  - Estimated end time (optional)
- System Health:
  - Database: ✅ Connected
  - Storage: ✅ OK
  - Email Service: ✅ OK
  - Payment APIs: ✅ OK
  - Cache: ✅ OK
- Recent Errors: Last 10 system errors (timestamp, type, message, status)
- Performance Metrics:
  - Avg response time: 250ms
  - Database query time: 45ms
  - Uptime: 99.9% (last 30 days)
  - Error rate: 0.1%
- Storage Usage: 15 GB / 100 GB (15%)
- Database Size: 500 MB
- Bandwidth this month: 250 GB

**Admin Management Tab:**
- Create Admin button (top right)
- Create Admin Modal:
  - Name, Email (unique)
  - Role: Super Admin, Moderator, Content Manager
  - Permissions checklist (auto-populated based on role, read-only)
  - Send invite email: Toggle
  - Create button
- Admin List Table:
  - Columns: Avatar + Name, Email, Role (badge), Last Active, Status (Active/Inactive), Actions (Edit Role, Deactivate, Delete)
- Roles & Permissions detailed in Section 10

**Settings Changes:**
- Immediate effect (from decision 9.1A)
- Log everything in audit trail (from decision 9.2A)
- Who changed what, when, why

---

## Section 10: Admin Roles & Permissions ✅

### Decision: 3 Roles - Super Admin (Unlimited), Moderator (Restricted), Content Manager (Basic)

**Role Comparison Matrix:**

| Section | Super Admin | Moderator | Content Manager |
|---------|-------------|-----------|-----------------|
| Dashboard (all metrics) | ✅ | ✅ (no financials) | ✅ (basic only) |
| Users - View | ✅ | ✅ | ✅ |
| Users - Edit Tier | ✅ | ❌ | ❌ |
| Users - Ban | ✅ | ⚠️ Requires approval | ❌ |
| Users - Reset Password | ✅ | ✅ | ❌ |
| Verification Queue | ✅ | ✅ | ✅ |
| Products - View All | ✅ | ✅ | ✅ |
| Products - Edit | ✅ | ❌ | ❌ |
| Products - Suspend | ✅ | ⚠️ Requires approval | ❌ |
| Products - Delete | ✅ | ❌ | ❌ |
| Pending Reviews | ✅ | ✅ | ✅ |
| Flagged Reviews | ✅ | ✅ | ✅ |
| User Reports | ✅ All actions | ✅ Resolve (warn/suspend needs approval) | ✅ Resolve (warn only) |
| Pioneers - View | ✅ | ✅ | ✅ (read-only) |
| Pioneers - Add/Remove | ✅ | ❌ | ❌ |
| Financials - View | ✅ | ❌ | ❌ |
| Withdrawals - Process | ✅ | ❌ | ❌ |
| Announcements - Create | ✅ All types | ✅ Basic only (Normal priority) | ✅ Basic only |
| Settings - View | ✅ | ❌ | ❌ |
| Settings - Edit | ✅ | ❌ | ❌ |
| Admins - Manage | ✅ | ❌ | ❌ |
| Audit Logs | ✅ View all | ✅ View own | ✅ View own |

Legend: ✅ Full access, ⚠️ Restricted (requires approval), ❌ No access

**Super Admin:**
- Can do EVERYTHING (no restrictions)
- Full financial access
- Process withdrawals
- Change commission rates
- Edit settings
- Ban users (no approval needed)
- Manage Pioneers
- Create/delete admins
- Send urgent announcements
- Minimum required: 1 (you)
- Maximum recommended: 2-3 (very trusted only)

**Moderator:**
- View Dashboard (basic metrics, no financials)
- View all Users (read-only)
- Approve/reject teacher verifications
- Reset user passwords
- View all Products (read-only)
- Approve/reject pending products
- Dismiss/delete flagged reviews
- Resolve user reports (warn only, suspend/ban requires Super Admin approval)
- View Pioneers (read-only)
- Create basic announcements (Normal priority only)
- View own audit log entries
- Requires approval: Ban users, Suspend products, Resolve with bans
- Restrictions: No financials, No settings, No Pioneer management, No urgent announcements
- Minimum required: 0 (optional)
- Maximum recommended: 5

**Content Manager:**
- View Dashboard (basic metrics only)
- View Users (read-only)
- Approve/reject teacher verifications
- View all Products (read-only)
- Approve/reject pending products
- Dismiss/delete flagged reviews
- Resolve user reports (warn only, no suspensions/bans)
- View Pioneers (read-only)
- Create basic announcements (Normal priority only)
- View own audit log entries
- Restrictions: No bans, No suspensions, No tier changes, No Pioneer management, No urgent announcements, No settings, No financials
- Minimum required: 0 (optional)
- Maximum recommended: 10

**Approval Workflow (Restricted Actions):**
- Moderator clicks restricted action (e.g., Ban User)
- Modal: "This action requires Super Admin approval"
- Admin provides: Reason, Evidence, Request approval from: [Super Admin dropdown]
- Notification sent to Super Admin
- Super Admin: Approve (performs action) or Deny (with reason)
- Moderator notified of decision
- All requests logged (even if denied)

**Admin Account Creation:**
- Invite only (from decision 10.2A)
- Super Admin creates all admins (controlled process)
- No self-service signup
- Welcome email: "You've been added as [Role] to AKOMAYLESSONPLANNA"
- Link to admin panel, brief guide

**Session Management:**
- Session timeout: 4 hours (from decision 10.3A)
- Require re-authentication for sensitive actions (ban, delete, settings)
- Device tracking (show logged-in devices, remote logout)
- Logout from all devices button
- Self-demote: Not allowed (another Super Admin must do it - from decision 10.4B)
- View as User: Toggle for testing (from decision 10.5A)

**Audit Logging:**
- Every admin action logged
- Table: audit_log (admin_id, action, target_type, target_id, changes, reason, ip_address, created_at)
- Each admin can view OWN log
- Super Admin can view ALL logs
- Filters by action, date, admin

**Admin Profile:**
- Avatar, Name, Email
- Role badge (Super Admin, Moderator, Content Manager)
- Admin since date
- Last active
- Actions: Edit profile, Change password, View audit log, Logout from all devices, Switch to User View (testing)

---

## Section 11: Search & Discovery Admin Tools ✅

### Decision: Search Analytics with Advanced Segmentation

**Tab Structure:**
1. Search Analytics (what users search for)
2. Popular Searches (trending terms)
3. Category Management (manage category pages)
4. SEO Tools (platform-wide SEO)

**Search Analytics Tab:**
- Top metrics: Total searches, Unique terms, Zero results searches, Avg search results, Searches with filters, Click-through rate
- Filters: Date range, Search type, User type
- Charts:
  - Search Volume Over Time (line chart)
  - Top Search Terms (bar chart, horizontal, top 20)
    - Shows: Term, Search count, Results found, Click-through rate
    - Color: Green (good CTR), Yellow (okay), Red (bad CTR or zero results)
  - Searches by Category (pie chart)
  - Search Funnel (funnel chart: Searches → Results found → Clicked → Purchased)
- Zero Results Report:
  - Table: Search term, Search count, Last searched, Suggested action
  - Actions: Track term, Create alert, Dismiss
  - Examples: "Grade 12 Physics" → Create products, "Mathamatics" → No action (misspelling)

**Popular Searches Tab:**
- Time period: This Week, This Month, All Time
- Table: Rank, Search Term, Search count, Trend (↗️↘️→), Avg results, Click-through rate, Top products (first 3)
- Actions: View Search Results (preview modal), Edit Results (future - pin products), Create Alert (volume spike notification)
- Search Results Preview Modal: Shows EXACTLY what users see (admin sees user perspective)

**Category Management Tab:**
- Existing Category Pages:
  - List with URLs: /products/lesson-plans, /products/exams, /products/grade-7-math, etc.
  - Each shows: Name, URL slug, Product count, Page views, Avg time on page, Featured products
  - Actions: Edit Category, View Page, Delete (if custom, not system)
- Edit Category Modal:
  - Basic info: Name, URL slug (auto-generated, editable), Description
  - SEO: Meta title (60 chars), Meta description (160 chars), Hero image (1200x400px)
  - Featured Products: Select up to 8 products (search, multi-select, drag-and-drop reorder)
  - Display: Show on homepage? (toggle), Sort products by (dropdown: Relevance, Newest, Best Selling, etc.)
  - Filters: Which filters to show (checkboxes: Product Type, Quarter, Weeks, Grade, Subject, Price, Rating, etc.)
- Both custom and system categories (from decision 11.2A)
- Featured products: Auto-selected by algorithm (from decision 11.3B)
  - Algorithm: Top performers, high ratings, recent sales
  - Admin can override by manually pinning (if needed)

**SEO Tools Tab:**
- Platform-Wide SEO:
  - Platform Name, Tagline
  - Homepage Title (60 chars)
  - Homepage Description (160 chars)
- Sitemap Management:
  - Auto-generated: /sitemap.xml
  - Last updated, Total URLs
  - Regenerate Sitemap button
- Canonical URLs:
  - Base URL: https://akomaylessonplanna.com
  - WWW redirect toggle
- Robots.txt:
  - View/Edit (text area)
  - Default: Allow all, Sitemap link
- Schema.org Markup:
  - Enabled: Product, Organization, Breadcrumb, Seller schemas
  - Test Schema button (Google Rich Results Test)
- Image SEO:
  - Auto-alt text toggle (generate from titles)
  - SEO-friendly filenames (auto-enabled)
- Product-level SEO editing (from decision 11.5A):
  - Admins can override product metadata
  - Edit individual product meta titles, descriptions

**Zero Results Alerts:**
- Email alerts when search term has 50+ zero-result searches (from decision 11.4A)
- Notify admins of content gaps
- Threshold-based

**Access Control:**
- Super Admin + Moderator access (from decision 11.1B)

**New Database Table:**
```sql
CREATE TABLE categories (
  id UUID PRIMARY KEY,
  name VARCHAR(255),
  slug VARCHAR(255) UNIQUE,
  description TEXT,
  meta_title VARCHAR(60),
  meta_description VARCHAR(160),
  hero_image_url TEXT,
  parent_id UUID REFERENCES categories(id),
  show_on_homepage BOOLEAN DEFAULT false,
  sort_by VARCHAR(50) DEFAULT 'relevance',
  filters TEXT[],
  featured_products UUID[],
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

---

## Section 12: Mobile Admin Experience ✅

### Decision: Responsive Only (Mobile Optimization Deferred to Phase 2)

**Current Scope: MVP Responsive Design**

**Works on Mobile (Responsive):**
- Admin panel loads on mobile (no broken layout)
- Dashboard metrics viewable (cards stack vertically)
- Lists browsable (tables scroll horizontally)
- Sidebar becomes hamburger menu
- Basic actions work (view, approvals)

**Awkward but Acceptable:**
- Tables require horizontal scrolling
- Modals are small (may need zooming)
- Small buttons (< 44px recommended, but usable)
- Desktop-first layout (shrunk down)

**Deferred to Phase 2 (3-6 months after launch):**
- Mobile-optimized navigation (bottom tab bar)
- Mobile-optimized queues (card-based, swipe gestures)
- Mobile push notifications
- Touch actions (44x44px targets, swipe, long-press)
- Offline mode
- Quick actions (one-tap approve, bulk actions)

**Responsive Breakpoints (MVP):**
- Desktop (1280px+): Full sidebar, 4-column cards, all table columns, large modals (800px)
- Tablet (768px-1279px): Collapsible sidebar, 2-3 column cards, horizontal scroll tables, medium modals (600px)
- Mobile (< 768px): Hamburger menu, single-column cards, full-width modals (95%), 32x32px min buttons

**Tablet Treatment:**
- Tablets as small desktops (no tablet-specific optimizations - from decision 12.3B)
- Responsive layout only, no special tablet features

**Mobile Quality Target:**
- Must be usable (basic tasks work, nothing broken - from decision 12.2A)
- Not mobile-optimized, but not broken either

**Revisit Timeline:**
- Phase 2 (3-6 months after launch - from decision 12.1C)

---

## Section 13: Data & Analytics Dashboard ✅

### Decision: Real-Time Analytics with Full Export

**Tab Structure:**
1. Platform Growth (user acquisition, retention, churn)
2. Seller Performance (seller health, top performers)
3. Product Insights (best-selling products, categories, trends)
4. Buyer Behavior (purchase patterns, funnels)
5. Geographic Data (users by region)

**Platform Growth Tab:**
- Time range: Last 7 days, 30 days, 90 days, This Year, All Time
- Metric Cards (Row 1): Total Users, New Signups, Seller Conversion Rate, Active Users (DAU/MAU)
- Metric Cards (Row 2): User Retention Rate, Seller Churn Rate, Avg Session Duration, Bounce Rate
- Charts:
  - User Growth Over Time (dual line: Total users vs Active users)
  - Signup Sources (pie chart: Organic, Referral, Social, Search, Direct)
  - Conversion Funnel (Visits → Signups → Verified → First product → First sale)
  - Retention Cohorts (heat map: signup month vs months active)

**Seller Performance Tab:**
- Metric Cards: Total Sellers, Active Sellers, Top Sellers (10+ sales/month), Inactive Sellers, Avg Seller Revenue, Pioneer vs Standard
- Charts:
  - Seller Performance Distribution (histogram: monthly revenue ranges)
  - Pioneer vs Standard (grouped bar chart: avg revenue, sales, rating)
  - Top 10 Sellers by Revenue (horizontal bar chart, color-coded by tier)
  - Seller Tier Distribution (pie chart: Free 70%, Pro 20%, Pioneer 10%)
- Seller Leaderboard (table): Rank, Seller, Tier, Products, Sales, Revenue, Rating, Growth
- Struggling Sellers (table): Identify sellers needing help (inactive 90+ days, low sales, low rating)
- Actions: View Profile, View Analytics, Send Message, Change Tier

**Product Insights Tab:**
- Metric Cards: Total Products, Published Products, Avg Products per Seller, Best-Selling Category, Avg Product Price, Approval Rate
- Charts:
  - Sales by Product Type (bar chart)
  - Sales by Grade Level (bar chart: K-G12)
  - Sales by Subject (horizontal bar chart)
  - Price Distribution (histogram: ₱100 ranges)
- Top Products (table): Rank, Product, Seller, Type, Grade/Subject, Price, Sales, Revenue, Rating
- Actions: View Product, Suspend, Feature

**Buyer Behavior Tab:**
- Metric Cards: Total Buyers, Repeat Buyers, Avg Order Value, Products per Order, Cart Abandonment Rate, Review Rate
- Charts:
  - Purchase Funnel (Browse → View → Add to cart → Checkout → Purchase)
  - Traffic Sources (pie chart)
  - Purchase by Day of Week (bar chart: weekends 2x more)
  - Repeat Purchase Timeline (line chart: % 2nd purchase by days)

**Geographic Data Tab:**
- Map: Philippines map with region shading (darker = more users)
- Region Breakdown Table: Region, User count, % of total, Seller count, Buyer count, Orders, Revenue
- Top regions: NCR (40%), Calabarzon (15%), Central Luzon (10%), Central Visayas (8%), Davao (5%)

**Use Cases:**
- Identify growth opportunities ("Grade 12 has few products")
- Help struggling sellers ("Seller X has 0 sales in 90 days - send tips")
- Optimize conversion ("Cart abandonment 70% - improve reminder emails")
- Geographic expansion ("Visayas low seller count - recruit there")

**Access Control:**
- Super Admin + Moderator (from decision 13.1B)

**Data Retention:**
- 1 year (from decision 13.2A)
- Balance storage vs insights

**Real-Time vs Cached:**
- Real-time (from decision 13.3A)
- Few admins = no performance issue
- Always accurate, current data

**Export Analytics:**
- Full export (CSV/Excel/PDF - from decision 13.4A)
- All data exportable
- Date range selector

**Leaderboard Exposure:**
- Show own rank + top 10 (from decision 13.5A)
- Personalized: "You're #45 of 500 sellers"
- Public leaderboards: Top 10 visible to everyone

---

## Section 14: Admin Support & Communication Tools ✅

### Decision: Email Support + External Chat Tool

**Tab Structure:**
1. Admin Notes (internal communication)
2. Support Tickets (email only - users email support@)
3. Dispute Resolution (formal mediation)
4. Admin Activity Log (audit trail)

**Admin Notes Tab:**
- Search: User/product by name or ID
- Filters: Notes with @mentions, Notes by you, Recent notes
- User/Product Cards: Show entity + all admin notes (chronological)
- Add Note Modal:
  - Note Type: General, Warning flag, VIP user, Quality concern, Follow-up needed, Other
  - Note Text: 500 chars, supports @mentions (autocomplete)
  - Priority: Normal, High, Low
  - Save button
- Notification: When @mentioned, bell + email
- Immediate visibility to all admins (from decision 14.3A)

**Support Tickets Tab:**
- Email-only support (from decision 14.1B)
- Users email: support@akomaylessonplanna.com
- Admins create tickets manually from emails
- Top metrics: Open Tickets, New Today, Resolved Today, Avg Response Time
- Filters: Status, Priority, Type, Assigned To, Date
- Ticket Cards: Status badge, Priority badge, Ticket Type, Created time, Assigned To, From (user), Subject, Description (truncated), Attachments, Last Activity, Response Count
- Actions: View Ticket, Assign to Me, Resolve, Close
- Ticket Detail Modal:
  - Left Column (Conversation): User message, Admin replies, Reply box (Public/Internal note), Send as (dropdown), Resolve checkbox
  - Right Column (Ticket Info): ID, Status, Priority, Type, Assigned To, Created, Updated, Response Time Tracker
  - Quick Actions: Assign to Me, Mark Resolved, Reopen, Escalate
- Ticket Types: Technical, Billing, Content, Account
- Workflows: Troubleshoot (technical), Verify & Process (billing), Review & Mediate (content), Verify & Change (account)

**Dispute Resolution Tab:**
- Top metrics: Open Disputes, In Mediation, Resolved This Week, Avg Resolution Time
- Filters: Status, Type, Severity, Date
- Dispute Cards: Dispute ID, Type badge, Severity badge, Status, Opened, Buyer, Seller, Product (if applicable), Issue (truncated), Evidence, Assigned Mediator, Messages, Current Stage, Actions
- Types: Product Quality, Payment, Copyright, Harassment
- Severity: High (red), Medium (orange), Low (green)
- Dispute Resolution Modal:
  - Section 1: Dispute Details (ID, Type, Severity, Status, Opened, Updated, Stage)
  - Section 2: Parties (Buyer info, Seller info, Product, Order)
  - Section 3: Evidence (Buyer's evidence, Seller's response, Platform investigation, Attachments)
  - Section 4: Communication Timeline (thread of all messages, timestamped)
  - Section 5: Resolution Options:
    - Request More Info
    - Mediation Call (future)
    - Propose Resolution: Full refund, Partial refund, Product replacement, Seller provides fix, Take down product, Ban user, Other
    - Final Decision: Choose resolution, Reason (required 500 chars), Notify both parties
  - Section 6: Admin Notes (internal, not visible to parties)
- Resolution Workflow:
  1. Admin proposes resolution
  2. Both parties notified (email)
  3. Parties have 48 hours to accept/objection
  4. Both accept → Auto-implemented
  5. One objects → Continue mediation
  6. No agreement after 7 days → Admin final decision
- Final Decision: Render verdict (binding), Implementation (refund processed via API, product access revoked, product taken down, user banned), Appeals: 7-day window to different admin
- Max timeline: 7 days for final decision (from decision 14.2A)

**Admin Activity Log Tab:**
- Filters: Admin, Action type, Target type, Date range, Keywords
- Search: Reason, target name
- Table: Timestamp, Admin, Action (badge), Target (link), Changes (JSON preview), Reason, IP Address
- Actions: View Details, Export CSV
- Audit Log Detail Modal: Complete audit entry (timestamp, admin, action, target, before/after state, changes JSON, reason, IP, user agent, related entries)
- Retention: 1 year (from decision 14.4A)

**Real-Time Admin Chat:**
- External tool only (from decision 14.5C)
- Use Slack or Discord
- Don't build internal chat system
- Admins communicate in real-time via external platform

**New Database Tables:**
```sql
CREATE TABLE support_tickets (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  subject VARCHAR(255),
  description TEXT,
  category VARCHAR(100),  -- technical, billing, content, account
  status VARCHAR(50),  -- open, in_progress, resolved, closed
  priority VARCHAR(20),  -- high, medium, low
  assigned_to UUID REFERENCES users(id),
  created_at TIMESTAMP,
  updated_at TIMESTAMP,
  resolved_at TIMESTAMP
);

CREATE TABLE ticket_messages (
  id UUID PRIMARY KEY,
  ticket_id UUID REFERENCES support_tickets(id),
  sender_id UUID REFERENCES users(id),
  message TEXT,
  is_internal BOOLEAN DEFAULT false,
  created_at TIMESTAMP
);

CREATE TABLE disputes (
  id UUID PRIMARY KEY,
  buyer_id UUID REFERENCES users(id),
  seller_id UUID REFERENCES users(id),
  product_id UUID REFERENCES products(id),
  order_id UUID REFERENCES orders(id),
  type VARCHAR(100),  -- quality, payment, copyright, harassment
  severity VARCHAR(20),  -- high, medium, low
  status VARCHAR(50),  -- open, mediation, resolved, closed
  description TEXT,
  evidence JSONB,
  resolution TEXT,
  resolved_by UUID REFERENCES users(id),
  created_at TIMESTAMP,
  resolved_at TIMESTAMP
);
```

**Email Notifications:**
- Support Tickets: User "Ticket received", Admin "New ticket", User "Admin replied"
- Disputes: Parties "New dispute", Parties "Admin proposed resolution", Parties "Final decision", Admin "New dispute"
- Admin Notes: Admin "You were mentioned in a note about [User]"

---

## Database Schema Summary

### New Tables Required:

1. **announcements** - System announcements
2. **announcement_stats** - Announcement performance tracking
3. **categories** - Category pages management
4. **support_tickets** - User support requests
5. **ticket_messages** - Support ticket conversation
6. **disputes** - Dispute resolution

### Enhanced Tables:

- **users** - Add: `admin_role` (ENUM: super_admin, moderator, content_manager)
- **admin_notes** - From Feature 02 (already exists)
- **audit_log** - From Feature 02 (already exists)

### Tables Used from Previous Features:

- users (all user data)
- teacher_id_verifications (Feature 01)
- products (Feature 03)
- product_updates (Feature 03)
- reviews (Feature 05)
- review_flags (Feature 05)
- reports (Feature 15 - new, but referenced)
- orders, order_items (Feature 04)
- withdrawal_requests (Feature 04)
- notifications (Feature 06)
- messages (messaging system)
- followers (Feature 02)
- search_queries, search_analytics (Feature 08)

---

## API Endpoints Summary

### Admin Endpoints (New):

```
GET /api/admin/dashboard - Dashboard metrics
GET /api/admin/dashboard/quick-actions - Pending counts

GET /api/admin/users - List all users
GET /api/admin/users/:id - User detail modal
PUT /api/admin/users/:id/edit - Edit user
POST /api/admin/users/:id/ban - Ban user
POST /api/admin/users/:id/unban - Unban user
POST /api/admin/users/:id/reset-password - Reset password
GET /api/admin/users/verification-queue - Verification queue
POST /api/admin/users/:id/verify-teacher - Approve/reject verification
POST /api/admin/users/:id/admin-notes - Add admin note

GET /api/admin/products/pending - Pending products queue
GET /api/admin/products/all - All products
GET /api/admin/products/suspended - Suspended products
GET /api/admin/products/history - Review history
GET /api/admin/products/:id/preview - Preview product files
POST /api/admin/products/:id/approve - Approve product
POST /api/admin/products/:id/reject - Reject product
POST /api/admin/products/:id/suspend - Suspend product
POST /api/admin/products/:id/download - Download product files

GET /api/admin/reviews/flagged - Flagged reviews queue
PUT /api/admin/reviews/:id/dismiss - Dismiss flag
DELETE /api/admin/reviews/:id - Delete review

GET /api/admin/reports - User reports queue
GET /api/admin/reports/:id - Report detail
PUT /api/admin/reports/:id/resolve - Resolve report
GET /api/admin/reports/resolved - Resolved reports history

GET /api/admin/pioneers - Current Pioneers
GET /api/admin/pioneers/candidates - Pioneer candidates
POST /api/admin/pioneers/add - Add Pioneer
DELETE /api/admin/pioneers/:id/remove - Remove Pioneer
GET /api/admin/pioneers/analytics - Pioneer analytics
GET /api/admin/pioneers/history - Pioneer history

GET /api/admin/financials/revenue - Revenue overview
GET /api/admin/financials/withdrawals - Withdrawal requests
POST /api/admin/financials/withdrawals/:id/process - Process withdrawal
POST /api/admin/financials/withdrawals/:id/reject - Reject withdrawal
GET /api/admin/financials/withdrawals/history - Payout history
GET /api/admin/financials/reports - Financial reports

GET /api/admin/announcements - All announcements
POST /api/admin/announcements - Create announcement
GET /api/admin/announcements/:id - Announcement detail
PUT /api/admin/announcements/:id/edit - Edit announcement
DELETE /api/admin/announcements/:id - Delete announcement
GET /api/admin/announcements/templates - Announcement templates

GET /api/admin/settings/platform - Platform settings
PUT /api/admin/settings/platform/update - Update platform settings
GET /api/admin/settings/feature-flags - Feature flags
PUT /api/admin/settings/feature-flags/toggle - Toggle feature
GET /api/admin/settings/email - Email settings
PUT /api/admin/settings/email/update - Update email settings
GET /api/admin/settings/payments - Payment settings
PUT /api/admin/settings/payments/update - Update payment settings
GET /api/admin/settings/system - System status
PUT /api/admin/settings/maintenance-mode - Toggle maintenance mode

GET /api/admin/admins - List all admins
POST /api/admin/admins/create - Create admin
PUT /api/admin/admins/:id/edit-role - Edit admin role
DELETE /api/admin/admins/:id/delete - Delete admin

GET /api/admin/search/analytics - Search analytics
GET /api/admin/search/popular - Popular searches
GET /api/admin/search/zero-results - Zero results searches
GET /api/admin/categories - Category management
POST /api/admin/categories/create - Create category
PUT /api/admin/categories/:id/edit - Edit category
DELETE /api/admin/categories/:id/delete - Delete category
GET /api/admin/settings/seo - SEO settings
PUT /api/admin/settings/seo/update - Update SEO settings

GET /api/admin/analytics/growth - Platform growth analytics
GET /api/admin/analytics/sellers - Seller performance
GET /api/admin/analytics/products - Product insights
GET /api/admin/analytics/buyers - Buyer behavior
GET /api/admin/analytics/geographic - Geographic data
GET /api/admin/analytics/export - Export analytics

GET /api/admin/support/tickets - Support tickets
POST /api/admin/support/tickets/create - Create ticket from email
GET /api/admin/support/tickets/:id - Ticket detail
POST /api/admin/support/tickets/:id/reply - Reply to ticket
PUT /api/admin/support/tickets/:id/resolve - Resolve ticket

GET /api/admin/disputes - Dispute queue
GET /api/admin/disputes/:id - Dispute detail
POST /api/admin/disputes/:id/propose - Propose resolution
POST /api/admin/disputes/:id/decision - Final decision
GET /api/admin/disputes/resolved - Resolved disputes

GET /api/admin/audit-log - Audit trail
GET /api/admin/audit-log/:id - Audit entry detail
GET /api/admin/admin-notes - Admin notes search
POST /api/admin/admin-notes/add - Add admin note
```

---

## Implementation Checklist

### Phase 1: Foundation (Weeks 1-2)
- [ ] Set up admin routes (/admin/*)
- [ ] Create admin layout (sidebar + top bar)
- [ ] Implement authentication for admin routes
- [ ] Create role-based access control middleware
- [ ] Set up database tables (announcements, categories, support_tickets, disputes)
- [ ] Create audit logging middleware

### Phase 2: Dashboard & Overview (Weeks 3-4)
- [ ] Build Dashboard Overview with metrics
- [ ] Implement Quick Action cards with pending counts
- [ ] Create all 4 charts (User Growth, Sales by Category, Order Volume, Seller Performance)
- [ ] Build Recent Activity Feed
- [ ] Add time range selector
- [ ] Implement caching strategy (1-min, 5-min, 15-min)

### Phase 3: User Management (Weeks 5-6)
- [ ] Build All Users table with search/filters
- [ ] Create User Detail Modal (7 tabs)
- [ ] Implement Verification Queue
- [ ] Build Banned Users tab
- [ ] Implement Admin Notes system with @mentions
- [ ] Add bulk actions with undo toast
- [ ] Email notifications for verification

### Phase 4: Product Moderation (Weeks 7-8)
- [ ] Build Pending Reviews queue
- [ ] Create Product Preview Modal (downloadable files)
- [ ] Implement Approve/Reject workflow
- [ ] Add rejection reasons and resubmission tracking
- [ ] Build All Products search
- [ ] Create Suspended Products tab
- [ ] Implement Review History
- [ ] Add Quality Guidelines documentation
- [ ] Email notifications for approvals/rejections

### Phase 5: Content Moderation (Weeks 9-10)
- [ ] Build Flagged Reviews queue
- [ ] Implement Dismiss/Delete actions
- [ ] Create User Reports queue
- [ ] Implement Report Resolution workflow
- [ ] Add escalation system
- [ ] Create Appeal Process workflow
- [ ] Build Resolved Items history
- [ ] Create Moderation Stats dashboard
- [ ] Email notifications for resolutions/appeals

### Phase 6: Pioneer Management (Weeks 11-12)
- [ ] Build Current Pioneers tab
- [ ] Create Pioneer cards with performance metrics
- [ ] Implement Add Pioneer workflow (invite-only)
- [ ] Create Remove Pioneer workflow
- [ ] Build Pioneer Candidates tab with Quality Score
- [ ] Create Pioneer History & Analytics
- [ ] Email templates for invitations/removals
- [ ] Integrate with Pro features (auto-bundle)

### Phase 7: Financial Overview (Weeks 13-14)
- [ ] Build Revenue Overview tab with charts
- [ ] Create Withdrawal Requests queue
- [ ] Implement manual withdrawal processing
- [ ] Integrate GCash/Maya Disbursement API
- [ ] Handle failed withdrawals (manual retry)
- [ ] Create Payout History tab
- [ ] Build Financial Reports (5 types)
- [ ] Implement CSV/Excel/PDF export
- [ ] Super Admin only access control

### Phase 8: System Announcements (Weeks 15)
- [ ] Build Create Announcement form with rich text editor
- [ ] Implement advanced audience segmentation
- [ ] Create scheduling system
- [ ] Build All Announcements list
- [ ] Implement announcement stats tracking
- [ ] Create Template System with variables
- [ ] Email service integration (Resend/SendGrid)
- [ ] In-app notification creation

### Phase 9: Settings (Weeks 16)
- [ ] Build Platform Settings tab
- [ ] Implement Feature Flags system
- [ ] Create Email Settings with template editor
- [ ] Build Payment Settings (GCash/Maya)
- [ ] Implement System Status monitoring
- [ ] Create Admin Management (CRUD admins)
- [ ] Add audit logging for all settings changes
- [ ] Implement immediate changes (no approval)

### Phase 10: Admin Roles & Permissions (Week 17)
- [ ] Implement 3 roles (Super Admin, Moderator, Content Manager)
- [ ] Create role comparison matrix
- [ ] Build approval workflow for restricted actions
- [ ] Implement session management (4-hour timeout)
- [ ] Create "View as User" testing feature
- [ ] Build Admin Profile section
- [ ] Implement comprehensive audit logging

### Phase 11: Search & Discovery Admin (Weeks 18-19)
- [ ] Build Search Analytics dashboard
- [ ] Create Popular Searches tracking
- [ ] Implement Zero Results Report with alerts
- [ ] Build Category Management system
- [ ] Create Category Editor (SEO, featured products)
- [ ] Implement auto-selected featured products algorithm
- [ ] Build SEO Tools panel
- [ ] Add product-level SEO editing
- [ ] Create Search Results Preview modal

### Phase 12: Data & Analytics (Weeks 20-21)
- [ ] Build Platform Growth tab (4 charts)
- [ ] Create Seller Performance tab (leaderboards)
- [ ] Build Product Insights tab (trending products)
- [ ] Create Buyer Behavior tab (funnels)
- [ ] Implement Geographic Data tab (map + table)
- [ ] Add real-time analytics (no caching)
- [ ] Implement CSV/Excel/PDF export
- [ ] Create personalized leaderboards (show own rank)

### Phase 13: Support & Communication (Weeks 22)
- [ ] Enhance Admin Notes system (search, filters)
- [ ] Create Support Tickets system (email-to-ticket)
- [ ] Build Ticket Detail modal with conversation
- [ ] Implement Dispute Resolution workflow
- [ ] Create mediation tools (propose resolution, final decision)
- [ ] Add 7-day appeal process
- [ ] Build comprehensive Activity Log
- [ ] Implement email notifications for tickets/disputes
- [ ] Add audit log export (CSV)

### Phase 14: Responsive Design (Weeks 23-24)
- [ ] Implement responsive breakpoints (desktop/tablet/mobile)
- [ ] Create hamburger menu for mobile
- [ ] Build responsive metric cards (stack vertically)
- [ ] Implement horizontal scroll for tables
- [ ] Create responsive modals (full-width on mobile)
- [ ] Test all admin features on mobile devices
- [ ] Document mobile limitations (Phase 2 optimization)

### Phase 15: Testing & Polish (Weeks 25-26)
- [ ] Comprehensive testing of all admin features
- [ ] Test all approval workflows
- [ ] Verify email notifications
- [ ] Test audit logging completeness
- [ ] Verify role-based access control
- [ ] Load testing for analytics dashboards
- [ ] Security audit (SQL injection, XSS, CSRF)
- [ ] Performance optimization (caching, indexing)
- [ ] User acceptance testing (UAT) with admin scenarios
- [ ] Documentation (admin guide, runbooks)

---

## Key Metrics & Targets

### Performance:
- Dashboard load time: < 2 seconds
- Search analytics: Real-time (no caching needed)
- Chart rendering: < 1 second
- Table load: < 500ms

### Moderation:
- Target product review time: 24-48 hours
- Target verification time: 24-48 hours
- Target dispute resolution: 7 days max
- Target support response: 24 hours

### Platform Health:
- Target approval rate: 80%+
- Target seller retention: 70%+ (after 30 days)
- Target buyer repeat purchase: 20%+
- Target platform rating: 4.0+ ⭐

---

## Notes for Developers

### Security Considerations:
- All admin routes require authentication
- Role-based access control on EVERY endpoint
- Audit log ALL admin actions (cannot be disabled)
- Super Admin only for financial data
- CSRF protection on all POST/PUT/DELETE
- Rate limiting on admin routes (prevent brute force)
- SQL injection prevention (parameterized queries)
- XSS protection (sanitize all user inputs)

### Performance Considerations:
- Use database indexes for admin queries
- Pre-calculate heavy analytics (nightly jobs)
- Cache dashboard metrics appropriately
- Use pagination for large datasets (50 per page)
- Lazy load images and data
- Optimize database queries (avoid N+1 queries)

### UX Considerations:
- One-click actions where possible (Approve, Dismiss)
- Instant actions with undo toast (no confirmation dialogs)
- Clear visual feedback for all actions
- Loading states for async operations
- Error messages with actionable next steps
- Breadcrumbs for navigation
- Keyboard shortcuts for power users (future)

### Filipino Market Context:
- Tagalog profanity filter needed
- PRC license expiration tracking
- Grace period handling (1 month)
- GCash/Maya integration testing
- Holiday schedule (Philippines holidays)
- Timezone: PST/UTC+8

---

## Future Enhancements (Phase 2+)

1. **Mobile Admin Optimization** (Phase 2)
   - Bottom tab navigation
   - Swipe gestures on cards
   - Pull-to-refresh
   - Touch-optimized interface (44x44px targets)
   - Offline mode
   - Push notifications for urgent items

2. **Bulk Operations**
   - Bulk approve products (trusted sellers)
   - Bulk export (multiple selections)
   - Bulk email users
   - Bulk ban/unban

3. **Advanced Analytics**
   - Cohort analysis
   - Funnel analysis with drop-off points
   - A/B testing for features
   - Heatmaps for admin actions
   - Predictive analytics (churn prediction)

4. **Automation**
   - Auto-approve trusted sellers (10+ approved products)
   - Auto-process withdrawals (trusted sellers)
   - Auto-flag suspicious activity
   - Scheduled reports (email weekly/monthly)

5. **Integration**
   - Slack integration (notifications in Slack channel)
   - Google Analytics integration
   - CRM integration (customer management)
   - Accounting software integration (Xero, QuickBooks)

---

## Document Status

**Status:** ✅ DESIGN COMPLETE
**Last Updated:** January 13, 2026
**Version:** 1.0
**Total Decisions Made:** 68 (14 sections × 4-5 questions each)

**Next Steps:**
1. Update main design summary document with Admin Panel section
2. Create detailed implementation plan
3. Begin Phase 1: Foundation (database setup, admin routes)
4. Proceed with remaining features (10+ if needed)
5. Create comprehensive database schema after ALL features finalized

**Related Documents:**
- Feature 01: Authentication & User Management
- Feature 02: User Profiles & Profile Management
- Feature 03: Product Listings & Management
- Feature 04: Shopping Cart & Checkout Flow
- Feature 05: Reviews & Ratings
- Feature 06: Social Features
- Feature 07: Seller Dashboard & Analytics
- Feature 08: Advanced Search & Discovery
- Main Design Summary: docs/2025-01-09-akomaylessonplanna-complete-design-summary.md

---

*This document contains the complete design specification for Feature 09: Admin Panel & Content Moderation. All major decisions have been documented. Use this as the single source of truth during implementation.*
