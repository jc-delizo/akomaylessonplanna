# Feature 11: Messaging System - Complete Design

**Project:** AKOMAYLESSONPLANNA - Filipino Teacher Lesson Plan Marketplace
**Date:** January 13, 2026
**Status:** ✅ Design Complete - Ready for Implementation
**Feature:** Messaging System (Buyer-Seller Communication)

---

## Table of Contents

1. [Overview](#overview)
2. [Message Types & Categories](#message-types--categories)
3. [Conversations & Threading](#conversations--threading)
4. [User Interface & Experience](#user-interface--experience)
5. [Real-Time vs Polling](#real-time-vs-polling)
6. [Notifications & Alerts](#notifications--alerts)
7. [Privacy & Safety](#privacy--safety)
8. [Seller Tools & Efficiency](#seller-tools--efficiency)
9. [File Sharing](#file-sharing)
10. [Integration with Existing Features](#integration-with-existing-features)
11. [Admin & Moderation Tools](#admin--moderation-tools)
12. [Database Schema](#database-schema)
13. [API Endpoints](#api-endpoints)
14. [Success Metrics & KPIs](#success-metrics--kpis)
15. [MVP vs Post-Launch Prioritization](#mvp-vs-post-launch-prioritization)
16. [Implementation Roadmap](#implementation-roadmap)

---

## Overview

The messaging system for AKOMAYLESSONPLANNA enables **buyer-seller communication** while maintaining platform safety and transaction integrity. Filipino teachers are highly social and familiar with Messenger, so the design feels like Facebook Messenger while keeping all transactions on-platform.

### Primary Use Cases

1. **Pre-purchase inquiries** - Buyers ask questions before buying ("Does this include the answer key?")
2. **Post-purchase support** - Buyers request help after purchase ("Can you explain page 5?")
3. **Custom requests** - Buyers request modifications ("Can you make this for Grade 8?")
4. **Dispute resolution** - Admin mediates conflicts between buyers and sellers

### Core Design Philosophy

- **Messenger-like UX** - Chat bubbles, familiar interface, mobile-optimized
- **Privacy-first** - No email/phone exposure, prevent off-platform transactions
- **Polling for MVP** - 30-second polling (not WebSockets) for simplicity
- **Seller efficiency** - Quick replies, templates, response time tracking
- **Safe space** - Block/report, content moderation, admin mediation

### Key Constraint

Support remains email-only (support@akomaylessonplanna.com). The messaging system is for buyer-seller communication only, not user-to-platform support.

---

## Message Types & Categories

### Message Categories (4 types)

#### 1. Product Inquiries (Pre-purchase questions)
- "Is this aligned with the new curriculum?"
- "Does this include answer keys?"
- "Can I see more samples?"
- Most common message type for new buyers

#### 2. Order Support (Post-purchase help)
- "I can't download the file"
- "Can you explain how to use page 5?"
- "The file seems corrupted"
- "Can I get an updated version?"

#### 3. Custom Requests (Personalization)
- "Can you modify this for Grade 8?"
- "Can you add a quarterly exam?"
- "I need this in a different format"
- Leads to custom product opportunities

#### 4. Platform Messages (System-generated)
- "Admin is reviewing your dispute"
- "Your message was flagged for review"
- "Conversation archived due to inactivity"
- Official admin communications

### Message Types (by sender)

**From Buyers:**
- Free-form text questions
- Image attachments (MVP: up to 3 images, 5MB each)
- Emoji support (✅ for MVP)

**From Sellers:**
- Free-form text responses
- **Quick replies** (5 system templates for MVP)
- **Custom templates** (Pro/Pioneer feature)
- **Away messages** (auto-reply when seller inactive)

**System Messages:**
- Auto-generated notifications
- Cannot be edited by users
- Highlighted with different style

### Quick Reply Templates (MVP - 5 system templates)

1. "Yes, this product is available! 💚"
2. "Yes, this includes answer keys."
3. "I can customize this for you. What changes do you need?"
4. "Please check your library for downloads."
5. "Thank you for your purchase! Let me know if you need help."

---

## Conversations & Threading

### Conversation Organization Model

**One conversation per buyer-seller pair per product.**

This means:
- Teacher Maria (buyer) + Teacher Juan (seller) + Product A = **Conversation #1**
- Teacher Maria (buyer) + Teacher Juan (seller) + Product B = **Conversation #2**
- Teacher Maria (buyer) + Teacher Juan (seller) (no product context) = **Conversation #3**

**Rationale:** Keeps discussions organized by product. If a buyer asks about multiple products, each conversation stays focused.

### Conversation Status

**1. Active** - Open for communication
- Either party can send messages
- Shows in main inbox

**2. Archived** - Hidden from main inbox
- Can be re-opened by either party sending a new message
- Automatically archived after **90 days of inactivity**
- Manual archive option available

**3. Blocked** - Communication halted
- One party blocked the other
- Messages hidden (not deleted)
- Cannot be unblocked by blocked party

### Message Threading

**Linear chat-bubble style** (like Messenger/WhatsApp)
- NOT email threading (no reply-to functionality)
- Messages appear in chronological order
- Newest messages at bottom
- Auto-scroll to latest on open

**No "reply to specific message"** in MVP
- Keeps it simple
- Post-launch enhancement: quoted replies

### Conversation History

**Retention: 1 year** (balance between storage and record-keeping)
- After 1 year: Soft delete (messages marked as deleted, not purged)
- Admin can still access for disputes
- Post-launch: "Export conversation" feature for permanent records

### Conversation List Display

**Sorted by:**
- Primary: Most recent message (descending)
- Secondary: Unread status (unread conversations always at top)

**Shows:**
- Other party's name + avatar
- Product thumbnail (if product-linked)
- Last message preview (truncated to 50 chars)
- Timestamp ("2m ago", "1h ago", "Yesterday")
- Unread badge (count of unread messages)

---

## User Interface & Experience

### Inbox Page Layout (Desktop)

**Two-column layout:**

```
┌─────────────────────────────────────────────────────────┐
│ Messages                      [Search conversations...]  │
├─────────────────────┬───────────────────────────────────┤
│ CONVERSATIONS LIST  │ CONVERSATION VIEW                  │
│                     │                                   │
│ [Avatar] Teacher... │ [Avatar] Teacher Maria            │
│ [Thumbnail]         │ Jan 13 at 3:45 PM                 │
│ Grade 7 Math DLL    │                                   │
│ Last message:       │ [Product card preview]           │
│ "Yes, available!"   │ Grade 7 Math DLL Q1               │
│ 2m ago • [2]        │ ₱100 • Teacher Juan              │
│                     │                                   │
│ [Avatar] Teacher... │ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│ [Thumbnail]         │                                   │
│ Science Exam        │ You: Is this available?           │
│ "Does this have...  │                                   │
│ 1h ago              │ Teacher Juan: Yes, available! 💚  │
│                     │                                   │
│ [Avatar] Teacher... │ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│ No thumbnail        │                                   │
│ "Can you help..."   │ [Type a message...]              │
│ Yesterday           │ [📎] [😊] [Send →]                │
│                     │                                   │
│                     │ [⚙️] [🚫]                          │
└─────────────────────┴───────────────────────────────────┘
```

**Conversation List (Left Panel - 40% width):**
- Shows all conversations (active + archived in separate tab)
- Avatar + Name + Product thumbnail
- Last message preview
- Timestamp + Unread badge
- Click to open conversation

**Tabs:**
- **Active** (default) - Open conversations
- **Archived** - Inactive conversations
- **All** - Combined view

**Search:**
- Search by seller name, buyer name, product title, message content
- Filters: Unread only, Product-linked, General (no product)

**Conversation View (Right Panel - 60% width):**
**Header:**
- Other party's avatar + name
- "Teaches Grade 7 Math" badge (from seller profile)
- [Product card] if product-linked
- Actions: ⚙️ Menu, 🚫 Block

**Message Area (Scrollable):**
- Chat-bubble style (Messenger-like)
- **Your messages:** Right-aligned, purple background
- **Their messages:** Left-aligned, gray background
- **System messages:** Centered, small text, gray (e.g., "Conversation archived")

**Message Input Area (Bottom):**
- Text input field (multi-line, auto-expands)
- **[📎 Attach]** button (image upload, up to 3 images)
- **[😊 Emoji]** button (native emoji picker)
- **[Send →]** button (prominent)
- Character limit: 1000 chars per message

### Mobile Experience (70%+ of users)

**Full-screen layout (like Messenger app):**

1. **Message list view** (default)
   - Full-width conversation cards
   - Swipe left on card → [Archive] [Delete]
   - Search icon top-right
   - Bottom: "New Message" button (floating action button)

2. **Conversation view** (tap to open)
   - Full-screen chat
   - Back button top-left (returns to list)
   - Product context at top (tappable → product page)
   - Input area fixed at bottom
   - Pull-to-refresh for new messages

3. **Bottom sheet** (compose options)
   - Slide-up menu for quick replies
   - Template selection
   - Block/Report options

**Swipe Actions (Mobile):**
- Swipe left on conversation → Archive (primary), Delete (secondary)
- Swipe right → Mark as read/unread

### Product Context in Conversations

When conversation is product-linked:
- **Product card always visible** at top of conversation
- Shows: Thumbnail, title, price, [View Product] button
- Helps sellers remember which product buyer is asking about
- Helps buyers reference product details

---

## Real-Time vs Polling

### Recommendation: Polling for MVP (30-second intervals)

### Rationale

**1. Simplicity & Speed:**
- No WebSocket server needed
- No persistent connections to manage
- Easier to implement and test
- Works reliably with Supabase + Next.js

**2. Low Message Volume:**
- Most buyers send 1-3 messages per purchase
- Most sellers respond within hours (not seconds)
- No need for instant delivery like customer support chat
- Filipino teachers accustomed to asynchronous messaging (email, Facebook messages)

**3. Cost Savings:**
- WebSocket connections = server resources
- Polling = simple HTTP requests
- Vercel/Supabase free tiers sufficient longer
- Estimated: 100 polling requests/user/hour vs continuous WebSocket

**4. Better Mobile Performance:**
- WebSockets drain battery (persistent connection)
- Polling = request → response → sleep
- Works better on low-end phones (Facebook Lite users)

### Polling Implementation

```javascript
// Poll every 30 seconds when user is on Messages page
const POLLING_INTERVAL = 30000; // 30 seconds

// Smart polling: only poll when tab is active
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    stopPolling(); // User switched tabs
  } else {
    startPolling(); // User returned
  }
});

// Fetch new messages
async function pollForNewMessages() {
  const lastMessageId = getLastMessageId();
  const response = await fetch(`/api/messages/new?after=${lastMessageId}`);
  const newMessages = await response.json();

  if (newMessages.length > 0) {
    updateConversationList(newMessages);
    updateConversationView(newMessages);
    playNotificationSound(); // Optional: subtle "ding"
  }
}
```

### Polling Behavior

**On Inbox Page:**
- Poll every 30 seconds for new messages
- Update conversation list (new messages, move updated conversations to top)
- Update unread badge count

**On Conversation View:**
- Poll every 30 seconds for new messages in THIS conversation
- Auto-scroll to bottom if new messages arrive
- Show "New messages" banner if user scrolled up (don't auto-scroll)

**Background:**
- Stop polling when user leaves page
- Stop polling when tab is inactive
- Resume when user returns

### Post-Launch Upgrade to WebSockets

**When to upgrade:**
- 10,000+ daily active users
- 100+ messages per minute platform-wide
- User complaints about "slow messaging"
- Budget for WebSocket server (Pusher: $200/month, or self-hosted)

**Benefits of WebSockets (post-launch):**
- True real-time (instant delivery)
- Typing indicators ("Teacher Juan is typing...")
- Read receipts ("Seen at 3:45 PM")
- Lower server load at scale
- Better UX for power users

**Hybrid Approach (alternative):**

Use **Supabase Realtime** (Postgres changes feature):
- Messages table triggers → Push notification to client
- Real-time without WebSocket server complexity
- Built into Supabase (no extra infrastructure)
- Can test post-launch before full WebSocket commitment

---

## Notifications & Alerts

### Notification Channels (3 types)

**1. In-App Bell Badge** (✅ Already exists from Feature 06)
- Red badge on bell icon shows unread count
- Includes messages + other notifications (sales, reviews)
- Updates every 30 seconds (synced with polling)
- Click bell → dropdown with latest 5 notifications
- "Message from Teacher Juan" → click → opens conversation

**2. Browser Push Notifications** (Post-Launch)
- **Not for MVP** - adds complexity
- Post-launch: Web Push API for:
  - "You have a new message from Teacher Juan"
  - Works even when browser is closed
  - Requires user permission (show prompt on first message)
- Filipino context: Many users on mobile, push notifications drain battery
- **Recommendation:** Defer to 3 months post-launch

**3. Email Notifications**
- **No email notifications for messages** (user decision)
- In-app bell only for message notifications
- Feature 10 email system handles other notifications

### Notification Throttling (Spam Prevention)

**Per-Conversation Limits:**
- Max **10 messages per hour** from same sender
- After limit: "Please wait before sending more messages"
- Prevents spam/harassment

**Per-User Limits:**
- Max **50 messages received per hour** platform-wide
- After limit: Notifications stop, inbox shows "You've received many messages"
- Protects from coordinated attacks

### Quiet Hours (Do-Not-Disturb)

**User Settings (optional):**
- **Quiet hours:** 9 PM - 7 AM (default: OFF)
- When enabled: No push notifications during quiet hours (if enabled post-launch)
- In-app bell still updates (silent)
- **Rationale:** Filipino teachers message at all hours (late night grading, weekend prep)
- Default: OFF (let users decide)
- Can be enabled in `/settings/notifications`

### Notification Sound

**In-App:**
- **Subtle "ding"** when new message arrives (only if tab is active)
- Can be disabled in settings
- No sound if tab is inactive (browser limitation)

### Message Read Status

**Mark as read:**
- When user views message in conversation
- When user clicks notification bell item
- Bell badge count decreases

**Unread badge:**
- Shows count of unread messages + other notifications
- Max display: "9+" (like iOS)

### Notification Preferences

**Route:** `/settings/notifications`

**Message Notification Toggles:**
- ☑️ **In-app notifications** (always ON - bell icon)
- ☐ **Browser push notifications** (post-launch, default: OFF)
- ☐ **Quiet hours (9 PM - 7 AM)** (default: OFF)
- ❌ **Email notifications** (disabled - user decision)

---

## Privacy & Safety

### Anonymity Controls

**What's Visible:**
- ✅ **Display name** (e.g., "Teacher Maria M.")
- ✅ **Profile photo**
- ✅ **Subject taught** (e.g., "Teaches Grade 7 Math")
- ✅ **Verification badge** (if verified teacher)

**What's NEVER Visible:**
- ❌ **Email address** (prevent off-platform transactions)
- ❌ **Phone number** (prevent external communication)
- ❌ **Real full name** (unless user chooses to display)

**When to Reveal More:**
- After successful purchase, buyer sees seller's: **Display name only** (still no email/phone)
- Admin can see full details for disputes

### Message Content Moderation

**Auto-Flag Triggers:**
1. **External links** - "Add me on GCash: 09XX-XXX-XXXX"
2. **Personal info** - Email addresses, phone numbers detected
3. **Profanity** - Tagalog + English swear words
4. **Spam patterns** - Same message sent 5+ times

**When Message is Flagged:**
- Message still delivered (don't block legitimate communication)
- **Admin notification** in admin panel
- Admin reviews manually
- If malicious: Delete message + warn user
- If severe: Ban user

### Blocking & Reporting

**Block User Flow:**
1. User clicks "⚙️" → "Block Teacher Juan"
2. Confirmation: "Are you sure? You won't receive messages from Teacher Juan."
3. Upon confirmation:
   - All messages hidden (not deleted)
   - Conversation removed from inbox
   - Teacher Juan cannot send new messages (gets: "User blocked you")
   - Block recorded in database

**Report User Flow:**
1. User clicks "⚙️" → "Report Teacher Juan"
2. Modal appears: "Why are you reporting?"
   - [ ] Harassment
   - [ ] Fraud (asking for off-platform payment)
   - [ ] Inappropriate content
   - [ ] Spam
   - [ ] Other (text field)
3. Submit → Admin notified
4. Admin reviews + takes action within 24-48 hours
5. Reporter notified of outcome

**Unblock:**
- User can unblock anytime from Blocked list
- Conversation reappears in archived tab
- Messages are restored (still hidden until scrolled)

### Transaction Safety

**Off-Platform Transaction Detection:**

**Suspicious Patterns:**
- "Bayad mo lang ako sa GCash" (Just pay me on GCash)
- "Send payment to 09XX-XXX-XXXX"
- "Email me for payment: xxx@gmail.com"
- Links to external payment sites

**When Detected:**
- **Auto-warning message** from system: "⚠️ For your safety, please complete all transactions through AKOMAYLESSONPLANNA. Paying outside the platform puts you at risk."
- Message still delivered (buyer needs to see seller's request)
- **Admin flagged** for review
- If repeat offender: Ban seller

**External Link Policy:**
- **All external links blocked** in messages
- Rationale: Prevent phishing, external payment sites
- Message shows: "[Link removed - external links not allowed for security]"
- Exception: Admin can allow specific domains (YouTube, Google Drive for educational content)

### Seller Identity Verification
- Messages from **verified teachers** show ✅ badge
- Messages from **unverified users** show ⚠️ "Not verified" badge
- Helps buyers assess trustworthiness

### Admin Access
- Admins can view **all messages** (for dispute resolution)
- Audit log: Which admin viewed which conversation + when
- Admin messages highlighted differently (gold border)
- When admin enters dispute: Both parties notified

### Privacy for Buyers:
- Seller sees: "Teacher Maria M." (anonymized)
- Seller sees: Buyer's general location (NCR, Visayas, etc.) - from Feature 07
- Seller does NOT see: Email, phone, real name

### Privacy for Sellers:
- Buyer sees: "Teacher Juan" + profile info
- Buyer does NOT see: Email, phone, real name
- After purchase: Still just display name (no additional info)

---

## Seller Tools & Efficiency

Sellers may receive many messages daily. Tools to help them respond faster and better.

### Quick Replies (MVP - 5 System Templates)

**Pre-written responses** for common questions:

**System Templates (all sellers):**
1. ✅ **"Yes, this product is available! 💚"**
2. ✅ **"Yes, this includes answer keys."**
3. ✅ **"I can customize this for you. What changes do you need?"**
4. ✅ **"Please check your library for downloads. Thank you!"**
5. ✅ **"Thank you for your purchase! Let me know if you need help."**

**How Quick Replies Work:**
- **Small chips** above message input: "[Yes, available!] [Includes keys] [Can customize]..."
- Click chip → Message populates input field
- Can edit before sending (add personalization)
- Send immediately or continue typing

**Mobile:** Long-press message input → Quick reply menu appears

### Custom Templates (Pro/Pioneer Feature)

**Pro/Pioneer sellers** can create **5 custom templates**.

**Template Variables:**
- `{{buyer_name}}` - "Hi Teacher Maria!"
- `{{product_title}}` - "Re: Grade 7 Math DLL"
- `{{seller_name}}` - "Teacher Juan"

**Template Example:**
```
Hi {{buyer_name}}! 👋

Yes, I can customize {{product_title}} for you.

I offer:
- Additional worksheets
- Modified activities
- Different grade levels

What would you like me to change?

Best,
Teacher Juan
```

**Template Management:**
- Route: `/dashboard/messages/templates` (Pro/Pioneer only)
- Create/Edit/Delete templates
- Save up to 5 custom templates
- Duplicate templates (for similar responses)

### Response Time Tracking

**Automatic Metrics:**
- Track **average response time** per seller
- Calculate: Time from buyer message → seller reply
- Update daily (not real-time)

**Display to Buyers:**
- On seller profile: "⏱️ Responds within 1 hour"
- In conversation: "Typically replies in 2 hours"
- Time ranges: "< 1 hour", "1-3 hours", "3-6 hours", "6-12 hours", "12-24 hours", "> 24 hours"

**Calculation:**
- Average of last 50 responses
- Rolling 30-day window
- Only counts first response (not follow-ups)

**Benefits:**
- Motivates sellers to respond fast
- Helps buyers know what to expect
- Competitive advantage (fast responders = more sales)

**Response Time Badges:**
- ⚡ **Lightning fast** - responds < 1 hour (top 10%)
- 🚀 **Very responsive** - responds < 3 hours (top 25%)
- ✅ **Responsive** - responds < 6 hours (average)

### Away Message (Auto-Reply)

**Optional** feature for all sellers:

**When Active:**
- Seller sets: "On leave until January 20"
- Auto-reply sent instantly when buyer messages:
  ```
  Hi! 👋

  Teacher Juan is currently on leave and will respond on January 20.

  For urgent questions, please browse our other products:
  [View all products]

  Thank you for your patience! 💚
  ```

**Seller Settings:**
- Route: `/dashboard/messages/settings`
- Toggle: "Enable away message"
- Set: Return date
- Custom message (optional, default provided)
- Buyers can still view products while seller away

### Seller Analytics Dashboard

**Route:** `/dashboard/messages/analytics` (Pro/Pioneer)

**Metrics Shown:**
1. **Total conversations** - All-time, this month
2. **Response time** - Average, current badge
3. **Response rate** - % of messages responded to
4. **Template usage** - Most-used templates
5. **Conversion impact** - Conversations that led to sales

**Charts (Pro/Pioneer):**
- Response time over time (improving vs worsening)
- Messages per day (busy vs slow periods)
- Template effectiveness (which templates get replies)

---

## File Sharing

### Images Only (Simpler & Safer)

**Why Images Only:**
- ✅ **No virus scanning needed** (images can't execute malware)
- ✅ **Simpler implementation** (no complex file handling)
- ✅ **Faster uploads** (especially on mobile)
- ✅ **Lower storage costs**
- ✅ **Works for samples, screenshots, previews**

### Use Cases for Images

1. **Show preview** - "Here's a screenshot of page 5"
2. **Answer questions** - "This image shows how to use the activity"
3. **Custom work preview** - "Here's a sample of what I can create"
4. **Issue resolution** - "Here's the corrected version (screenshot)"

### Image Upload Specs

- **File types:** JPG, PNG, WebP
- **Max size:** 5 MB per image
- **Max dimensions:** 4000x4000px (auto-resize if larger)
- **Max per message:** 3 images

### Image Storage

- **Supabase Storage** bucket: `message-images`
- **Optimization:** Auto-compress large images
- **Retention:** 90 days (auto-delete after)
- **No virus scanning** (images are safe)

### Image Upload UI

- Click [📎] → Select image(s)
- Upload progress bar
- Images show as thumbnails in message input
- Can remove before sending
- Send → Images appear in chat

### Image Display in Chat

- Thumbnail view (300px wide)
- Click to view full-size
- Download button (optional)
- Caption: "Image 1 of 3"

---

## Integration with Existing Features

### Feature 01: Authentication & User Management
- **Messages require login** - No guest messaging
- User avatars pulled from profile
- Display names shown (anonymized)
- Blocked users cannot message

### Feature 02: User Profiles
- **"Contact Seller" button** on seller profile
- Click → Opens new conversation (or existing one)
- Shows seller info in conversation header
- **Response time badge** visible on profile ("⏱️ Responds within 1 hour")

### Feature 03: Product Listings
- **"Ask a Question" button** on product page
- Pre-fills message context: Product-linked conversation
- Product thumbnail + title shown in chat
- Buyers can ask: "Is this aligned with the new curriculum?"

### Feature 04: Shopping Cart & Checkout
- **Post-purchase auto-message** (optional):
  - After purchase: "Have questions about your order? Message the seller."
  - Shown in order confirmation + email
- **"Contact Seller" link** in order history
- From Feature 07: Order details modal has "Contact Buyer" button

### Feature 05: Reviews & Ratings
- **Review response messaging:**
  - Seller responds to review → "Thanks for the review! Message me if you need help."
  - Buyer can click → Opens conversation with seller
- **Before review reminder:** Email says "Need help? Message the seller before reviewing."

### Feature 06: Social Features
- **Follower messaging:**
  - "New product from followed seller" notification → "Message to ask questions"
  - Link → Opens conversation pre-filled: "Hi, I saw your new product..."
- **Wishlist integration:**
  - Price drop notification → "Message seller about customizing this"

### Feature 07: Seller Dashboard
- **Messages navigation item** in sidebar
- **Unread badge** shows message count
- Message analytics: Response time, conversation count
- Quick link to respond to messages

### Feature 09: Admin Panel
- **Support ticket integration:**
  - User reports issue → Admin creates support ticket
  - If dispute → Admin enters conversation as mediator
  - Admin messages highlighted (gold border)
- **Flagged messages queue:** Admin reviews auto-flagged content

### Navigation Integration

**Main Navigation Bar (All Users):**
- **Messages** icon (envelope 📨)
- Badge shows unread count
- Dropdown with: "New Message" + "View All Messages"

**Seller Dashboard Navigation:**
- **Messages** tab
- Shows: Unread, Response Time, Analytics

**Mobile Navigation:**
- Bottom tab bar: **Messages** icon
- Always visible (like Messenger app)

### URL Structure
- `/messages` - Inbox
- `/messages/:conversationId` - Specific conversation
- `/messages/new?productId=xxx` - Compose new (product-linked)
- `/dashboard/messages` - Seller dashboard messages

### Notification Bell Integration
- Existing bell from Feature 06
- Messages appear in notification dropdown
- Click notification → Opens conversation

---

## Admin & Moderation Tools

### Admin Panel Integration (Feature 09)

**New Navigation Item:**
- **Messages** section in admin sidebar
- Only accessible to Super Admin + Moderator
- Sub-tabs: Flagged, Disputes, All Conversations

### Flagged Messages Queue

**Auto-Flagged Content:**
- External links (GCash numbers, email addresses)
- Profanity (Tagalog + English swear words)
- Spam patterns (same message 5+ times)
- Report from user

**Queue Display:**
```
┌─────────────────────────────────────────────────┐
│ Flagged Messages Queue      [12 pending]        │
├─────────────────────────────────────────────────┤
│                                                 │
│ [🚩 High] External Link Detected               │
│ From: Teacher Juan (seller)                    │
│ To: Teacher Maria (buyer)                      │
│ Product: Grade 7 Math DLL                      │
│ 5 minutes ago                                   │
│                                                 │
│ Message: "Bayad mo lang ako sa GCash:          │
│ 09XX-XXX-XXXX"                                 │
│                                                 │
│ Flag Reason: Detected external payment link     │
│                                                 │
│ [View Conversation] [Dismiss] [Warn User]      │
│                                                 │
└─────────────────────────────────────────────────┘
```

**Admin Actions:**
1. **View Conversation** - Opens full conversation context
2. **Dismiss Flag** - No action needed (false positive)
3. **Delete Message** - Remove malicious content
4. **Warn User** - Send warning email + record on account
5. **Ban User** - For severe violations (Super Admin only)

### Dispute Resolution

**When Buyer/Seller Escalates:**
- User clicks "Report Issue" in conversation
- Selects reason: Fraud, Harassment, Product Quality, Other
- Admin notified + conversation moved to "Disputes" tab

**Dispute Resolution Interface:**

```
┌─────────────────────────────────────────────────┐
│ Dispute: #DISP-1234                             │
├─────────────────────────────────────────────────┤
│                                                 │
│ Buyer: Teacher Maria M.                         │
│ Seller: Teacher Juan                            │
│ Product: Grade 7 Math DLL                      │
│ Order: #ORD-5678                               │
│ Opened: 2 hours ago                            │
│                                                 │
│ Issue: Product Quality                         │
│ "The file is corrupted and won't open"         │
│                                                 │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│                                                 │
│ Conversation (Last 10 messages):               │
│                                                 │
│ Teacher Maria: I can't open the file...        │
│ Teacher Juan: Let me check...                  │
│ ...                                            │
│                                                 │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│                                                 │
│ Admin Notes (Internal):                        │
│ [Add note...]                                  │
│                                                 │
│ Previous notes:                                │
│ • Sent warning to Teacher Juan (2 days ago)    │
│                                                 │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│                                                 │
│ Resolution:                                    │
│ ○ Mediate (continue conversation)              │
│ ○ Refund Buyer (process via orders system)     │
│ ○ Warn Buyer                                   │
│ ○ Warn Seller                                 │
│ ○ Ban Buyer (Super Admin only)                │
│ ○ Ban Seller (Super Admin only)               │
│                                                 │
│ Notes (required):                               │
│ [........................................]      │
│                                                 │
│ [Close Dispute]                                │
└─────────────────────────────────────────────────┘
```

### Admin Joining Conversations

**When Admin Mediates:**
- Admin enters conversation as third party
- Admin messages show **gold border** + "Admin" badge
- Both buyers + sellers see: "Admin has joined this conversation"
- Admin can see all message history
- Admin can send messages to both parties

**Admin Message Example:**
```
⭐ Admin (Platform):

Hello! I'm here to help resolve this dispute.

Teacher Maria, could you share a screenshot of the error?
Teacher Juan, please check if the file uploads correctly.

— AKOMAYLESSONPLANNA Support
```

### Conversation Search (Admin Only)

**Advanced Search:**
- Search by: Buyer name, Seller name, Product ID, Message content
- Filters: Date range, Flagged status, Dispute status
- View any conversation (admin has full access)

**Use Cases:**
- Investigate reported user
- Find harassment evidence
- Resolve payment disputes
- Check product quality complaints

### Message Analytics Dashboard (Admin)

**Route:** `/admin/messages/analytics`

**Metrics:**
1. **Total conversations** - All-time, this month
2. **Active disputes** - Open, under review
3. **Flagged messages** - Pending, resolved
4. **Response time** - Average seller response time
5. **Most reported users** - Top 10 offenders
6. **Resolution rate** - % of disputes resolved

**Charts:**
- Conversations over time (line chart)
- Dispute types (pie chart: Quality 40%, Fraud 20%, Harassment 10%...)
- Response time distribution (histogram)

**Export:**
- Export conversation history (CSV)
- For disputes, legal issues, evidence

### Access Control

**Super Admin:**
- View all conversations
- Delete any message
- Ban users
- Resolve disputes
- Access analytics

**Moderator:**
- View flagged messages
- Dismiss flags
- Warn users
- View disputes (read-only)
- Cannot ban (requires Super Admin approval)

**Audit Logging:**
- Every admin action logged:
  - Which admin viewed which conversation
  - Which admin deleted which message
  - Which admin banned which user
  - Timestamps for all actions

---

## Database Schema

### 1. conversations Table (NEW)

```sql
CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Participants
  buyer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  seller_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Context
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  order_id UUID REFERENCES orders(id) ON DELETE SET NULL,

  -- Status
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'archived', 'blocked')),
  archived_by UUID REFERENCES users(id), -- Who archived (null if both)
  blocked_by UUID REFERENCES users(id), -- Who blocked (null if not blocked)

  -- Timestamps
  last_message_at TIMESTAMP, -- Updated on each new message
  created_at TIMESTAMP DEFAULT NOW(),

  -- Constraints
  UNIQUE(buyer_id, seller_id, product_id) -- One conversation per buyer-seller-product
);

CREATE INDEX idx_conversations_buyer ON conversations(buyer_id);
CREATE INDEX idx_conversations_seller ON conversations(seller_id);
CREATE INDEX idx_conversations_status ON conversations(status);
CREATE INDEX idx_conversations_last_message ON conversations(last_message_at DESC);
```

### 2. messages Table (Enhanced from existing)

```sql
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Conversation
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,

  -- Sender
  sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Content
  content TEXT NOT NULL,
  message_type VARCHAR(20) DEFAULT 'user' CHECK (message_type IN ('user', 'system', 'admin')),

  -- Attachments (images only)
  attachments TEXT[], -- Array of image URLs (Supabase Storage)

  -- Read Status
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMP,

  -- Moderation
  is_flagged BOOLEAN DEFAULT false,
  flag_reason VARCHAR(255), -- 'external_link', 'profanity', 'spam', 'user_report'
  is_deleted BOOLEAN DEFAULT false, -- Soft delete
  deleted_by UUID REFERENCES users(id),
  deleted_at TIMESTAMP,

  -- Admin Intervention
  admin_joined BOOLEAN DEFAULT false, -- Admin joined conversation
  admin_id UUID REFERENCES users(id), -- Which admin

  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),

  -- Constraints
  CHECK (length(content) <= 1000) -- Max 1000 chars
);

CREATE INDEX idx_messages_conversation ON messages(conversation_id, created_at DESC);
CREATE INDEX idx_messages_sender ON messages(sender_id);
CREATE INDEX idx_messages_unread ON messages(conversation_id, is_read) WHERE is_read = false;
CREATE INDEX idx_messages_flagged ON messages(is_flagged) WHERE is_flagged = true;
```

### 3. message_templates Table (NEW - Pro/Pioneer Feature)

```sql
CREATE TABLE message_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Owner
  seller_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Template Content
  name VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,

  -- Type
  template_type VARCHAR(20) DEFAULT 'custom' CHECK (template_type IN ('system', 'custom')),
  is_active BOOLEAN DEFAULT true,

  -- Usage
  usage_count INTEGER DEFAULT 0, -- Track how often used

  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  -- Constraints
  CHECK (seller_id IN (SELECT id FROM users WHERE subscription_tier IN ('pro', 'pioneer')) OR template_type = 'system')
);

CREATE INDEX idx_templates_seller ON message_templates(seller_id);
CREATE INDEX idx_templates_type ON message_templates(template_type);
```

**System Templates** (5 defaults, owned by platform):
- Inserted by migration, `seller_id = NULL`
- All sellers can use

**Custom Templates:**
- Limited to 5 per Pro/Pioneer seller
- Enforced at application level

### 4. message_reports Table (NEW)

```sql
CREATE TABLE message_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Who Reported
  reporter_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reported_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Context
  conversation_id UUID REFERENCES conversations(id) ON DELETE SET NULL,
  message_id UUID REFERENCES messages(id) ON DELETE SET NULL,

  -- Report Details
  report_type VARCHAR(50) NOT NULL, -- 'harassment', 'fraud', 'inappropriate', 'spam', 'other'
  description TEXT,

  -- Status
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'under_review', 'resolved', 'dismissed')),

  -- Resolution
  reviewed_by UUID REFERENCES users(id), -- Admin who reviewed
  resolution TEXT, -- Admin notes
  resolved_at TIMESTAMP,

  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_reports_status ON message_reports(status);
CREATE INDEX idx_reports_reported_user ON message_reports(reported_user_id);
```

### 5. user_blocks Table (NEW)

```sql
CREATE TABLE user_blocks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Who Blocked Whom
  blocker_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  blocked_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Conversation Context
  conversation_id UUID REFERENCES conversations(id) ON DELETE SET NULL,

  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),

  -- Constraints
  UNIQUE(blocker_id, blocked_id),
  CHECK (blocker_id != blocked_id) -- Can't block yourself
);

CREATE INDEX idx_blocks_blocker ON user_blocks(blocker_id);
CREATE INDEX idx_blocks_blocked ON user_blocks(blocked_id);
```

### 6. seller_response_times Table (NEW - Analytics)

```sql
CREATE TABLE seller_response_times (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Seller
  seller_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Response Metrics
  conversation_id UUID REFERENCES conversations(id) ON DELETE SET NULL,
  first_message_at TIMESTAMP NOT NULL, -- Buyer sent message
  first_response_at TIMESTAMP NOT NULL, -- Seller responded
  response_seconds INTEGER NOT NULL, -- Time difference

  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_response_times_seller ON seller_response_times(seller_id);
CREATE INDEX idx_response_times_created ON seller_response_times(created_at);
```

**Response Time Calculation:**
- When seller replies to first message in conversation:
  - Calculate `response_seconds = first_response_at - first_message_at`
  - Insert record
  - Update seller profile badge (average of last 50)

### Storage Requirements

**Supabase Storage Bucket:**
- **`message-images`** - Image attachments
- **Retention:** 90 days (auto-delete via cron job)
- **Size limit:** 5 MB per image
- **Allowed formats:** JPG, PNG, WebP

---

## API Endpoints

### Conversations

```
GET /api/messages/conversations
- Get user's conversations (buyer or seller)
- Query params: status (active, archived, blocked, all), page, per_page
- Response: List of conversations with last message preview
- Auth required

GET /api/messages/conversations/:id
- Get single conversation details
- Response: Conversation object + all messages
- Auth required (must be participant)

POST /api/messages/conversations
- Create new conversation
- Body: { buyer_id (optional, auto-detect), seller_id, product_id (optional) }
- Response: New conversation object
- Auth required

PUT /api/messages/conversations/:id/archive
- Archive conversation
- Response: Updated conversation
- Auth required (must be participant)

PUT /api/messages/conversations/:id/unarchive
- Unarchive conversation
- Response: Updated conversation
- Auth required (must be participant)

DELETE /api/messages/conversations/:id
- Delete conversation (soft delete - marks as deleted)
- Response: Success message
- Auth required (must be participant)
```

### Messages

```
GET /api/messages/conversations/:id/messages
- Get all messages in conversation
- Query params: before (timestamp), limit (default: 50, max: 100)
- Response: List of messages (chronological)
- Auth required (must be participant)

POST /api/messages/conversations/:id/messages
- Send new message
- Body: { content, attachments[] (optional) }
- Response: New message object
- Auth required (must be participant)
- Validates: Not blocked, max 1000 chars, max 3 images

GET /api/messages/new
- Poll for new messages (for real-time polling)
- Query params: after (timestamp), conversation_id (optional)
- Response: List of new messages
- Auth required
- Called every 30 seconds

PUT /api/messages/:id/read
- Mark message as read
- Response: Updated message
- Auth required (must be recipient)

PUT /api/messages/conversations/:id/read-all
- Mark all messages in conversation as read
- Response: Success message
- Auth required (must be participant)

DELETE /api/messages/:id
- Delete message (soft delete)
- Response: Success message
- Auth required (must be sender or admin)
```

### Image Uploads

```
POST /api/messages/upload
- Upload image attachment
- Body: FormData with file
- Validates: Image type, size <= 5MB
- Returns: Image URL (Supabase Storage)
- Auth required

DELETE /api/messages/images/:url
- Delete uploaded image (before sending)
- Response: Success message
- Auth required (must be uploader)
```

### Templates (Pro/Pioneer)

```
GET /api/messages/templates
- Get user's custom templates (Pro/Pioneer)
- Also includes 5 system templates
- Response: List of templates
- Auth required

POST /api/messages/templates
- Create custom template (Pro/Pioneer only)
- Body: { name, content }
- Validates: Max 5 custom templates
- Response: New template object
- Auth required (Pro/Pioneer only)

PUT /api/messages/templates/:id
- Update custom template
- Body: { name, content }
- Response: Updated template
- Auth required (must be owner + Pro/Pioneer)

DELETE /api/messages/templates/:id
- Delete custom template
- Response: Success message
- Auth required (must be owner + Pro/Pioneer)

GET /api/messages/templates/system
- Get 5 system quick reply templates
- Response: List of system templates
- No auth required (all users)
```

### Blocking & Reporting

```
POST /api/messages/conversations/:id/block
- Block other participant
- Response: Updated conversation (status: blocked)
- Auth required (must be participant)

POST /api/messages/conversations/:id/unblock
- Unblock user
- Response: Updated conversation (status: active)
- Auth required (must be blocker)

GET /api/messages/blocks
- Get list of blocked users
- Response: List of blocked user objects
- Auth required

POST /api/messages/report
- Report user or message
- Body: { reported_user_id, message_id (optional), report_type, description }
- Response: New report object
- Auth required

GET /api/messages/reports
- Get user's own reports
- Response: List of reports (status, resolution)
- Auth required
```

### Admin Endpoints

```
GET /api/admin/messages/conversations
- Get all conversations (admin view)
- Query params: user_id, product_id, status, flagged
- Response: Paginated list
- Auth required (Super Admin or Moderator)

GET /api/admin/messages/conversations/:id
- View any conversation (admin access)
- Response: Conversation + all messages
- Auth required (Super Admin or Moderator)

GET /api/admin/messages/flagged
- Get flagged messages queue
- Query params: status (pending, resolved, all)
- Response: List of flagged messages
- Auth required (Super Admin or Moderator)

PUT /api/admin/messages/flagged/:id/dismiss
- Dismiss flag (no action needed)
- Response: Updated message
- Auth required (Super Admin or Moderator)

DELETE /api/admin/messages/:id
- Delete any message (admin action)
- Response: Success message
- Auth required (Super Admin only)

POST /api/admin/messages/conversations/:id/join
- Admin joins conversation as mediator
- Response: Success message
- Auth required (Super Admin or Moderator)

POST /api/admin/messages/conversations/:id/message
- Admin sends message to conversation
- Body: { content }
- Response: New message (type: admin)
- Auth required (Super Admin or Moderator)

GET /api/admin/messages/reports
- Get all user reports
- Query params: status, report_type
- Response: List of reports
- Auth required (Super Admin or Moderator)

PUT /api/admin/messages/reports/:id/resolve
- Resolve report
- Body: { resolution, status (resolved/dismissed) }
- Response: Updated report
- Auth required (Super Admin or Moderator)
```

### Seller Analytics

```
GET /api/seller/messages/analytics
- Get seller messaging analytics
- Response: { total_conversations, active_conversations, unread_count, response_time_avg, response_time_badge, message_count_today, message_count_month }
- Auth required (seller only)

GET /api/seller/messages/templates/analytics
- Get template usage stats (Pro/Pioneer)
- Response: { templates: [{ template_id, name, usage_count, last_used }] }
- Auth required (Pro/Pioneer only)
```

### Settings

```
PUT /api/messages/settings/away-message
- Set away/auto-reply message
- Body: { is_active, return_date, message }
- Response: Updated settings
- Auth required (seller only)

GET /api/messages/settings/away-message
- Get current away message status
- Response: Away message object
- Auth required
```

**Total: ~35 endpoints** covering all messaging functionality.

---

## Success Metrics & KPIs

### Metrics to Track (Week 1, Month 1, Month 3, Month 6)

#### 1. Adoption Metrics

**Week 1 Targets:**
- **Messages sent:** 500+ (if 100 users)
- **Active conversations:** 200+
- **Sellers using quick replies:** 30%+

**Month 1 Targets:**
- **Messages sent:** 5,000+
- **Active conversations:** 1,500+
- **Sellers with 10+ conversations:** 50+
- **Repeat conversation rate:** 20%+ (same buyer-seller pair messaging again)

**Month 3 Targets:**
- **Daily active users (messaging):** 200+
- **Messages sent per day:** 500+
- **Conversion rate:** 15%+ of conversations lead to purchase

**Month 6 Targets:**
- **Daily active users:** 500+
- **Total conversations:** 10,000+
- **Sellers using templates:** 40%+ (Pro/Pioneer)

#### 2. Engagement Metrics

**Message Response Time:**
- **Average seller response time:** < 3 hours
- **Fast responders:** 30%+ respond < 1 hour
- **Slow responders:** < 10% take > 24 hours

**Message Read Rates:**
- **Messages read within 1 hour:** 60%+
- **Messages read within 24 hours:** 90%+

**Conversation Depth:**
- **Average messages per conversation:** 4-6
- **Single-message conversations:** < 30% (indicates quick Q&A)
- **Long conversations (10+ messages):** 20%+ (indicates negotiation/support)

#### 3. Safety & Moderation Metrics

**Flag Rate:**
- **Messages flagged:** < 2% of total messages
- **False positive flags:** < 50% of flags (dismissed by admin)
- **Resolution time:** < 24 hours average

**User Reports:**
- **Reports per 1,000 messages:** < 5
- **Harassment reports:** < 1% of conversations
- **Fraud reports:** < 0.5% of conversations

**Block Rate:**
- **Users blocking others:** < 5% of users
- **Repeat blockers:** < 10% of blockers block 3+ users

#### 4. Business Impact Metrics

**Conversion from Messaging:**
- **Conversation → Purchase rate:** 15%+ (🎯 **MOST IMPORTANT METRIC**)
- **Pre-purchase inquiry → Purchase:** 25%+ (buyer asks, then buys)
- **Custom request conversion:** 10%+ (buyer asks for custom work, seller creates, buyer buys)

**Seller Performance:**
- **Fast responders sell more:** Compare sales of sellers <1hr response vs >24hr
- **Target:** Fast responders make 30%+ more sales

**Dispute Reduction:**
- **Disputes before messaging:** Track baseline (support tickets)
- **Disputes after messaging:** Should decrease by 20%+ (direct seller-buyer resolution)
- **Refund rate:** Should decrease (messaging resolves issues instead)

#### 5. Technical Metrics

**Polling Performance:**
- **API response time:** < 200ms average
- **Polling success rate:** > 99%
- **Failed polls:** < 1%

**Message Delivery:**
- **Messages delivered successfully:** > 99.5%
- **Message send failures:** < 0.5%

**Storage & Costs:**
- **Image storage:** 90-day retention working well
- **Storage cost:** < ₱500/month
- **Database size:** Growing predictably

#### 6. User Satisfaction

**Qualitative Metrics (Post-Launch Month 3):**

**Survey Questions:**
1. "How easy is it to message sellers?" (1-5 stars) - Target: 4.0+
2. "Did messaging help you make a purchase decision?" (Yes/No) - Target: 70%+ Yes
3. "How satisfied are you with seller response times?" (1-5) - Target: 3.5+

**Net Promoter Score (NPS):**
- "Would you recommend AKOMAYLESSONPLANNA messaging to other teachers?"
- Target: NPS > 40

#### 7. Seller Feedback

**Pro/Pioneer Adoption:**
- **Quick reply usage:** 60%+ of sellers
- **Custom template creation:** 40%+ of Pro/Pioneer
- **Away message usage:** 20%+ of sellers

**Seller Efficiency:**
- **Time saved with templates:** Self-reported (survey)
- **Target:** 50%+ say templates save time

---

## MVP vs Post-Launch Prioritization

### MVP Critical (Launch with These)

**Must-Have Features:**
1. ✅ **Basic messaging** - Send/receive text messages
2. ✅ **Conversations** - Buyer-seller chat, product-linked
3. ✅ **Inbox UI** - Desktop + mobile layouts
4. ✅ **Polling (30s)** - Real-time message updates
5. ✅ **Read/unread status** - Track read messages
6. ✅ **Block/Report** - Safety tools
7. ✅ **5 quick reply templates** - System templates for all
8. ✅ **Response time tracking** - Seller metrics
9. ✅ **In-app notifications** - Bell badge (no email)
10. ✅ **Admin flagged queue** - Moderation
11. ✅ **Auto-flag external links** - Safety
12. ✅ **Archive conversations** - 90-day auto-archive
13. ✅ **Search conversations** - By name/product/message
14. ✅ **Mobile-optimized** - 70%+ users on mobile
15. ✅ **Image attachments** - Up to 3 images, 5MB max

**Estimated Timeline:** 6-8 weeks for full implementation

### Post-Launch Month 1-3

**High Priority (After Launch):**
1. **Custom templates** (Pro/Pioneer feature)
   - Why: Sellers will request immediately
   - Effort: Medium (2 weeks)

2. **Away messages** (Auto-reply)
   - Why: Sellers need vacation/offline mode
   - Effort: Low (1 week)

3. **Enhanced admin analytics**
   - Why: Admins need insights into messaging patterns
   - Effort: Low (1 week)

4. **Emoji picker** (Native emoji only in MVP)
   - Why: Better UX for Filipino teachers
   - Effort: Low (3 days)

5. **Conversation export** (Download chat history)
   - Why: Sellers want records for tax/disputes
   - Effort: Low (1 week)

### Post-Launch Month 3-6

**Medium Priority:**
6. **Browser push notifications**
   - Why: Real-time alerts without app open
   - Effort: Medium (2 weeks)
   - Requires: User permission flow

7. **Reply with quote**
   - Why: Better context in long conversations
   - Effort: Medium (1 week)

8. **Bulk messages** (Sellers messaging all buyers of Product X)
   - Why: "I updated this product - check it out!"
   - Effort: High (3 weeks)
   - Requires: Strict anti-spam limits, admin approval

9. **Typing indicators** ("Teacher Juan is typing...")
   - Why: Better UX, more like Messenger
   - Effort: Medium (2 weeks)
   - Requires: Upgrade to WebSockets (or complex polling)

10. **Read receipts** ("Seen at 3:45 PM")
    - Why: Confirmation of message delivery
    - Effort: Low (3 days)
    - Note: Some users prefer privacy (make toggle-able)

### Post-Launch Month 6+

**Nice-to-Have (Lower Priority):**
11. **Voice messages** (Audio recording)
    - Why: Some teachers prefer speaking
    - Effort: High (3 weeks)
    - Storage: Audio files larger, 90-day retention costly

12. **Video messages**
    - Why: Show product features visually
    - Effort: High (4 weeks)
    - Storage: Video files very large

13. **Message reactions** (❤️ 👍 😂)
    - Why: Expressive, like Messenger
    - Effort: Low (3 days)

14. **Message forwarding** (Share conversation with support)
    - Why: Easy dispute escalation
    - Effort: Medium (1 week)

15. **Scheduled messages** (Send at 9 AM tomorrow)
    - Why: Seller convenience
    - Effort: Medium (1 week)

16. **Message search** (Search within conversation)
    - Why: Find specific info in long chats
    - Effort: Medium (1 week)

17. **Group conversations** (Admin + Buyer + Seller)
    - Why: Better dispute mediation
    - Effort: High (3 weeks)
    - Note: Already have admin joining, just make it true group chat

18. **File sharing beyond images** (PDF, DOCX)
    - Why: Full document sharing
    - Effort: High (3 weeks)
    - Requires: Virus scanning, larger storage, more complex UI

19. **Upgrade to WebSockets**
    - Why: True real-time, typing indicators
    - Effort: High (4 weeks)
    - Requires: New infrastructure, testing

### Never Build (Out of Scope)

- ❌ **Video/voice calling** - Use external tools (Zoom, Messenger)
- ❌ **SMS integration** - Too expensive, not needed
- ❌ **Email messaging** - Keep email for support@ only
- ❌ **Anonymous messaging** - All users authenticated
- ❌ **Public chat rooms** - Private buyer-seller only
- ❌ **Message encryption** - Not needed for this use case
- ❌ **AI-powered chatbots** - Sellers are humans, not robots
- ❌ **Payment integration in chat** - Transactions via checkout only

---

## Implementation Roadmap

### Phase 1: Foundation (Weeks 1-2)

**Database Setup:**
- [ ] Create `conversations` table
- [ ] Enhance `messages` table
- [ ] Create `message_templates` table
- [ ] Create `message_reports` table
- [ ] Create `user_blocks` table
- [ ] Create `seller_response_times` table
- [ ] Set up all indexes
- [ ] Configure Row Level Security (RLS)

**API Foundation:**
- [ ] Create API routes structure
- [ ] Implement auth middleware for messaging routes
- [ ] Create base API client functions
- [ ] Set up Supabase Storage bucket `message-images`

### Phase 2: Core Messaging (Weeks 3-4)

**Conversation Management:**
- [ ] Implement `POST /api/messages/conversations` (create)
- [ ] Implement `GET /api/messages/conversations` (list)
- [ ] Implement `GET /api/messages/conversations/:id` (get single)
- [ ] Implement conversation uniqueness logic (buyer+seller+product)

**Message CRUD:**
- [ ] Implement `POST /api/messages/conversations/:id/messages` (send)
- [ ] Implement `GET /api/messages/conversations/:id/messages` (list)
- [ ] Implement `PUT /api/messages/:id/read` (mark read)
- [ ] Implement `DELETE /api/messages/:id` (soft delete)

**Polling Implementation:**
- [ ] Implement `GET /api/messages/new` (polling endpoint)
- [ ] Create polling client utility
- [ ] Add smart polling (pause when tab inactive)
- [ ] Test polling behavior

### Phase 3: UI Components (Weeks 5-6)

**Inbox Page:**
- [ ] Build conversation list component
- [ ] Build conversation view component
- [ ] Implement message bubbles (yours vs theirs)
- [ ] Add message input component
- [ ] Implement quick reply chips
- [ ] Add search functionality
- [ ] Create archive/unarchive functionality

**Mobile Experience:**
- [ ] Implement mobile-responsive layouts
- [ ] Add swipe gestures (archive/delete)
- [ ] Create bottom sheet for quick replies
- [ ] Test on mobile devices (iOS + Android)

**Image Uploads:**
- [ ] Implement image upload endpoint
- [ ] Create image picker component
- [ ] Add image preview in chat
- [ ] Implement image compression/optimization
- [ ] Test image upload flow

### Phase 4: Safety & Admin (Week 7)

**Blocking & Reporting:**
- [ ] Implement block/unblock endpoints
- [ ] Build report user flow
- [ ] Create report modal UI
- [ ] Add blocked users list

**Auto-Flagging:**
- [ ] Implement external link detection
- [ ] Implement profanity filter (Tagalog + English)
- [ ] Add spam pattern detection
- [ ] Create admin flagged queue UI

**Admin Tools:**
- [ ] Build admin conversation search
- [ ] Implement admin join conversation
- [ ] Create dispute resolution UI
- [ ] Add admin analytics dashboard
- [ ] Implement audit logging

### Phase 5: Polish & Testing (Week 8)

**Performance:**
- [ ] Optimize database queries
- [ ] Add query result caching
- [ ] Test polling performance
- [ ] Load test with 100+ concurrent users

**Security:**
- [ ] Test block enforcement
- [ ] Verify external link blocking
- [ ] Test message ownership validation
- [ ] Security audit (SQL injection, XSS)

**User Testing:**
- [ ] Test with 10+ Filipino teachers
- [ ] Gather feedback on UX
- [ ] Test mobile experience
- [ ] Fix reported bugs

**Documentation:**
- [ ] Write API documentation
- [ ] Create user guide
- [ ] Document admin tools
- [ ] Write deployment guide

### Success Criteria

**Launch Requirements:**
- ✅ All 15 MVP features implemented
- ✅ Mobile-responsive on all screen sizes
- ✅ Polling working smoothly (30s intervals)
- ✅ Admin tools functional
- ✅ Safety features tested (block, report, flag)
- ✅ Zero critical bugs
- ✅ Load tested (100+ concurrent users)
- ✅ User testing complete (10+ teachers)

**Post-Launch (Month 1):**
- Monitor conversation → purchase conversion rate (target: 15%+)
- Track response times (target: < 3 hours avg)
- Measure seller adoption (target: 60%+ using quick replies)
- Gather user feedback (target: 4.0+ satisfaction)

---

## Document Status

**Status:** ✅ Design Complete
**Date:** January 13, 2026
**Version:** 1.0
**Total Sections:** 15
**Estimated Implementation Time:** 6-8 weeks

**Next Steps:**
1. ✅ **Design Complete** - All decisions finalized
2. ⏭️ **Developer Review** - Share with development team
3. ⏭️ **Create Implementation Tasks** - Break down into developer tasks
4. ⏭️ **Begin Phase 1** - Database setup + API foundation

**Dependencies:**
- Feature 01: Authentication & User Management
- Feature 02: User Profiles & Profile Management
- Feature 03: Product Listings & Management
- Feature 04: Shopping Cart & Checkout Flow
- Feature 05: Reviews & Ratings
- Feature 06: Social Features
- Feature 07: Seller Dashboard & Analytics
- Feature 09: Admin Panel & Content Moderation
- Feature 10: Email System

**Integration Points:**
- Uses existing `users`, `products`, `orders` tables
- Extends notification system from Feature 06
- Integrates with seller dashboard from Feature 07
- Uses admin panel from Feature 09

---

*This document contains the complete design specification for Feature 11: Messaging System. All major decisions have been documented. Use this as the single source of truth during implementation.*
