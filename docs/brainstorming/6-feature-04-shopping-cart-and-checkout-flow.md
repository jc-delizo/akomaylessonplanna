# Feature 04: Shopping Cart & Checkout Flow - Complete Design

**Date:** January 11, 2026
**Feature:** Shopping Cart & Checkout Flow
**Status:** Design Complete

---

## Table of Contents

1. [Overview](#overview)
2. [Shopping Cart Features](#shopping-cart-features)
3. [Wishlist Functionality](#wishlist-functionality)
4. [Checkout Flow](#checkout-flow)
5. [Payment Integration](#payment-integration)
6. [Order Confirmation & Fulfillment](#order-confirmation--fulfillment)
7. [User Library & Downloads](#user-library--downloads)
8. [Cart Abandonment Recovery](#cart-abandonment-recovery)
9. [Seller Order Management](#seller-order-management)
10. [Seller Payouts](#seller-payouts)
11. [Refund Policy & Process](#refund-policy--process)
12. [Email Notifications](#email-notifications)
13. [Mobile Experience](#mobile-experience)
14. [Database Schema Updates](#database-schema-updates)
15. [API Endpoints](#api-endpoints)
16. [User Interface Components](#user-interface-components)
17. [Development Considerations](#development-considerations)

---

## Overview

**Feature 04** connects product browsing (Feature 03) to payment completion and library access. This is the revenue engine of the marketplace where browsers become buyers.

### Core Design Principles

- **Frictionless checkout:** Minimize clicks, form fields, and page loads
- **Mobile-first:** PWA experience optimized for phone purchases
- **Clear payment flow:** GCash/Maya instructions appear at the right time
- **Trust-building:** Receipts, confirmations, and order tracking
- **Seller-friendly:** Fast payouts, transparent earnings

### User Journey

1. Buyer browses products → adds to cart (or wishlist)
2. Views cart page → selects items to checkout
3. Multi-step checkout: (Step 1) Review order → (Step 2) Select payment
4. Enters mobile number → approves payment in GCash/Maya app
5. Redirects to Thank You page → can download immediately
6. Products added to library → unlimited downloads forever
7. Seller receives notification → sees sale in dashboard
8. Seller requests withdrawal → automatic payout via GCash/Maya

### Key Decisions Summary

| Decision Area | Choice | Rationale |
|--------------|--------|-----------|
| Cart quantity | 1 of each product only | Digital goods, unlimited downloads |
| Cart UI | Separate cart page + "Buy Now" | Clear, traditional e-commerce |
| Account requirement | Required for purchase | Build user base, simple implementation |
| Cart limits | Unlimited, persist indefinitely | No realistic limit needed |
| Wishlist | Full wishlist in MVP | Standard e-commerce feature |
| Checkout flow | Multi-step (2 steps) | Break process into review + payment |
| Payment method UI | Large clickable cards with logos | Mobile-friendly, visual clarity |
| Payment instructions | After selection | Contextual, less overwhelming |
| Payment timeout | 15 minutes, hold order | Standard e-commerce timeout |
| Payment retry | Unlimited retries | Technical glitches happen |
| Order confirmation | Thank You page + email | Closure and immediate access |
| Downloads | Unlimited, permanent access | Buyer-friendly, watermarking prevents sharing |
| Cart abandonment | Single reminder after 24h | Polite, 10-15% recovery rate |
| Coupons | Deferred to post-launch | Focus on core features |
| Seller payouts | Manual request, auto-processing | Seller control, no bottleneck |
| Refund policy | All sales final, 7-day exceptions | Digital goods standard |
| Refund window | 7 days, seller first | Fair timeline, seller autonomy |
| Refund processing | Automatic via API | Professional, seamless |
| Mobile checkout | Optimized, no special features | PWA + responsive is enough |
| Buyer info to sellers | Anonymized only | Privacy + transparency balance |
| Earnings display | Full breakdown | Radical transparency |

---

## Shopping Cart Features

### 1. Cart Behavior

**One Copy Per Product**
- Each product appears only once in cart (quantity always = 1)
- Rationale: Digital products can be downloaded unlimited times
- No quantity selector (simpler UI)
- Teachers don't need multiple copies of the same resource

**Unlimited Cart Items**
- No maximum limit on items in cart
- Cart persists indefinitely (no expiration)
- Rationale: Cart = product references (minimal database impact)
- Teachers can save many items for later consideration

**Cart Persistence**
- Cart saved in database for logged-in users
- Returning users see their previous cart
- Cart only clears when: items purchased, manually removed, or products deleted

### 2. Cart Page Design

**Layout**
- Route: `/cart`
- Responsive: 2/3/4 column grid for mobile/tablet/desktop
- Header: "Shopping Cart (X items)"

**Cart Item Display**
Each item shows:
- Product thumbnail (cover image)
- Product title (link to product detail page)
- Seller name (link to seller profile)
- Price
- Checkbox (for checkout selection)
- "Remove" button (trash icon)
- "Move to Wishlist" button (heart icon)

**Cart Actions**
- "Select All" checkbox + "Deselect All" button
- "Remove Selected" button
- "Checkout [X] Selected Items" button (prominent, CTA)
- Subtotal display: "Total for X items: ₱XXX"

**Empty Cart State**
- Illustration + message: "Your cart is empty"
- CTA: "Browse Products" button
- Secondary: "View Wishlist" link

### 3. "Buy Now" Button

**Product Page Integration**
- "Add to Cart" button (secondary action)
- "Buy Now" button (primary action, prominent)
- "Buy Now" behavior:
  1. Add single product to cart (if not already there)
  2. Redirect immediately to checkout (skip cart page)
  3. Pre-select the product for checkout
  4. User can still add more items from cart if desired

**Benefits**
- Captures impulse purchases
- Faster path to purchase for single-item buyers
- Reduces abandoned carts

---

## Wishlist Functionality

### 1. Wishlist Design

**Heart Icon Toggle**
- Heart icon on each product card (top-right corner)
- Empty heart: not saved
- Filled heart: saved to wishlist
- One-click toggle (no confirmation)

**Wishlist Page**
- Route: `/wishlist`
- Similar layout to cart page
- Shows: product thumbnail, title, seller, price
- Actions per item:
  - "Add to Cart" button
  - "Remove from Wishlist" button (trash icon)

**Empty Wishlist State**
- Illustration + message: "Save items you'd like to buy later"
- CTA: "Browse Products" button

### 2. Wishlist Behavior

**Cart Integration**
- Moving item from wishlist → cart removes from wishlist
- Cart has "Move to Wishlist" button
- Both lists independent: can have item in both (but show indicator)

**Wishlist Persistence**
- Saved in database (similar to cart_items table)
- Persists indefinitely (no expiration)
- Account required (same as cart)

---

## Checkout Flow

### 1. Checkout Entry

**From Cart Page**
- User selects items (checkboxes)
- Clicks "Checkout [X] Selected Items"
- Redirects to `/checkout`

**From Product Page (Buy Now)**
- Single item checkout
- Pre-selected, skips cart
- Can still add more items from cart (back button)

### 2. Multi-Step Checkout

**Route:** `/checkout`

**Step 1: Review Order**
- Progress indicator: "Step 1 of 2"
- Order summary:
  - List of selected items
  - Product thumbnail, title, seller
  - Price per item
  - Subtotal: ₱XXX
- Total: ₱XXX (prominent, large)
- "Continue to Payment" button

**Step 2: Payment Method**
- Progress indicator: "Step 2 of 2"
- Payment method selection (see below)
- "Back to Order Review" link
- After payment selection: "Pay Now" button (GCash/Maya color-coded)

### 3. Order Summary Display

**Simple Summary (No Commission)**
- Shows to buyer:
  - Itemized list with prices
  - Subtotal
  - **Total (final amount to pay)**

- Does NOT show:
  - Platform commission (seller-side)
  - Transaction fees (if you absorb them)
  - Any fee breakdown

**Rationale**
- Buyer only cares about total
- Commission is seller's concern
- Simpler = faster checkout
- Industry standard (Amazon, Lazada, Shopee)

---

## Payment Integration

### 1. Payment Method Selection UI

**Large Clickable Cards**
- Two big cards side-by-side (desktop) or stacked (mobile)
- Each card:
  - GCash or Maya logo (prominent)
  - Radio button indicator (selected state)
  - Text: "Pay with GCash" or "Pay with Maya"
  - Entire card clickable (not just radio)

**Visual Design**
- Selected state: colored border (GCash blue, Maya orange)
- Hover state: subtle lift effect
- Mobile: full-width cards, easy touch targets

### 2. Payment Instructions

**Contextual Display**
- Instructions appear **after** selecting payment method
- Progressive disclosure: only show relevant instructions

**GCash Instructions (after selection)**
```
Pay with GCash

1. Enter your GCash mobile number below
2. You'll receive a push notification in your GCash app
3. Open GCash, enter your PIN/biometric to approve
4. Return here to confirm payment

[Mobile number input field]
[Checkbox] "I have a GCash account"
```

**Maya Instructions (after selection)**
```
Pay with Maya

1. Enter your Maya mobile number below
2. You'll receive an OTP in your Maya app
3. Enter the OTP here to confirm payment
4. Your order will be completed instantly

[Mobile number input field]
[Checkbox] "I have a Maya account"
```

**Additional Help**
- Small "ℹ️ How it works" link → opens modal with detailed steps
- Screenshots of GCash/Maya payment flow
- FAQ link below

### 3. Payment Timeout

**15-Minute Window**
- Order created with status: `payment_pending`
- Countdown timer: "Complete payment in 14:59"
- After 15 minutes:
  - Order status → `payment_failed`
  - Cart items NOT cleared (can retry)
  - Email sent: "Payment not completed. Your cart is waiting, try again!"

**Rationale**
- 15 minutes is standard (Amazon, Lazada)
- Creates urgency without being aggressive
- Holding cart reduces frustration

### 4. Payment Retry

**Unlimited Retries**
- Payment fails → clear error message
- "Try Again" button (returns to payment selection)
- No limit on retry attempts
- Order stays in `payment_pending` until successful or user cancels

**Error Messages**
- "Payment timed out. Please try again."
- "Insufficient funds in your GCash account."
- "Payment cancelled. Please try again."
- After 3 failed attempts: "Having trouble? Contact support"

**User Can Cancel**
- "Cancel Order" button at any time
- Returns to cart with items still there
- No consequences (can try again later)

### 5. Payment Webhook Handling

**GCash Webhook**
1. GCash sends webhook to `/api/orders/gcash-callback`
2. System verifies webhook signature
3. Order status → `payment_completed`
4. Products added to user library
5. Order confirmation email sent
6. Seller notification sent
7. Redirect user to Thank You page

**Maya Webhook**
1. Maya sends webhook to `/api/orders/maya-callback`
2. Same flow as GCash

**Idempotency**
- Idempotency key prevents duplicate payments
- Retry-safe: if webhook received twice, same result

---

## Order Confirmation & Fulfillment

### 1. Thank You Page

**Route:** `/orders/[orderId]/success`

**Page Content**
- Large success message: "Payment Successful! 🎉"
- Order details:
  - Order ID: #ORD-12345
  - Date and time
  - List of purchased items
  - Total paid: ₱XXX
- Download buttons for each product (prominent)
- "Go to My Library" button (secondary)
- "View Order Receipt" button
- "Continue Shopping" button
- "Email confirmation sent to: user@email.com"

**Success Message Options**
- "Your resources are ready for download!"
- "Thank you for supporting Filipino teachers!"
- "A receipt has been sent to your email."

### 2. Email Confirmation

**Immediate Email Send**

**Subject:** "Order Confirmation - Your AKOMAYLESSONPLANNA Purchase"

**Email Content:**
```
Hi [Buyer Name],

Thank you for your purchase! Your order is complete.

ORDER DETAILS
-------------
Order ID: #ORD-12345
Date: January 11, 2026

Items Purchased:
- Grade 7 Math DLL Q1 Weeks 1-8 - ₱100
- Science Periodical Exam Grade 7 - ₱50

Total: ₱150

DOWNLOAD YOUR FILES
-------------------
[Download: Grade 7 Math DLL Q1 Weeks 1-8]
[Download: Science Periodical Exam Grade 7]

Or visit your library: [Go to My Library]

NEED HELP?
----------
Have questions? Contact us: support@akomaylessonplanna.com

Thank you for supporting Filipino teachers! 🇵🇭

AKOMAYLESSONPLANNA
```

**Download Links in Email**
- Direct download links (watermarked files)
- Links expire after 24 hours (security)
- After expiry: "Please log in to your library to download"

---

## User Library & Downloads

### 1. Library Page

**Route:** `/library`

**Layout**
- Grid of purchased products (2/3/4 columns responsive)
- Filter: "All", "Recently Purchased", "Most Downloaded"
- Search: "Search your library..."

**Library Item Display**
- Product thumbnail
- Product title
- Purchase date
- Seller name
- Rating stars (if rated by buyer)
- "Download" button (prominent)
- "Rate this Product" link (if not yet rated)

**Empty Library State**
- Illustration + message: "You haven't purchased anything yet"
- CTA: "Browse Products" button

### 2. Download Behavior

**Unlimited Downloads**
- No limit on number of downloads per product
- No time limit (permanent access)
- "Download" button always available

**Download Process**
1. User clicks "Download"
2. System checks: has user purchased this product? ✓
3. System generates watermarked file (if not cached)
4. Progress indicator: "Preparing your files... 45%"
5. File downloads automatically when ready
6. Download count incremented in database
7. "Last downloaded: [datetime]" updated

**Download Progress UI**
```
Preparing your files...

[████████░░░░░░░░] 45%

Please wait while we prepare your download...
```

**Watermarking**
- Every download watermarked with buyer's email
- PDF: email on first/last page
- DOCX: email in header/footer
- PPTX: email watermark on slides
- Caches for 24 hours (faster re-downloads)

---

## Cart Abandonment Recovery

### 1. Abandoned Cart Email

**Trigger:** Items in cart for 24 hours without checkout

**Subject:** "You left items in your cart! 💭"

**Email Content:**
```
Hi [Buyer Name],

We noticed you have some great resources waiting in your cart:

[Product 1 thumbnail + title]
[Product 2 thumbnail + title]

Total: ₱XXX

Complete your purchase now: [Continue to Checkout]

Need help finding the perfect resources?
Browse our collection: [Browse All Products]

These resources are created by Filipino teachers like you!
Support your fellow educators.

AKOMAYLESSONPLANNA
```

**Optional: Incentive**
- Can include: "Complete your purchase in the next 24 hours and get 5% off!"
- Use discount code: CART5
- Only if you want to implement coupons in MVP (we deferred this)

### 2. Abandoned Cart Tracking

**Database Field**
- `cart_items` table needs: `last_abandoned_email_sent_at` (timestamp)
- Prevents spam: only send once per cart

**Email Frequency**
- ONE email only (not spammy)
- Sent 24 hours after items added
- No follow-up emails

---

## Seller Order Management

### 1. Seller Dashboard - Orders Section

**Route:** `/seller/dashboard/orders`

**Orders List Display**
Each order shows:
- Order ID
- Date and time
- Product sold (thumbnail + title)
- Product price
- Platform commission (20% or 15%)
- **Net earnings** (prominent)
- Buyer info: "Teacher Maria M." (anonymized)
- Payment method: GCash/Maya
- Order status: Completed/Pending/Failed
- Download count: "Downloaded 3 times"

**Order Actions**
- "View Details" button → opens order detail modal
- "Contact Buyer" button → opens messaging form

**Filters**
- All orders
- Completed orders
- Pending orders
- Date range filter
- Product filter

### 2. Order Detail Modal

**Full Order Information**
```
Order #ORD-12345
January 11, 2026 at 3:45 PM

PRODUCT
Grade 7 Math DLL Q1 Weeks 1-8
Cover image: [thumbnail]

PRICING
Product price: ₱100
Platform commission (20%): -₱20
─────────────────────
Your earnings: ₱80

BUYER INFORMATION
Teacher Maria M. (anonymized)
Member since: January 2026
Downloaded: 3 times

PAYMENT
Method: GCash
Status: Completed

[Contact Buyer]
[View Product Listing]
```

**Earnings Transparency**
- Shows full breakdown (price → commission → earnings)
- Commission rate shown: 20% (or 15% for Pioneers)
- Helps sellers understand platform fee

---

## Seller Payouts

### 1. Earnings Dashboard

**Route:** `/seller/dashboard/earnings`

**Dashboard Display**
- Current balance: "₱2,340 available for withdrawal"
- Pending balance: "₱560 processing"
- Total lifetime earnings: "₱15,780"
- "Request Withdrawal" button (enabled if balance ≥ ₱500)

**Earnings Breakdown**
- This week: ₱XXX
- This month: ₱XXX
- All time: ₱XXX
- Chart: Earnings over time (Pro/Pioneer feature)

### 2. Withdrawal Request

**Minimum Threshold**
- ₱500 minimum withdrawal
- Prevents excessive transfer fees

**Withdrawal Form**
```
Request Withdrawal

Available balance: ₱2,340
Withdrawal amount: [₱2,340]

Withdraw to:
○ GCash (09XX-XXX-XXXX)
● Maya (09XX-XXX-XXXX)

[Request Withdrawal]
```

**Automatic Processing**
- Seller clicks "Request Withdrawal"
- System validates:
  - Minimum ✓ threshold met
  - Payment ✓ method valid
  - Earnings ✓ calculated correctly
- System processes via GCash/Maya Disbursement API
- Funds transferred to seller's wallet
- Seller notified: "Withdrawal successful! Check your GCash/Maya."
- No admin review needed
- Processing time: 1-3 business days

**Withdrawal History**
- Table shows: date, amount, method, status
- Status: Processing, Completed, Failed
- Failed withdrawals show reason + retry option

---

## Refund Policy & Process

### 1. Refund Policy Statement

**Public Policy (on website)**
```
REFUND POLICY

All sales are final due to the digital nature of our products.

However, we understand that issues may arise. Refunds may be considered in the following cases:

• Defective or corrupted files
• Product not as described
• Technical issues preventing download
• Inappropriate content (after review)

Refund requests must be made within 7 days of purchase.

To request a refund, contact the seller directly through our messaging system.
The seller has 48 hours to respond.

If the seller doesn't respond or you disagree with their decision, you can
escalate to our support team for mediation.

Our decision is final.
```

### 2. Refund Request Process

**Step 1: Buyer Initiates Request**
- Buyer goes to: `/orders/[orderId]/request-refund`
- Form appears:
  - Reason for refund (dropdown)
  - Description (textarea)
  - Attachments (optional, screenshots)
- Buyer submits request

**Step 2: Seller Notified**
- Seller receives email: "Refund requested for Order #ORD-12345"
- In-app notification appears
- Seller has 48 hours to respond

**Step 3: Seller Response Options**
- **Approve refund:** Automatic processing via GCash/Maya API
- **Offer fix:** "I can send you a corrected file"
- **Dispute:** "Product is as described, no refund"
- **No response:** Buyer can escalate after 48 hours

**Step 4: Buyer Escalation (if needed)**
- If seller disputes or doesn't respond, buyer clicks "Escalate to Platform"
- Platform support reviews both sides
- Platform mediates, final decision
- Response time: 3-5 business days

### 3. Refund Processing

**Automatic Refund via API**
- When refund approved: system triggers GCash/Maya refund API
- Money returned to buyer's wallet automatically
- Buyer receives notification from GCash/Maya
- Processing time: 1-3 business days
- Buyer's library access revoked immediately

**Email Notifications**

**To Buyer:**
```
Refund Approved

Your refund for Order #ORD-12345 has been processed.

Amount: ₱100
The refund should appear in your GCash account within 1-3 business days.

Your access to this product has been revoked.

AKOMAYLESSONPLANNA
```

**To Seller:**
```
Refund Processed

A refund has been issued for Order #ORD-12345.

Product: Grade 7 Math DLL Q1 Weeks 1-8
Refund amount: ₱100
This amount has been deducted from your earnings.

The buyer's access has been revoked.

AKOMAYLESSONPLANNA
```

---

## Email Notifications

### 1. Buyer Notifications

**Order Confirmation**
- Trigger: Immediately after successful payment
- Subject: "Order Confirmation - Your AKOMAYLESSONPLANNA Purchase"
- Content: Order details, download links, receipt

**Payment Failed**
- Trigger: Payment timeout or payment declined
- Subject: "Payment Not Completed - Your Cart is Waiting"
- Content: "Your cart items are saved. Try again when you're ready."

**Abandoned Cart**
- Trigger: 24 hours after items added to cart (no checkout)
- Subject: "You left items in your cart! 💭"
- Content: Cart items summary, CTA to complete purchase

**Refund Approved**
- Trigger: Refund processed successfully
- Subject: "Refund Approved - Order #ORD-12345"
- Content: Refund amount, processing time, access revoked

### 2. Seller Notifications

**New Sale**
- Trigger: Immediately after successful payment
- Subject: "You made a sale! 🎉"
- Content:
  ```
  Congratulations! You just made a sale.

  Product: Grade 7 Math DLL Q1 Weeks 1-8
  Price: ₱100
  Your earnings: ₱80

  Buyer: Teacher Maria M.

  Keep up the great work!

  View order details: [Link]
  ```

**Refund Requested**
- Trigger: Buyer requests refund
- Subject: "Refund Requested - Order #ORD-12345"
- Content: "A buyer has requested a refund. Please review and respond within 48 hours."

**Withdrawal Complete**
- Trigger: Withdrawal processed successfully
- Subject: "Withdrawal Complete - ₱2,340 sent to your GCash"
- Content: "Your withdrawal has been processed. Check your GCash/Maya account in 1-3 business days."

**Product Updated**
- Trigger: Seller updates product (from Feature 03)
- Subject: "Your product has been updated!"
- Content: "Buyers who purchased Grade 7 Math DLL will be notified of the update."

---

## Mobile Experience

### 1. Mobile Checkout Optimization

**PWA Benefits**
- Add to home screen
- Full-screen mode
- Offline capability (view cart, wishlist offline)

**Responsive Design**
- Cart page: 2 columns (mobile), 3 (tablet), 4 (desktop)
- Checkout: Single column, stacked layout
- Payment cards: Full-width on mobile
- Touch targets: Minimum 44x44px (iOS guideline)

**Mobile-Specific Optimizations**
- Numeric keyboard for mobile number input
- Input mode: `type="tel"` (shows number pad)
- Large "Pay Now" button (easy to tap)
- Sticky "Pay" button (bottom of screen)
- Back button: Clearly visible, easy to return

**No Special Features**
- No deep linking to GCash/Maya apps
- No one-tap buy
- Keep it simple: responsive + PWA is enough

### 2. Mobile Payment Flow

**GCash on Mobile**
1. User selects "Pay with GCash"
2. Enters mobile number
3. Receives push notification in GCash app
4. Switches to GCash app (approves payment)
5. Returns to browser (auto-redirects to Thank You page)
6. Seamless app switching

**Maya on Mobile**
1. User selects "Pay with Maya"
2. Enters mobile number
3. Receives OTP in Maya app
4. Enters OTP in checkout form
5. Payment completes instantly
6. Redirects to Thank You page

---

## Database Schema Updates

### 1. Cart Items Table

**Table: `cart_items`**
```sql
CREATE TABLE cart_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, product_id) -- One of each product per user
);

CREATE INDEX idx_cart_items_user ON cart_items(user_id);
```

**Notes**
- No quantity field (always = 1)
- No expiration date (persists indefinitely)
- Unique constraint prevents duplicates

### 2. Wishlist Table

**Table: `wishlist`**
```sql
CREATE TABLE wishlist (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, product_id)
);

CREATE INDEX idx_wishlist_user ON wishlist(user_id);
```

### 3. Orders Table (Enhanced)

**Table: `orders`**
```sql
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  buyer_id UUID NOT NULL REFERENCES users(id),

  -- Order details
  total_amount DECIMAL(10,2) NOT NULL,
  total_commission DECIMAL(10,2) NOT NULL,
  item_count INTEGER NOT NULL,

  -- Payment
  payment_method VARCHAR(20) NOT NULL, -- 'gcash' or 'maya'
  payment_status VARCHAR(20) NOT NULL DEFAULT 'pending', -- 'pending', 'completed', 'failed'
  payment_reference VARCHAR(100), -- Transaction ID from GCash/Maya

  -- Payment timeout
  payment_expires_at TIMESTAMP, -- 15 minutes from order creation

  -- Buyer info (for refund requests)
  buyer_mobile_number VARCHAR(20), -- GCash/Maya number

  -- Refund
  refund_status VARCHAR(20) DEFAULT 'none', -- 'none', 'requested', 'approved', 'rejected'
  refund_reason TEXT,
  refund_requested_at TIMESTAMP,
  refund_processed_at TIMESTAMP,
  refund_reference VARCHAR(100), -- Refund transaction ID

  -- Timestamps
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMP
);

CREATE INDEX idx_orders_buyer ON orders(buyer_id);
CREATE INDEX idx_orders_seller ON orders(seller_id);
CREATE INDEX idx_orders_status ON orders(payment_status);
CREATE INDEX idx_orders_created ON orders(created_at DESC);
```

**Enhancements from Feature 04**
- Added `payment_expires_at` for 15-minute timeout
- Added `buyer_mobile_number` for GCash/Maya
- Added refund fields (status, reason, timestamps)
- Added `completed_at` timestamp

### 4. Order Items Table (Enhanced)

**Table: `order_items`**
```sql
CREATE TABLE order_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id),
  seller_id UUID NOT NULL REFERENCES users(id),

  -- Product snapshot (at time of purchase)
  product_title VARCHAR(255) NOT NULL,
  product_cover_image_url TEXT,

  -- Pricing
  price_at_purchase DECIMAL(10,2) NOT NULL,
  commission_rate DECIMAL(5,2) NOT NULL, -- 20.00 or 15.00
  commission_amount DECIMAL(10,2) NOT NULL,
  net_earnings DECIMAL(10,2) NOT NULL, -- For seller dashboard

  -- Version tracking
  product_version_at_purchase INTEGER NOT NULL DEFAULT 1,

  -- Download tracking
  download_count INTEGER DEFAULT 0,
  last_downloaded_at TIMESTAMP,

  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_order_items_order ON order_items(order_id);
CREATE INDEX idx_order_items_seller ON order_items(seller_id);
```

**Enhancements from Feature 04**
- Added `product_title` and `product_cover_image_url` (snapshot)
- Added `download_count` and `last_downloaded_at`
- Added `net_earnings` for seller dashboard

### 5. User Library Table (No Changes)

**Table: `user_library`**
```sql
-- No changes needed from original design
-- Already supports unlimited downloads (download_count field exists)
```

### 6. Abandoned Cart Tracking

**New Field: `users` table**
```sql
ALTER TABLE users ADD COLUMN last_cart_abandonment_email_sent_at TIMESTAMP;
```

**Usage**
- Prevents sending multiple abandonment emails
- Reset after purchase or cart cleared

---

## API Endpoints

### 1. Cart Endpoints

**GET /api/cart**
- Get user's cart
- Response: List of cart items with product details
- Auth required

**POST /api/cart/add**
- Add product to cart
- Body: `{ product_id: UUID }`
- If already in cart: ignore (idempotent)
- Response: Cart item
- Auth required

**DELETE /api/cart/:itemId**
- Remove item from cart
- Response: Success message
- Auth required

**DELETE /api/cart**
- Clear entire cart
- Response: Success message
- Auth required

**POST /api/cart/move-to-wishlist**
- Move item from cart to wishlist
- Body: `{ product_id: UUID }`
- Removes from cart, adds to wishlist
- Response: Success message
- Auth required

### 2. Wishlist Endpoints

**GET /api/wishlist**
- Get user's wishlist
- Response: List of wishlist items with product details
- Auth required

**POST /api/wishlist/add**
- Add product to wishlist
- Body: `{ product_id: UUID }`
- If already in wishlist: ignore
- Response: Wishlist item
- Auth required

**DELETE /api/wishlist/:itemId**
- Remove item from wishlist
- Response: Success message
- Auth required

**POST /api/wishlist/move-to-cart**
- Move item from wishlist to cart
- Body: `{ product_id: UUID }`
- Removes from wishlist, adds to cart
- Response: Success message
- Auth required

### 3. Checkout Endpoints

**POST /api/checkout/create**
- Create order from selected cart items
- Body: `{ item_ids: UUID[] }`
- Creates order with `payment_pending` status
- Sets `payment_expires_at` to 15 minutes from now
- Response: Order ID, payment details
- Auth required

**POST /api/checkout/select-payment**
- Select payment method (GCash/Maya)
- Body: `{ order_id: UUID, payment_method: 'gcash'|'maya', mobile_number: string }`
- Initiates payment via GCash/Maya API
- Returns payment instructions
- Response: Payment details, instructions
- Auth required

**POST /api/checkout/cancel**
- Cancel pending payment
- Body: `{ order_id: UUID }`
- Order status → `payment_failed`
- Cart items remain (can retry)
- Response: Success message
- Auth required

### 4. Payment Webhook Endpoints

**POST /api/orders/gcash-callback**
- GCash webhook endpoint
- Verifies webhook signature
- Updates order status to `payment_completed`
- Adds products to user library
- Sends confirmation emails
- Sends seller notifications
- Response: { success: true }
- No auth required (webhook signed)

**POST /api/orders/maya-callback**
- Maya webhook endpoint
- Same flow as GCash
- Response: { success: true }
- No auth required (webhook signed)

### 5. Order Endpoints

**GET /api/orders**
- Get user's orders
- Query params: status, date_from, date_to
- Response: List of orders with items
- Auth required

**GET /api/orders/:orderId**
- Get order details
- Response: Full order with items, status, download links
- Auth required (buyer only)

**GET /api/orders/:orderId/success**
- Thank you page data
- Response: Order details, download buttons, next steps
- Auth required

**POST /api/orders/:orderId/request-refund**
- Initiate refund request
- Body: `{ reason: string, description: string }`
- Order refund_status → `requested`
- Notifies seller
- Response: Success message
- Auth required (buyer only)

**POST /api/orders/:orderId/refund/respond**
- Seller responds to refund request
- Body: `{ action: 'approve'|'dispute', message: string }`
- If approve: Process refund via API automatically
- Response: Success message
- Auth required (seller only)

**POST /api/orders/:orderId/refund/escalate**
- Buyer escalates refund to platform
- Only after 48 hours or if seller disputed
- Body: `{ message: string }`
- Platform support notified
- Response: Success message
- Auth required (buyer only)

### 6. Library Endpoints

**GET /api/library**
- Get user's purchased products
- Response: List of library items with download URLs
- Auth required

**GET /api/library/:productId/download**
- Download product file (watermarked)
- Generates watermarked file if not cached
- Streams file to browser
- Increments download count
- Response: File stream
- Auth required

**GET /api/library/:productId/download/progress**
- Poll download preparation progress
- Response: `{ progress: 45, status: 'preparing' }`
- Auth required

### 7. Seller Dashboard Endpoints

**GET /api/seller/orders**
- Get seller's orders (items they sold)
- Query params: status, product_id, date_from, date_to
- Response: List of order items with earnings breakdown
- Auth required (seller only)

**GET /api/seller/earnings**
- Get seller's earnings dashboard
- Response: Current balance, pending balance, total earnings, chart data
- Auth required (seller only)

**POST /api/seller/withdrawal**
- Request withdrawal
- Body: `{ amount: decimal, payment_method: 'gcash'|'maya' }`
- Validates minimum threshold (₱500)
- Processes via GCash/Maya Disbursement API
- Response: Withdrawal details
- Auth required (seller only)

**GET /api/seller/withdrawals**
- Get withdrawal history
- Response: List of withdrawals with status
- Auth required (seller only)

**GET /api/seller/orders/:orderItemId**
- Get detailed order item info
- Response: Full order item details with buyer info (anonymized)
- Auth required (seller only)

**POST /api/seller/orders/:orderItemId/contact-buyer**
- Send message to buyer
- Body: `{ message: string }`
- Creates message in system
- Buyer notified via email + in-app
- Response: Message details
- Auth required (seller only)

### 8. Admin Endpoints

**GET /api/admin/pending-refunds**
- Get all refund requests awaiting seller response
- Response: List of refund requests
- Auth required (admin only)

**POST /api/admin/refunds/:refundId/resolve**
- Admin resolves escalated refund
- Body: `{ decision: 'approve'|'reject', reason: string }`
- Processes refund if approved
- Notifies buyer and seller
- Response: Success message
- Auth required (admin only)

---

## User Interface Components

### 1. Cart Page Component

**File:** `app/cart/page.tsx`

**Layout**
```
[Header: Shopping Cart (3 items)]

[Cart Items List]
┌─────────────────────────────────┐
│ ☑ │ [Thumbnail] │ Title        │
│   │             │ Seller       │
│   │             │ ₱100         │
│   │             │ [Remove] [♥] │
└─────────────────────────────────┘
┌─────────────────────────────────┐
│ ☑ │ [Thumbnail] │ Title        │
│   │             │ ...          │
└─────────────────────────────────┘

[Select All] [Deselect All] [Remove Selected]

Subtotal for 2 items: ₱150

[Checkout 2 Selected Items] (large, prominent)
[Continue Shopping]
```

**Responsive**
- Mobile: Single column, full-width items
- Tablet: 2 columns
- Desktop: 3 columns

### 2. Checkout Page Component

**File:** `app/checkout/page.tsx`

**Step 1: Review Order**
```
[Progress: Step 1 of 2]

ORDER SUMMARY
────────────────────────────────────
[Thumbnail] Grade 7 Math DLL Q1     ₱100
[Thumbnail] Science Exam Grade 7    ₱50
────────────────────────────────────
Subtotal:                            ₱150
Total:                               ₱150

[Continue to Payment] (large, prominent)
[Back to Cart]
```

**Step 2: Payment Method**
```
[Progress: Step 2 of 2]

SELECT PAYMENT METHOD
────────────────────────────────────
┌─────────────────┐  ┌──────────────┐
│   ○ Pay with   │  │  ○ Pay with │
│     GCash      │  │    Maya      │
│  [GCash Logo]  │  │ [Maya Logo]  │
└─────────────────┘  └──────────────┘

(GCash selected)
────────────────────────────────────
✓ Pay with GCash

1. Enter your GCash mobile number below
2. You'll receive a push notification
3. Approve in your GCash app
4. Return here to confirm

Mobile Number: [09XX-XXX-XXXX]

[ℹ️ How it works]

[Back to Order Review]
[Pay Now ₱150] (GCash blue, large)
```

### 3. Thank You Page Component

**File:** `app/orders/[id]/success/page.tsx`

```
┌────────────────────────────────────┐
│                                    │
│   ✓ Payment Successful! 🎉        │
│                                    │
│   Your resources are ready         │
│                                    │
└────────────────────────────────────┘

ORDER #ORD-12345
January 11, 2026

Your Downloads:
┌─────────────────────────────────┐
│ [Download] Grade 7 Math DLL Q1  │
│ [Download] Science Exam Grade 7 │
└─────────────────────────────────┘

Total Paid: ₱150

[Go to My Library]
[View Order Receipt]
[Continue Shopping]

A receipt has been sent to your email.
```

### 4. Library Page Component

**File:** `app/library/page.tsx`

```
[Header: My Library (5 items)]

[Search: Search your library...]

[Filter: All ▼] [Recently Purchased] [Most Downloaded]

┌──────────┐ ┌──────────┐ ┌──────────┐
│[Thumbnail]│ │[Thumbnail]│ │[Thumbnail]│
│Grade 7   │ │Science   │ │Filipino  │
│Math DLL  │ │Exam      │ │Lesson    │
│          │ │          │ │          │
│[Download]│ │[Download]│ │[Download]│
│[Rate ★]  │ │[Rate ★★★]│ │[Rate ★★★]│
└──────────┘ └──────────┘ └──────────┘
```

### 5. Seller Dashboard - Orders

**File:** `app/seller/dashboard/orders/page.tsx`

```
[Header: Seller Dashboard > Orders]

[Filter: All Orders ▼] [Completed] [Pending] [This Month]

┌──────────────────────────────────────────────────────┐
│ Order #ORD-12345 • January 11, 2026                  │
│                                                      │
│ Product: Grade 7 Math DLL Q1                         │
│ Buyer: Teacher Maria M.                              │
│                                                      │
│ Price: ₱100                                          │
│ Commission (20%): -₱20                               │
│ Your earnings: ₱80                                   │
│                                                      │
│ Payment: GCash • Completed                           │
│ Downloaded: 3 times                                  │
│                                                      │
│ [View Details] [Contact Buyer]                       │
└──────────────────────────────────────────────────────┘
```

### 6. Seller Dashboard - Earnings

**File:** `app/seller/dashboard/earnings/page.tsx`

```
[Header: Seller Dashboard > Earnings]

┌────────────────┐  ┌────────────────┐
│ Available:     │  │ Pending:       │
│ ₱2,340        │  │ ₱560           │
└────────────────┘  └────────────────┘

[Request Withdrawal] (enabled)

┌────────────────────────────────────┐
│ Total Earnings: ₱15,780            │
│                                    │
│ This Week:   ██████  ₱450         │
│ This Month:  ████████████ ₱2,340  │
│ All Time:    ██████████████ ₱15K  │
└────────────────────────────────────┘

Withdrawal History
Date        Amount     Method    Status
Jan 10      ₱1,500     GCash     Completed
Jan 3       ₱800       Maya      Completed
```

---

## Development Considerations

### 1. Priority Features (MVP)

**Must Have**
- Cart page with item management
- Wishlist page
- Multi-step checkout (2 steps)
- GCash payment integration
- Maya payment integration
- Thank you page
- Order confirmation email
- User library with downloads
- Watermarking on download
- Seller dashboard (orders, earnings)
- Withdrawal request and processing
- Refund request system

**Nice to Have (Post-MVP)**
- Coupon/discount codes
- Abandoned cart emails (can add later)
- Advanced seller analytics
- Instant payouts (fee-based)
- Gift purchases

### 2. Technical Challenges

**Payment Integration**
- GCash and Maya API integration requires business accounts
- Webhook signature verification is critical for security
- Idempotency keys prevent duplicate payments
- Testing in sandbox environments first

**Watermarking**
- On-demand file processing can be slow
- Caching strategy: 24-hour cache
- Progress indicator is UX-critical
- File type support: PDF, DOCX, PPTX

**Email Deliverability**
- Configure SPF, DKIM, DMARC records
- Use reputable email service (Resend, SendGrid)
- Transactional emails must be reliable
- Test spam scores

### 3. Security Considerations

**Payment Security**
- Never store full GCash/Maya credentials
- Use environment variables for API keys
- Verify webhook signatures
- Log all payment transactions for audit

**Download Security**
- Check user owns product before every download
- Watermark all files (traceability)
- Rate limit download endpoint
- Monitor for abuse (excessive downloads)

**Refund Fraud Prevention**
- Track refund requests per user
- Flag users with high refund rate
- Require description for refund requests
- Manual review for suspicious patterns

### 4. Performance Optimization

**Caching Strategy**
- Cart data: Cache in Redis (fast access)
- Product details: Cache for 5 minutes
- Watermarked files: Cache for 24 hours
- Library: No cache (real-time)

**Database Indexing**
- Index on: user_id, seller_id, order status, created_at
- Composite indexes for common queries
- Partition orders by date (future scalability)

**Download Optimization**
- Generate watermarks asynchronously
- Queue system for large files
- Progress bar for UX
- CDN for static assets

### 5. Testing Strategy

**Unit Tests**
- Cart operations (add, remove, move)
- Order creation and status transitions
- Commission calculations
- Refund eligibility logic

**Integration Tests**
- GCash payment flow (sandbox)
- Maya payment flow (sandbox)
- Email sending
- Download generation and watermarking

**E2E Tests**
- Complete purchase flow (add to cart → checkout → payment → download)
- Refund request flow
- Withdrawal flow
- Admin refund resolution

**Load Testing**
- Simulate 100 concurrent checkouts
- Test download server load
- Email queue performance
- Database query performance

### 6. Monitoring & Analytics

**Key Metrics to Track**
- Cart abandonment rate
- Checkout completion rate
- Payment success rate
- Average time to purchase
- Refund rate
- Download count per product
- Withdrawal frequency and amount

**Error Tracking**
- Payment failures (by reason)
- Download failures
- Email delivery failures
- Webhook processing errors
- Watermarking failures

**User Behavior**
- Most abandoned cart items
- Most purchased items
- Average cart value
- Payment method split (GCash vs Maya)
- Mobile vs desktop purchases

### 7. Dependencies & Libraries

**Payment Integration**
- GCash SDK (if available) or REST API
- Maya SDK (if available) or REST API
- Crypto library for webhook signature verification

**File Processing**
- `pdf-lib` - PDF watermarking
- `docx` - DOCX watermarking
- `PptxGenJS` - PPTX manipulation
- Sharp - Image processing

**Email**
- Resend or SendGrid - Transactional emails
- React Email - Email templates

**Queue System**
- BullMQ or Bull - Job queue for watermarks
- Redis - Queue backend

**Caching**
- Redis - Cart caching, file caching
- React Query - Client-side caching

---

## Implementation Checklist

### Phase 1: Foundation
- [ ] Create `cart_items` and `wishlist` tables
- [ ] Build cart page UI
- [ ] Build wishlist page UI
- [ ] Implement cart API endpoints (add, remove, list)
- [ ] Implement wishlist API endpoints
- [ ] Add "Buy Now" button to product pages
- [ ] Test cart and wishlist functionality

### Phase 2: Checkout
- [ ] Build checkout page (multi-step)
- [ ] Implement order creation API
- [ ] Apply for GCash developer account
- [ ] Apply for Maya business account
- [ ] Implement GCash payment integration (sandbox)
- [ ] Implement Maya payment integration (sandbox)
- [ ] Build payment webhook endpoints
- [ ] Test payment flows end-to-end

### Phase 3: Fulfillment
- [ ] Build thank you page
- [ ] Implement order confirmation email
- [ ] Build user library page
- [ ] Implement download endpoint
- [ ] Implement watermarking for PDFs
- [ ] Implement watermarking for DOCX
- [ ] Implement watermarking for PPTX
- [ ] Build download progress UI
- [ ] Test download and watermarking

### Phase 4: Seller Experience
- [ ] Build seller orders dashboard
- [ ] Build seller earnings dashboard
- [ ] Implement withdrawal request API
- [ ] Implement GCash/Maya disbursement integration
- [ ] Build new sale notification (email + in-app)
- [ ] Test withdrawal flow

### Phase 5: Refunds & Support
- [ ] Build refund request UI
- [ ] Implement refund request API
- [ ] Implement refund processing (GCash/Maya)
- [ ] Build seller refund response UI
- [ ] Implement escalation to platform
- [ ] Build admin refund resolution UI
- [ ] Test refund flow end-to-end

### Phase 6: Polish
- [ ] Implement abandoned cart tracking
- [ ] Build abandoned cart email
- [ ] Add download count tracking
- [ ] Build seller analytics (basic)
- [ ] Mobile optimization testing
- [ ] Load testing
- [ ] Security audit
- [ ] Performance optimization

---

## Success Metrics

### Pre-Launch Targets

**Functional Requirements**
- ✓ All payment tests pass (sandbox)
- ✓ Download and watermarking working
- ✓ Email delivery working
- ✓ Refund flow tested
- ✓ Mobile checkout tested

**Performance Requirements**
- Page load < 2 seconds
- Checkout flow < 3 clicks from cart
- Payment processing < 30 seconds
- Download preparation < 10 seconds (typical)

### Post-Launch Metrics

**Week 1 Targets**
- Cart-to-checkout conversion: >60%
- Checkout-to-payment conversion: >80%
- Payment success rate: >95%
- Abandoned cart recovery: >10% (via email)
- Refund rate: <2%

**Month 1 Targets**
- Average order value: ₱150+
- Repeat purchase rate: >15%
- Seller satisfaction: >4.0/5.0
- Buyer satisfaction: >4.0/5.0
- Payment processing time: <24 hours for withdrawals

---

## Next Steps

1. **Create Implementation Plan**
   - Break down into development tasks
   - Estimate effort for each task
   - Assign priorities

2. **Apply for Payment APIs**
   - GCash developer account application
   - Maya business account application
   - Sandbox access for testing

3. **Set Up Email Service**
   - Choose email provider (Resend/SendGrid)
   - Configure DNS records
   - Create email templates

4. **Begin Development**
   - Start with Phase 1: Foundation
   - Build cart and wishlist
   - Test thoroughly before moving to payments

---

**Document Status:** ✅ Design Complete
**Last Updated:** January 11, 2026
**Version:** 1.0
**Next Document:** Feature 05 brainstorming session

---

*This document contains the complete design specification for Feature 04: Shopping Cart & Checkout Flow. All major decisions have been documented and are ready for implementation.*
