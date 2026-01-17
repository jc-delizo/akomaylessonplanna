# Feature 12: Email System (Transactional & Notification Emails) - Complete Design

**Project:** AKOMAYLESSONPLANNA - Filipino Teacher Lesson Plan Marketplace
**Date:** January 13, 2026
**Status:** ✅ Design Complete - Ready for Implementation
**Feature:** Email System (Transactional & Notification Emails)

---

## Table of Contents

1. [Overview](#overview)
2. [Email Service Provider & Infrastructure](#email-service-provider--infrastructure)
3. [Email Categories & Types](#email-categories--types)
4. [Email Template Design System](#email-template-design-system)
5. [Email Template Management](#email-template-management)
6. [Email Delivery & Scheduling System](#email-delivery--scheduling-system)
7. [Email Security & Compliance](#email-security--compliance)
8. [Email Analytics & Monitoring](#email-analytics--monitoring)
9. [Error Handling & Edge Cases](#error-handling--edge-cases)
10. [Cost & Budget Considerations](#cost--budget-considerations)
11. [Implementation Priority (MVP vs Post-Launch)](#implementation-priority-mvp-vs-post-launch)
12. [Complete Email Template Specifications](#complete-email-template-specifications)
13. [Database Schema](#database-schema)
14. [API Endpoints](#api-endpoints)
15. [Implementation Checklist](#implementation-checklist)

---

## Overview

Feature 12 implements a comprehensive email system for AKOMAYLESSONPLANNA, handling **26 distinct email types** across authentication, transactions, notifications, and administrative functions.

### Key Design Decisions

**1. Hybrid Email Approach**
- **Supabase Auth** for authentication emails (4 types) - built-in, free
- **Resend** for transactional/marketing emails (22+ types) - flexible, cost-effective

**2. Two-Tier Preference System**
- **User Preferences:** Category-based controls (4 categories) - simple, user-friendly
- **Admin Configuration:** Individual toggles (26 email types) - granular platform control

**3. Email Queue System**
- Priority-based queue with retry logic
- Rate limiting for deliverability
- Scheduled emails (cart abandonment, review reminders)
- Batch sending for announcements

**4. Mobile-First Design**
- Responsive HTML templates
- Plain text fallback (automatic)
- Optimized for mobile email clients (70%+ Filipino users)

---

## Email Service Provider & Infrastructure

### **Hybrid Approach: Supabase Auth + Resend**

#### **Supabase Auth Emails (Built-in, Automatic)**

**Email Types:**
1. Welcome/Signup confirmation
2. Email verification (sellers only)
3. Password reset request
4. Password reset confirmation

**How It Works:**
- Supabase Auth handles these automatically
- Uses SendGrid infrastructure under the hood
- Free tier: 3 emails/user/month (sufficient for auth)
- Customizable in Supabase Dashboard

**Setup:**
```javascript
// Enable in Supabase Dashboard
// Authentication → Email Auth → Enable
// Customize email templates in Supabase Dashboard
```

#### **Resend (Custom Transactional Emails)**

**Why Resend:**
- **Developer-friendly:** Best DX, excellent Next.js integration
- **Cost-effective:** $20/month for 50,000 emails (vs SendGrid's $100)
- **Generous free tier:** 3,000 emails/month free
- **Good PH deliverability:** Reliable delivery to @gmail, @yahoo, @outlook
- **Built-in templates:** Store and manage templates via API
- **React Email components:** `@react-email` for template creation

**Email Types (22+):**
- Product notifications (approved, rejected, suspended, version updates)
- Shopping cart & checkout (cart abandonment, order confirmation, payment status, download ready, refunds)
- Reviews (reminders, responses, flagged)
- Social features (new sale, new review, followers, price drops, new products)
- Admin notifications (verification, bans, announcements)

**Pricing:**

| Plan | Monthly Emails | Cost | When You'll Hit This |
|------|---------------|------|---------------------|
| Free | 3,000 | ₱0 | Month 1 (exceeds free) |
| Pro | 50,000 | $20 (~₱1,200) | Months 1-6 |
| Pro | 100,000 | $40 (~₱2,400) | Months 7-12 |
| Custom | 500,000+ | Contact sales | Year 2+ |

**Estimated Cost:**
- **Months 1-6:** $20/month (~₱1,200)
- **Months 7-12:** $40/month (~₱2,400)
- **Year 1 Total:** ~$360 (~₱21,600)

### **No Backup Provider (MVP)**

**Decision:** Start with Resend only

**Rationale:**
- Resend is reliable with good uptime
- Email queue handles temporary outages (emails stay in queue until service resumes)
- Add backup provider (SendGrid/Mailgun) only if issues arise at scale

---

## Email Categories & Types

### **Total: 26 Email Types**

#### **Category 1: Transactional Emails (Required - Cannot Disable)**

**Definition:** Essential emails for account security, order processing, and platform operations

**Email Types (10):**
1. Welcome email
2. Email verification (sellers)
3. Password reset request
4. Password reset confirmation
5. Order confirmation
6. Payment successful
7. Payment failed
8. Download ready
9. Refund processed
10. Review flagged (content moderation)

**User Control:** Always ON (cannot disable)

**Admin Control:** Individual toggles for each type

#### **Category 2: Selling Notifications**

**Definition:** Emails relevant to sellers about their products and sales

**Email Types (8):**
1. Product submitted for review
2. Product approved
3. Product rejected
4. Product suspended
5. Product version update
6. New sale notification ("You made a sale!")
7. New review notification
8. Teacher verification approved/rejected

**User Control:** Category toggle `selling_notifications`

**Admin Control:** Individual toggles for each type

#### **Category 3: Buying Notifications**

**Definition:** Emails relevant to buyers about their purchases

**Email Types (6):**
1. Cart abandonment reminder (24 hours)
2. Review reminder (24h after download)
3. Price drop notification (wishlisted items)
4. Refund approved/processed
5. Review response notification
6. Product version update

**User Control:** Category toggle `buying_notifications`

**Admin Control:** Individual toggles for each type

#### **Category 4: Social Notifications**

**Definition:** Emails about community engagement (followers, activity)

**Email Types (3):**
1. New follower notification
2. New product from followed seller
3. Review response notification

**User Control:** Category toggle `social_notifications`

**Admin Control:** Individual toggles for each type

#### **Category 5: Platform Announcements**

**Definition:** System-wide communications from platform

**Email Types (2):**
1. System announcements (maintenance, updates, policy changes)
2. Account ban notification (appeal process info)

**User Control:** Category toggle `announcements`

**Admin Control:** Individual toggles for each type

---

## Email Template Design System

### **Template Structure**

**Standard Layout (All Emails):**

```
┌────────────────────────────────────┐
│ HEADER (Logo + Branding)           │
├────────────────────────────────────┤
│ PREHEADER (Optional preview text)  │
├────────────────────────────────────┤
│ MAIN CONTENT                       │
│ • Greeting (Personalized)          │
│ • Email Body (Rich Text)           │
│ • CTA Button (if applicable)       │
│ • Additional Info (if applicable)  │
├────────────────────────────────────┤
│ FOOTER (Locked - Cannot Edit)      │
│ • Platform branding                │
│ • Unsubscribe link                 │
│ • Preferences link                 │
│ • Contact info                     │
│ • Copyright                        │
└────────────────────────────────────┘
```

### **Brand Design System**

**Colors:**
- Primary Gradient: `#667eea` → `#764ba2` (purple)
- Background: `#ffffff` (white)
- Secondary Background: `#f8f9fa` (light gray)
- Text: `#1a202c` (dark gray)
- Secondary Text: `#6c757d` (medium gray)
- Accent/Buttons: `#667eea` (purple)

**Typography:**
- Font Family: Inter (fallback: system fonts)
- Headings: 24-28px, bold
- Body Text: 16px, regular
- Footer: 12-14px

**Components:**
- Buttons: Rounded corners (8px), purple gradient background
- Info Cards: Light gray background (`#f7fafc`), left border accent (4px solid `#667eea`)
- Dividers: Light gray (`#e9ecef`)

### **Email Variables (Personalization)**

**Standard Variables (All Templates):**

```javascript
{
  // User data
  user_name: "Teacher Maria",
  user_email: "maria@example.com",
  user_username: "teacher_maria",

  // Platform data
  platform_name: "AKOMAYLESSONPLANNA",
  platform_url: "https://akomaylessonplanna.com",
  logo_url: "https://akomaylessonplanna.com/logo.png",

  // Footer links (auto-generated)
  preferences_link: "https://akomaylessonplanna.com/settings/notifications",
  unsubscribe_link: "https://akomaylessonplanna.com/unsubscribe?token=xxx",
  support_email: "support@akomaylessonplanna.com",

  // Timestamps
  current_date: "January 13, 2026",
  current_year: "2026"
}
```

**Product Variables (Product Emails):**

```javascript
{
  product_title: "Grade 7 Math DLL (Q1 Weeks 1-10)",
  product_cover_image: "https://...",
  product_url: "https://akomaylessonplanna.com/products/123",
  product_price: "₱150.00",
  product_type: "Lesson Plan",
  grade_level: "Grade 7",
  subject: "Mathematics"
}
```

**Order Variables (Checkout Emails):**

```javascript
{
  order_id: "ORD-12345",
  order_date: "January 13, 2026",
  order_total: "₱450.00",
  order_items: [
    { title: "Grade 7 Math DLL", price: "₱150" }
  ],
  payment_method: "GCash",
  download_link: "https://akomaylessonplanna.com/orders/123/download"
}
```

### **Mobile-Responsive Design**

**Best Practices:**
- Single-column layout (max-width: 600px)
- Large touch targets (buttons 44px+ min-height)
- Readable font size (16px minimum)
- Optimized images (max-width: 100%, auto-scaling)
- Tested on: iOS Mail, Gmail App, Outlook Mobile

---

## Email Template Management

### **Admin Panel: Template Editor**

**Location:** `/admin/settings/email/templates`

**Features:**

1. **Rich Text Editor**
   - Bold, italic, underline
   - Headings (H1, H2, H3)
   - Lists (bullet, numbered)
   - Links, images
   - No HTML source view (non-technical admins)

2. **Variable Insertion**
   - Dropdown to insert variables
   - Auto-suggest when typing `{{`
   - Validation: Required vs optional variables

3. **Locked Sections**
   - Header (logo, branding) - Admin cannot edit
   - Footer (unsubscribe, links) - Admin cannot edit
   - Ensures brand consistency

4. **Flexible Sections**
   - Subject line
   - Preheader text (optional)
   - Email body (rich text)
   - CTA button (label only, link auto-filled)

5. **Version Control**
   - Track all template changes
   - Revert to previous version
   - Version history with who/when
   - Unlimited versions stored

6. **Preview & Test**
   - Preview with sample data
   - Send test email to admin's email
   - Mobile/desktop preview toggle

7. **Template Cloning**
   - Create new template from existing
   - Useful for similar email types

**UI Example:**

```
┌────────────────────────────────────────────────────────┐
│ Edit Template: Product Approved Notification           │
├────────────────────────────────────────────────────────┤
│ Subject Line                                           │
│ [Your product was approved! 🎉                      ]  │
│                                                        │
│ Preheader Text (Optional)                             │
│ [Great news! Your product is now live...            ]  │
│                                                        │
│ Email Content (Rich Text Editor)                      │
│ [Hi {{user_name}},                                    ]  │
│ [                                                     ]  │
│ [Great news! Your product has been approved...       ]  │
│ [                                                     ]  │
│ [Tips for your first sale:                           ]  │
│ [• Share to Facebook teacher groups                  ]  │
│ [• Pin to your profile                               ]  │
│ [                                                     ]  │
│ [Good luck! 🍀                                       ]  │
│                                                        │
│ Available Variables:                                   │
│ {{user_name}} {{product_title}} {{product_url}} ...    │
│                                                        │
│ [Preview Email] [Send Test to Your Email]             │
│                                                        │
│ Version History: [v1.2 (Current) ▼]                    │
│                                                        │
│                        [Cancel] [Save Changes]        │
└────────────────────────────────────────────────────────┘
```

---

## Email Delivery & Scheduling System

### **Three-Tier Delivery Strategy**

#### **Tier 1: Immediate Emails (Real-Time)**

**Send immediately when event occurs. No queuing delay.**

**Email Types:**
- Password reset
- Order confirmation
- Payment successful/failed
- Product approved/rejected
- New sale notification
- Download ready

**Implementation:**
```typescript
// Direct send via Resend API
await resend.emails.send({
  from: 'noreply@akomaylessonplanna.com',
  to: user.email,
  subject: 'Order confirmed',
  html: template.render(data)
});
```

#### **Tier 2: Scheduled Emails (Delayed)**

**Send after specified time delay. Managed by scheduled jobs.**

**Email Types:**
- Cart abandonment reminder (24 hours after cart created)
- Review reminder (24 hours after download)

**Implementation:**
```typescript
// Schedule in email queue
await db.email_queue.create({
  data: {
    email_type: 'cart_abandonment',
    recipient_user_id: userId,
    send_after: new Date(Date.now() + 24 * 60 * 60 * 1000)  // 24 hours
  }
});
```

#### **Tier 3: Batch Emails (Bulk)**

**Send to many users at once. Rate-limited to avoid spam filters.**

**Email Types:**
- System announcements
- New product from followed seller (to all followers)
- Price drop notifications (to all wishlisted users)

**Implementation:**
```typescript
// Create queue items for all recipients
const users = await getTargetAudience();
for (const user of users) {
  await db.email_queue.create({
    data: {
      email_type: 'system_announcement',
      recipient_user_id: user.id,
      priority: 7  // Lower priority for bulk
    }
  });
}

// Queue processor sends in batches (500 at a time, 1 min delay)
```

### **Email Queue System**

**Database Schema:** See [Database Schema](#database-schema) section

**Queue Processor (Edge Function):**

```typescript
// Runs every 1 minute via cron
async function processEmailQueue() {
  const pendingEmails = await db.email_queue.findMany({
    where: {
      status: 'pending',
      send_after: { lte: new Date() }
    },
    orderBy: { priority: 'asc', send_after: 'asc' },
    take: 50  // Process 50 at a time
  });

  for (const email of pendingEmails) {
    await sendEmail(email);
  }
}
```

### **Rate Limiting & Throttling**

**Rate Limit Rules:**

```typescript
const rateLimits = {
  // Per user limits
  perUser: {
    maxPerHour: 10,        // Max 10 emails per user per hour
    maxPerDay: 50,         // Max 50 emails per user per day
  },

  // Platform limits
  platform: {
    maxPerMinute: 100,     // Max 100 emails platform-wide per minute
    maxPerHour: 3000,      // Max 3000 emails platform-wide per hour
  },

  // Batch sending limits
  batch: {
    announcements: {
      batchSize: 500,      // Send 500 at a time
      delayBetweenBatches: 60000  // Wait 1 minute between batches
    }
  }
};
```

**Smart Scheduling:**

```typescript
// Don't send emails at inappropriate hours
function getOptimalSendTime(userTimezone: string, baseTime: Date): Date {
  const hour = baseTime.getHours();

  // If scheduled time is outside 8 AM - 9 PM, reschedule to next day 8 AM
  if (hour < 8 || hour >= 21) {
    const nextDay = new Date(baseTime);
    nextDay.setDate(nextDay.getDate() + 1);
    nextDay.setHours(8, 0, 0, 0);
    return nextDay;
  }

  return baseTime;
}
```

---

## Email Security & Compliance

### **Email Authentication (SPF, DKIM, DMARC)**

**Required for maximum deliverability**

**1. SPF (Sender Policy Framework)**
```
DNS Record (TXT):
Type: TXT
Name: @
Value: v=spf1 include:resend.com -all
```

**2. DKIM (DomainKeys Identified Mail)**
```
DNS Record (TXT):
Type: TXT
Name: resend._domainkey
Value: k=rsa; p=MIGfMA0... (provided by Resend)
```

**3. DMARC (Domain-based Message Authentication)**
```
DNS Record (TXT):
Type: TXT
Name: _dmarc
Value: v=DMARC1; p=none; rua=mailto:dmarc@akomaylessonplanna.com
```

**DMARC Policy Rollout:**
- **Month 1:** `p=none` (monitoring only, no blocking)
- **Month 2:** `p=quarantine` (spam folder)
- **Month 4:** `p=reject` (block fake emails)

### **Data Privacy Act (DPA) Compliance**

**Philippines Legal Requirements:**

1. **Unsubscribe Link**
   - Required in all non-transactional emails
   - One-click unsubscribe
   - Process within 24 hours

2. **Consent Management**
   - Users opt-in to marketing emails at signup
   - Can opt-out anytime
   - Preferences respected immediately

3. **Data Protection**
   - Encrypt email addresses in database
   - No sharing/selling email data
   - Access logs (who viewed user data)

4. **Data Retention**
   - Email queue data: 30 days
   - Sent email logs: 1 year
   - User preferences: While account exists

### **Spam Prevention**

**1. Rate Limiting**
- Already implemented (see above)

**2. Email Verification**
```typescript
// Check if email is valid format before sending
function isValidEmail(email: string): boolean {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
}
```

**3. Suppression List**
- Hard bounces added to suppression list
- Spam complaints added to suppression list
- Never email suppressed addresses again

**Database Schema:**
```sql
CREATE TABLE email_suppression_list (
  id UUID PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  reason VARCHAR(50),  -- 'hard_bounce', 'spam_complaint', 'manual_suppression'
  created_at TIMESTAMP DEFAULT NOW()
);
```

---

## Email Analytics & Monitoring

### **Metrics to Track**

**Delivery Metrics:**
- Sent count
- Delivery rate (sent ÷ attempted)
- Bounce rate (hard + soft bounces)
- Delivery time

**Engagement Metrics:**
- Open rate (opened ÷ delivered)
- Click rate (clicked ÷ opened)
- Unsubscribe rate
- Spam complaint rate

**Email Type Metrics:**
- Top performing email types
- Least performing email types
- Email volume by type

**Platform Health:**
- Queue depth (emails waiting)
- Processing time
- Failure rate

### **Analytics Dashboard (Admin Panel)**

**Location:** `/admin/analytics/email`

**UI Components:**

```
┌─────────────────────────────────────────────────────────┐
│ Email Analytics Dashboard                               │
├─────────────────────────────────────────────────────────┤
│                                                         │
│ Time Range: [Last 7 Days ▼]                            │
│                                                         │
│ Metric Cards                                            │
│ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐   │
│ │  12,450  │ │  94.2%   │ │  42.8%   │ │   1.2%   │   │
│ │   Sent   │ │Delivery  │ │Open Rate │ │  Bounce  │   │
│ └──────────┘ └──────────┘ └──────────┘ └──────────┘   │
│                                                         │
│ Email Performance by Type                              │
│ ┌─────────────────────────────────────────────────┐   │
│ │ Type                │ Sent │ Open │ Click│Bounce│   │
│ ├─────────────────────────────────────────────────┤   │
│ │ Order confirmation  │ 456  │ 78%  │ 62%  │ 0.5% │   │
│ │ New sale            │ 312  │ 95%  │ 45%  │ 0.2% │   │
│ │ Cart abandonment    │ 234  │ 38%  │ 12%  │ 2.1% │   │
│ └─────────────────────────────────────────────────┘   │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### **Alerting System**

**Alert Conditions:**

```typescript
const alertThresholds = {
  bounceRate: 5,        // Alert if bounce rate > 5%
  failureRate: 2,       // Alert if failure rate > 2%
  queueDepth: 1000,     // Alert if pending emails > 1000
  processingTime: 300   // Alert if avg processing time > 5 minutes
};

// Check alerts every hour
async function checkEmailAlerts() {
  const stats = await getRecentEmailStats();

  if (stats.bounceRate > alertThresholds.bounceRate) {
    await sendAdminAlert({
      type: 'high_bounce_rate',
      message: `Bounce rate is ${stats.bounceRate}%`,
      severity: 'high'
    });
  }
}
```

---

## Error Handling & Edge Cases

### **Retry Logic**

**Exponential Backoff Strategy:**

```typescript
const retrySchedule = {
  attempt1: 0,      // Immediate
  attempt2: 60,     // 1 minute later
  attempt3: 300,    // 5 minutes later
  maxAttempts: 3
};
```

**Retry Flow:**

```
Email Fails
  ↓
Wait (0 min / 1 min / 5 min)
  ↓
Retry (max 3 times)
  ↓
If all retries fail → Mark as permanently failed
  ↓
Log error → Alert admin → Add to suppression list (if hard bounce)
```

### **Bounce Handling**

**Soft Bounces (Temporary):**
- Full inbox
- Temporary server issues
- Action: Retry up to 3 times

**Hard Bounces (Permanent):**
- Invalid email address
- Domain doesn't exist
- Action: Add to suppression list, mark as failed

### **Email Service Outage**

**What happens if Resend is down?**

```typescript
// Health check before sending
async function checkEmailServiceHealth(): Promise<boolean> {
  try {
    await resend.api.get('/emails', { limit: 1 });
    return true;
  } catch (error) {
    console.error('Email service is down:', error);
    // Alert admins
    await sendAdminAlert({ type: 'email_service_down' });
    return false;
  }
}

// If service is down, emails stay in queue with status='pending'
// Queue processor retries when service is back up
```

### **Email Changes**

**User updates email address:**

```typescript
// Flow:
// 1. User requests email change
// 2. Send confirmation to NEW email
// 3. User clicks verification link
// 4. Update user's email in database
// 5. Send confirmation to BOTH old and new email
```

---

## Cost & Budget Considerations

### **Email Volume Estimation**

| Month | Users | Est. Emails/Month | Resend Plan | Monthly Cost |
|-------|-------|-------------------|-------------|--------------|
| 1 | 500 | 7,000 | Free tier exceeded | $20 (₱1,200) |
| 6 | 2,000 | 39,000 | Pro (50k) | $20 (₱1,200) |
| 12 | 5,000 | 119,000 | Pro (100k) | $40 (₱2,400) |

**Year 1 Total:** ~$360 (~₱21,600)

**Budget-Friendly Tips:**
1. Monitor usage closely
2. Optimize notification emails (don't spam)
3. Clean email list regularly (remove suppressed emails)
4. Batch announcements efficiently

---

## Implementation Priority (MVP vs Post-Launch)

### **MVP Critical (Must Have for Launch)**

**Phase 1: Core Infrastructure**
- ✅ Supabase Auth emails (built-in)
- ✅ Resend account + API setup
- ✅ Email queue system
- ✅ Template system with basic templates
- ✅ Admin configuration panel
- ✅ SPF/DKIM/DMARC setup

**Phase 2: Essential Transactional Emails (10)**
1. Password reset (Supabase Auth)
2. Email verification (Supabase Auth)
3. Order confirmation
4. Payment successful/failed
5. Download ready
6. Product approved/rejected
7. Cart abandonment (24h)
8. Refund notification
9. New sale notification
10. Teacher verification approved/rejected

**Phase 3: Basic Analytics**
- ✅ Email delivery tracking
- ✅ Basic dashboard (sent, delivered, bounced)
- ✅ Queue monitoring

### **Post-Launch (Month 1-3)**

11. Review reminder email
12. New review notification
13. Product version update
14. Enhanced analytics dashboard
15. Template version history

### **Post-Launch (Month 4-6)**

16. Review response notification
17. Price drop notification
18. New product from followed seller
19. System announcements (bulk)
20. Account ban notification

### **Post-Launch (Month 7+)**

21. New follower notification
22. Review flagged notification
23. Product suspended notification
24. Product submitted confirmation
25. A/B testing for templates
26. Behavioral emails (win-back campaigns)

---

## Complete Email Template Specifications

See detailed specifications for all 26 email types in the sections above.

**Quick Reference:**

| # | Email Type | Category | MVP Priority |
|---|------------|----------|--------------|
| 1 | auth_welcome | Transactional | Supabase Auth |
| 2 | auth_email_verification | Transactional | Critical |
| 3 | auth_password_reset | Transactional | Critical |
| 4 | auth_password_reset_confirmation | Transactional | Critical |
| 5 | product_submitted | Selling | Important |
| 6 | product_approved | Selling | Critical |
| 7 | product_rejected | Selling | Critical |
| 8 | product_version_update | Buying | Important |
| 9 | product_suspended | Selling | Important |
| 10 | cart_abandonment | Buying | Important |
| 11 | order_confirmation | Transactional | Critical |
| 12 | payment_successful | Transactional | Critical |
| 13 | payment_failed | Transactional | Critical |
| 14 | download_ready | Transactional | Important |
| 15 | refund_processed | Transactional | Important |
| 16 | review_reminder | Buying | Important |
| 17 | review_response | Buying | Nice-to-have |
| 18 | review_flagged | Transactional | Important |
| 19 | new_sale | Selling | Critical |
| 20 | new_review | Selling | Important |
| 21 | new_follower | Social | Nice-to-have |
| 22 | price_drop | Buying | Nice-to-have |
| 23 | new_product_followed_seller | Social | Nice-to-have |
| 24 | verification_approved | Transactional | Critical |
| 25 | verification_rejected | Transactional | Critical |
| 26 | account_banned | Transactional | Important |

---

## Database Schema

### **Core Tables**

**1. email_queue**
```sql
CREATE TABLE email_queue (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email_type VARCHAR(100) NOT NULL,
  recipient_email VARCHAR(255) NOT NULL,
  recipient_user_id UUID REFERENCES users(id),

  -- Template data
  template_id UUID REFERENCES email_templates(id),
  template_data JSONB NOT NULL,

  -- Priority & Timing
  priority INTEGER DEFAULT 5,  -- 1=highest, 10=lowest
  send_after TIMESTAMP DEFAULT NOW(),
  attempts INTEGER DEFAULT 0,
  max_attempts INTEGER DEFAULT 3,

  -- Status
  status VARCHAR(20) CHECK (status IN ('pending', 'processing', 'sent', 'failed', 'cancelled')) DEFAULT 'pending',

  -- Error tracking
  last_error TEXT,
  error_details JSONB,

  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  processed_at TIMESTAMP,
  sent_at TIMESTAMP,
  failed_at TIMESTAMP
);

CREATE INDEX idx_email_queue_status ON email_queue(status, send_after) WHERE status = 'pending';
CREATE INDEX idx_email_queue_priority ON email_queue(priority ASC, send_after ASC) WHERE status = 'pending';
```

**2. email_templates**
```sql
CREATE TABLE email_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email_type VARCHAR(100) UNIQUE NOT NULL,
  template_name VARCHAR(255) NOT NULL,

  -- Template content
  subject_line TEXT NOT NULL,
  preheader TEXT,
  body_html TEXT NOT NULL,
  body_text TEXT,

  -- CTA
  cta_enabled BOOLEAN DEFAULT false,
  cta_text VARCHAR(255),
  cta_link_template TEXT,

  -- Variables
  required_variables TEXT[],
  optional_variables TEXT[],

  -- Version control
  version INTEGER DEFAULT 1,
  is_active BOOLEAN DEFAULT true,

  -- Metadata
  description TEXT,
  category VARCHAR(50),

  -- Audit
  created_by UUID REFERENCES users(id),
  updated_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_email_templates_type ON email_templates(email_type);
CREATE INDEX idx_email_templates_category ON email_templates(category);
```

**3. email_template_versions**
```sql
CREATE TABLE email_template_versions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  template_id UUID REFERENCES email_templates(id),
  version INTEGER NOT NULL,
  subject_line TEXT NOT NULL,
  body_html TEXT NOT NULL,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(template_id, version)
);
```

**4. email_configuration**
```sql
CREATE TABLE email_configuration (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email_type VARCHAR(100) UNIQUE NOT NULL,
  is_enabled BOOLEAN DEFAULT true,
  template_id UUID REFERENCES email_templates(id),
  updated_by UUID REFERENCES users(id),
  updated_at TIMESTAMP DEFAULT NOW(),
  notes TEXT
);

CREATE INDEX idx_email_config_type ON email_configuration(email_type);
```

**5. user_email_preferences**
```sql
CREATE TABLE user_email_preferences (
  user_id UUID PRIMARY KEY REFERENCES users(id),
  selling_notifications BOOLEAN DEFAULT true,
  buying_notifications BOOLEAN DEFAULT true,
  social_notifications BOOLEAN DEFAULT true,
  announcements BOOLEAN DEFAULT true
);
```

**6. email_analytics**
```sql
CREATE TABLE email_analytics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email_queue_id UUID REFERENCES email_queue(id),
  resend_email_id VARCHAR(255),
  recipient_email VARCHAR(255),
  email_type VARCHAR(100),

  -- Delivery metrics
  sent_at TIMESTAMP,
  delivered_at TIMESTAMP,
  delivery_error TEXT,

  -- Engagement metrics
  opened_at TIMESTAMP,
  clicked_at TIMESTAMP,
  open_count INTEGER DEFAULT 0,
  click_count INTEGER DEFAULT 0,

  -- Final status
  bounced BOOLEAN DEFAULT false,
  bounce_reason TEXT,
  spam_complained BOOLEAN DEFAULT false,
  unsubscribed BOOLEAN DEFAULT false,

  created_at TIMESTAMP DEFAULT NOW()
);
```

**7. email_daily_stats**
```sql
CREATE TABLE email_daily_stats (
  date DATE PRIMARY KEY,
  emails_sent INTEGER DEFAULT 0,
  emails_delivered INTEGER DEFAULT 0,
  emails_opened INTEGER DEFAULT 0,
  emails_clicked INTEGER DEFAULT 0,
  emails_bounced INTEGER DEFAULT 0,
  emails_failed INTEGER DEFAULT 0,
  updated_at TIMESTAMP DEFAULT NOW()
);
```

**8. email_suppression_list**
```sql
CREATE TABLE email_suppression_list (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  reason VARCHAR(50),  -- 'hard_bounce', 'spam_complaint', 'manual_suppression'
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_suppression_email ON email_suppression_list(email);
```

---

## API Endpoints

### **Queue Management**

**POST /api/admin/email/send**
- Send email immediately (bypass queue)
- Auth required (admin only)
- Body: `{ email_type, recipient_email, template_data }`

**POST /api/admin/email/schedule**
- Schedule email for later
- Auth required (admin only)
- Body: `{ email_type, recipient_email, template_data, send_after }`

**GET /api/admin/email/queue**
- Get email queue status
- Auth required (admin only)
- Query params: `?status=pending&limit=50`

**POST /api/admin/email/process-queue**
- Process pending emails (trigger manually)
- Auth required (admin only or cron job)

### **Template Management**

**GET /api/admin/email/templates**
- List all email templates
- Auth required (admin only)

**GET /api/admin/email/templates/:emailType**
- Get single template
- Auth required (admin only)

**PUT /api/admin/email/templates/:emailType**
- Update template
- Auth required (admin only)
- Body: `{ subject_line, preheader, body_html, cta_text }`

**POST /api/admin/email/templates/:emailType/test**
- Send test email to admin
- Auth required (admin only)
- Body: `{ test_email }`

**GET /api/admin/email/templates/:emailType/versions**
- Get template version history
- Auth required (admin only)

**POST /api/admin/email/templates/:emailType/revert**
- Revert to previous version
- Auth required (admin only)
- Body: `{ version }`

### **Configuration**

**GET /api/admin/email/configuration**
- Get email configuration (all 26 types)
- Auth required (admin only)

**PUT /api/admin/email/configuration/:emailType**
- Update email configuration
- Auth required (admin only)
- Body: `{ is_enabled, template_id, notes }`

**POST /api/admin/email/configuration/:emailType/enable**
- Enable email type
- Auth required (admin only)

**POST /api/admin/email/configuration/:emailType/disable**
- Disable email type
- Auth required (admin only)

### **User Preferences**

**GET /api/settings/email-preferences**
- Get current user's email preferences
- Auth required

**PUT /api/settings/email-preferences**
- Update email preferences
- Auth required
- Body: `{ selling_notifications, buying_notifications, social_notifications, announcements }`

### **Analytics**

**GET /api/admin/email/analytics**
- Get email analytics dashboard data
- Auth required (admin only)
- Query params: `?start_date=2026-01-01&end_date=2026-01-13`

**GET /api/admin/email/analytics/daily**
- Get daily email stats
- Auth required (admin only)

**GET /api/admin/email/analytics/by-type**
- Get performance by email type
- Auth required (admin only)

---

## Implementation Checklist

### **Phase 1: Setup & Configuration**

**Email Service Setup:**
- [ ] Create Resend account
- [ ] Verify domain (akomaylessonplanna.com)
- [ ] Generate API key
- [ ] Configure SPF DNS record
- [ ] Configure DKIM DNS record
- [ ] Configure DMARC DNS record
- [ ] Test email sending
- [ ] Set up Supabase Auth emails (custom templates)

**Database Setup:**
- [ ] Create email_queue table
- [ ] Create email_templates table
- [ ] Create email_template_versions table
- [ ] Create email_configuration table
- [ ] Create user_email_preferences table
- [ ] Create email_analytics table
- [ ] Create email_daily_stats table
- [ ] Create email_suppression_list table
- [ ] Create all indexes
- [ ] Set up Row Level Security (RLS)

### **Phase 2: Core Email Infrastructure**

**Queue System:**
- [ ] Implement email queue processor (Edge Function)
- [ ] Set up cron job (process queue every 1 minute)
- [ ] Implement rate limiting
- [ ] Implement retry logic (exponential backoff)
- [ ] Implement bounce handling
- [ ] Add emails to suppression list
- [ ] Health check for email service

**Template System:**
- [ ] Create base email template structure
- [ ] Implement variable substitution
- [ ] Create template rendering function
- [ ] Set up Resend integration
- [ ] Test template rendering with sample data

### **Phase 3: Admin Panel Features**

**Email Configuration:**
- [ ] Build email configuration page
- [ ] Create individual toggles for 26 email types
- [ ] Add quick actions (enable/disable all)
- [ ] Add status indicators (last sent, sent today)
- [ ] Add "Send Test Email" button
- [ ] Add version history display

**Template Editor:**
- [ ] Build rich text editor for templates
- [ ] Implement variable insertion dropdown
- [ ] Add preview mode (sample data)
- [ ] Add mobile/desktop preview toggle
- [ ] Implement version control
- [ ] Add template revert functionality
- [ ] Add template cloning

**Analytics Dashboard:**
- [ ] Build email analytics dashboard
- [ ] Display metric cards (sent, delivery, open rate, bounce)
- [ ] Create performance by type table
- [ ] Add queue status display
- [ ] Add recent failures list
- [ ] Implement time range selector

### **Phase 4: User Features**

**User Preferences:**
- [ ] Build email preferences page
- [ ] Create category toggles (4 categories)
- [ ] Implement preference updates
- [ ] Respect preferences in email sending logic
- [ ] Add unsubscribe functionality

**Unsubscribe Flow:**
- [ ] Create unsubscribe page
- [ ] Generate unsubscribe tokens
- [ ] Process unsubscribe requests
- [ ] Update user preferences
- [ ] Confirm unsubscribe action

### **Phase 5: Essential Email Templates (MVP)**

**Authentication Emails (Supabase Auth):**
- [ ] Welcome email (customize in Supabase)
- [ ] Email verification (customize in Supabase)
- [ ] Password reset (customize in Supabase)
- [ ] Password reset confirmation (customize in Supabase)

**Transaction Emails (10 types):**
- [ ] Product submitted for review
- [ ] Product approved
- [ ] Product rejected
- [ ] Cart abandonment reminder
- [ ] Order confirmation
- [ ] Payment successful
- [ ] Payment failed
- [ ] Download ready
- [ ] Refund processed
- [ ] New sale notification
- [ ] Teacher verification approved
- [ ] Teacher verification rejected

### **Phase 6: Testing**

**Unit Tests:**
- [ ] Test queue processor
- [ ] Test rate limiting
- [ ] Test retry logic
- [ ] Test template rendering
- [ ] Test bounce handling
- [ ] Test preference checking

**Integration Tests:**
- [ ] Test email sending (all 26 types)
- [ ] Test scheduled emails
- [ ] Test batch emails
- [ ] Test admin configuration
- [ ] Test user preferences

**Manual Testing:**
- [ ] Test all emails in development
- [ ] Test email on mobile devices
- [ ] Test email clients (Gmail, Outlook, Apple Mail)
- [ ] Test unsubscribe flow
- [ ] Test template editor
- [ ] Test analytics dashboard

### **Phase 7: Launch Preparation**

**Pre-Launch:**
- [ ] Verify SPF/DKIM/DMARC records
- [ ] Test email deliverability
- [ ] Clean suppression list
- [ ] Set up monitoring alerts
- [ ] Document email types
- [ ] Create admin guide

**Launch Day:**
- [ ] Monitor queue processing
- [ ] Check delivery rates
- [ ] Respond to any issues
- [ ] Track analytics from day 1

---

## Next Steps

1. ✅ **Design Complete** - All decisions finalized
2. ⏭️ **Create Implementation Plan** - Break down into developer tasks
3. ⏭️ **Set Up Resend Account** - Configure domain and DNS
4. ⏭️ **Implement Database Schema** - Create tables and indexes
5. ⏭️ **Build Email Queue System** - Core infrastructure
6. ⏭️ **Create MVP Email Templates** - 12 critical templates
7. ⏭️ **Build Admin Features** - Configuration, editor, analytics
8. ⏭️ **Testing & Launch** - Test thoroughly, deploy to production

---

## Document Status

**Status:** ✅ Design Complete
**Date:** January 13, 2026
**Version:** 1.0
**Next:** Implementation Planning

**Dependencies:**
- Feature 01: Authentication & User Management (for user data)
- Feature 03: Product Management (for product notifications)
- Feature 04: Shopping Cart & Checkout (for order emails)
- Feature 05: Reviews & Ratings (for review emails)
- Feature 06: Social Features (for notification preferences)
- Feature 09: Admin Panel (for admin configuration)

---

*This document contains the complete design specification for Feature 12: Email System. All 26 email types have been specified with implementation details.*
