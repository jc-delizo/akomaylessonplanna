# Comprehensive Test Cases for AKOMAYLESSONPLANNA

**Version:** 1.0  
**Date:** January 14, 2026  
**Status:** Ready for Implementation

---

## Table of Contents

1. [Overview](#overview)
2. [Test Categories](#test-categories)
3. [Feature 01: Authentication & User Management](#feature-01-authentication--user-management)
4. [Feature 02: User Profiles & Profile Management](#feature-02-user-profiles--profile-management)
5. [Feature 03: Product Listings & Product Management](#feature-03-product-listings--product-management)
6. [Feature 04: Shopping Cart & Checkout Flow](#feature-04-shopping-cart--checkout-flow)
7. [Feature 05: Reviews & Ratings](#feature-05-reviews--ratings)
8. [Feature 06: Social Features](#feature-06-social-features)
9. [Feature 07: Seller Dashboard & Analytics](#feature-07-seller-dashboard--analytics)
10. [Feature 08: Advanced Search & Discovery](#feature-08-advanced-search--discovery)
11. [Feature 09: Admin Panel & Content Moderation](#feature-09-admin-panel--content-moderation)
12. [Feature 10: Email System](#feature-10-email-system)
13. [Feature 11: Messaging System](#feature-11-messaging-system)
14. [Cross-Feature Integration Tests](#cross-feature-integration-tests)
15. [Performance Test Scenarios](#performance-test-scenarios)
16. [Mobile Test Scenarios](#mobile-test-scenarios)
17. [Accessibility Tests](#accessibility-tests)
18. [Security Test Scenarios](#security-test-scenarios)
19. [Test Data Requirements](#test-data-requirements)
20. [Test Execution Strategy](#test-execution-strategy)
21. [Test Tools & Frameworks](#test-tools--frameworks)
22. [Success Criteria](#success-criteria)

---

## Overview

This document provides comprehensive test cases for the entire AKOMAYLESSONPLANNA platform, covering all 11 features documented in the brainstorming sessions. Test cases are organized by feature and test type (Unit, Integration, E2E, Security, Performance).

### System Overview

AKOMAYLESSONPLANNA is a digital marketplace where Filipino K-12 teachers can buy and sell educational resources including:
- Exams (Periodical Exams, Summative Tests)
- Lesson Plans (DLL, DLP)
- RPMS (Cover pages)
- Posters
- Tarpaulins

### Key User Types

- **Buyers**: Teachers purchasing resources
- **Sellers**: Verified teachers selling resources
- **Pro Sellers**: Subscription tier with enhanced features
- **Pioneer Sellers**: Invite-only tier with 15% commission
- **Admins**: Super Admin, Moderator, Content Manager

---

## Test Categories

### Unit Tests
Individual component/function testing with mocked dependencies.

### Integration Tests
API endpoints, database interactions, external service integrations.

### E2E Tests
Complete user workflows from start to finish.

### Security Tests
Authentication, authorization, data protection, vulnerability testing.

### Performance Tests
Load testing, stress testing, response time validation.

### Mobile Tests
Responsive design, touch interactions, mobile-specific features.

### Accessibility Tests
WCAG 2.1 AA compliance, screen reader compatibility.

---

## Feature 01: Authentication & User Management

### Unit Tests

#### Password Validation - Done
- **TC-01-001**: Password minimum length (8 characters)
- **TC-01-002**: Password complexity requirements
- **TC-01-003**: Password hash generation (bcrypt)
- **TC-01-004**: Password comparison (hashed vs plaintext)

#### Email Validation - Done
- **TC-01-005**: Valid email format acceptance
- **TC-01-006**: Invalid email format rejection
- **TC-01-007**: Email uniqueness check
- **TC-01-008**: Email normalization (lowercase)

#### Username Validation - Done
- **TC-01-009**: Username length (3-20 characters)
- **TC-01-010**: Username format (alphanumeric + underscores)
- **TC-01-011**: Username uniqueness check
- **TC-01-012**: Username generation from email (if not provided)

#### Session Management
- **TC-01-013**: Session token generation
- **TC-01-014**: Session token validation
- **TC-01-015**: Remember me functionality (90-day expiry)
- **TC-01-016**: Browser session expiry (no remember me)
- **TC-01-017**: Session invalidation on logout

#### Rate Limiting
- **TC-01-018**: 5 failed login attempts trigger 30-minute lockout
- **TC-01-019**: Lockout countdown timer display
- **TC-01-020**: Lockout email notification
- **TC-01-021**: Rate limit reset after successful login

#### Teacher Verification
- **TC-01-022**: PRC license number validation
- **TC-01-023**: License expiry date validation
- **TC-01-024**: Grace period calculation (1 month after expiry)
- **TC-01-025**: Verification status transitions

### Integration Tests

#### Authentication (Supabase Client-Side)
**Note**: Authentication uses Supabase client directly, not custom API routes.

- **TC-01-026**: `supabase.auth.signUp()` - Email/password registration
  - Valid signup data → User created, session established
  - Duplicate email → Supabase auth error
  - Invalid email format → Supabase auth error
  - Weak password (< 8 chars) → Validation error

- **TC-01-027**: `supabase.auth.signInWithPassword()` - Email/password login
  - Valid credentials → Session created
  - Invalid email → Supabase auth error
  - Invalid password → Supabase auth error
  - Remember me checked → 90-day session
  - Remember me unchecked → Browser session

- **TC-01-028**: `supabase.auth.signInWithOAuth({ provider: 'google' })` - Google OAuth
  - OAuth callback → User created/logged in via `/auth/callback`
  - Existing user → Login successful
  - Invalid OAuth token → Supabase auth error

- **TC-01-029**: `supabase.auth.signInWithOAuth({ provider: 'facebook' })` - Facebook OAuth
  - OAuth callback → User created/logged in via `/auth/callback`
  - Existing user → Login successful
  - Invalid OAuth token → Supabase auth error

- **TC-01-030**: `supabase.auth.signOut()` - Session termination
  - Valid session → Session cleared, redirect to home
  - No session → Graceful handling

- **TC-01-031**: `supabase.auth.resetPasswordForEmail()` - Password reset request
  - Valid email → Reset email sent via Supabase Auth
  - Invalid email → No error (security - don't reveal if email exists)
  - Rate limiting → Handled by Supabase

- **TC-01-032**: `supabase.auth.updateUser()` - Password reset completion
  - Valid recovery session → Password updated
  - Expired token (1 hour) → Supabase auth error
  - Invalid token → Supabase auth error

#### User Management Endpoints
- **TC-01-033**: POST /api/users/verify-teacher - PRC ID upload
  - Valid PRC document → Verification pending
  - Invalid file type → Error 400
  - File too large → Error 400
  - Already verified → Error 409

- **TC-01-034**: GET /api/users/:id/verification-status - Check status
  - Pending → Status: pending
  - Approved → Status: verified, can_sell: true
  - Rejected → Status: rejected, reason shown

### E2E Tests

#### Signup Flows
- **TC-01-035**: Complete email/password signup
  1. Navigate to signup page
  2. Enter name, email, password
  3. Click "Sign Up"
  4. Verify redirect to onboarding
  5. Verify user created in database
  6. Verify session established

- **TC-01-036**: Complete Google OAuth signup
  1. Click "Sign up with Google"
  2. Complete OAuth flow
  3. Verify user created with Google email
  4. Verify session established

- **TC-01-037**: Complete Facebook OAuth signup
  1. Click "Sign up with Facebook"
  2. Complete OAuth flow
  3. Verify user created with Facebook email
  4. Verify session established

#### Login Flows
- **TC-01-038**: Login with remember me checked
  1. Login with credentials
  2. Check "Remember me"
  3. Close browser
  4. Reopen browser after 24 hours
  5. Verify still logged in
  6. Verify session expires after 90 days

- **TC-01-039**: Login with remember me unchecked
  1. Login with credentials
  2. Don't check "Remember me"
  3. Close browser
  4. Reopen browser
  5. Verify logged out

#### Password Reset Flow - Done
- **TC-01-040**: Complete password reset
  1. Click "Forgot password"
  2. Enter email
  3. Receive reset email
  4. Click reset link
  5. Enter new password
  6. Verify password updated
  7. Login with new password

#### Teacher Verification Flow - Done
- **TC-01-041**: Complete teacher verification
  1. Sign up as buyer
  2. Click "Become a Seller"
  3. Upload PRC ID document
  4. Enter license number and expiry
  5. Submit for review
  6. Admin approves (simulated)
  7. Verify can_sell: true
  8. Verify can upload products

### Security Tests

#### Authentication Security
- **TC-01-042**: SQL injection in login form
  - Input: `admin' OR '1'='1`
  - Expected: Error, no SQL execution

- **TC-01-043**: XSS in signup form
  - Input: `<script>alert('XSS')</script>` in name field
  - Expected: Script sanitized, not executed

- **TC-01-044**: CSRF protection on auth endpoints
  - POST without CSRF token → Error 403
  - POST with valid CSRF token → Success

- **TC-01-045**: Rate limiting enforcement
  - 5 failed login attempts → Account locked
  - 6th attempt → Error 429 (Too Many Requests)

- **TC-01-046**: Session hijacking prevention
  - Session token in URL → Rejected
  - Session token in httpOnly cookie → Accepted

- **TC-01-047**: Password hash verification
  - Verify passwords stored as bcrypt hash
  - Verify plaintext passwords not stored

- **TC-01-048**: OAuth state parameter validation
  - OAuth callback without state → Error 400
  - OAuth callback with mismatched state → Error 400

---

## Feature 02: User Profiles & Profile Management

### Unit Tests

#### Profile Completion Calculator
- **TC-02-001**: Calculate completion percentage
  - All fields filled → 100%
  - Required fields only → 80%
  - Missing required fields → < 80%

#### Username Validation
- **TC-02-002**: Username length validation (3-20 chars)
- **TC-02-003**: Username format (alphanumeric + underscores)
- **TC-02-004**: Username uniqueness check

#### Bio Validation
- **TC-02-005**: Bio character limit (500 chars)
- **TC-02-006**: Bio line breaks support
- **TC-02-007**: Bio HTML sanitization

#### Image Validation
- **TC-02-008**: Avatar upload validation (max 5MB, square crop)
- **TC-02-009**: Banner upload validation (Pro/Pioneer only, max 5MB)
- **TC-02-010**: Image format validation (JPG, PNG, WebP)

#### Badge Display Logic
- **TC-02-011**: Badge order (Pioneer → Pro → Verified)
- **TC-02-012**: Achievement badges (Top Seller, Fast Responder, Rising Star)

### Integration Tests

#### Profile Endpoints
- **TC-02-013**: GET /api/sellers/[username] - Public profile view
  - Valid username → Profile data returned
  - Invalid username → Error 404
  - Private data not exposed (email, phone)

- **TC-02-014**: PUT /api/me/profile - Profile update
  - Valid data → Profile updated
  - Unauthorized user → Error 403
  - Invalid data → Error 400

- **TC-02-015**: POST /api/me/profile/avatar - Avatar upload
  - Valid image → Avatar uploaded, URL returned
  - Invalid file type → Error 400
  - File too large → Error 400

- **TC-02-016**: POST /api/me/profile/banner - Banner upload
  - Pro seller → Banner uploaded
  - Free seller → Error 403
  - Invalid file → Error 400

- **TC-02-017**: POST /api/sellers/[id]/follow - Follow seller
  - Valid seller → Followed, notification sent
  - Already following → Error 409
  - Self-follow → Error 400

- **TC-02-018**: DELETE /api/sellers/[id]/follow - Unfollow seller
  - Following seller → Unfollowed
  - Not following → Error 404

- **TC-02-019**: GET /api/me/profile/analytics - Profile analytics
  - Seller account → Analytics returned
  - Buyer account → Error 403

### E2E Tests

#### Profile Viewing
- **TC-02-020**: View public seller profile (unauthenticated)
  1. Navigate to /sellers/[username]
  2. Verify profile displays
  3. Verify products shown
  4. Verify reviews shown
  5. Verify email/phone not visible

- **TC-02-021**: View own profile (authenticated)
  1. Navigate to /profile
  2. Verify edit button visible
  3. Verify analytics accessible (if seller)

#### Profile Editing
- **TC-02-022**: Edit own profile
  1. Navigate to /profile/edit
  2. Update bio, subjects, grades
  3. Save changes
  4. Verify profile updated
  5. Verify completion percentage updated

- **TC-02-023**: Upload avatar image
  1. Click "Upload Avatar"
  2. Select image file
  3. Crop to square
  4. Save
  5. Verify avatar updated

- **TC-02-024**: Upload banner image (Pro seller)
  1. Pro seller navigates to profile edit
  2. Upload banner image
  3. Verify banner displayed
  4. Free seller attempts → Error shown

#### Social Features
- **TC-02-025**: Follow/unfollow seller
  1. View seller profile
  2. Click "Follow"
  3. Verify follower count increases
  4. Click "Unfollow"
  5. Verify follower count decreases

- **TC-02-026**: Profile completion prompts
  1. Incomplete profile seller
  2. Attempt to upload product
  3. Verify "Complete your profile" modal
  4. Complete profile
  5. Verify can upload product

- **TC-02-027**: Search sellers
  1. Navigate to /sellers
  2. Search by name
  3. Filter by subject/grade
  4. Verify results displayed

### Security Tests

#### Profile Data Privacy
- **TC-02-028**: Email/phone not exposed in public profile
- **TC-02-029**: PRC license number not exposed
- **TC-02-030**: Payment info (GCash/Maya) not exposed

#### Image Upload Security
- **TC-02-031**: File type validation (images only)
- **TC-02-032**: File size limits enforced
- **TC-02-033**: Malicious file upload prevention

#### Authorization
- **TC-02-034**: Profile edit authorization (own profile only)
- **TC-02-035**: Admin can edit any profile

#### Input Validation
- **TC-02-036**: XSS in bio field
- **TC-02-037**: SQL injection in search

---

## Feature 03: Product Listings & Product Management

### Unit Tests

#### Product Validation
- **TC-03-001**: Product title validation (5-100 chars)
- **TC-03-002**: Price validation (₱5-₱50,000)
- **TC-03-003**: Description validation (50-2000 chars)
- **TC-03-004**: Product type validation (5 types)

#### File Upload Validation
- **TC-03-005**: File type validation (PDF, DOCX, PPTX, JPG, PNG, ZIP)
- **TC-03-006**: File size validation (100MB per file, 500MB total)
- **TC-03-007**: Virus scanning trigger

#### Image Processing
- **TC-03-008**: Cover image auto-generation (PDF first page)
- **TC-03-009**: Cover image auto-generation (DOCX first page)
- **TC-03-010**: Cover image auto-generation (PPTX first slide)
- **TC-03-011**: Preview generation (first 3 pages)
- **TC-03-012**: Watermark overlay on preview

#### Version Management
- **TC-03-013**: Version increment (minor: 1.0 → 1.1)
- **TC-03-014**: Version increment (major: 1.2 → 2.0)
- **TC-03-015**: Changelog requirement (min 20 chars)

#### Status Workflow
- **TC-03-016**: Draft → Publish → Pending Review (first 3)
- **TC-03-017**: Pending Review → Published (admin approval)
- **TC-03-018**: Published → Unpublish → Draft
- **TC-03-019**: Rejected → Edit → Pending Review

### Integration Tests

#### Product Endpoints
- **TC-03-020**: POST /api/products - Create product
  - Valid data → Product created as draft
  - Missing required fields → Error 400
  - Unverified seller → Error 403

- **TC-03-021**: PUT /api/products/:id - Update product
  - Owner → Product updated
  - Non-owner → Error 403
  - Creates new version if published

- **TC-03-022**: POST /api/products/:id/publish - Publish draft
  - First 3 products → Status: pending_review
  - 4th+ product → Status: published
  - Unverified seller → Error 403

- **TC-03-023**: POST /api/products/:id/update - Create new version
  - Valid changelog → Version incremented
  - Missing changelog → Error 400
  - Buyers notified

- **TC-03-024**: GET /api/products/:id/preview - Get preview images
  - Valid product → Preview images returned
  - Preview not generated → Trigger generation

- **TC-03-025**: GET /api/products - List products with filters
  - No filters → All published products
  - Grade filter → Filtered results
  - Subject filter → Filtered results
  - Price range → Filtered results

- **TC-03-026**: POST /api/admin/products/:id/approve - Admin approval
  - Admin → Product approved, status: published
  - Non-admin → Error 403

### E2E Tests

#### Product Upload
- **TC-03-027**: Multi-step product upload wizard
  1. Navigate to /dashboard/products/new
  2. Step 1: Enter title, type, description
  3. Step 2: Select grade, subject, quarter, weeks
  4. Step 3: Upload files, cover image
  5. Step 4: Set price
  6. Step 5: Preview and confirm
  7. Verify product created as draft

- **TC-03-028**: Product categorization
  1. Select Grade 7
  2. Verify subjects filter (only Grade 7 subjects)
  3. Select Mathematics
  4. Select Quarter 1
  5. Select Weeks 1-3
  6. Verify all selections saved

- **TC-03-029**: File upload with cover image
  1. Upload PDF file
  2. Verify cover auto-generated from first page
  3. Option to upload custom cover
  4. Upload custom cover
  5. Verify custom cover used

- **TC-03-030**: Preview generation and display
  1. Upload product files
  2. Verify preview generated (first 3 pages)
  3. View product page
  4. Click "Preview" button
  5. Verify preview modal opens
  6. Verify watermark visible

- **TC-03-031**: Product version update
  1. Edit published product
  2. Upload new files
  3. Enter changelog
  4. Publish update
  5. Verify version incremented
  6. Verify buyers notified

- **TC-03-032**: First 3 products review workflow
  1. New seller uploads 1st product
  2. Publish → Status: pending_review
  3. Admin reviews and approves
  4. Seller uploads 2nd product → pending_review
  5. Seller uploads 3rd product → pending_review
  6. Seller uploads 4th product → published (no review)

- **TC-03-033**: Product status changes
  1. Create draft product
  2. Publish → pending_review (if first 3)
  3. Admin approves → published
  4. Unpublish → draft
  5. Delete → deleted (soft delete)

### Security Tests

#### File Upload Security
- **TC-03-034**: Virus scanning on upload
- **TC-03-035**: File type validation (whitelist only)
- **TC-03-036**: File size limits enforced
- **TC-03-037**: Malicious file upload prevention

#### Content Security
- **TC-03-038**: XSS in product description
- **TC-03-039**: SQL injection in search/filters
- **TC-03-040**: Unauthorized product edit

---

## Feature 04: Shopping Cart & Checkout Flow

### Unit Tests

#### Cart Logic
- **TC-04-001**: Cart item uniqueness (one per product)
- **TC-04-002**: Cart persistence (database storage)
- **TC-04-003**: Cart clearing on purchase
- **TC-04-004**: Cart clearing on manual removal

#### Price Calculation
- **TC-04-005**: Subtotal calculation (sum of item prices)
- **TC-04-006**: Total calculation (subtotal, no fees shown to buyer)
- **TC-04-007**: Commission calculation (20% standard, 15% Pioneer)
- **TC-04-008**: Net earnings calculation (price - commission)

#### Payment Processing
- **TC-04-009**: Payment timeout (15 minutes)
- **TC-04-010**: Payment retry logic (unlimited)
- **TC-04-011**: Webhook signature verification
- **TC-04-012**: Idempotency key validation

#### Download Processing
- **TC-04-013**: Watermark generation (buyer email)
- **TC-04-014**: Download authorization check
- **TC-04-015**: Download count increment

### Integration Tests

#### Cart Endpoints
- **TC-04-016**: POST /api/cart/add - Add to cart
  - Valid product → Added to cart
  - Already in cart → No duplicate
  - Unauthenticated → Error 401

- **TC-04-017**: DELETE /api/cart/:itemId - Remove from cart
  - Valid item → Removed
  - Invalid item → Error 404

- **TC-04-018**: GET /api/cart - Get cart items
  - Authenticated → Cart items returned
  - Empty cart → Empty array

#### Checkout Endpoints
- **TC-04-019**: POST /api/checkout/create - Create order
  - Valid cart items → Order created, status: payment_pending
  - Empty cart → Error 400
  - Payment timeout set (15 minutes)

- **TC-04-020**: POST /api/checkout/select-payment - Select payment method
  - GCash selected → Payment initiated
  - Maya selected → Payment initiated
  - Invalid method → Error 400

#### Payment Webhooks
- **TC-04-021**: POST /api/orders/gcash-callback - GCash webhook
  - Valid signature → Order completed, products added to library
  - Invalid signature → Error 401
  - Duplicate webhook → Idempotent (no duplicate processing)

- **TC-04-022**: POST /api/orders/maya-callback - Maya webhook
  - Valid signature → Order completed
  - Invalid signature → Error 401

#### Library Endpoints
- **TC-04-023**: GET /api/library/:productId/download - Download product
  - Purchased product → Watermarked file downloaded
  - Not purchased → Error 403
  - Download count incremented

### E2E Tests

#### Cart Operations
- **TC-04-024**: Add product to cart
  1. Browse products
  2. Click "Add to Cart"
  3. Verify cart badge updates
  4. Navigate to cart page
  5. Verify product in cart

- **TC-04-025**: Remove product from cart
  1. View cart
  2. Click "Remove"
  3. Verify product removed
  4. Verify cart badge updates

#### Checkout Flow
- **TC-04-026**: "Buy Now" flow (single product)
  1. View product page
  2. Click "Buy Now"
  3. Redirected to checkout
  4. Product pre-selected
  5. Complete payment

- **TC-04-027**: Multi-step checkout
  1. View cart with multiple items
  2. Select items to checkout
  3. Step 1: Review order
  4. Step 2: Select payment method
  5. Enter mobile number
  6. Complete payment

#### Payment Flows
- **TC-04-028**: GCash payment flow
  1. Select GCash payment
  2. Enter mobile number
  3. Receive push notification
  4. Approve in GCash app
  5. Return to site
  6. Verify order confirmed
  7. Verify products in library

- **TC-04-029**: Maya payment flow
  1. Select Maya payment
  2. Enter mobile number
  3. Receive OTP
  4. Enter OTP
  5. Verify order confirmed

- **TC-04-030**: Payment timeout
  1. Create order
  2. Wait 15 minutes without payment
  3. Verify order status: payment_failed
  4. Verify cart items still available
  5. Retry payment

#### Order Fulfillment
- **TC-04-031**: Order confirmation email
  1. Complete payment
  2. Verify email sent
  3. Verify email contains order details
  4. Verify download links in email

- **TC-04-032**: Download purchased product
  1. Navigate to library
  2. Click "Download"
  3. Verify watermarked file downloads
  4. Verify watermark contains buyer email
  5. Verify download count incremented

- **TC-04-033**: Watermarked file download
  1. Download PDF product
  2. Verify watermark on first/last page
  3. Download DOCX product
  4. Verify watermark in header/footer
  5. Download PPTX product
  6. Verify watermark on slides

### Security Tests

#### Payment Security
- **TC-04-034**: Payment webhook signature verification
- **TC-04-035**: Idempotency key validation (prevent duplicate processing)
- **TC-04-036**: Payment amount validation (match order total)

#### Cart Security
- **TC-04-037**: Cart manipulation (unauthorized access)
- **TC-04-038**: Price manipulation prevention

#### Download Security
- **TC-04-039**: Download authorization (purchased products only)
- **TC-04-040**: Watermark injection prevention
- **TC-04-041**: Download rate limiting

---

## Feature 05: Reviews & Ratings

### Unit Tests

#### Review Validation
- **TC-05-001**: Rating validation (1-5 stars, integer only)
- **TC-05-002**: Comment character limit (500 chars)
- **TC-05-003**: Review eligibility check (purchased + downloaded)
- **TC-05-004**: One review per product per buyer (unique constraint)
- **TC-05-005**: 7-day edit window enforcement
- **TC-05-006**: Seller response character limit (500 chars)

#### Review Calculations
- **TC-05-007**: Average rating calculation
- **TC-05-008**: Seller rating aggregation (all products)
- **TC-05-009**: Review count increment

### Integration Tests

#### Review Endpoints
- **TC-05-010**: POST /api/products/:productId/reviews - Create review
  - Purchased + downloaded → Review created
  - Not purchased → Error 403
  - Already reviewed → Error 409

- **TC-05-011**: PUT /api/reviews/:reviewId - Edit review
  - Within 7 days → Review updated, is_edited: true
  - After 7 days → Error 400
  - Not owner → Error 403

- **TC-05-012**: PUT /api/reviews/:reviewId/response - Seller response
  - Product owner → Response added
  - Not owner → Error 403
  - Character limit exceeded → Error 400

- **TC-05-013**: GET /api/products/:productId/reviews - Get reviews
  - Published product → Reviews returned
  - Sort by newest (default)
  - Sort by highest rated
  - Sort by lowest rated

- **TC-05-014**: POST /api/reviews/:reviewId/flag - Flag review
  - Valid flag → Review flagged, hidden
  - Admin notified

- **TC-05-015**: GET /api/admin/reviews/flagged - Admin moderation queue
  - Admin → Flagged reviews returned
  - Non-admin → Error 403

### E2E Tests

#### Review Submission
- **TC-05-016**: Leave review after purchase and download
  1. Purchase product
  2. Download product
  3. Navigate to library
  4. Click "Leave Review"
  5. Select rating (required)
  6. Enter comment (optional)
  7. Submit review
  8. Verify review appears on product page

- **TC-05-017**: Edit review within 7 days
  1. View own review
  2. Click "Edit Review"
  3. Change rating and/or comment
  4. Save changes
  5. Verify "Edited on [date]" shown

- **TC-05-018**: Seller responds to review
  1. Seller views product reviews
  2. Click "Respond" on review
  3. Enter response (max 500 chars)
  4. Submit response
  5. Verify buyer notified
  6. Verify response visible on product page

#### Review Reminders
- **TC-05-019**: Review reminder email (24h after download)
  1. Download product
  2. Wait 24 hours
  3. Verify reminder email sent
  4. Click link in email
  5. Verify review form opens

#### Review Moderation
- **TC-05-020**: Review moderation flow
  1. User submits review with profanity
  2. System auto-flags review
  3. Review hidden from public
  4. Admin sees in flagged queue
  5. Admin dismisses or deletes
  6. User notified of action

- **TC-05-021**: Review display on product page
  1. View product with reviews
  2. Verify top 3 recent reviews shown
  3. Verify "See all [count] reviews" link
  4. Click link → Full reviews page
  5. Verify all reviews displayed

### Security Tests

#### Review Integrity
- **TC-05-022**: Review spam prevention (one per product)
- **TC-05-023**: XSS in review comment
- **TC-05-024**: Unauthorized review edit/deletion
- **TC-05-025**: Review manipulation (fake reviews)

---

## Feature 06: Social Features

### Unit Tests

#### Notification System
- **TC-06-001**: Notification creation (8 types)
- **TC-06-002**: Notification delivery (in-app + email)
- **TC-06-003**: Notification preference enforcement
- **TC-06-004**: Unread count calculation

#### Recently Viewed
- **TC-06-005**: Recently viewed tracking (last 20, 30 days)
- **TC-06-006**: Recently viewed update on duplicate view
- **TC-06-007**: Recently viewed auto-cleanup (30 days)

#### Social Sharing
- **TC-06-008**: Share tracking (Facebook, Messenger, copy link)
- **TC-06-009**: Share URL generation with referral
- **TC-06-010**: Open Graph metadata generation

#### Social Proof
- **TC-06-011**: Trending badge calculation (sales + views in 7 days)
- **TC-06-012**: Bestseller badge calculation (top 10% in category)
- **TC-06-013**: Popular badge calculation (50+ wishlist or 100+ views)

### Integration Tests

#### Notification Endpoints
- **TC-06-014**: GET /api/notifications - Get notifications
  - Authenticated → Notifications returned
  - Filter by unread → Unread only
  - Pagination → 20 per page

- **TC-06-015**: PUT /api/notifications/:id/read - Mark as read
  - Valid notification → Marked as read
  - Unread count decremented

- **TC-06-016**: POST /api/products/:id/view - Track product view
  - Logged-in user → View tracked
  - Anonymous user → Not tracked

- **TC-06-017**: GET /api/recently-viewed - Get recently viewed
  - Logged-in user → Last 20 items
  - Anonymous user → Error 401

- **TC-06-018**: POST /api/products/:id/share - Track share
  - Valid share → Tracked in database
  - Platform: facebook, messenger, copy_link

- **TC-06-019**: POST /api/admin/announcements - Create announcement
  - Admin → Announcement created
  - Target audience selected
  - Email + in-app delivery

### E2E Tests

#### Notifications
- **TC-06-020**: Notification bell badge updates
  1. Seller makes sale
  2. Verify bell badge shows count
  3. Click bell
  4. Verify notification dropdown
  5. Click notification
  6. Verify navigates to order

- **TC-06-021**: Recently viewed section
  1. Browse products (view 5+)
  2. Navigate to homepage
  3. Verify "Recently Viewed" section
  4. Click product
  5. Verify navigates to product page

#### Social Sharing
- **TC-06-022**: Share product to Facebook
  1. View product page
  2. Click "Share" → Facebook
  3. Verify Facebook share dialog opens
  4. Verify product image/title pre-filled

- **TC-06-023**: Share product to Messenger
  1. View product page
  2. Click "Share" → Messenger
  3. Verify Messenger opens
  4. Verify product link included

- **TC-06-024**: Copy product link
  1. Click "Share" → Copy Link
  2. Verify "Link copied!" toast
  3. Paste link
  4. Verify link works

- **TC-06-025**: System announcement delivery
  1. Admin creates announcement
  2. Target: All users
  3. Verify in-app notification created
  4. Verify email sent (if preferences allow)
  5. Users see announcement

### Security Tests

#### Notification Security
- **TC-06-026**: Notification authorization (own notifications only)
- **TC-06-027**: Share tracking privacy
- **TC-06-028**: Recently viewed data privacy

---

## Feature 07: Seller Dashboard & Analytics

### Unit Tests

#### Revenue Calculations
- **TC-07-001**: Revenue calculation (gross sales)
- **TC-07-002**: Commission calculation (20% or 15%)
- **TC-07-003**: Net earnings calculation (revenue - commission)
- **TC-07-004**: Withdrawal balance calculation

#### Analytics Calculations
- **TC-07-005**: Sparkline generation (Free tier)
- **TC-07-006**: Chart data aggregation (Pro/Pioneer)
- **TC-07-007**: Performance score calculation (0-100)
- **TC-07-008**: Conversion rate calculation (sales ÷ views)

#### Export Generation
- **TC-07-009**: CSV export generation
- **TC-07-010**: Excel export generation (Pro/Pioneer)
- **TC-07-011**: PDF report generation (Pro/Pioneer)

### Integration Tests

#### Dashboard Endpoints
- **TC-07-012**: GET /api/seller/dashboard/overview - Dashboard metrics
  - Seller → Metrics returned
  - Time period filter → Filtered data
  - Caching → 15-minute cache

- **TC-07-013**: GET /api/seller/products - Product management
  - Grid view → Products with stats
  - List view → Table format
  - Filters → Filtered results

- **TC-07-014**: GET /api/seller/orders - Order history
  - Seller → Orders returned
  - Filters → Filtered results
  - Buyer location included

- **TC-07-015**: GET /api/seller/earnings - Earnings dashboard
  - Available balance shown
  - Pending balance shown
  - Lifetime earnings shown

- **TC-07-016**: POST /api/seller/withdrawal - Request withdrawal
  - Balance ≥ ₱500 → Withdrawal processed
  - Balance < ₱500 → Error 400
  - GCash/Maya → Disbursement API called

- **TC-07-017**: GET /api/seller/analytics/revenue - Revenue analytics
  - Pro/Pioneer → Charts returned
  - Free tier → Error 403

### E2E Tests

#### Dashboard Overview
- **TC-07-018**: Dashboard overview display
  1. Seller logs in
  2. Navigate to /dashboard
  3. Verify 4 metric cards
  4. Verify sparklines (Free) or charts (Pro/Pioneer)
  5. Verify activity feed
  6. Verify quick actions

- **TC-07-019**: Product grid/list view toggle
  1. Navigate to /dashboard/products
  2. Default: Grid view
  3. Click "List" toggle
  4. Verify table view
  5. Toggle back to grid

- **TC-07-020**: Bulk product actions
  1. Select multiple products (checkboxes)
  2. Click bulk action (unpublish)
  3. Confirm action
  4. Verify all selected products updated

- **TC-07-021**: Duplicate product feature
  1. View product in dashboard
  2. Click "Duplicate"
  3. Verify copy created with "[Copy]" in title
  4. Verify status: draft
  5. Edit and publish

- **TC-07-022**: Order history with filters
  1. Navigate to /dashboard/orders
  2. Filter by date range
  3. Filter by status
  4. Filter by location
  5. Verify filtered results
  6. Export to CSV

- **TC-07-023**: Withdrawal request
  1. Navigate to /dashboard/earnings
  2. Verify available balance
  3. If ≥ ₱500, click "Request Withdrawal"
  4. Select payment method
  5. Confirm withdrawal
  6. Verify withdrawal in history

- **TC-07-024**: Analytics dashboard (Pro/Pioneer)
  1. Pro seller navigates to /dashboard/analytics
  2. Verify interactive charts
  3. Verify performance score
  4. Verify recommendations
  5. Export report (PDF)

### Security Tests

#### Dashboard Security
- **TC-07-025**: Dashboard data authorization (seller only)
- **TC-07-026**: Earnings data privacy
- **TC-07-027**: Withdrawal amount validation
- **TC-07-028**: Export data security

---

## Feature 08: Advanced Search & Discovery

### Unit Tests

#### Search Algorithm
- **TC-08-001**: Search relevance ranking algorithm
  - Text match (40%) + Sales (25%) + Rating (20%) + Recency (10%) + Seller rep (5%)
- **TC-08-002**: Filter logic (AND operations)
- **TC-08-003**: Autocomplete suggestions (8 results max)
- **TC-08-004**: Search history tracking (last 10)
- **TC-08-005**: Category page generation

### Integration Tests

#### Search Endpoints
- **TC-08-006**: GET /api/search - Search products
  - Query string → Results returned
  - Filters applied → Filtered results
  - Sort options → Sorted results
  - Pagination → 24 per page (desktop), 20 (mobile)

- **TC-08-007**: GET /api/search/suggestions - Autocomplete
  - Partial query → 8 suggestions
  - Product titles, subjects, seller names

- **TC-08-008**: GET /api/search/popular - Popular searches
  - Top 100 searches cached
  - Updated nightly

- **TC-08-009**: GET /api/categories/:slug/products - Category products
  - Valid category → Products returned
  - Category-specific filters applied

- **TC-08-010**: GET /api/recommendations/related/:productId - Related products
  - Same grade/subject → 8 products
  - Same seller → Included

### E2E Tests

#### Search Functionality
- **TC-08-011**: Search with query string
  1. Enter search query
  2. Verify results displayed
  3. Verify relevance ranking
  4. Verify result count

- **TC-08-012**: Search with filters
  1. Enter query
  2. Select grade filter
  3. Select subject filter
  4. Select price range
  5. Verify filtered results
  6. Verify active filters shown as chips

- **TC-08-013**: Autocomplete dropdown
  1. Start typing in search bar
  2. Verify suggestions appear
  3. Click suggestion
  4. Verify search executed

- **TC-08-014**: Category page navigation
  1. Navigate to /products/lesson-plans
  2. Verify category page displays
  3. Verify products filtered to category
  4. Verify category-specific filters shown

- **TC-08-015**: "No results" behavior
  1. Search for non-existent product
  2. Verify "No results" message
  3. Verify suggestions shown
  4. Verify "Popular in [category]" section

- **TC-08-016**: Related products display
  1. View product detail page
  2. Scroll to "You Might Also Like"
  3. Verify 8 related products
  4. Click product → Navigate to product page

- **TC-08-017**: Search analytics (seller dashboard)
  1. Seller views product analytics
  2. Navigate to search analytics
  3. Verify search terms report
  4. Verify ranking position
  5. Verify CTR (Pro/Pioneer)

### Performance Tests

#### Search Performance
- **TC-08-018**: Search response time (< 500ms)
- **TC-08-019**: Cache hit rate (> 80%)
- **TC-08-020**: Popular search pre-computation
- **TC-08-021**: Database query optimization

---

## Feature 09: Admin Panel & Content Moderation

### Unit Tests

#### Role-Based Access Control
- **TC-09-001**: Super Admin access (all features)
- **TC-09-002**: Moderator access (restricted features)
- **TC-09-003**: Content Manager access (basic features)
- **TC-09-004**: Approval workflow logic
- **TC-09-005**: Rejection reason validation
- **TC-09-006**: Bulk action processing
- **TC-09-007**: Audit log creation

### Integration Tests

#### Admin Endpoints
- **TC-09-008**: GET /api/admin/dashboard - Admin dashboard
  - Admin → Metrics returned
  - Non-admin → Error 403

- **TC-09-009**: GET /api/admin/users/verification-queue - Verification queue
  - Admin → Pending verifications returned
  - Oldest first (FCFS)

- **TC-09-010**: POST /api/admin/users/:id/verify-teacher - Approve/reject
  - Approve → User can_sell: true
  - Reject → Reason required, user notified

- **TC-09-011**: GET /api/admin/products/pending - Pending products
  - Admin → Pending products returned
  - Oldest first

- **TC-09-012**: POST /api/admin/products/:id/approve - Approve product
  - Admin → Product published
  - Seller notified

- **TC-09-013**: POST /api/admin/products/:id/reject - Reject product
  - Admin → Product rejected, reason required
  - Seller notified

- **TC-09-014**: GET /api/admin/reviews/flagged - Flagged reviews
  - Admin → Flagged reviews returned
  - Severity levels shown

- **TC-09-015**: GET /api/admin/financials/withdrawals - Withdrawal requests
  - Super Admin → Withdrawals returned
  - Moderator → Error 403

### E2E Tests

#### Admin Workflows
- **TC-09-016**: Admin login and dashboard access
  1. Admin logs in
  2. Navigate to /admin
  3. Verify dashboard displays
  4. Verify quick action cards
  5. Verify metrics

- **TC-09-017**: Teacher verification approval
  1. Admin views verification queue
  2. View PRC document
  3. Enter license number and expiry
  4. Click "Approve"
  5. Verify user can_sell: true
  6. Verify user notified

- **TC-09-018**: Product moderation
  1. Admin views pending products
  2. Preview product files
  3. Approve or reject
  4. If reject, enter reason
  5. Verify seller notified
  6. Verify product status updated

- **TC-09-019**: Review moderation
  1. Admin views flagged reviews
  2. Review flagged content
  3. Dismiss flag or delete review
  4. Verify action logged

- **TC-09-020**: User ban/unban
  1. Admin views user profile
  2. Click "Ban User"
  3. Enter reason
  4. Confirm ban
  5. Verify user banned
  6. Unban user
  7. Verify user active

- **TC-09-021**: Pioneer management
  1. Admin views Pioneer candidates
  2. Check quality score
  3. Invite seller to become Pioneer
  4. Verify invitation sent
  5. Remove Pioneer (if needed)
  6. Verify commission reverts to 20%

- **TC-09-022**: Withdrawal processing
  1. Super Admin views withdrawal requests
  2. Verify seller balance
  3. Click "Process Withdrawal"
  4. Verify GCash/Maya API called
  5. Verify withdrawal status: processing
  6. Webhook confirms → status: completed

- **TC-09-023**: System announcement creation
  1. Admin creates announcement
  2. Select target audience
  3. Schedule or send immediately
  4. Verify announcement created
  5. Verify users notified

### Security Tests

#### Admin Security
- **TC-09-024**: Admin route protection
- **TC-09-025**: Role-based authorization
- **TC-09-026**: Audit trail completeness
- **TC-09-027**: Financial data access (Super Admin only)
- **TC-09-028**: CSRF protection on admin actions

---

## Feature 10: Email System

### Unit Tests

#### Email Processing
- **TC-10-001**: Email template rendering
- **TC-10-002**: Variable substitution
- **TC-10-003**: Email queue processing
- **TC-10-004**: Rate limiting logic
- **TC-10-005**: Bounce handling
- **TC-10-006**: Suppression list check

### Integration Tests

#### Email Endpoints
- **TC-10-007**: POST /api/admin/email/send - Send email
  - Admin → Email sent immediately
  - Valid template → Email delivered

- **TC-10-008**: POST /api/admin/email/schedule - Schedule email
  - Future date → Email queued
  - Cron job processes at scheduled time

- **TC-10-009**: GET /api/admin/email/queue - Queue status
  - Admin → Queue status returned
  - Pending, processing, sent counts

- **TC-10-010**: PUT /api/admin/email/templates/:emailType - Update template
  - Admin → Template updated
  - Version history maintained

- **TC-10-011**: GET /api/admin/email/analytics - Email analytics
  - Delivery rate, open rate, click rate
  - Performance by email type

### E2E Tests

#### Email Delivery
- **TC-10-012**: Order confirmation email
  1. Complete purchase
  2. Verify email sent immediately
  3. Verify email contains order details
  4. Verify download links work

- **TC-10-013**: Password reset email
  1. Request password reset
  2. Verify email sent
  3. Click reset link
  4. Verify link expires after 1 hour

- **TC-10-014**: Product approved email
  1. Admin approves product
  2. Verify seller receives email
  3. Verify email contains product details

- **TC-10-015**: Cart abandonment email (24h delay)
  1. Add items to cart
  2. Wait 24 hours
  3. Verify reminder email sent
  4. Click link → Navigate to cart

- **TC-10-016**: Review reminder email (24h after download)
  1. Download product
  2. Wait 24 hours
  3. Verify reminder email sent
  4. Click link → Review form

- **TC-10-017**: System announcement email (bulk)
  1. Admin creates announcement
  2. Target: All users
  3. Verify emails queued
  4. Verify batch processing (500 at a time)
  5. Verify users receive email

### Security Tests

#### Email Security
- **TC-10-018**: Email injection prevention
- **TC-10-019**: Unsubscribe link validation
- **TC-10-020**: Email preference enforcement
- **TC-10-021**: SPF/DKIM/DMARC validation

---

## Feature 11: Messaging System

### Unit Tests

#### Message Validation
- **TC-11-001**: Message character limit (1000 chars)
- **TC-11-002**: Image upload validation (3 images, 5MB each)
- **TC-11-003**: Conversation uniqueness (buyer+seller+product)
- **TC-11-004**: Block enforcement logic
- **TC-11-005**: Auto-flagging (external links, profanity)
- **TC-11-006**: Response time calculation

### Integration Tests

#### Messaging Endpoints
- **TC-11-007**: POST /api/messages/conversations - Create conversation
  - Valid participants → Conversation created
  - Duplicate conversation → Existing returned

- **TC-11-008**: GET /api/messages/conversations - List conversations
  - Authenticated → Conversations returned
  - Sorted by last message (descending)

- **TC-11-009**: POST /api/messages/conversations/:id/messages - Send message
  - Valid message → Sent
  - Blocked user → Error 403
  - Character limit exceeded → Error 400

- **TC-11-010**: GET /api/messages/new - Poll for new messages
  - Polling endpoint (30s interval)
  - Returns new messages since last poll

- **TC-11-011**: POST /api/messages/conversations/:id/block - Block user
  - Valid user → Blocked
  - Messages hidden
  - Cannot send new messages

- **TC-11-012**: POST /api/messages/report - Report user
  - Valid report → Created
  - Admin notified

- **TC-11-013**: GET /api/admin/messages/flagged - Flagged messages
  - Admin → Flagged messages returned
  - Auto-flagged and user-reported

### E2E Tests

#### Messaging Flows
- **TC-11-014**: Create product inquiry conversation
  1. View product page
  2. Click "Ask a Question"
  3. Enter message
  4. Send message
  5. Verify conversation created
  6. Verify seller notified

- **TC-11-015**: Send/receive messages
  1. Open conversation
  2. Type message
  3. Send message
  4. Verify message appears
  5. Seller receives notification
  6. Seller responds
  7. Buyer sees response (polling)

- **TC-11-016**: Image attachment upload
  1. Compose message
  2. Click attach image
  3. Select image (max 3)
  4. Upload images
  5. Send message
  6. Verify images displayed in chat

- **TC-11-017**: Quick reply templates
  1. Seller views message
  2. Click quick reply chip
  3. Message pre-filled
  4. Edit if needed
  5. Send message

- **TC-11-018**: Block/unblock user
  1. View conversation
  2. Click menu → Block
  3. Confirm block
  4. Verify conversation hidden
  5. Unblock user
  6. Verify conversation restored

- **TC-11-019**: Report user workflow
  1. View conversation
  2. Click menu → Report
  3. Select reason
  4. Submit report
  5. Verify admin notified

- **TC-11-020**: Admin joins conversation (dispute)
  1. User escalates to admin
  2. Admin views dispute
  3. Admin joins conversation
  4. Admin sends message
  5. Verify admin message highlighted
  6. Both parties notified

- **TC-11-021**: Polling for new messages
  1. User on messages page
  2. Polling active (30s interval)
  3. New message arrives
  4. Verify UI updates
  5. Verify notification sound (if enabled)

### Security Tests

#### Messaging Security
- **TC-11-022**: Message content moderation
- **TC-11-023**: External link blocking
- **TC-11-024**: Block enforcement
- **TC-11-025**: Conversation privacy (participants only)
- **TC-11-026**: Admin access logging

---

## Cross-Feature Integration Tests

### User Journey: Complete Purchase Flow

**TC-CROSS-001**: End-to-end buyer journey
1. User signs up (Feature 01)
2. User completes profile (Feature 02)
3. User browses products (Feature 03)
4. User searches for products (Feature 08)
5. User adds to cart (Feature 04)
6. User checks out and pays (Feature 04)
7. User downloads product (Feature 04)
8. User leaves review (Feature 05)
9. User receives notifications (Feature 06)
10. Seller views analytics (Feature 07)

**Expected Result**: All features work together seamlessly, user completes purchase and review.

### Seller Journey: First Sale

**TC-CROSS-002**: End-to-end seller journey
1. Seller signs up (Feature 01)
2. Seller verifies teacher status (Feature 01)
3. Seller completes profile (Feature 02)
4. Seller uploads first product (Feature 03)
5. Admin reviews product (Feature 09)
6. Product approved and published (Feature 03)
7. Seller receives sale notification (Feature 06)
8. Seller views order in dashboard (Feature 07)
9. Seller requests withdrawal (Feature 07)
10. Admin processes withdrawal (Feature 09)

**Expected Result**: Seller successfully lists product, makes sale, and receives payment.

### Messaging to Purchase Conversion

**TC-CROSS-003**: Inquiry leads to purchase
1. Buyer views product (Feature 03)
2. Buyer sends message inquiry (Feature 11)
3. Seller responds with quick reply (Feature 11)
4. Buyer adds to cart (Feature 04)
5. Buyer completes purchase (Feature 04)
6. Buyer downloads product (Feature 04)
7. Buyer leaves review (Feature 05)

**Expected Result**: Messaging facilitates purchase decision.

---

## Performance Test Scenarios

### Load Tests

**TC-PERF-001**: 100 concurrent users browsing products
- Simulate 100 users browsing homepage
- Measure response times
- Target: < 2 seconds page load

**TC-PERF-002**: 50 concurrent checkout processes
- Simulate 50 users checking out simultaneously
- Measure checkout completion time
- Target: < 3 seconds checkout flow

**TC-PERF-003**: 200 concurrent search queries
- Simulate 200 search requests
- Measure search response time
- Target: < 500ms

**TC-PERF-004**: 100 concurrent message sends
- Simulate 100 users sending messages
- Measure message delivery time
- Target: < 1 second

**TC-PERF-005**: Dashboard load with 1000+ products
- Seller with 1000+ products views dashboard
- Measure dashboard load time
- Target: < 2 seconds

### Stress Tests

**TC-PERF-006**: 1000+ products in database
- Test search performance with large dataset
- Measure query times
- Target: < 500ms search

**TC-PERF-007**: 10,000+ users
- Test user management performance
- Measure profile load times
- Target: < 200ms API response

**TC-PERF-008**: 50,000+ orders
- Test order history performance
- Measure query times with pagination
- Target: < 500ms

**TC-PERF-009**: High message volume (1000+ messages/hour)
- Test messaging system under load
- Measure polling performance
- Target: < 200ms polling response

### Response Time Targets

- **Page load**: < 2 seconds
- **Search results**: < 500ms
- **API endpoints**: < 200ms
- **Database queries**: < 100ms

---

## Mobile Test Scenarios

### Responsive Design

**TC-MOBILE-001**: Mobile layout (320px-767px)
- Verify 2-column product grid
- Verify touch targets (44x44px minimum)
- Verify readable font sizes
- Verify navigation works

**TC-MOBILE-002**: Tablet layout (768px-1023px)
- Verify 3-column product grid
- Verify responsive sidebar
- Verify touch interactions

**TC-MOBILE-003**: Desktop layout (1024px+)
- Verify 4-column product grid
- Verify sidebar navigation
- Verify hover effects

### Mobile-Specific Features

**TC-MOBILE-004**: Pull-to-refresh
- Pull down on product list
- Verify refresh triggered
- Verify loading indicator

**TC-MOBILE-005**: Swipe gestures
- Swipe left on product card → Archive
- Swipe right → Select
- Verify gestures work smoothly

**TC-MOBILE-006**: Bottom tab navigation
- Verify 5 tabs visible
- Verify active tab highlighted
- Verify navigation works

**TC-MOBILE-007**: Mobile payment flow
- GCash payment on mobile
- Verify app switching works
- Verify return to site works
- Verify payment confirmation

**TC-MOBILE-008**: Image upload on mobile
- Select image from gallery
- Verify upload progress
- Verify image displays in chat

---

## Accessibility Tests

### WCAG 2.1 AA Compliance

**TC-A11Y-001**: Keyboard navigation
- Navigate entire site with keyboard only
- Verify all interactive elements accessible
- Verify focus indicators visible

**TC-A11Y-002**: Screen reader compatibility
- Test with NVDA/JAWS
- Verify all content announced
- Verify form labels associated

**TC-A11Y-003**: Color contrast ratios
- Verify text contrast (4.5:1 minimum)
- Verify large text contrast (3:1 minimum)
- Verify interactive elements contrast

**TC-A11Y-004**: Alt text for images
- Verify all images have alt text
- Verify decorative images marked
- Verify informative alt text

**TC-A11Y-005**: Form label associations
- Verify all inputs have labels
- Verify labels associated correctly
- Verify error messages announced

**TC-A11Y-006**: Focus indicators
- Verify focus visible on all elements
- Verify focus order logical
- Verify skip links available

---

## Security Test Scenarios

### Authentication Security

**TC-SEC-001**: Password strength requirements
- Test weak passwords rejected
- Test strong passwords accepted
- Verify password hashing

**TC-SEC-002**: Session timeout
- Admin: 4 hours
- User: Browser session
- Verify timeout enforced

**TC-SEC-003**: CSRF token validation
- Test POST without token → Rejected
- Test POST with token → Accepted

**TC-SEC-004**: XSS prevention
- Test script injection in all text fields
- Verify scripts sanitized
- Verify no execution

**TC-SEC-005**: SQL injection prevention
- Test SQL injection in all inputs
- Verify parameterized queries
- Verify no SQL execution

### Data Protection

**TC-SEC-006**: Row Level Security (RLS) policies
- Test user can only access own data
- Test seller can only access own products
- Test admin can access all data

**TC-SEC-007**: Encrypted sensitive data
- Verify passwords hashed
- Verify payment info encrypted
- Verify PRC documents secured

**TC-SEC-008**: Audit logging
- Verify all admin actions logged
- Verify user actions logged (where applicable)
- Verify logs immutable

**TC-SEC-009**: Privacy controls
- Verify email not exposed in profiles
- Verify phone not exposed
- Verify payment info private

---

## Test Data Requirements

### Test Users

**Buyer Account (Verified)**
- Email: buyer@test.com
- Role: buyer
- Verified: true

**Seller Account (Verified Teacher)**
- Email: seller@test.com
- Role: seller
- Verified teacher: true
- Can sell: true

**Pro Seller Account**
- Email: pro@test.com
- Role: seller
- Subscription: pro
- Verified teacher: true

**Pioneer Seller Account**
- Email: pioneer@test.com
- Role: seller
- Subscription: pioneer
- Verified teacher: true
. Is pioneer: true

**Admin Account (Super Admin)**
- Email: admin@test.com
- Role: admin
- Admin role: super_admin

**Moderator Account**
- Email: moderator@test.com
- Role: admin
- Admin role: moderator

**Content Manager Account**
- Email: content@test.com
- Role: admin
- Admin role: content_manager

### Test Products

**All 5 Product Types**
- Exams: Periodical Exam, Summative Test
- Lesson Plans: DLL, DLP
- RPMS: Cover pages
- Posters: Various themes
- Tarpaulins: Seasonal designs

**Various Grades**
- Kindergarten through Grade 12
- Multiple products per grade

**Various Subjects**
- Mathematics, Science, English, Filipino, Araling Panlipunan, MAPEH, ESP, TLE

**Different Price Ranges**
- ₱50 (minimum)
- ₱100-₱300 (common)
- ₱500+ (premium)

**Different Statuses**
- Draft products
- Pending review products
- Published products
- Suspended products

### Test Orders

**Completed Orders**
- Multiple completed orders
- Various payment methods (GCash, Maya)
- Various order totals

**Pending Payment Orders**
- Orders awaiting payment
- Orders near timeout

**Failed Payment Orders**
- Payment timeout orders
- Payment declined orders

**Refunded Orders**
- Fully refunded orders
- Partially refunded orders

---

## Test Execution Strategy

### Pre-Launch Testing

**Phase 1: Unit Tests (Automated, CI/CD)**
- Run on every commit
- Target: 80%+ code coverage
- Fail build if tests fail

**Phase 2: Integration Tests (Automated, CI/CD)**
- Run on every commit
- Test all API endpoints
- Test database interactions

**Phase 3: E2E Tests (Automated, Nightly)**
- Run nightly builds
- Test critical user flows
- Generate reports

**Phase 4: Security Tests (Automated + Manual)**
- Automated: OWASP ZAP scans
- Manual: Penetration testing
- Monthly security audits

**Phase 5: Performance Tests (Weekly)**
- Load testing
- Stress testing
- Response time monitoring

**Phase 6: Mobile Tests (Manual, Real Devices)**
- Test on iOS devices
- Test on Android devices
- Test on various screen sizes

### Post-Launch Testing

**Daily: Smoke Tests**
- Critical paths only
- Quick validation
- 15-minute execution

**Weekly: Regression Tests**
- Full test suite
- Verify no regressions
- 2-hour execution

**Continuous: Performance Monitoring**
- Real-time monitoring
- Alert on degradation
- Weekly reports

**Monthly: User Acceptance Testing**
- Real user scenarios
- Feedback collection
- Improvement prioritization

---

## Test Tools & Frameworks

### Recommended Tools

**Unit/Integration Testing**
- Jest (JavaScript/TypeScript)
- Vitest (Vite-based, faster)
- React Testing Library (React components)

**E2E Testing**
- Playwright (recommended)
- Cypress (alternative)
- Browser automation

**API Testing**
- Postman (manual testing)
- Insomnia (alternative)
- REST client

**Performance Testing**
- k6 (load testing)
- Artillery (alternative)
- Load simulation

**Security Testing**
- OWASP ZAP (vulnerability scanning)
- Snyk (dependency scanning)
- Security audits

**Mobile Testing**
- BrowserStack (cloud devices)
- Real devices (preferred)
- Responsive design testing

**Accessibility Testing**
- axe DevTools (automated)
- WAVE (browser extension)
- Screen readers (NVDA, JAWS)

---

## Success Criteria

### Test Coverage Targets

- **Unit tests**: 80%+ code coverage
- **Integration tests**: All API endpoints covered
- **E2E tests**: All critical user flows covered
- **Security tests**: All authentication/authorization paths covered

### Quality Gates

**Pre-Deployment Requirements**
- All critical tests must pass
- Zero high-severity bugs
- Performance targets met
- Security vulnerabilities resolved
- Mobile responsiveness verified
- Accessibility compliance verified

**Post-Launch Monitoring**
- < 1% error rate
- > 99% uptime
- < 2s average page load
- < 500ms average API response
- Zero security incidents

### Test Metrics

**Coverage Metrics**
- Code coverage percentage
- Feature coverage percentage
- API endpoint coverage percentage

**Quality Metrics**
- Test pass rate
- Bug detection rate
- Test execution time
- Test maintenance effort

**Performance Metrics**
- Response times (p50, p95, p99)
- Throughput (requests/second)
- Error rates
- Resource utilization

---

## Appendix: Test Case Template

### Standard Test Case Format

```
Test Case ID: TC-XX-XXX
Feature: Feature XX - [Feature Name]
Test Type: Unit/Integration/E2E/Security/Performance
Priority: High/Medium/Low

Description:
[Brief description of what is being tested]

Preconditions:
[What must be true before test execution]

Test Steps:
1. [Step 1]
2. [Step 2]
3. [Step 3]

Expected Result:
[What should happen]

Actual Result:
[What actually happened - filled during execution]

Status: Pass/Fail/Blocked/Skipped
Notes:
[Additional notes or observations]
```

---

## Document Status

**Version:** 1.0  
**Last Updated:** January 14, 2026  
**Total Test Cases:** 300+  
**Coverage:** All 11 features + cross-feature + performance + security + mobile + accessibility

**Next Steps:**
1. Review test cases with development team
2. Prioritize test cases for MVP
3. Set up test automation framework
4. Begin test implementation
5. Execute tests during development

---

*This document serves as the comprehensive test plan for AKOMAYLESSONPLANNA. All test cases should be implemented and executed before production deployment.*
