# Feature 01: Authentication & User Management - Design Decisions

**Date:** January 11, 2026
**Feature:** Authentication & User Management
**Status:** ✅ DESIGN COMPLETE - Ready for Implementation

---

## Overview

This document captures all decisions made during the brainstorming session for Feature 01: Authentication & User Management for AKOMAYLESSONPLANNA.

---

## Decisions Made

### 1. User Registration ✅

**Decision:** No email verification upfront. Email verification required ONLY for sellers before uploading first product.

**Rationale:**
- Reduces signup friction for buyers
- Allows immediate browsing and purchasing
- Maintains quality control for sellers
- Sellers must verify before any selling activity

**Implementation Notes:**
- Buyers can browse and purchase immediately
- "Unverified" badge shown until verification
- Verification required when:
  - Seller tries to upload first product
- Gentle in-UI reminders until verified

---

### 2. Social Login Strategy ✅

**Decision:** Email/Password PRIMARY + Google & Facebook OAuth as alternatives

**UI Priority:**
1. Google OAuth (largest button - most popular)
2. Facebook OAuth (medium button)
3. Email/Password (link "Sign up with email" or smaller option)

**Rationale:**
- Universal access (not everyone has social accounts)
- 80%+ of Filipinos use Gmail
- Facebook still dominant in PH (80%+ penetration)
- Proven model (Teachers Pay Teachers)
- Accommodates privacy-conscious users

---

### 3. User Roles & Permissions ✅

**Decision:** Single role system - Buyers can become Sellers while keeping all buyer abilities

**Database Schema:**
```typescript
role: 'buyer' | 'seller' | 'admin'
is_verified_teacher: boolean
can_sell: boolean  // true only after teacher verification
```

**User Journey:**
1. **Initial signup:** Role = `buyer`, `can_sell = false`
2. **After PRC verification:** Role = `seller`, `can_sell = true`
3. **Sellers retain all buyer abilities:**
   - Can browse marketplace ✅
   - Can add items to cart ✅
   - Can purchase from other sellers ✅
   - Can leave reviews ✅
   - Can follow other sellers ✅
   - PLUS: Can upload their own products ✅

**Rationale:**
- Reflects reality (teachers buy from each other)
- Marketplace health (sellers buying = more transactions)
- Teachers Pay Teachers model
- No artificial restrictions

---

### 4. Teacher Verification Process ✅

**Decision:** Manual admin approval - PRC ID only

**Accepted Documents:**
- ✅ PRC License (Professional Regulation Commission) ONLY
- ❌ UMID ID (not accepted)
- ❌ School ID (not accepted)
- ❌ DepEd ID (not accepted)

**Process:**
1. User clicks "Become a Seller"
2. Uploads PRC ID (PDF/JPG/PNG)
3. Admin encodes:
   - PRC license number
   - License expiration date
4. **User can browse marketplace while waiting** ✅
5. **Cannot upload products yet** ❌
6. Admin reviews (24-48 hours)
7. Approve → "Verified Teacher" badge ✅ + can upload
8. Reject → Explain why, user can re-upload (max 3 attempts)

**License Renewal:**
- License validity: 3 years
- Grace period: 1 month after expiration
- After grace period: Account suspended until re-verification
- Admin encodes expiration date during initial verification

**Database Fields:**
```typescript
verification_status: 'pending' | 'verified' | 'rejected' | 'expired'
prc_license_number: string
prc_license_expiry: date
verification_grace_period_ends: date
```

**Rationale:**
- Highest quality control (licensed professional teachers only)
- PRC ID is most reliable proof
- Manual review prevents fake teachers
- 3 attempts prevents spam

---

### 5. Session Management & Login Experience ✅

**Decision:** "Remember Me" toggle (simplified)

**Features:**
- ✅ "Remember me" checkbox (unchecked by default for security)
- ✅ Remembered sessions: 90 days
- ✅ Not remembered: Browser session only

**Features REMOVED (decided against):**
- ❌ "Logout from all devices"
- ❌ Show active sessions list
- ❌ Inactivity timeout
- ❌ Suspicious login warnings

**Rationale:**
- User control without complexity
- 90 days is generous (users hate re-login)
- Simple implementation
- Unchecked by default for shared device security

---

### 6. Account Recovery & Security ✅

**Decision A - Password Reset:** Email password reset
- User clicks "Forgot password"
- Email sent with reset link (expires in 1 hour)
- User sets new password

**Decision B - Email Change:** Verify new email
- User enters new email
- Confirmation sent to NEW email
- User clicks link to confirm

**Decision C - Account Deletion:** 30-day grace period
- User requests deletion
- Account marked for deletion
- 30 days to cancel request
- After 30 days: permanent deletion

**Decision D - Data Retention:** Your recommendation
- Purchases: Keep for 7 years (tax/legal)
- Sales records: Keep for 7 years (tax/legal)
- Teacher ID: Delete immediately
- Messages: Delete after account deletion
- Reviews: Keep but show "Deleted user"

**Rationale:**
- Industry standard practices
- GDPR-compliant
- Tax compliance (7-year financial records)
- Privacy-focused (personal data deleted)

---

### 7. Security Features ✅

**Decision A - 2FA:** No 2FA initially (add later if needed)
- Skip 2FA for MVP
- Can add post-launch if security incidents occur
- Teachers Pay Teachers doesn't have 2FA
- Reduces complexity and support burden

**Decision B - Login Attempt Limits:** 5 failed attempts = 30-minute lockout
- After 5 failed passwords: lock account for 30 minutes
- Show countdown timer
- Email notification about suspicious activity
- Prevents brute force attacks
- Industry standard security

**Decision C - CAPTCHA:** CAPTCHA on signup only
- Google reCAPTCHA v3 (invisible)
- Only shows on suspicious activity
- No CAPTCHA on login
- Stops bot account creation
- Minimal friction for real users

**Rationale:**
- Balanced security without UX burden
- Standard e-commerce practices
- Keeps signup simple while preventing abuse

---

### 8. User Profile Fields ✅

**Decision A - Signup Fields:** Minimal (email, password, name only)
- Fastest signup
- Lowest friction
- Progressive data collection later

**Decision B - Optional Profile Fields:** Rich profile (your recommendation)
- ✅ Profile picture/avatar
- ✅ Bio (teaching experience, philosophy)
- ✅ Subjects taught (Math, Science, English, etc.)
- ✅ Grade levels taught (Kinder, Grade 1-12)
- ✅ Location (city/region - for search filtering)
- ✅ Social links (Facebook, Instagram)
- ❌ School name (privacy concern - teachers prefer anonymity)

**Decision C - Pro/Pioneer Profiles:** Enhanced profiles
- Custom banner/header image
- Custom accent colors
- Longer about section
- Featured products section
- Premium feel, incentivizes upgrades
- Teachers Pay Teachers Premium model

**Rationale:**
- Minimal signup = maximum conversions
- Rich profiles = better marketplace
- Enhanced profiles = subscription incentive
- Privacy-conscious (no school name)

---

### 9. Onboarding Flow & Progressive Profiling ✅

**Decision:** Multi-step onboarding (Option A) with modifications

**Onboarding Flow:**

**Step 1: Quick Signup**
```
Name: _____________
Email: _____________
Password: _____________
[Sign Up with Google] [Sign Up with Facebook]
```

**Step 2: Choose Your Journey** (can skip) - MODIFIED
```
What brings you to AKOMAYLESSONPLANNA?
[ ] I want to BUY lesson plans
[ ] I want to SELL lesson plans
[NOTE: "Both" button removed - single role system]
```

**Step 3a: If buyer → Quick Welcome Tour** (can skip)
- Browse products
- How library works
- Can skip to marketplace

**Step 3b: If seller → PRC ID Upload**
```
Upload your PRC License: [Browse]
License Number: _____________
Expiration Date: [Date picker]
```

**Step 4: Complete Your Profile** (optional, can do later)
```
Profile picture: [Upload]
Bio: Tell us about your teaching journey...
Subjects taught: [✓Math ✓Science]
Grade levels: [✓Grade 7 ✓Grade 8]
Location: Cebu City
```

**Step 5: Welcome Dashboard**
- If seller: "Your account is under review (24-48 hours)"
- If buyer: "Start browsing!"

**Progressive Profiling (for sellers):**
- Can browse while waiting for verification ✅
- Prompt for profile info before first upload ✅
- Email tips: "Complete your profile to get more sales!" ✅

**Modification from original:**
- Removed "Both" button (no longer needed with single role system)
- Users can still do both actions (buy + sell) with seller role

**Rationale:**
- Guided experience reduces confusion
- Clear progression
- Collects needed info at right time
- Can skip non-essential steps

---

### 10. Technical Implementation ✅

**Decision:** Use Supabase Auth with custom implementation

**Tech Stack:**
- **Authentication:** Supabase Auth (built-in)
- **Session Management:** httpOnly cookies (Supabase default)
- **OAuth:** Supabase Social Auth (Google + Facebook)
- **Password Security:** Supabase handles hashing (bcrypt)
- **Middleware:** Next.js middleware for protected routes
- **JWT Tokens:** Supabase manages automatically

**Implementation Approach:**
- Use Supabase Auth Helpers for Next.js
- Server-side authentication (Server Actions)
- Client-side auth state management (React Context)
- Protected route middleware
- Row Level Security (RLS) for data access

**Key Libraries:**
- `@supabase/supabase-js` - Supabase client
- `@supabase/auth-helpers-nextjs` - Next.js auth helpers
- React Context - Auth state management
- Zod - Input validation

---

## Database Schema Updates

### `users` Table

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255),  -- Null for OAuth users
  name VARCHAR(255) NOT NULL,
  avatar_url TEXT,

  -- Role & Permissions
  role VARCHAR(20) CHECK (role IN ('buyer', 'seller', 'admin')) DEFAULT 'buyer',
  is_verified_teacher BOOLEAN DEFAULT false,
  can_sell BOOLEAN DEFAULT false,

  -- Profile
  bio TEXT,
  subjects_taught TEXT[],  -- ['Math', 'Science']
  grade_levels_taught TEXT[],  -- ['Grade 7', 'Grade 8']
  location VARCHAR(255),  -- City/region
  social_links JSONB,  -- {facebook: '', instagram: ''}

  -- Subscription
  subscription_tier VARCHAR(20) CHECK (subscription_tier IN ('free', 'pro', 'pioneer')) DEFAULT 'free',
  custom_commission_rate DECIMAL(5,2),
  is_pioneer BOOLEAN DEFAULT false,

  -- Payment
  gcash_number VARCHAR(20),
  maya_number VARCHAR(20),

  -- Admin
  is_banned BOOLEAN DEFAULT false,
  ban_reason TEXT,

  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_verification ON users(is_verified_teacher);
```

### `teacher_id_verifications` Table

```sql
CREATE TABLE teacher_id_verifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- PRC License Info
  document_url TEXT NOT NULL,  -- Supabase Storage URL
  prc_license_number VARCHAR(50) NOT NULL,
  prc_license_expiry DATE NOT NULL,
  verification_grace_period_ends DATE,

  -- Status
  status VARCHAR(20) CHECK (status IN ('pending', 'approved', 'rejected')) DEFAULT 'pending',
  rejection_reason TEXT,

  -- Admin Review
  reviewed_by UUID REFERENCES users(id),
  reviewed_at TIMESTAMP,

  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_verifications_user ON teacher_id_verifications(user_id);
CREATE INDEX idx_verifications_status ON teacher_id_verifications(status);
```

### `user_sessions` Table (Optional - for advanced session management)

```sql
CREATE TABLE user_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token VARCHAR(255) NOT NULL,
  remember_me BOOLEAN DEFAULT false,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_sessions_user ON user_sessions(user_id);
CREATE INDEX idx_sessions_token ON user_sessions(token);
CREATE INDEX idx_sessions_expires ON user_sessions(expires_at);
```

---

## API Endpoints

### Authentication

```
POST /api/auth/signup
  - Body: { email, password, name }
  - Response: { user, session }
  - Email verification: Not sent (deferred)

POST /api/auth/login
  - Body: { email, password, rememberMe? }
  - Response: { user, session }
  - Rate limiting: 5 attempts → 30min lockout

POST /api/auth/google
  - OAuth flow
  - Response: { user, session }

POST /api/auth/facebook
  - OAuth flow
  - Response: { user, session }

POST /api/auth/logout
  - Clears session cookie
  - Response: { success: true }

GET /api/auth/me
  - Returns current user
  - Response: { user, role, permissions }

POST /api/auth/forgot-password
  - Body: { email }
  - Sends reset email (link expires 1hr)

POST /api/auth/reset-password
  - Body: { token, newPassword }
  - Updates password
```

### User Management

```
GET /api/users/:id
  - Get public user profile
  - Response: { name, bio, avatar, subjects, grades, role }

PUT /api/users/:id
  - Auth required (own profile only)
  - Body: { name?, bio?, subjects_taught?, grade_levels_taught?, location?, social_links? }
  - Response: { updated_user }

POST /api/users/verify-teacher
  - Auth required
  - FormData: { document, prc_license_number, prc_license_expiry }
  - Response: { verification_id, status: 'pending' }

GET /api/users/:id/verification-status
  - Auth required (own profile only)
  - Response: { status, rejection_reason?, grace_period_ends? }

DELETE /api/users/:id
  - Auth required (own account only)
  - Starts 30-day deletion process
  - Response: { will_delete_at: date }

POST /api/users/:id/cancel-deletion
  - Auth required (own account only)
  - Cancels pending deletion
  - Response: { success: true }
```

---

## Implementation Checklist

### Phase 1: Core Authentication

- [ ] Set up Supabase Auth
- [ ] Create users table schema
- [ ] Implement email/password signup
- [ ] Implement email/password login
- [ ] Add "remember me" functionality (90 days)
- [ ] Implement rate limiting (5 attempts = 30min lockout)
- [ ] Add CAPTCHA to signup (reCAPTCHA v3)
- [ ] Create protected route middleware
- [ ] Test authentication flow

### Phase 2: Social Login

- [ ] Configure Google OAuth in Supabase
- [ ] Configure Facebook OAuth in Supabase
- [ ] Implement OAuth callback handling
- [ ] Create OAuth signup/login UI
- [ ] Test OAuth flows

### Phase 3: User Profiles

- [ ] Create user profile pages
- [ ] Implement profile editing
- [ ] Add avatar upload (Supabase Storage)
- [ ] Create profile completion prompts
- [ ] Implement Pro/Pioneer enhanced profiles
- [ ] Test profile management

### Phase 4: Teacher Verification

- [ ] Create teacher_id_verifications table
- [ ] Build file upload for PRC ID
- [ ] Create admin verification queue
- [ ] Implement approve/reject workflow
- [ ] Add license expiration tracking
- [ ] Create re-verification flow
- [ ] Build email notifications
- [ ] Test verification process

### Phase 5: Account Recovery

- [ ] Implement forgot password flow
- [ ] Create password reset emails
- [ ] Build reset password page
- [ ] Implement email change verification
- [ ] Create account deletion request
- [ ] Build 30-day grace period logic
- [ ] Add deletion cancelation
- [ ] Test recovery flows

### Phase 6: Security & Compliance

- [ ] Implement Row Level Security (RLS) policies
- [ ] Add httpOnly cookie security
- [ ] Implement CSRF protection
- [ ] Add email notification for suspicious logins
- [ ] Create security logging
- [ ] Audit RLS policies
- [ ] Security testing

### Phase 7: Onboarding Flow

- [ ] Create multi-step signup wizard
- [ ] Build "Choose your journey" step
- [ ] Create welcome tour (skippable)
- [ ] Implement PRC upload step
- [ ] Build profile completion step
- [ ] Create welcome dashboard
- [ ] Add progressive profiling prompts
- [ ] Test onboarding flow

---

## Testing Checklist

### Authentication

- [ ] Signup with email/password
- [ ] Login with email/password
- [ ] Login with Google OAuth
- [ ] Login with Facebook OAuth
- [ ] "Remember me" persists for 90 days
- [ ] Session expires when remember me unchecked
- [ ] Rate limiting works (5 attempts → lockout)
- [ ] CAPTCHA shows on suspicious signup
- [ ] Logout clears session
- [ ] Protected routes redirect unauthenticated users

### Password Reset

- [ ] Forgot password sends email
- [ ] Reset link expires in 1 hour
- [ ] Reset password works
- [ ] Old password no longer works

### User Profiles

- [ ] View own profile
- [ ] Edit profile
- [ ] Upload avatar
- [ ] View other user profiles
- [ ] Pro/Pioneer profiles show enhanced features

### Teacher Verification

- [ ] Upload PRC ID
- [ ] Admin sees verification queue
- [ ] Admin can approve
- [ ] Admin can reject with reason
- [ ] User receives approval notification
- [ ] User receives rejection notification
- [ ] Verified seller can upload products
- [ ] Unverified seller cannot upload
- [ ] License expiration tracking works
- [ ] Re-verification flow after grace period

### Account Deletion

- [ ] Request deletion starts 30-day timer
- [ ] Can cancel deletion within 30 days
- [ ] After 30 days account permanently deleted
- [ ] Financial data retained for 7 years
- [ ] Personal data deleted

### Security

- [ ] Buyers cannot access admin routes
- [ ] Unverified sellers cannot upload
- [ ] RLS policies enforce data access
- [ ] httpOnly cookies secure session
- [ ] CSRF protection works

---

## Next Steps

1. ✅ All design decisions finalized
2. ⏭️ Create detailed implementation plan
3. ⏭️ Set up Supabase project
4. ⏭️ Begin Phase 1: Core Authentication
5. ⏭️ Update design document with final decisions

---

## Dependencies

This feature (Authentication & User Management) MUST be completed before:
- Feature 03: User Profiles (depends on auth)
- Feature 04: Product Upload (requires verified seller)
- Feature 07: Shopping Cart (requires authenticated users)
- Feature 08: Checkout Flow (requires authenticated users)
- All other features requiring user accounts

---

## Notes

- Email verification deferred until seller wants to upload (reduces friction)
- Single role system (seller = buyer + selling abilities)
- PRC ID only for teacher verification (highest quality)
- 90-day "remember me" sessions (user convenience)
- No 2FA initially (MVP simplicity)
- Manual admin approval for teacher verification
- 30-day grace period for account deletion
- Enhanced profiles for Pro/Pioneer tier (subscription incentive)

---

**Status:** ✅ Ready for Implementation
**Next Action:** Create detailed implementation plan with database migrations and API routes
**Estimated Time:** 2-3 weeks (Phase 1 of development)

---

*All decisions documented. Ready to proceed with implementation planning.*
