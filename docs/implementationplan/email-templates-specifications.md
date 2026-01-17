# Email Templates - Complete Specifications (All 26 Types)

**Project:** AKOMAYLESSONPLANNA - Filipino Teacher Lesson Plan Marketplace
**Date:** January 13, 2026
**Total Email Types:** 26

---

## Table of Contents

1. [Authentication Emails (4)](#authentication-emails)
2. [Product Management Emails (5)](#product-management-emails)
3. [Shopping Cart & Checkout Emails (6)](#shopping-cart--checkout-emails)
4. [Reviews & Ratings Emails (3)](#reviews--ratings-emails)
5. [Social Features Emails (5)](#social-features-emails)
6. [Admin Panel Emails (3)](#admin-panel-emails)

---

## Authentication Emails

### Email 1: Welcome Email

**Email Type ID:** `auth_welcome`

**Category:** Transactional

**MVP Priority:** Supabase Auth (Built-in)

**Priority:** 5 (Normal)

**Send Timing:** Immediate

**Subject Line:**
```
Welcome to AKOMAYLESSONPLANNA! 🎓
```

**Preheader:**
```
Your journey to quality educational resources starts here
```

**Email Content:**
```html
Hi {{user_name}} 👋,

Welcome to AKOMAYLESSONPLANNA! We're thrilled to have you join our community of Filipino educators.

You now have access to:
• Thousands of quality lesson plans and resources
• Materials created by verified Filipino teachers
• Instant digital delivery after purchase

[Explore the Marketplace]

Quick Links:
• [Browse Products]
• [Become a Seller](link to become seller)
• [Complete Your Profile]

If you have any questions, reply to this email. We're here to help!

Happy teaching,
The AKOMAYLESSONPLANNA Team

P.S. Follow us on Facebook for tips and updates!
```

**Variables:**
- Required: `user_name`, `platform_name`
- Optional: None

**Trigger:**
User completes signup (email/password or OAuth)

**Target Audience:**
All new users (buyers and sellers)

---

### Email 2: Email Verification (Sellers)

**Email Type ID:** `auth_email_verification`

**Category:** Transactional

**MVP Priority:** Critical

**Priority:** 3 (High - blocking seller actions)

**Send Timing:** Immediate

**Subject Line:**
```
Verify your email to start selling
```

**Preheader:**
```
One click to confirm your email address
```

**Email Content:**
```html
Hi {{user_name}},

You're almost ready to start selling! Please verify your email address by clicking the button below.

[Verify Email]

This link expires in 24 hours.

If you didn't request this, you can safely ignore this email.

Why verify?
• Upload your educational resources
• Start earning from your materials
• Join our community of teacher-entrepreneurs

Questions? Contact us anytime.

— The AKOMAYLESSONPLANNA Team
```

**Variables:**
- Required: `user_name`, `verification_link`, `expires_in`
- Optional: None

**Trigger:**
- User clicks "Become a Seller" OR
- Seller tries to upload first product (if not verified)

**Target Audience:**
Sellers only (before uploading)

---

### Email 3: Password Reset Request

**Email Type ID:** `auth_password_reset`

**Category:** Transactional

**MVP Priority:** Critical

**Priority:** 2 (Urgent - security)

**Send Timing:** Immediate

**Subject Line:**
```
Reset your password
```

**Preheader:**
```
We received a request to reset your password
```

**Email Content:**
```html
Hi {{user_name}},

We received a request to reset your password. Click the button below to create a new password:

[Reset Password]

This link expires in 1 hour.

If you didn't request this, please ignore this email or contact us if you have concerns.

Your password won't change until you access the link above and create a new one.

For security, this request was made from:
IP: {{ip_address}}
Location: {{location}}
Time: {{request_time}}

— The AKOMAYLESSONPLANNA Team
```

**Variables:**
- Required: `user_name`, `reset_link`, `ip_address`, `request_time`
- Optional: `location`

**Trigger:**
User clicks "Forgot Password" on login page

**Target Audience:**
All users (buyers, sellers, admins)

---

### Email 4: Password Reset Confirmation

**Email Type ID:** `auth_password_reset_confirmation`

**Category:** Transactional

**MVP Priority:** Critical

**Priority:** 2 (Urgent - security)

**Send Timing:** Immediate

**Subject Line:**
```
Your password has been changed
```

**Preheader:**
```
Your account security has been updated
```

**Email Content:**
```html
Hi {{user_name}},

Your password was successfully changed.

If you didn't make this change, please contact us immediately at support@akomaylessonplanna.com.

For your security:
• Use a unique password you don't use elsewhere
• Never share your password with anyone
• AKOMAYLESSONPLANNA staff will never ask for your password

Changed at: {{reset_time}}
IP Address: {{ip_address}}

[Secure Account Tips]

— The AKOMAYLESSONPLANNA Team
```

**Variables:**
- Required: `user_name`, `reset_time`, `ip_address`
- Optional: None

**Trigger:**
User successfully resets password

**Target Audience:**
All users

---

## Product Management Emails

### Email 5: Product Submitted for Review

**Email Type ID:** `product_submitted`

**Category:** Selling Notifications

**MVP Priority:** Important

**Priority:** 5 (Normal)

**Send Timing:** Immediate

**Subject Line:**
```
Your product is under review 📋
```

**Preheader:**
```
We'll review your submission within 24-48 hours
```

**Email Content:**
```html
Hi {{user_name}},

Great news! Your product has been submitted for review.

[Product Preview]
{{product_cover_image}}
{{product_title}}

What happens next:
1. Our team reviews your product (24-48 hours)
2. You'll receive an email notification
3. Once approved, your product goes live!

Review status:
• Submitted: {{submitted_date}}
• Queue position: {{queue_position}}
• Estimated review time: {{estimated_time}}

While you wait:
• [Upload more products]
• [Complete your profile]
• [Read seller tips]

Questions? Check our [Seller Guidelines].

— The AKOMAYLESSONPLANNA Team
```

**Variables:**
- Required: `user_name`, `product_title`, `product_cover_image`, `submitted_date`
- Optional: `queue_position`, `estimated_time`

**Trigger:**
Seller submits product (first 3 products require review)

**Target Audience:**
Sellers (first 3 products only)

---

### Email 6: Product Approved

**Email Type ID:** `product_approved`

**Category:** Selling Notifications

**MVP Priority:** Critical

**Priority:** 3 (High - exciting news)

**Send Timing:** Immediate

**Subject Line:**
```
Your product was approved! 🎉
```

**Preheader:**
```
Great news! Your product is now live on the marketplace
```

**Email Content:**
```html
Hi {{user_name}},

Great news! Your product has been approved and is now live on the marketplace.

[Product Preview]
{{product_cover_image}}
{{product_title}}
{{product_price}}

[View Product on Marketplace]

Tips for your first sale:
• Share to Facebook teacher groups
• Pin to your seller profile
• Set competitive pricing (₱50-₱500)
• Add detailed descriptions

Your product is now visible to thousands of Filipino teachers!

Track your product's performance in your [Seller Dashboard].

Good luck! 🍀

— The AKOMAYLESSONPLANNA Team
```

**Variables:**
- Required: `user_name`, `product_title`, `product_cover_image`, `product_price`, `product_url`
- Optional: None

**Trigger:**
Admin approves product (from pending review)

**Target Audience:**
Sellers

---

### Email 7: Product Rejected

**Email Type ID:** `product_rejected`

**Category:** Selling Notifications

**MVP Priority:** Critical

**Priority:** 3 (High - requires action)

**Send Timing:** Immediate

**Subject Line:**
```
Action needed: Your product needs changes
```

**Preheader:**
```
Your product submission requires some updates
```

**Email Content:**
```html
Hi {{user_name}},

Your product submission needs some changes before it can be approved.

[Product Preview]
{{product_cover_image}}
{{product_title}}

Reason for rejection:
{{rejection_reason}}

Please update your product and resubmit for review. You can resubmit unlimited times.

[Edit Product]

Common issues:
• Preview images don't match the file content
• Description needs more detail
• Missing grade level or subject
• Inappropriate pricing
• Quality concerns

Need help? Check our [Quality Guidelines] or [Contact Us].

Don't give up! Most approved products succeed on the second try.

— The AKOMAYLESSONPLANNA Team
```

**Variables:**
- Required: `user_name`, `product_title`, `product_cover_image`, `rejection_reason`
- Optional: `quality_guidelines_link`

**Trigger:**
Admin rejects product (from pending review)

**Target Audience:**
Sellers

---

### Email 8: Product Version Update

**Email Type ID:** `product_version_update`

**Category:** Buying Notifications

**MVP Priority:** Important

**Priority:** 5 (Normal)

**Send Timing:** Immediate

**Subject Line:**
```
A product you purchased has been updated 📝
```

**Preheader:**
```
{{product_title}} has a new version available
```

**Email Content:**
```html
Hi {{user_name}},

Good news! A product you purchased has been updated by the seller.

[Product Preview]
{{product_cover_image}}
{{product_title}}

What's new in version {{version_number}}:
{{changelog}}

[Download Updated Version]
[View All Your Purchases]

Your previous version ({{previous_version}}) is still available in your library.

You now have access to the latest version with all improvements and fixes!

Happy teaching,
The AKOMAYLESSONPLANNA Team

P.S. Enjoying this resource? Leave a [review] to help other teachers!
```

**Variables:**
- Required: `user_name`, `product_title`, `product_cover_image`, `version_number`, `changelog`, `previous_version`, `product_url`
- Optional: None

**Trigger:**
Seller updates product (creates new version)
Sent to ALL previous buyers

**Target Audience:**
Buyers who previously purchased

---

### Email 9: Product Suspended

**Email Type ID:** `product_suspended`

**Category:** Selling Notifications

**MVP Priority:** Important

**Priority:** 2 (Urgent - requires action)

**Send Timing:** Immediate

**Subject Line:**
```
⚠️ Your product has been suspended
```

**Preheader:**
```
Your product {{product_title}} has been temporarily taken down
```

**Email Content:**
```html
Hi {{user_name}},

Your product has been temporarily suspended from the marketplace.

[Product Preview]
{{product_cover_image}}
{{product_title}}

Reason for suspension:
{{suspension_reason}}

What this means:
• Your product is not visible to buyers
• You cannot sell this product until resolved
• Your other products remain active

Next steps:
1. Review the suspension reason above
2. Make necessary changes
3. Contact us to appeal this decision

[Appeal This Decision]
[Contact Support]

You have the right to appeal within 7 days. A different admin will review your case.

— The AKOMAYLESSONPLANNA Team
```

**Variables:**
- Required: `user_name`, `product_title`, `product_cover_image`, `suspension_reason`
- Optional: `appeal_link`

**Trigger:**
Admin suspends product (policy violation, quality issue, etc.)

**Target Audience:**
Sellers

---

## Shopping Cart & Checkout Emails

### Email 10: Cart Abandonment Reminder

**Email Type ID:** `cart_abandonment`

**Category:** Buying Notifications

**MVP Priority:** Important

**Priority:** 5 (Normal)

**Send Timing:** 24 hours after cart created

**Subject Line:**
```
You left items in your cart! 💭
```

**Preheader:**
```
Your cart is waiting for you
```

**Email Content:**
```html
Hi {{user_name}},

You left some great resources in your cart! Don't miss out.

[Your Cart Items]
{{cart_items_preview}}

Total: {{cart_total}}

[Complete Your Purchase]

These resources are ready to download instantly after purchase.

Need help? We're here for you!

— The AKOMAYLESSONPLANNA Team

P.S. Items in your cart are reserved but may sell out. Complete your purchase soon!
```

**Variables:**
- Required: `user_name`, `cart_total`, `cart_items_preview`, `cart_link`
- Optional: None

**Trigger:**
Items in cart for 24 hours without checkout
Send only ONCE per cart (don't spam)

**Target Audience:**
Buyers who abandoned cart

---

### Email 11: Order Confirmation

**Email Type ID:** `order_confirmation`

**Category:** Transactional

**MVP Priority:** Critical

**Priority:** 2 (Urgent - receipt + delivery)

**Send Timing:** Immediate

**Subject Line:**
```
Order Confirmation - Your AKOMAYLESSONPLANNA Purchase
```

**Preheader:**
```
Thank you for your order! Your files are ready
```

**Email Content:**
```html
Hi {{user_name}},

Thank you for your purchase! Your order has been confirmed.

Order Details:
• Order ID: {{order_id}}
• Order Date: {{order_date}}
• Payment Method: {{payment_method}}

[Items Purchased]
{{order_items_list}}

Total Paid: {{order_total}}

[Download Your Files Now]
[View Order Details]

Your files are ready for immediate download! You can download them anytime from your [Library].

Important:
• Download links expire in 24 hours (but you can always re-download from your library)
• Files are watermarked with your email for security
• All sales are final (see our Refund Policy)

Questions? Reply to this email. We're happy to help!

Happy teaching,
The AKOMAYLESSONPLANNA Team
```

**Variables:**
- Required: `user_name`, `order_id`, `order_date`, `payment_method`, `order_items_list`, `order_total`, `download_link`, `order_url`
- Optional: None

**Trigger:**
Payment completed successfully (GCash/Maya webhook)

**Target Audience:**
Buyers

---

### Email 12: Payment Successful

**Email Type ID:** `payment_successful`

**Category:** Transactional

**MVP Priority:** Critical

**Priority:** 2 (Urgent - confirmation)

**Send Timing:** Immediate

**Subject Line:**
```
✅ Payment successful! Your order is complete
```

**Preheader:**
```
Great news! Your payment was processed successfully
```

**Email Content:**
```html
Hi {{user_name}},

Great news! Your payment was successful and your order is complete.

Payment Details:
• Order ID: {{order_id}}
• Amount Paid: {{order_total}}
• Payment Method: {{payment_method}}
• Transaction ID: {{transaction_id}}
• Payment Date: {{payment_date}}

[Download Your Files]

Your purchased files are ready for immediate download!

What's Next:
1. Download your files (unlimited downloads, always available)
2. Leave a review after using the materials (24h reminder coming)
3. Explore more resources from the same seller

[Go to My Library]
[Rate Your Purchase]

Thank you for supporting Filipino teachers!

— The AKOMAYLESSONPLANNA Team
```

**Variables:**
- Required: `user_name`, `order_id`, `order_total`, `payment_method`, `transaction_id`, `payment_date`, `download_link`, `library_link`
- Optional: None

**Trigger:**
Payment webhook confirms success (GCash/Maya)

**Target Audience:**
Buyers

---

### Email 13: Payment Failed

**Email Type ID:** `payment_failed`

**Category:** Transactional

**MVP Priority:** Critical

**Priority:** 4 (High - blocking purchase)

**Send Timing:** Immediate

**Subject Line:**
```
⚠️ Payment not completed
```

**Preheader:**
```
Your cart is waiting - complete your purchase
```

**Email Content:**
```html
Hi {{user_name}},

We couldn't complete your payment. Don't worry, your cart is saved!

Order Details:
• Order ID: {{order_id}}
• Amount: {{order_total}}
• Payment Method: {{payment_method}}

What happened:
{{failure_reason}}

[Complete Your Purchase]

Your cart items are reserved. You can:
• Try payment again (unlimited retries)
• Change payment method (GCash or Maya)
• Remove items from cart

Common issues:
• Insufficient funds in e-wallet
• Expired payment session (15-minute timeout)
• Network connection error

Need help? Contact us at support@akomaylessonplanna.com

— The AKOMAYLESSONPLANNA Team
```

**Variables:**
- Required: `user_name`, `order_id`, `order_total`, `payment_method`, `failure_reason`, `checkout_link`
- Optional: None

**Trigger:**
Payment webhook returns failure/timeout

**Target Audience:**
Buyers with failed payments

---

### Email 14: Download Ready

**Email Type ID:** `download_ready`

**Category:** Transactional

**MVP Priority:** Important

**Priority:** 3 (High - delivery)

**Send Timing:** Immediate

**Subject Line:**
```
📥 Your files are ready for download!
```

**Preheader:**
```
Your purchased resources are ready to use
```

**Email Content:**
```html
Hi {{user_name}},

Great news! Your files are ready for download.

[Purchased Items]
{{order_items_list}}

[Download All Files]
[Download Individually]

Download Links:
{{download_links_list}}

Important Notes:
• Files are watermarked with your email ({{user_email}})
• You can download unlimited times
• Links expire in 24 hours, but files remain in your [Library]

File Details:
{{file_details}}

Need help downloading?
[View Download Guide]
[Contact Support]

Happy teaching!
The AKOMAYLESSONPLANNA Team

P.S. Love your purchase? Leave a review to help other teachers!
```

**Variables:**
- Required: `user_name`, `user_email`, `order_items_list`, `download_links_list`, `file_details`, `library_link`
- Optional: `download_guide_link`

**Trigger:**
Payment confirmed + files ready for download
Usually combined with Order Confirmation

**Target Audience:**
Buyers

---

### Email 15: Refund Approved/Processed

**Email Type ID:** `refund_processed`

**Category:** Transactional

**MVP Priority:** Important

**Priority:** 3 (High - financial)

**Send Timing:** Immediate

**Subject Line:**
```
💸 Your refund has been processed
```

**Preheader:**
```
Refund for order {{order_id}} is on its way
```

**Email Content:**
```html
Hi {{user_name}},

Your refund has been processed successfully.

Refund Details:
• Order ID: {{order_id}}
• Refund Amount: {{refund_amount}}
• Refund Date: {{refund_date}}
• Refund Method: {{payment_method}} (original payment method)
• Transaction ID: {{refund_transaction_id}}

The refund will appear in your {{payment_method}} account within 1-3 business days.

Product Details:
• Product: {{product_title}}
• Refund Reason: {{refund_reason}}

What happens next:
• Your access to this product has been revoked
• You can no longer download this file
• Your library has been updated accordingly

Questions about your refund?
[View Refund Status]
[Contact Support]

We're sorry this purchase didn't work out. We hope to serve you better in the future!

— The AKOMAYLESSONPLANNA Team
```

**Variables:**
- Required: `user_name`, `order_id`, `refund_amount`, `refund_date`, `payment_method`, `refund_transaction_id`, `product_title`, `refund_reason`
- Optional: `refund_status_link`

**Trigger:**
Admin approves refund request OR Seller approves refund request

**Target Audience:**
Buyers who received refunds

---

## Reviews & Ratings Emails

### Email 16: Review Reminder

**Email Type ID:** `review_reminder`

**Category:** Buying Notifications

**MVP Priority:** Important

**Priority:** 5 (Normal)

**Send Timing:** 24 hours after download

**Subject Line:**
```
How was your experience? Leave a review ⭐
```

**Preheader:**
```
Share your thoughts with other teachers
```

**Email Content:**
```html
Hi {{user_name}},

It's been 24 hours since you purchased {{product_title}}. How's it going?

Your honest feedback helps other Filipino teachers decide what to buy.

[Product Preview]
{{product_cover_image}}
{{product_title}}

[Leave a Review]

Why review matters:
• Helps other teachers make informed decisions
• Rewards sellers for quality work
• Builds our community

Quick tips for a great review:
• Be specific about what you liked
• Mention how you used it in class
• Keep it respectful and constructive

[Leave Review Now]
[Maybe Later]

You'll receive this reminder only once. We value your time!

— The AKOMAYLESSONPLANNA Team
```

**Variables:**
- Required: `user_name`, `product_title`, `product_cover_image`, `product_url`, `time_since_purchase`
- Optional: None

**Trigger:**
24 hours after successful download
Send only ONCE (don't spam)

**Target Audience:**
Buyers (after download)

---

### Email 17: Review Response Notification

**Email Type ID:** `review_response`

**Category:** Buying Notifications

**MVP Priority:** Nice-to-have (Post-Launch)

**Priority:** 5 (Normal)

**Send Timing:** Immediate

**Subject Line:**
```
{{seller_name}} responded to your review 💬
```

**Preheader:**
```
You have a new response to your review
```

**Email Content:**
```html
Hi {{user_name}},

Good news! {{seller_name}} responded to your review.

[Your Review]
⭐⭐⭐⭐⭐
{{review_comment}}
Your review on {{review_date}}

[Seller's Response]
{{seller_response}}
Response posted {{response_date}}

[View Full Discussion]
[Continue the Conversation]

Thank you for taking the time to review! Your feedback helps our community grow.

— The AKOMAYLESSONPLANNA Team
```

**Variables:**
- Required: `user_name`, `seller_name`, `review_comment`, `review_date`, `seller_response`, `response_date`, `product_url`
- Optional: None

**Trigger:**
Seller responds to buyer's review

**Target Audience:**
Buyers who left reviews

---

### Email 18: Review Flagged Notification

**Email Type ID:** `review_flagged`

**Category:** Transactional (content moderation)

**MVP Priority:** Important

**Priority:** 4 (High - content removed)

**Send Timing:** Immediate

**Subject Line:**
```
⚠️ Your review was flagged for moderation
```

**Preheader:**
```
Your review on {{product_title}} has been temporarily hidden
```

**Email Content:**
```html
Hi {{user_name}},

Your review on {{product_title}} has been flagged for moderation.

[Your Review]
{{review_comment}}
Posted on: {{review_date}}

Why it was flagged:
{{flag_reason}}

What happens next:
• Your review is temporarily hidden
• Our team will review it within 24 hours
• You'll receive an update after review

If this was a mistake, don't worry! Our team will restore your review.

Need to clarify something?
[Contact Support]
[Review our Community Guidelines]

We appreciate your understanding as we maintain a respectful community.

— The AKOMAYLESSONPLANNA Team
```

**Variables:**
- Required: `user_name`, `product_title`, `review_comment`, `review_date`, `flag_reason`
- Optional: `community_guidelines_link`

**Trigger:**
Review automatically flagged (profanity filter, spam patterns) OR
Admin manually flags review

**Target Audience:**
Buyers/sellers who wrote flagged reviews

---

## Social Features Emails

### Email 19: New Sale Notification

**Email Type ID:** `new_sale`

**Category:** Selling Notifications

**MVP Priority:** Critical

**Priority:** 3 (High - exciting news!)

**Send Timing:** Immediate

**Subject Line:**
```
You made a sale! 🎉 ₱{{earnings_amount}}
```

**Preheader:**
```
Congratulations! Your product just sold
```

**Email Content:**
```html
Hi {{seller_name}},

Great news! You just made a sale! 🎉

[Product Preview]
{{product_cover_image}}
{{product_title}}

Sale Details:
• Sold to: Teacher {{buyer_name}}
• Sale Amount: ₱{{sale_amount}}
• Commission ({{commission_rate}}%): ₱{{commission_amount}}
• Your Earnings: ₱{{net_earnings}}

[View Order Details]
[View Your Products]

This sale will be available for withdrawal once the buyer downloads the file.

Keep up the great work! Your teaching materials are making a difference.

💡 Tip: Upload more products to increase your sales!

— The AKOMAYLESSONPLANNA Team
```

**Variables:**
- Required: `seller_name`, `product_title`, `product_cover_image`, `buyer_name`, `sale_amount`, `commission_rate`, `commission_amount`, `net_earnings`, `order_url`, `products_url`
- Optional: None

**Trigger:**
Payment webhook confirms successful payment
Order marked as "completed"

**Target Audience:**
Sellers

---

### Email 20: New Review Notification

**Email Type ID:** `new_review`

**Category:** Selling Notifications

**MVP Priority:** Important

**Priority:** 5 (Normal)

**Send Timing:** Immediate

**Subject Line:**
```
New review on {{product_title}} ⭐
```

**Preheader:**
```
Someone just reviewed your product!
```

**Email Content:**
```html
Hi {{seller_name}},

Someone just reviewed your product!

[Product Preview]
{{product_cover_image}}
{{product_title}}

[The Review]
⭐⭐⭐⭐⭐ {{rating}}/5
"{{review_comment}}"
- Teacher {{reviewer_name}}
Posted {{review_date}}

[View Review & Respond]

What's your seller rating?
Your average rating: {{seller_rating}} ⭐ ({{total_reviews}} reviews)

Keep creating amazing content! The community loves your work.

💡 Tip: Respond to reviews to build trust with buyers!

— The AKOMAYLESSONPLANNA Team
```

**Variables:**
- Required: `seller_name`, `product_title`, `product_cover_image`, `rating`, `review_comment`, `reviewer_name`, `review_date`, `product_url`, `seller_rating`, `total_reviews`
- Optional: None

**Trigger:**
Buyer submits review (after download)

**Target Audience:**
Sellers

---

### Email 21: New Follower Notification

**Email Type ID:** `new_follower`

**Category:** Social Notifications

**MVP Priority:** Nice-to-have (Post-Launch)

**Priority:** 7 (Low - not urgent)

**Send Timing:** Immediate (or batch hourly)

**Subject Line:**
```
{{follower_name}} started following you 👋
```

**Preheader:**
```
You have a new follower on AKOMAYLESSONPLANNA
```

**Email Content:**
```html
Hi {{seller_name}},

Great news! {{follower_name}} started following you.

[Follower Profile]
{{follower_avatar}}
{{follower_name}}
{{follower_bio}}

They'll be notified when you upload new products.

[View Their Profile]
[See All Your Followers]

Your follower count: {{total_followers}} teachers

💡 Tip: Engage with followers by sharing updates and responding to questions!

— The AKOMAYLESSONPLANNA Team
```

**Variables:**
- Required: `seller_name`, `follower_name`, `follower_avatar`, `follower_bio`, `follower_profile_url`, `total_followers`, `followers_url`
- Optional: None

**Trigger:**
User clicks "Follow" on seller profile

**Target Audience:**
Sellers

---

### Email 22: Price Drop Notification

**Email Type ID:** `price_drop`

**Category:** Buying Notifications

**MVP Priority:** Nice-to-have (Post-Launch)

**Priority:** 5 (Normal)

**Send Timing:** Immediate (or batch hourly if many drops)

**Subject Line:**
```
Price drop! {{product_title}} is now ₱{{new_price}}
```

**Preheader:**
```
A product in your wishlist just dropped in price
```

**Email Content:**
```html
Hi {{user_name}},

A product in your wishlist just dropped in price!

[Product Preview]
{{product_cover_image}}
{{product_title}}

Was: ₱{{old_price}}
Now: ₱{{new_price}}
You save: ₱{{savings_amount}} 💰

[View Product]
[Add to Cart]
[Remove from Wishlist]

This offer won't last long! Prices can change anytime.

Happy shopping,
The AKOMAYLESSONPLANNA Team

P.S. Follow {{seller_name}} for more great resources!
```

**Variables:**
- Required: `user_name`, `product_title`, `product_cover_image`, `old_price`, `new_price`, `savings_amount`, `product_url`, `seller_name`
- Optional: None

**Trigger:**
Seller lowers price on product
Sent to ALL users who have this product in wishlist

**Target Audience:**
Buyers (wishlisted items)

---

### Email 23: New Product from Followed Seller

**Email Type ID:** `new_product_followed_seller`

**Category:** Social Notifications

**MVP Priority:** Nice-to-have (Post-Launch)

**Priority:** 7 (Low - informational)

**Send Timing:** Immediate (or batch hourly)

**Subject Line:**
```
New from {{seller_name}}: {{product_title}}
```

**Preheader:**
```
A seller you follow just uploaded a new product
```

**Email Content:**
```html
Hi {{user_name}},

{{seller_name}} just uploaded a new product!

[Product Preview]
{{product_cover_image}}
{{product_title}}
{{product_description}}
₱{{product_price}}

[View Product]
[Add to Wishlist]

See more from {{seller_name}}:
[View All Their Products]

You're following {{total_following}} sellers.

— The AKOMAYLESSONPLANNA Team
```

**Variables:**
- Required: `user_name`, `seller_name`, `product_title`, `product_cover_image`, `product_description`, `product_price`, `product_url`, `seller_products_url`, `total_following`
- Optional: None

**Trigger:**
Seller publishes new product
Sent to ALL followers

**Target Audience:**
Buyers who follow the seller

---

## Admin Panel Emails

### Email 24: Teacher Verification Approved

**Email Type ID:** `verification_approved`

**Category:** Transactional

**MVP Priority:** Critical

**Priority:** 3 (High - unlocks features)

**Send Timing:** Immediate

**Subject Line:**
```
✅ You're now a verified seller! 🎓
```

**Preheader:**
```
Your teacher verification has been approved
```

**Email Content:**
```html
Hi {{user_name}},

Congratulations! Your teacher verification has been approved.

You are now a verified seller on AKOMAYLESSONPLANNA!

[Verified Teacher Badge]
✅ Verified Teacher

What you can do now:
• Upload unlimited products
• Start selling immediately
• Earn 80% of each sale (20% platform commission)
• Access seller dashboard and analytics

[Upload Your First Product]
[Go to Seller Dashboard]

Your Details:
• PRC License: {{prc_license_number}}
• License Expiry: {{prc_license_expiry}}
• Verified Date: {{verification_date}}

Remember to renew your license before it expires to maintain your verified status.

Welcome to our community of teacher-entrepreneurs! 🎉

— The AKOMAYLESSONPLANNA Team
```

**Variables:**
- Required: `user_name`, `prc_license_number`, `prc_license_expiry`, `verification_date`, `upload_link`, `dashboard_link`
- Optional: None

**Trigger:**
Admin approves teacher verification

**Target Audience:**
Sellers (teacher verification)

---

### Email 25: Teacher Verification Rejected

**Email Type ID:** `verification_rejected`

**Category:** Transactional

**MVP Priority:** Critical

**Priority:** 3 (High - blocks selling)

**Send Timing:** Immediate

**Subject Line:**
```
⚠️ Your teacher verification needs updates
```

**Preheader:**
```
We couldn't verify your teacher ID
```

**Email Content:**
```html
Hi {{user_name}},

We couldn't verify your teacher ID. Please review the information below and resubmit.

Rejection Reason:
{{rejection_reason}}

Common issues:
• PRC License image is unclear or incomplete
• License number doesn't match document
• License has expired (must be valid)
• Document is not a PRC License (we only accept PRC)

Please resubmit with:
• Clear photo/scan of your PRC License
• Correct license number
• Valid license (not expired)

[Resubmit Verification]

You have unlimited resubmission attempts. Don't give up!

Questions? Check our [Verification Guide] or [Contact Support].

— The AKOMAYLESSONPLANNA Team
```

**Variables:**
- Required: `user_name`, `rejection_reason`, `resubmit_link`
- Optional: `verification_guide_link`

**Trigger:**
Admin rejects teacher verification

**Target Audience:**
Sellers (teacher verification)

---

### Email 26: Account Ban Notification

**Email Type ID:** `account_banned`

**Category:** Transactional

**MVP Priority:** Important

**Priority:** 1 (Critical - account disabled)

**Send Timing:** Immediate

**Subject Line:**
```
⚠️ Your account has been suspended
```

**Preheader:**
```
Your account has been temporarily suspended
```

**Email Content:**
```html
Hi {{user_name}},

Your account has been suspended due to a violation of our Terms of Service.

Suspension Reason:
{{ban_reason}}

What this means:
• Your account is temporarily suspended
• You cannot login or access the platform
• Your products are not visible to buyers
• Pending earnings are on hold

Appeal Process:
You have the right to appeal this decision within 7 days.

To appeal:
1. Review our Terms of Service
2. Send your appeal to appeals@akomaylessonplanna.com
3. Include your username and appeal reason
4. A different admin will review your case

Appeal Deadline: {{appeal_deadline}}

[Read Terms of Service]
[Contact Appeals]

We take platform safety seriously and appreciate your understanding.

— The AKOMAYLESSONPLANNA Team
```

**Variables:**
- Required: `user_name`, `ban_reason`, `appeal_deadline`, `terms_link`, `appeals_email`
- Optional: None

**Trigger:**
Admin bans user (severe violations)

**Target Audience:**
All user types (buyers, sellers, admins)

---

## Summary Table: All 26 Email Types

| # | Email Type ID | Subject Keywords | Category | Priority | MVP Priority | Send Timing |
|---|---------------|------------------|----------|----------|--------------|-------------|
| 1 | auth_welcome | Welcome | Transactional | 5 | Supabase Auth | Immediate |
| 2 | auth_email_verification | Verify email | Transactional | 3 | Critical | Immediate |
| 3 | auth_password_reset | Reset password | Transactional | 2 | Critical | Immediate |
| 4 | auth_password_reset_confirmation | Password changed | Transactional | 2 | Critical | Immediate |
| 5 | product_submitted | Product under review | Selling | 5 | Important | Immediate |
| 6 | product_approved | Product approved | Selling | 3 | Critical | Immediate |
| 7 | product_rejected | Product needs changes | Selling | 3 | Critical | Immediate |
| 8 | product_version_update | Product updated | Buying | 5 | Important | Immediate |
| 9 | product_suspended | Product suspended | Selling | 2 | Important | Immediate |
| 10 | cart_abandonment | Cart abandoned | Buying | 5 | Important | 24h |
| 11 | order_confirmation | Order confirmed | Transactional | 2 | Critical | Immediate |
| 12 | payment_successful | Payment successful | Transactional | 2 | Critical | Immediate |
| 13 | payment_failed | Payment failed | Transactional | 4 | Critical | Immediate |
| 14 | download_ready | Files ready | Transactional | 3 | Important | Immediate |
| 15 | refund_processed | Refund processed | Transactional | 3 | Important | Immediate |
| 16 | review_reminder | Leave a review | Buying | 5 | Important | 24h |
| 17 | review_response | Seller responded | Buying | 5 | Nice-to-have | Immediate |
| 18 | review_flagged | Review flagged | Transactional | 4 | Important | Immediate |
| 19 | new_sale | You made a sale | Selling | 3 | Critical | Immediate |
| 20 | new_review | New review | Selling | 5 | Important | Immediate |
| 21 | new_follower | New follower | Social | 7 | Nice-to-have | Immediate |
| 22 | price_drop | Price drop | Buying | 5 | Nice-to-have | Immediate |
| 23 | new_product_followed_seller | New product | Social | 7 | Nice-to-have | Immediate |
| 24 | verification_approved | Verified seller | Transactional | 3 | Critical | Immediate |
| 25 | verification_rejected | Verification rejected | Transactional | 3 | Critical | Immediate |
| 26 | account_banned | Account suspended | Transactional | 1 | Important | Immediate |

---

**Document Status:** ✅ Complete
**Last Updated:** January 13, 2026
**Total Email Types:** 26

---

*All email templates fully specified with content, variables, triggers, and implementation details.*
