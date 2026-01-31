# AKOMAYLESSONPLANNA - Master Implementation Plan

**Version:** 1.0
**Date:** January 14, 2026
**Status:** Ready for Implementation
**Developer:** Solo Developer (Sequential Implementation)
**Timeline:** Flexible (Quality over Speed)
**Scope:** Full 11-Feature MVP

---

## Table of Contents

0. [Design Alignment & Source Documents](#0-design-alignment--source-documents)
1. [Tech Stack Verification](#1-tech-stack-verification)
2. [Architecture Overview](#2-architecture-overview)
3. [Implementation Order](#3-implementation-order)
4. [Cross-Feature Shared Components](#4-cross-feature-shared-components)
5. [Database Migration Strategy](#5-database-migration-strategy)
6. [State Management Strategy](#6-state-management-strategy)
7. [API Route Structure](#7-api-route-structure)
8. [Authentication Flow](#8-authentication-flow)
9. [File Upload Strategy](#9-file-upload-strategy)
10. [Testing Strategy](#10-testing-strategy)
11. [Performance Optimization Strategy](#11-performance-optimization-strategy)
12. [Error Handling & Logging](#12-error-handling--logging)
13. [Deployment Strategy](#13-deployment-strategy)
14. [Documentation Requirements](#14-documentation-requirements)
15. [Launch Checklist](#15-launch-checklist)
16. [Risk Assessment & Mitigation](#16-risk-assessment--mitigation)

---

## 0. Design Alignment & Source Documents

### ⚠️ Critical Rule

**ALWAYS read the brainstorming file BEFORE implementing any feature.**

The master plan is an execution **GUIDE** - the brainstorming files contain the actual **REQUIREMENTS**.

### Source Documents Hierarchy

| Tier | Document | Purpose | When to Use |
|------|----------|---------|-------------|
| 1 (PRIMARY) | `docs/brainstorming/*.md` | Actual design decisions | FIRST - before any feature |
| 2 | `docs/brainstorming/2025-01-09-*-complete-design-summary.md` | Overall architecture | Understanding cross-features |
| 3 | `docs/implementationplan/database-schema-complete.md` | Database structure | Before any DB operations |
| 4 | This document | Execution instructions | During implementation |

### Brainstorming Files Reference Table

| Feature | Brainstorming File | Key Decisions | Last Updated |
|---------|-------------------|---------------|--------------|
| Planning | `1-project-planning-mcp-setup-and-development-strategy.md` | 7 phases, MCP servers, 8-10 mo timeline | Jan 10, 2026 |
| Feature 01 | `2-feature-01-authentication-user-management.md` | No email verification for buyers (line 19) | Jan 11, 2026 |
| Feature 02 | `3-feature-02-user-profiles-and-profile-management.md` | Open profiles, badge system | Jan 11, 2026 |
| Feature 02 Align | `4-feature-02-design-alignment-and-documentation-review.md` | Username field added (line 98), responsive specs | Jan 11, 2026 |
| Feature 03 | `5-feature-03-product-listings-and-management.md` | 5-step upload wizard | TBD |
| Feature 04 | `6-feature-04-shopping-cart-and-checkout-flow.md` | One copy per product limit | TBD |
| Feature 05 | `7-feature-05-reviews-and-ratings.md` | 5-star system, moderation | TBD |
| Feature 06 | `8-feature-06-social-features.md` | Notifications, sharing | TBD |
| Feature 07 | `9-feature-07-seller-dashboard-and-analytics.md` | Dashboard, analytics, earnings | TBD |
| Feature 08 | `10-feature-08-advanced-search-and-discovery.md` | Full-text search, filters | TBD |
| Feature 09 | `11-feature-09-admin-panel-and-content-moderation.md` | Moderation, user management | TBD |
| Feature 12 | `12-feature-10-email-system-transactional-and-notification-emails.md` | 26 email types | TBD |
| Feature 13 | `13-feature-11-messaging-system.md` | Buyer-seller messaging | TBD |

### Mandatory Workflow

**Before implementing ANY feature, follow this workflow:**

```
Step 1: READ the brainstorming file
   → Understand what was decided
   → Note lines with ✅ (decisions) and ⚠️ (warnings)
   → Extract constraints and requirements

Step 2: CHECK the database schema
   → Verify tables exist: `supabase db inspect --table <table>`
   → Verify columns exist: `supabase db inspect --table <table> --column <column>`
   → Review RLS policies if needed

Step 3: FOLLOW this master plan
   → Execute with pre-flight checks
   → Follow step-by-step instructions
   → Run verification commands
   → Ensure alignment with brainstorming decisions

Step 4: VALIDATE against brainstorming
   → Ensure implementation matches decisions
   → Run post-implementation checks
   → Test all constraints are respected
```

### Conflict Resolution

**⚠️ If there's a conflict between this master plan and brainstorming files:**

1. **The BRAINSTORMING FILE wins** - it contains the actual design decisions
2. Update the master plan to align with brainstorming
3. Document the discrepancy for future reference

**Common conflicts to watch for:**
- Email verification requirements (buyers vs sellers)
- OAuth button order (Google first, then Facebook)
- Component choice (local registry vs online)
- Database table usage (public vs auth)

---

## 1. Tech Stack Verification

### Actual Stack (from package.json)

**Framework:**
- Next.js 16.1.1 (App Router)
- React 19.2.3
- React DOM 19.2.3

**UI Components:**
- @base-ui/react 1.0.0 (NOT Radix UI)
- shadcn 3.6.3
- Local registry at `registry/` (NOT online)

**Styling:**
- Tailwind CSS 4
- @tailwindcss/postcss 4
- tw-animate-css 1.4.0

**Icons:**
- lucide-react 0.562.0

**Auth (Supabase):**
- @supabase/ssr (NOT deprecated @supabase/auth-helpers-nextjs)
- Use `createClient()` from `@/lib/supabase/server` in API routes and server components; use `createServerClient` from `@supabase/ssr` in middleware with cookie get/set

**Utilities:**
- class-variance-authority 0.7.1
- clsx 2.1.1
- tailwind-merge 3.4.0

### ⚠️ Common Stack Confusions (AVOID THESE)

| ❌ WRONG | ✅ CORRECT | How to Verify |
|---------|-----------|---------------|
| TanStack Query | Next.js `fetch` / `use server` | `cat package.json \| grep next` |
| TanStack Router | Next.js App Router | `ls app/` - see route groups |
| @supabase/auth-helpers-nextjs | @supabase/ssr | `cat package.json \| grep supabase` - use createClient from lib/supabase/server |
| @radix-ui/* | @base-ui/react | `cat components.json` |
| Online shadcn registry | Local registry at `registry/` | `ls registry/registry.json` |
| React Query patterns | Server Components | Check for `async function` in app/ |
| Radix primitives | @base-ui/react primitives | Check imports |

### Verification Commands

```bash
# Verify actual installed packages
cat package.json | grep -A 20 "dependencies"

# Check for WRONG packages (should return nothing or error)
npm list @tanstack/react-query 2>/dev/null && echo "❌ WRONG: TanStack Query installed" || echo "✅ Correct: Not using TanStack"
npm list @tanstack/router 2>/dev/null && echo "❌ WRONG: TanStack Router installed" || echo "✅ Correct: Using Next.js"
npm list @radix-ui/react-button 2>/dev/null && echo "❌ WRONG: Radix UI installed" || echo "✅ Correct: Using @base-ui/react"
npm list @supabase/auth-helpers-nextjs 2>/dev/null && echo "❌ WRONG: Use @supabase/ssr instead" || echo "✅ Correct: Using @supabase/ssr"

# Verify local registry exists
test -f registry/registry.json && echo "✅ Local registry exists" || echo "❌ Local registry missing"

# Check components.json for style
cat components.json | grep '"style"' && echo "Should show 'base-mira' or similar"
```

### Data Fetching Pattern

**✅ CORRECT: Next.js Server Components**

```typescript
// app/products/page.tsx (Server Component)
async function getProducts() {
  const supabase = createClient()
  const { data } = await supabase.from('products').select('*')
  return data
}

export default async function ProductsPage() {
  const products = await getProducts()
  return <ProductList products={products} />
}
```

**❌ WRONG: TanStack Query Pattern**

```typescript
// DON'T DO THIS (TanStack Query not installed)
// const { data } = useQuery(['products'], fetchProducts)
```

### Component Pattern

**✅ CORRECT: Using Local Registry**

```bash
# Install from LOCAL registry
npx shadcn@latest add button --registry ./registry/registry.json

# Then import
import { Button } from '@/components/ui/button'
```

**❌ WRONG: Using Online Registry**

```bash
# DON'T DO THIS
# npx shadcn@latest add button  # Uses online registry
```

### Instruction Pattern for Cursor

**When implementing ANY feature, ALWAYS:**

1. **Check dependencies first** - Run `cat package.json` to see what's installed
2. **Verify components exist** - Run `ls components/ui/` and `ls registry/default/`
3. **Use local registry** - Run `npx shadcn add <name> --registry ./registry/registry.json`
4. **Reference existing patterns** - Check similar components before creating new ones
5. **Verify database schema** - Run `supabase db inspect --table <table>` before querying
6. **Read brainstorming file** - Always read design requirements first

---

## 2. Architecture Overview

> **Note:** For the actual, verified tech stack and verification commands, see [Section 1: Tech Stack Verification](#1-tech-stack-verification).

### Project Structure

```
akomaylessonplanna/
├── app/
│   ├── (auth)/                    # Authentication route group
│   │   ├── login/
│   │   ├── signup/
│   │   ├── verify-email/
│   │   └── layout.tsx            # Auth layout (minimal header)
│   │
│   ├── (buyer)/                   # Buyer route group
│   │   ├── products/
│   │   │   ├── [id]/             # Product detail
│   │   │   ├── search/           # Search results
│   │   │   └── page.tsx          # Product listing
│   │   ├── search/
│   │   ├── cart/
│   │   ├── checkout/
│   │   ├── library/              # Purchased items
│   │   ├── wishlist/
│   │   └── layout.tsx            # Buyer layout (full header)
│   │
│   ├── (seller)/                 # Seller route group
│   │   ├── dashboard/
│   │   │   ├── overview/
│   │   │   ├── products/
│   │   │   ├── orders/
│   │   │   ├── earnings/
│   │   │   ├── analytics/        # Pro/Pioneer
│   │   │   └── layout.tsx        # Dashboard sidebar layout
│   │   ├── products/
│   │   │   ├── new/              # Upload wizard
│   │   │   └── [id]/edit/
│   │   └── profile/[username]/   # Public seller profile
│   │
│   ├── (admin)/                  # Admin route group
│   │   ├── admin/
│   │   │   ├── dashboard/
│   │   │   ├── users/
│   │   │   ├── products/
│   │   │   ├── reviews/
│   │   │   ├── financials/       # Super Admin only
│   │   │   ├── settings/
│   │   │   └── layout.tsx        # Admin sidebar layout
│   │
│   ├── api/                      # API routes
│   │   ├── auth/
│   │   ├── products/
│   │   ├── checkout/
│   │   ├── webhook/              # GCash/Maya webhooks
│   │   ├── dashboard/
│   │   ├── messages/
│   │   ├── search/
│   │   └── admin/
│   │
│   ├── layout.tsx                # Root layout
│   ├── page.tsx                  # Homepage
│   ├── globals.css
│   └── error.tsx                 # Error boundary
│
├── components/
│   ├── ui/                       # shadcn/ui components (40+)
│   ├── auth/                     # Auth-specific components
│   ├── products/                 # Product components
│   ├── checkout/                 # Checkout components
│   ├── dashboard/                # Dashboard components
│   ├── messaging/                # Messaging components
│   ├── shared/                   # Cross-feature shared components
│   └── layout/                   # Layout components
│
├── lib/
│   ├── supabase/
│   │   ├── client.ts             # Browser client
│   │   ├── server.ts             # Server client
│   │   ├── admin.ts              # Service role client
│   │   └── types.ts              # Generated types
│   ├── hooks/                    # Custom React hooks
│   ├── utils/                    # Utility functions
│   ├── validations/              # Zod schemas
│   └── constants/                # App constants
│
├── types/                        # TypeScript types
├── hooks/                        # Custom React hooks
├── middleware.ts                 # Auth middleware
│
└── supabase/
    ├── migrations/               # SQL migrations
    └── seed.sql                  # Seed data
```

### Key Architectural Decisions

1. **Route Groups** - Separate layouts for auth, buyer, seller, admin
2. **Shared Components First** - Invest heavily in reusable components
3. **Custom Hooks** - All business logic in hooks, NOT in components
4. **TypeScript Strict** - Full type safety with Supabase generated types
5. **Server Components** - Use Next.js 16 Server Components by default
6. **API Layer** - Server Actions for mutations, API routes for webhooks

---

## 3. Implementation Order

Based on dependencies, user journey, and complexity considerations for a solo developer.

### Phase 1: Foundation (Weeks 1-2)

**Priority: CRITICAL - Must be completed first**

1. **Project Setup**
   - Initialize Next.js 16 with TypeScript
   - Install and configure shadcn/ui
   - Set up Tailwind CSS
   - Configure ESLint + Prettier
   - Set up Supabase project
   - Configure environment variables

2. **Database Foundation**
   - Enable PostgreSQL extensions (uuid-ossp, pg_trgm)
   - Create ENUM types
   - Create core tables (users, grades, subjects)
   - Set up RLS policies
   - Create indexes
   - Seed initial data (grades, subjects)

3. **Authentication System (Feature 01)**
   - Supabase Auth configuration
   - Login/Signup pages
   - Email verification
   - Password reset flow
   - Session management
   - Protected routes middleware
   - User profile completion tracking

**Deliverable:** Users can register, verify email, and log in

---

### Phase 2: Core Commerce (Weeks 3-6)

**Priority: HIGH - Core marketplace functionality**

4. **User Profiles (Feature 02)**
   - Profile creation and editing
   - Profile page layout
   - Badge system (Verified, Pro, Pioneer)
   - Follow system
   - Profile analytics (views, followers)
   - Seller search/discovery

5. **Product Listings (Feature 03)**
   - Multi-step product upload wizard (5 steps)
   - Product detail pages (hybrid layout)
   - Homepage with sections (hero, featured, new, trending)
   - Advanced filtering (8 filter types)
   - Automatic preview generation
   - Version management system
   - Product status workflow (6 states)

6. **Shopping Cart & Checkout (Feature 04)**
   - Shopping cart (one copy per product)
   - Wishlist (heart icon)
   - Multi-step checkout (2 steps)
   - GCash payment integration
   - Maya payment integration
   - Order confirmation
   - Download library
   - Refund system (7-day window)

**Deliverable:** Complete e-commerce flow (browse → cart → checkout → download)

---

### Phase 3: Engagement & Trust (Weeks 7-9)

**Priority: HIGH - Social proof and platform health**

7. **Reviews & Ratings (Feature 05)**
   - 5-star rating system
   - Review submission (after download only)
   - Seller responses
   - Review summary card
   - Automatic flagging system
   - Admin moderation queue
   - 7-day edit window

8. **Social Features (Feature 06)**
   - In-app notifications (bell icon)
   - Email notification preferences
   - Social sharing (Facebook, Messenger, Copy Link)
   - Recently viewed items
   - Social proof badges (Trending, Bestseller)

**Deliverable:** Users can review products, get notifications, share content

---

### Phase 4: Seller Tools & Discovery (Weeks 10-13)

**Priority: HIGH - Seller experience and platform growth**

9. **Seller Dashboard (Feature 07)**
   - Dashboard overview (revenue, sales, views, rating)
   - Product management (grid view, bulk actions, duplicate)
   - Order history with buyer insights
   - Earnings tracker (available, pending, lifetime)
   - Withdrawal system (₱500 minimum)
   - Tiered analytics (Free vs Pro/Pioneer)
   - Export reports (CSV for Free, Excel/PDF for Pro)

10. **Advanced Search (Feature 08)**
    - PostgreSQL full-text search
    - Search autocomplete (8 suggestions)
    - Advanced filters (11 filter types)
    - Search results page (grid + list toggle)
    - Category pages with SEO
    - Product recommendations (multi-strategy)
    - Search analytics for sellers
    - Lazy loading for performance

**Deliverable:** Sellers can manage business, buyers can discover products easily

---

### Phase 5: Platform Management (Weeks 14-17)

**Priority: HIGH - Platform health and communication**

11. **Admin Panel (Feature 09)**
    - Dashboard overview (metrics, charts, activity feed)
    - User management (all users, verification queue, banned users)
    - Product moderation (pending reviews, all products, rejected)
    - Content moderation (flagged reviews, user reports)
    - Pioneer management (20-slot limit)
    - Financial overview (Super Admin only)
    - System announcements (rich text editor)
    - Settings (platform, feature flags, email, payments)
    - Admin roles (Super Admin, Moderator, Content Manager)

12. **Email System (Feature 12)**
    - Supabase Auth emails (4 types - built-in)
    - Resend integration (transactional emails)
    - Email queue system with retry logic
    - Template editor (rich text, variables)
    - 26 email types total
    - Admin configuration panel
    - Email analytics dashboard
    - SPF/DKIM/DMARC setup

**Deliverable:** Admins can manage platform, automated email communications

---

### Phase 6: Communication & Final Polish (Weeks 18-20)

**Priority: MEDIUM - Enhanced user experience**

13. **Messaging System (Feature 13)**
    - Buyer-seller messaging
    - Conversations (product-linked)
    - Polling for real-time (30-second intervals)
    - Quick reply templates (5 system + 5 custom for Pro)
    - Blocking and reporting
    - Auto-flagging (external links, profanity)
    - Admin dispute resolution
    - Image attachments (3 images, 5MB each)

14. **Final Integration & Polish**
    - Cross-feature integration testing
    - Mobile responsiveness optimization
    - Performance optimization
    - Error handling refinement
    - Comprehensive testing
    - Documentation completion

**Deliverable:** Complete, polished platform ready for launch

---

### Implementation Order Summary

| Phase | Features | Weeks | Milestone |
|-------|----------|-------|-----------|
| 1 | Setup + Auth (01) | 1-2 | Users can register and login |
| 2 | Profiles (02) + Products (03) + Cart (04) | 3-6 | Complete e-commerce flow |
| 3 | Reviews (05) + Social (06) | 7-9 | Social proof and notifications |
| 4 | Dashboard (07) + Search (08) | 10-13 | Seller tools + discovery |
| 5 | Admin (09) + Email (12) | 14-17 | Platform management |
| 6 | Messaging (13) + Polish | 18-20 | Launch-ready platform |

**Total Estimated Time:** 20 weeks (5 months)

**Parallel Development Opportunities:**
- While payment integration is complex, other features can proceed
- Admin panel can be developed alongside seller dashboard (shared components)
- Email templates can be created while other features are in development

**Critical Path (Must Be Sequential):**
1. Foundation → Auth → Profiles → Products → Cart/Checkout (Core commerce)
2. Reviews → Social Features (Engagement)
3. Seller Dashboard → Admin Panel (Management tools)

---

## 4. Cross-Feature Shared Components

Invest heavily in these components first. They'll be used throughout the platform.

### UI Components (shadcn/ui Base)

Install all shadcn/ui components upfront:
- Button, Input, Card, Dialog/Modal, Dropdown Menu
- Form components (Label, Select, Checkbox, Radio, Switch)
- Table, Tabs, Badge, Avatar, Separator
- Toast notifications (Sonner)
- Tooltip, Alert, Alert Dialog

### Custom Shared Components

**High Priority (Build Early):**

1. **ProductCard** (Most Important)
   - Used by: Homepage, Search, Category pages, Wishlist, Profile
   - Shows: Thumbnail, title, price, rating, stats, badges
   - Actions: Add to cart, wishlist, quick view
   - Responsive: 2/3/4 columns (mobile/tablet/desktop)

2. **UserProfileCard**
   - Used by: Header, Seller profile, Reviews, Messages
   - Shows: Avatar, name, badges, bio, stats, follow button
   - Link to full profile

3. **ReviewCard**
   - Used by: Product page, Reviews page, Seller profile
   - Shows: Rating, comment, date, author, helpful count
   - Seller response

4. **SearchBar**
   - Used by: Header, Search page, Admin
   - Features: Autocomplete, search history, recent searches
   - Mobile: Full-screen on focus

5. **Pagination**
   - Used by: All list views (products, orders, reviews, users)
   - Features: Page numbers, prev/next, items per page
   - Mobile: Load more button (infinite scroll optional for Pro)

6. **FilterSidebar**
   - Used by: Search, Category pages
   - Features: Collapsible sections, active filters display, clear all
   - Mobile: Slide-out drawer

7. **ShareButtons**
   - Used by: Product page, Profile page
   - Platforms: Facebook, Messenger, Copy Link
   - Analytics tracking

### Layout Components

8. **Header**
   - Navigation links (Home, Products, Browse Sellers)
   - Search bar
   - User menu (avatar dropdown)
   - Notification bell
   - Cart icon with badge count
   - Mobile: Hamburger menu

9. **Footer**
   - Platform info, links, social media
   - Legal pages (Terms, Privacy, Refund Policy)

10. **DashboardSidebar**
    - Used by: Seller dashboard, Admin panel
    - Sections: Overview, Products, Orders, Earnings, Analytics, etc.
    - Collapsible to icons-only
    - Mobile: Bottom tab bar instead

### Business Logic Hooks

11. **useAuth** (CRITICAL - Build First)
    - Authentication state (user, loading, error)
    - Login, signup, logout functions
    - Role checking (buyer/seller/admin)
    - Session management

12. **useUser**
    - User data, profile
    - Profile completion percentage
    - Follow/unfollow functions

13. **useProducts**
    - Product queries (list, detail, search)
    - Mutations (create, update, delete)
    - Filtering and sorting logic
    - Caching strategy

14. **useCart**
    - Cart state (items, total)
    - Add/remove/update quantity
    - Cart persistence
    - Checkout flow

15. **useWishlist**
    - Wishlist state
    - Add/remove
    - Wishlist pagination

16. **useNotifications**
    - Notification list
    - Unread count
    - Mark as read
    - Notification preferences

17. **useMessages** (Feature 13)
    - Conversations list
    - Messages in conversation
    - Send message
    - Polling for new messages

18. **useReviews**
    - Reviews list
    - Submit review
    - Seller response
    - Review analytics

### Utility Functions

19. **format.ts**
    - `formatPrice(price: number)` → "₱100.00"
    - `formatDate(date: Date)` → "January 14, 2026"
    - `formatRelativeTime(date: Date)` → "2 hours ago"
    - `truncateText(text: string, maxLength: number)`

20. **validation.ts**
    - `validateEmail(email: string)`
    - `validatePhoneNumber(phone: string)` - PH format
    - `validatePrice(price: number)`
    - `validateSlug(slug: string)`

21. **constants.ts**
    - Product types, grades, subjects
    - Subscription tiers, commission rates
    - App configuration (pagination limits, file size limits)

### Validation Schemas (Zod)

22. **auth.schema.ts**
    - `loginSchema` - email, password
    - `registerSchema` - email, password, name
    - `resetPasswordSchema` - email

23. **product.schema.ts**
    - `productSchema` - Full product validation
    - `productUpdateSchema` - Partial updates

24. **review.schema.ts**
    - `reviewSchema` - rating, comment
    - `reviewResponseSchema` - Response text

25. **checkout.schema.ts**
    - `checkoutSchema` - Payment method validation

---

## 5. Database Migration Strategy

### Phase 1: Foundation (Before Any Features)

**Migration:** `001_foundation.sql`

```sql
-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Create ENUM types
CREATE TYPE user_role AS ENUM ('buyer', 'seller', 'admin');
CREATE TYPE subscription_tier AS ENUM ('free', 'pro', 'pioneer');
CREATE TYPE product_status AS ENUM ('draft', 'pending_review', 'published', 'rejected', 'suspended', 'deleted');
CREATE TYPE product_type AS ENUM ('exams', 'lesson_plans', 'rpms', 'posters', 'tarpaulins');
CREATE TYPE order_status AS ENUM ('pending', 'completed', 'failed', 'refunded');

-- Create core tables (simplified, see full schema)
CREATE TABLE users (...);
CREATE TABLE grades (...);
CREATE TABLE subjects (...);
CREATE TABLE grade_subjects (...);

-- Set up RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Create indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);
-- ... (see complete schema)
```

**Deliverable:** Foundation ready for feature development

---

### Phase 2: Feature-Specific Migrations

For each feature, create a dedicated migration file.

**Migration Order:**

| Migration # | Feature | Tables Created | Depends On |
|-------------|---------|----------------|------------|
| 002 | Feature 01 (Auth) | users, teacher_id_verifications, user_sessions | Foundation |
| 003 | Feature 02 (Profiles) | followers, profile_views, admin_notes, audit_log | 002 |
| 004 | Feature 03 (Products) | products, product_updates, product_views | 002, 003 |
| 005 | Feature 04 (Cart) | cart_items, wishlist, orders, order_items, user_library, withdrawal_requests | 002, 004 |
| 006 | Feature 05 (Reviews) | reviews, review_flags | 002, 004, 005 |
| 007 | Feature 06 (Social) | notifications, recently_viewed, product_shares | 002, 004 |
| 008 | Feature 07 (Dashboard) | seller_metrics_cache, export_jobs, scheduled_reports | 002, 004, 005 |
| 009 | Feature 08 (Search) | search_analytics, search_queries | 004 |
| 010 | Feature 09 (Admin) | categories, support_tickets, disputes | All previous |
| 011 | Feature 12 (Email) | email_queue, email_templates, email_template_versions, email_configuration, user_email_preferences, email_analytics, email_daily_stats, email_suppression_list | 002 |
| 012 | Feature 13 (Messaging) | conversations, messages, message_templates, message_reports, user_blocks, seller_response_times | 002, 004 |

**Example Migration Structure:**

```sql
-- Migration: 004_feature_03_products.sql
-- Feature: Product Listings & Management

-- Create products table
CREATE TABLE products (
  -- ... (see full schema in docs/dev/database-schema-complete.md)
);

-- Create product_updates table
CREATE TABLE product_updates (
  -- ...
);

-- Create product_views table
CREATE TABLE product_views (
  -- ...
);

-- Create indexes
CREATE INDEX idx_products_seller ON products(seller_id);
CREATE INDEX idx_products_grade ON products(grade_id);
-- ... (all indexes)

-- Set up RLS
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Sellers can view their own products"
  ON products FOR SELECT
  USING (auth.uid() = seller_id);

-- ... (all policies)
```

**Best Practices:**
- Each migration is one file
- Migrations are incremental (additive only)
- Never modify existing migrations
- Use Supabase CLI: `supabase migration new <name>`
- Test migrations locally first
- Always backup before production migrations

---

### Phase 3: Data Seeding

**Migration:** `999_seed_data.sql`

```sql
-- Seed grades (Kindergarten to Grade 12)
INSERT INTO grades (name, sort_order) VALUES
('Kindergarten', 1),
('Grade 1', 2),
-- ...
('Grade 12', 13);

-- Seed subjects (Math, Science, English, Filipino, AP, etc.)
INSERT INTO subjects (name, code) VALUES
('Mathematics', 'MATH'),
('Science', 'SCI'),
-- ...
('Araling Panlipunan', 'AP');

-- Seed grade-subject relationships
INSERT INTO grade_subjects (grade_id, subject_id)
SELECT g.id, s.id FROM grades g, subjects s
WHERE g.sort_order BETWEEN 1 AND 6 -- Elementary
AND s.name IN ('Mathematics', 'Science', 'English', 'Filipino', 'AP');
-- ... (more combinations)

-- Create admin account (for testing)
INSERT INTO users (email, name, role, subscription_tier)
VALUES ('admin@akomaylessonplanna.com', 'Admin User', 'admin', 'pioneer');
```

---

## 6. State Management Strategy

> **⚠️ CRITICAL:** This project does NOT use TanStack Query / React Query. See [Section 1: Tech Stack Verification](#1-tech-stack-verification) for the correct tech stack.

### Server State (Next.js Server Components)

**✅ CORRECT: Use Next.js Server Components with fetch:**

```typescript
// app/products/page.tsx (Server Component)
async function getProducts() {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) throw error
  return data
}

export default async function ProductsPage() {
  const products = await getProducts()
  return <ProductList products={products} />
}
```

**What to use Server Components for:**
- Products (listings, search, details)
- User profile data
- Wishlist items
- Orders and order history
- Reviews
- Dashboard metrics
- Analytics data
- Admin data (users, products, reports)

**Caching Strategy:**

```typescript
// Use Next.js fetch with revalidation
async function getProducts() {
  const supabase = createClient()
  const { data } = await supabase
    .from('products')
    .select('*')

  // Next.js will cache this for 300 seconds (5 minutes)
  const res = await fetch('https://api.example.com/products', {
    next: { revalidate: 300 }
  })

  return data
}
```

| Data Type | Revalidate Time | Strategy |
|-----------|----------------|----------|
| User profile | 5 min | ISR with revalidation |
| Products | 5 min | ISR with revalidation |
| Orders | 0 min | No caching (real-time) |
| Dashboard metrics | 15 min | ISR with revalidation |
| Static content | 3600 min | Static generation |

---

### Client State (Zustand)

**Use Zustand for UI-only and ephemeral state:**

**1. Cart State (Optimistic UI)**
```typescript
// lib/stores/cart-store.ts
interface CartStore {
  items: CartItem[];
  isOpen: boolean;

  // Actions
  addItem: (product: Product) => void;
  removeItem: (productId: string) => void;
  clearCart: () => void;
  openCart: () => void;
  closeCart: () => void;
}
```

**2. UI State**
```typescript
// lib/stores/ui-store.ts
interface UIStore {
  // Modals
  isProductDetailModalOpen: boolean;
  isQuickViewModalOpen: boolean;

  // Filters (search, products)
  activeFilters: FilterState;

  // Mobile navigation
  isMobileMenuOpen: boolean;
  isFilterDrawerOpen: boolean;

  // Actions
  openModal: (modal: string) => void;
  closeModal: (modal: string) => void;
  setFilters: (filters: FilterState) => void;
  toggleMobileMenu: () => void;
}
```

**3. Form State (React Hook Form + Zod)**
- Use React Hook Form for all forms
- Zod schemas for validation
- Don't put form state in Zustand

---

### Authentication State

**Supabase Auth + React Context:**

```typescript
// lib/hooks/useAuth.ts
export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const login = async (email: string, password: string) => { ... };
  const signup = async (email: string, password: string, name: string) => { ... };
  const logout = async () => { ... };

  return { user, loading, login, signup, logout };
}
```

**Role-Based Access Control:**

```typescript
// lib/utils/rbac.ts
export function canAccess(user: User, resource: string, action: string): boolean {
  const role = user.user_metadata.role;

  if (role === 'admin') return true;

  switch (resource) {
    case 'dashboard':
      return role === 'seller' || role === 'admin';
    case 'products':
      return action === 'read' || role === 'seller';
    // ... more rules
  }
}
```

---

## 7. API Route Structure

### Route Organization

```
app/api/
├── auth/
│   ├── signup/route.ts          # POST - Create account
│   ├── login/route.ts           # POST - Authenticate
│   ├── logout/route.ts          # POST - End session
│   └── verify-email/route.ts    # POST - Verify email
│
├── products/
│   ├── route.ts                 # GET (list), POST (create)
│   ├── [id]/route.ts            # GET, PUT, DELETE
│   ├── search/route.ts          # GET - Search products
│   └── [id]/reviews/route.ts    # GET, POST
│
├── cart/
│   ├── route.ts                 # GET, POST, DELETE
│   └── sync/route.ts            # POST - Sync with DB
│
├── checkout/
│   ├── route.ts                 # POST - Create order
│   ├── webhook/gcash/route.ts   # POST - GCash webhook
│   └── webhook/maya/route.ts    # POST - Maya webhook
│
├── dashboard/
│   ├── overview/route.ts        # GET - Dashboard metrics
│   ├── products/route.ts        # GET - Seller's products
│   ├── orders/route.ts          # GET - Seller's orders
│   ├── earnings/route.ts        # GET - Earnings data
│   └── analytics/route.ts       # GET (Pro/Pioneer)
│
├── messages/
│   ├── conversations/route.ts   # GET, POST
│   ├── conversations/[id]/route.ts
│   ├── conversations/[id]/messages/route.ts
│   └── new/route.ts             # GET - Polling endpoint
│
├── search/
│   ├── route.ts                 # GET - Search with filters
│   ├── suggestions/route.ts     # GET - Autocomplete
│   └── popular/route.ts         # GET - Popular searches
│
├── admin/
│   ├── users/route.ts           # GET (list), POST (ban/unban)
│   ├── products/route.ts        # GET (moderation queue)
│   ├── reviews/route.ts         # GET (flagged)
│   ├── financials/route.ts      # GET (Super Admin only)
│   └── announcements/route.ts   # GET, POST, PUT
│
└── webhooks/
    ├── resend/route.ts          # POST - Email webhooks
    └── upload/route.ts          # POST - File upload webhook
```

### API Route Template

**Standard structure for all API routes:**

```typescript
// app/api/products/route.ts
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';
import { productSchema } from '@/lib/validations/product.schema';

export async function GET(request: Request) {
  // 1. Authentication check (createClient uses @supabase/ssr under the hood)
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // 2. Parse query parameters
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get('page') ?? '1');
  const limit = parseInt(searchParams.get('limit') ?? '24');

  // 3. Fetch from database
  const { data, error } = await supabase
    .from('products')
    .select('*', { count: 'exact' })
    .eq('status', 'published')
    .range((page - 1) * limit, page * limit - 1);

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  // 4. Return response
  return Response.json({
    products: data,
    pagination: {
      page,
      limit,
      total: data.length,
    },
  });
}

export async function POST(request: Request) {
  // 1. Authentication check
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user || user.user_metadata.role !== 'seller') {
    return Response.json({ error: 'Forbidden' }, { status: 403 });
  }

  // 2. Parse and validate request body
  const body = await request.json();
  const validationResult = productSchema.safeParse(body);

  if (!validationResult.success) {
    return Response.json(
      { error: 'Validation failed', details: validationResult.error.errors },
      { status: 400 }
    );
  }

  // 3. Insert into database
  const { data, error } = await supabase
    .from('products')
    .insert({
      ...validationResult.data,
      seller_id: user.id,
      status: 'pending_review',
    })
    .select()
    .single();

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  // 4. Invalidate server cache (e.g., revalidatePath, or custom DB cache RPC if applicable)
  // Next.js: use revalidatePath('/products') or revalidateTag('products') for fetch cache
  // await supabase.rpc('invalidate_product_cache'); // Only if such RPC exists

  // 5. Return response
  return Response.json({ product: data }, { status: 201 });
}
```

### Webhook Handlers

**GCash/Maya Webhook:**

```typescript
// app/api/checkout/webhook/gcash/route.ts
import crypto from 'crypto';
import { supabase } from '@/lib/supabase/server';

export async function POST(request: Request) {
  // 1. Verify webhook signature
  const signature = request.headers.get('x-gcash-signature');
  const body = await request.text();

  if (!verifySignature(body, signature)) {
    return Response.json({ error: 'Invalid signature' }, { status: 401 });
  }

  // 2. Parse webhook data
  const data = JSON.parse(body);

  // 3. Update order status
  const { error } = await supabase
    .from('orders')
    .update({
      status: data.status === 'success' ? 'completed' : 'failed',
      payment_reference: data.transaction_id,
      paid_at: new Date().toISOString(),
    })
    .eq('id', data.order_id);

  if (error) {
    // Log error but don't fail (webhook might retry)
    console.error('Webhook processing failed:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }

  // 4. Send email confirmation
  if (data.status === 'success') {
    await sendOrderConfirmationEmail(data.order_id);
  }

  return Response.json({ success: true });
}

function verifySignature(body: string, signature: string): boolean {
  const hmac = crypto.createHmac('sha256', process.env.GCASH_WEBHOOK_SECRET!);
  const digest = hmac.update(body).digest('hex');
  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(digest));
}
```

### Rate Limiting

**Using Vercel Edge Config (upstash/ratelimit):**

```typescript
// lib/rate-limit.ts
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, '10 s'), // 10 requests per 10 seconds
});

export async function rateLimit(identifier: string) {
  const { success, remaining, limit } = await ratelimit.limit(identifier);

  if (!success) {
    throw new Error('Rate limit exceeded');
  }

  return { remaining, limit };
}
```

---

## 8. Authentication Flow

### Registration Flow

```
User enters email/password → POST /api/auth/signup
  ↓
Supabase creates user (email confirmation optional)
  ↓
Create user profile in users table
  ↓
Send verification email (via Supabase Auth)
  ↓
User clicks verification link
  ↓
Account verified → Can login
```

### Login Flow

```
User enters credentials → POST /api/auth/login
  ↓
Supabase auth verifies credentials
  ↓
Create session in user_sessions table (if "Remember me")
  ↓
Redirect to dashboard or home
  ↓
Set authentication cookies
```

### Protected Routes Middleware

**Use @supabase/ssr (not deprecated auth-helpers).** Example with createServerClient in middleware:

```typescript
// middleware.ts
import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
  let res = NextResponse.next({ request: req });
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return req.cookies.getAll(); },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => res.cookies.set(name, value));
        },
      },
    }
  );
  const { data: { session } } = await supabase.auth.getSession();

  // Check if route requires authentication
  const isProtectedRoute = req.nextUrl.pathname.startsWith('/dashboard') ||
                           req.nextUrl.pathname.startsWith('/admin') ||
                           req.nextUrl.pathname.startsWith('/checkout');

  const isAuthRoute = req.nextUrl.pathname.startsWith('/login') ||
                     req.nextUrl.pathname.startsWith('/signup');

  if (isProtectedRoute && !session) {
    // Redirect to login if accessing protected route without session
    return NextResponse.redirect(new URL('/login', req.url));
  }

  if (isAuthRoute && session) {
    // Redirect to dashboard if accessing auth route with session
    return NextResponse.redirect(new URL('/dashboard', req.url));
  }

  // Role-based access control for admin routes
  if (req.nextUrl.pathname.startsWith('/admin')) {
    const userRole = session?.user.user_metadata.role;
    if (userRole !== 'admin') {
      return NextResponse.redirect(new URL('/', req.url));
    }
  }

  return res;
}

export const config = {
  matcher: ['/dashboard/:path*', '/admin/:path*', '/checkout/:path*', '/login', '/signup'],
};
```

### Role-Based Access Control (RBAC)

**Roles:**
- **Buyer:** Can browse, buy, review
- **Seller:** All buyer permissions + can sell, manage products, view dashboard
- **Admin:** Full access to admin panel

**Permission Checking:**

```typescript
// lib/utils/permissions.ts
export function hasPermission(user: User, permission: string): boolean {
  const role = user.user_metadata.role;

  const permissions = {
    buyer: ['read:products', 'create:orders', 'create:reviews'],
    seller: ['read:products', 'create:products', 'update:products', 'delete:products',
             'create:orders', 'read:dashboard', 'read:analytics'],
    admin: ['*'], // All permissions
  };

  if (role === 'admin') return true;

  return permissions[role]?.includes(permission) || false;
}
```

### Session Management

**"Remember Me" Sessions:**

```sql
-- user_sessions table
CREATE TABLE user_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token VARCHAR(255) NOT NULL UNIQUE,
  remember_me BOOLEAN DEFAULT false,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);
```

**Session Expiry:**
- Remember me OFF: 24 hours
- Remember me ON: 90 days
- Auto-refresh token before expiry

---

## 9. File Upload Strategy

### Storage Buckets (Supabase Storage)

```
akomaylessonplanna/
├── products/
│   ├── [product_id]/
│   │   ├── files/
│   │   │   ├── file1.pdf
│   │   │   └── file2.docx
│   │   ├── previews/
│   │   │   ├── preview1.png
│   │   │   └── preview2.png
│   │   └── cover/
│   │       └── cover.jpg
│
├── user-avatars/
│   └── [user_id]/
│       └── avatar.jpg
│
├── teacher-ids/
│   └── [verification_id]/
│       └── prc_license.pdf
│
└── temp-uploads/
    └── [session_id]/
        └── upload.pdf  # Deleted after 24 hours
```

### Upload Flow

```typescript
// lib/utils/file-upload.ts
import { supabase } from '@/lib/supabase/client';

export async function uploadProductFile(
  file: File,
  productId: string,
  type: 'file' | 'preview' | 'cover'
): Promise<string> {
  // 1. Validate file
  const maxFileSize = type === 'cover' ? 5 * 1024 * 1024 : 100 * 1024 * 1024; // 5MB or 100MB
  if (file.size > maxFileSize) {
    throw new Error('File too large');
  }

  const allowedTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'image/jpeg', 'image/png'];
  if (!allowedTypes.includes(file.type)) {
    throw new Error('Invalid file type');
  }

  // 2. Generate unique filename
  const fileExt = file.name.split('.').pop();
  const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
  const filePath = `${productId}/${type}/${fileName}`;

  // 3. Upload to Supabase Storage
  const { data, error } = await supabase.storage
    .from('products')
    .upload(filePath, file);

  if (error) {
    throw new Error(`Upload failed: ${error.message}`);
  }

  // 4. Get public URL (for previews/cover) or signed URL (for files)
  const { data: { publicUrl } } = supabase.storage
    .from('products')
    .getPublicUrl(filePath);

  return publicUrl;
}
```

### Automatic Preview Generation

```typescript
// lib/utils/generate-preview.ts
export async function generatePreviews(
  pdfUrl: string,
  productId: string
): Promise<string[]> {
  // For MVP: Use placeholder (preview generation requires external service)
  // Post-launch: Integrate with PDF processing service

  const previews = [];
  for (let i = 1; i <= 3; i++) {
    previews.push(`/api/placeholder/preview/${productId}/${i}`);
  }

  return previews;
}
```

### File Size Limits

| File Type | Max Size | Allowed Formats |
|-----------|----------|-----------------|
| Product files | 100 MB | PDF, DOCX, PPTX |
| Cover images | 5 MB | JPG, PNG, WebP |
| Preview images | 2 MB each | JPG, PNG, WebP |
| User avatars | 5 MB | JPG, PNG, WebP |
| Teacher ID | 10 MB | PDF, JPG, PNG |

### Security Policies

**RLS Policies for Storage:**

```sql
-- Products bucket policies
CREATE POLICY "Sellers can upload to their products"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'products' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Anyone can view published product files"
  ON storage.objects FOR SELECT
  TO public
  USING (
    bucket_id = 'products' AND
    (storage.foldername(name))[1] IN (
      SELECT id FROM products WHERE status = 'published'
    )
  );
```

---

## 10. Testing Strategy

### Unit Tests (Vitest)

**What to Test:**
- Utility functions (formatPrice, formatDate, validation)
- Custom hooks (useAuth, useProducts, useCart)
- Helper functions (slug generation, file upload helpers)
- Business logic (commission calculation, conversion rate)

**Target:** 80% code coverage for utility functions and hooks

**Example Test:**

```typescript
// lib/utils/__tests__/format.test.ts
import { describe, it, expect } from 'vitest';
import { formatPrice, formatDate } from '../format';

describe('formatPrice', () => {
  it('formats price correctly', () => {
    expect(formatPrice(100)).toBe('₱100.00');
    expect(formatPrice(1000)).toBe('₱1,000.00');
    expect(formatPrice(10000)).toBe('₱10,000.00');
  });

  it('handles zero', () => {
    expect(formatPrice(0)).toBe('₱0.00');
  });

  it('handles decimals', () => {
    expect(formatPrice(100.50)).toBe('₱100.50');
    expect(formatPrice(100.5)).toBe('₱100.50');
  });
});
```

### Integration Tests

**What to Test:**
- API routes (request/response)
- Database queries (with test database)
- Authentication flows
- Payment flows (with mock webhooks)

**Example Test:**

```typescript
// tests/api/products.test.ts
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createClient } from '@supabase/supabase-js';

describe('Products API', () => {
  const supabase = createClient(
    process.env.TEST_SUPABASE_URL!,
    process.env.TEST_SUPABASE_ANON_KEY!
  );

  beforeAll(async () => {
    // Setup test data
    await supabase.from('products').insert({
      title: 'Test Product',
      price: 100,
      seller_id: 'test-user-id',
      status: 'published',
    });
  });

  afterAll(async () => {
    // Cleanup
    await supabase.from('products').delete().eq('title', 'Test Product');
  });

  it('should return list of products', async () => {
    const response = await fetch('/api/products');
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.products).toBeDefined();
    expect(data.products.length).toBeGreaterThan(0);
  });
});
```

### E2E Tests (Playwright)

**Critical User Journeys:**

1. **User Registration → Email Verification → Login**
   ```typescript
   // tests/e2e/auth.spec.ts
   test('user can register, verify email, and login', async ({ page }) => {
     await page.goto('/signup');
     await page.fill('input[name="email"]', 'test@example.com');
     await page.fill('input[name="password"]', 'password123');
     await page.fill('input[name="name"]', 'Test User');
     await page.click('button[type="submit"]');

     await expect(page).toHaveURL('/verify-email');
     // ... (simulate email verification)
     await page.goto('/login');
     await page.fill('input[name="email"]', 'test@example.com');
     await page.fill('input[name="password"]', 'password123');
     await page.click('button[type="submit"]');

     await expect(page).toHaveURL('/dashboard');
   });
   ```

2. **Browse Products → Search → Filter → Add to Cart → Checkout**
   ```typescript
   test('complete purchase flow', async ({ page }) => {
     // Login first
     await loginAsBuyer(page);

     // Browse products
     await page.goto('/products');
     await expect(page).toHaveTitle(/Products/);

     // Search
     await page.fill('input[placeholder*="Search"]', 'grade 7 math');
     await page.press('input[placeholder*="Search"]', 'Enter');

     // Filter
     await page.click('button:has-text("Filter")');
     await page.click('label:has-text("Grade 7")');
     await page.click('button:has-text("Apply")');

     // Add to cart
     await page.click('.product-card:first-child .add-to-cart-button');
     await expect(page.locator('.cart-badge')).toHaveText('1');

     // Checkout
     await page.click('.cart-icon');
     await page.click('button:has-text("Checkout")');
     await page.selectOption('select[name="paymentMethod"]', 'gcash');
     await page.click('button:has-text("Place Order")');

     // Verify order confirmation
     await expect(page).toHaveURL(/\/order-confirmation/);
     await expect(page.locator('text=Thank you for your order')).toBeVisible();
   });
   ```

3. **Seller: Upload Product → Edit → Delete**

4. **Buyer: Purchase → Download → Leave Review**

5. **Messaging: Send Message → Receive → Reply**

### Manual Testing Checklist

**Browser Testing:**
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (iOS/macOS)
- [ ] Edge (latest)

**Mobile Testing:**
- [ ] iOS Safari (iPhone 12+)
- [ ] Android Chrome (Samsung, Pixel)
- [ ] Tablet (iPad, Android tablet)

**Payment Testing:**
- [ ] GCash sandbox (successful payment)
- [ ] GCash sandbox (failed payment)
- [ ] Maya sandbox (successful payment)
- [ ] Maya sandbox (failed payment)

---

## 11. Performance Optimization Strategy

### Frontend Performance

**1. Image Optimization (Next.js Image)**
```typescript
import Image from 'next/image';

<Image
  src={product.cover_image_url}
  alt={product.title}
  width={400}
  height={300}
  loading="lazy"
  placeholder="blur"
  blurDataURL="/placeholder.jpg"
/>
```

**2. Code Splitting (Next.js Automatic)**
- Route-based splitting (automatic with App Router)
- Dynamic imports for heavy components:
  ```typescript
  const DashboardChart = dynamic(() => import('./DashboardChart'), {
    loading: () => <ChartSkeleton />,
  });
  ```

**3. Lazy Loading**
```typescript
// Product cards below fold
const ProductCard = dynamic(() => import('@/components/products/ProductCard'), {
  loading: () => <CardSkeleton />,
});
```

**4. Font Optimization (next/font)**
```typescript
import { Inter } from 'next/font/google';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});
```

**5. Bundle Size Monitoring**
```json
// package.json
{
  "scripts": {
    "analyze": "ANALYZE=true next build"
  }
}
```

### Backend Performance

**1. Database Query Optimization**
```typescript
// ❌ BAD: N+1 queries
const products = await db.products.findMany();
for (const product of products) {
  const seller = await db.users.findUnique({ where: { id: product.seller_id } });
  product.seller = seller;
}

// ✅ GOOD: Single query with join
const products = await db.products.findMany({
  include: { seller: true },
});
```

**2. Response Caching (Redis/Upstash)**
```typescript
import { Redis } from '@upstash/redis';

const redis = Redis.fromEnv();

export async function getCachedProducts(filters: FilterState) {
  const cacheKey = `products:${JSON.stringify(filters)}`;

  // Try cache first
  const cached = await redis.get(cacheKey);
  if (cached) {
    return JSON.parse(cached);
  }

  // Cache miss - fetch from DB
  const products = await fetchProductsFromDB(filters);

  // Set cache (5 minutes)
  await redis.set(cacheKey, JSON.stringify(products), { ex: 300 });

  return products;
}
```

**3. CDN for Static Assets (Vercel)**
- Automatic with Vercel deployment
- Images served from edge
- CSS/JS bundles served from edge

**4. API Rate Limiting**
```typescript
// See rate limiting section above
// Protects against abuse, reduces server load
```

**5. Pagination for All List Views**
- No "select all" queries
- Limit to 24-50 items per page
- Cursor-based pagination for large datasets

### Performance Budgets

| Metric | Target | Why |
|--------|--------|-----|
| First Contentful Paint (FCP) | < 1.5s | Perceived load speed |
| Largest Contentful Paint (LCP) | < 2.5s | Main content loaded |
| Time to Interactive (TTI) | < 3.5s | Page becomes interactive |
| Cumulative Layout Shift (CLS) | < 0.1 | Visual stability |
| First Input Delay (FID) | < 100ms | Responsiveness |

---

## 12. Error Handling & Logging

### Client-Side Errors

**React Error Boundaries:**

```typescript
// components/error-boundary.tsx
'use client';

import { Component, ReactNode } from 'react';

export class ErrorBoundary extends Component<
  { children: ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <h1 className="text-2xl font-bold">Something went wrong</h1>
            <p className="text-gray-600 mt-2">Please refresh the page</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 px-4 py-2 bg-purple-600 text-white rounded"
            >
              Refresh
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
```

**User-Friendly Error Messages:**
```typescript
// lib/utils/errors.ts
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === 'string') {
    return error;
  }

  return 'An unexpected error occurred. Please try again.';
}
```

**Toast Notifications:**
```typescript
// components/ui/toast.tsx
import { toast } from 'sonner';

// Usage
toast.error('Failed to load products. Please try again.');
toast.success('Product added to cart!');
```

### Server-Side Errors

**API Error Response Format:**
```typescript
// app/api/products/route.ts
export async function GET(request: Request) {
  try {
    const products = await fetchProducts();
    return Response.json({ products });
  } catch (error) {
    console.error('API Error:', error);
    return Response.json(
      {
        error: 'Failed to fetch products',
        details: process.env.NODE_ENV === 'development' ? error : undefined,
      },
      { status: 500 }
    );
  }
}
```

**HTTP Status Codes:**
- 200 OK - Successful request
- 201 Created - Resource created successfully
- 400 Bad Request - Invalid input
- 401 Unauthorized - Not authenticated
- 403 Forbidden - Insufficient permissions
- 404 Not Found - Resource not found
- 429 Too Many Requests - Rate limit exceeded
- 500 Internal Server Error - Server error

### Error Logging

**Sentry Integration (Post-Launch):**
```typescript
// lib/sentry.ts
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 1.0,
});
```

**Logging Utility:**
```typescript
// lib/utils/logger.ts
export function logError(context: string, error: unknown) {
  console.error(`[${context}]`, error);

  // Send to error tracking service (Sentry, LogRocket, etc.)
  if (typeof window !== 'undefined') {
    // Client-side error
  } else {
    // Server-side error (log to file or service)
  }
}
```

---

## 13. Deployment Strategy

### Environments

**1. Development (Local)**
```bash
# Local development
npm run dev

# Supabase local
supabase start
```

**2. Staging (Vercel Preview)**
- Automatic preview deployments for every PR
- Test with production-like environment
- Use staging Supabase project

**3. Production (Vercel + Supabase Cloud)**
- Automatic deployments from main branch
- Production Supabase project
- CDN enabled (Vercel Edge Network)

### CI/CD Pipeline

**GitHub Actions Workflow:**

```yaml
# .github/workflows/ci.yml
name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run tests
        run: npm test

      - name: Run linting
        run: npm run lint

      - name: Type check
        run: npm run type-check

      - name: Build
        run: npm run build

  deploy:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'

    steps:
      - uses: actions/checkout@v3

      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.ORG_ID }}
          vercel-project-id: ${{ secrets.PROJECT_ID }}
          vercel-args: '--prod'
```

### Database Migrations

**Running Migrations in Production:**

```bash
# 1. Backup database (automatic before migrations)
supabase db dump --db-url "$DATABASE_URL" > backup.sql

# 2. Run migrations
supabase migration up

# 3. Verify migration
supabase db remote commit

# 4. If migration fails, rollback
supabase db rollback
```

**Rollback Plan:**
1. Stop application deployment (Vercel rollback)
2. Rollback database migration
3. Investigate issue
4. Fix migration
5. Re-deploy

### Environment Variables

**Required Environment Variables:**

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Payments
GCASH_MERCHANT_ID=
GCASH_SECRET_KEY=
GCASH_WEBHOOK_SECRET=
MAYA_API_KEY=
MAYA_SECRET_KEY=
MAYA_WEBHOOK_SECRET=

# Email
RESEND_API_KEY=

# Error Tracking (optional)
NEXT_PUBLIC_SENTRY_DSN=

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=
```

**Secrets Management (Vercel):**
```bash
# Set secrets via CLI
vercel env add SUPABASE_SERVICE_ROLE_KEY
vercel env add GCASH_SECRET_KEY

# Or via Vercel Dashboard
# Settings > Environment Variables
```

---

## 14. Documentation Requirements

### Developer Docs

**1. Setup Guide (README.md)**
- Prerequisites (Node.js, Supabase account)
- Installation steps
- Environment configuration
- Running locally
- Running tests
- Building for production

**2. Architecture Overview**
- System design
- Technology choices
- Database schema (link to schema doc)
- API structure
- State management approach

**3. API Documentation**
- Auto-generate from OpenAPI spec
- Endpoint descriptions
- Request/response examples
- Error codes
- Authentication requirements

**4. Component Storybook (Optional)**
```bash
# Install Storybook
npx storybook@latest init

# Run Storybook
npm run storybook
```

### User Docs

**1. Buyer Guide**
- How to browse products
- How to search and filter
- How to purchase
- How to download purchased items
- How to leave reviews
- How to contact sellers

**2. Seller Guide**
- How to register as a seller
- Teacher verification process
- How to upload products
- Product guidelines
- How to manage orders
- How to withdraw earnings
- How to use analytics (Pro/Pioneer)

**3. Admin Guide**
- How to moderate products
- How to verify teachers
- How to handle disputes
- How to send announcements
- How to manage users
- Financial overview

### API Documentation

**OpenAPI/Swagger Specification:**

```yaml
# openapi.yaml
openapi: 3.0.0
info:
  title: AKOMAYLESSONPLANNA API
  version: 1.0.0

paths:
  /api/products:
    get:
      summary: List products
      tags: [Products]
      parameters:
        - name: page
          in: query
          schema:
            type: integer
            default: 1
      responses:
        '200':
          description: Successful response
          content:
            application/json:
              schema:
                type: object
                properties:
                  products:
                    type: array
                    items:
                      $ref: '#/components/schemas/Product'
```

---

## 15. Launch Checklist

### Functionality

**Core Features:**
- [ ] User registration and login working
- [ ] Email verification working
- [ ] Product upload and management working
- [ ] Shopping cart working
- [ ] Checkout flow working
- [ ] GCash payments working (tested in sandbox)
- [ ] Maya payments working (tested in sandbox)
- [ ] Download library working
- [ ] Reviews and ratings working
- [ ] Seller dashboard functional
- [ ] Admin panel functional
- [ ] Search working (including filters)
- [ ] Messaging system working
- [ ] Email notifications working (all critical emails)

**Testing:**
- [ ] All E2E tests passing
- [ ] Payment testing complete (GCash/Maya sandbox)
- [ ] Email testing complete (Resend test emails)
- [ ] File upload/download working
- [ ] Search performance acceptable (< 500ms)
- [ ] Mobile responsive tested

### Security

**Authentication & Authorization:**
- [ ] All routes protected with middleware
- [ ] RLS policies enabled and tested
- [ ] Admin routes only accessible to admins
- [ ] Seller routes only accessible to sellers
- [ ] API rate limiting configured
- [ ] Input validation on all endpoints

**Data Protection:**
- [ ] No hardcoded secrets
- [ ] All secrets in environment variables
- [ ] HTTPS only (production)
- [ ] XSS prevention tested
- [ ] CSRF protection (if needed)
- [ ] SQL injection prevention (parameterized queries)

**Payment Security:**
- [ ] Webhook signatures verified
- [ ] Order IDs verified before processing
- [ ] No sensitive data in logs
- [ ] Secure payment flow (HTTPS, valid certificates)

### Performance

**Core Web Vitals:**
- [ ] Lighthouse score > 90
- [ ] FCP < 1.5s
- [ ] LCP < 2.5s
- [ ] TTI < 3.5s
- [ ] CLS < 0.1

**Database Optimization:**
- [ ] All indexes created
- [ ] Queries optimized (no N+1)
- [ ] Connection pooling configured
- [ ] Slow query log monitored

**Frontend Optimization:**
- [ ] Images optimized (WebP, lazy loading)
- [ ] Bundle size analyzed and optimized
- [ ] Code splitting implemented
- [ ] Caching strategy in place

### Legal

**Required Pages:**
- [ ] Terms of Service page
- [ ] Privacy Policy page
- [ ] Refund Policy page
- [ ] Seller Agreement
- [ ] Copyright notices in footer

**Compliance:**
- [ ] Data Privacy Act (DPA) compliance
- [ ] Email unsubscribe working
- [ ] Cookie consent (if using tracking)
- [ ] User data export functionality
- [ ] User data deletion functionality

### Content

**Initial Content:**
- [ ] Seed data loaded (grades, subjects)
- [ ] Demo products (for testing)
- [ ] Admin account created
- [ ] Email templates configured and tested
- [ ] Platform announcements ready (welcome message)

### Monitoring & Analytics

**Setup:**
- [ ] Error tracking (Sentry or similar)
- [ ] Analytics (Google Analytics or Plausible)
- [ ] Uptime monitoring (UptimeRobot or similar)
- [ ] Database performance monitoring
- [ ] Log aggregation (if needed)

---

## 16. Risk Assessment & Mitigation

### Technical Risks

**Risk 1: Supabase Downtime**
- **Impact:** High - Platform unavailable
- **Likelihood:** Low - Supabase has good uptime
- **Mitigation:**
  - Error handling for failed requests
  - Retry logic with exponential backoff
  - User communication (status page)
  - Consider backup database provider (post-launch)

**Risk 2: Payment Gateway Failures**
- **Impact:** High - Cannot process payments
- **Likelihood:** Medium - GCash/Maya may have outages
- **Mitigation:**
  - Webhook retry handling
  - Order status tracking
  - Multiple payment providers (GCash + Maya)
  - Manual payment processing as backup
  - Clear error messages to users

**Risk 3: Database Performance Degradation**
- **Impact:** High - Slow platform
- **Likelihood:** Medium - As data grows
- **Mitigation:**
  - Comprehensive indexing strategy
  - Query optimization
  - Caching layer (Redis)
  - Regular monitoring (slow query log)
  - Database migration plan for scaling

**Risk 4: File Storage Issues**
- **Impact:** Medium - Cannot access files
- **Likelihood:** Low - Supabase Storage is reliable
- **Mitigation:**
  - CDN for static assets (Vercel Edge)
  - Backup storage strategy
  - File size limits enforced
  - Virus scanning for uploads

### Business Risks

**Risk 5: Low Seller Adoption**
- **Impact:** High - Limited product catalog
- **Likelihood:** Medium - New marketplace
- **Mitigation:**
  - Pioneer program (first 20 quality sellers)
  - Seller onboarding guide
  - Low commission for Pioneers (15%)
  - Marketing to teacher communities
  - Incentives for early adopters

**Risk 6: Payment Fraud**
- **Impact:** Medium - Financial loss
- **Likelihood:** Medium - Digital goods are vulnerable
- **Mitigation:**
  - GCash/Maya verification
  - Hold period for payouts (3 days)
  - Monitor suspicious patterns
  - Minimum withdrawal threshold (₱500)
  - User verification requirements

**Risk 7: Poor User Experience**
- **Impact:** High - Users won't return
- **Likelihood:** Medium - Complex platform
- **Mitigation:**
  - Extensive user testing
  - Iterative improvements
  - Mobile-first design
  - Fast page loads
  - Clear navigation
  - Comprehensive help docs

### Security Risks

**Risk 8: Data Breach**
- **Impact:** Critical - User data exposed
- **Likelihood:** Low - Good security practices
- **Mitigation:**
  - Row Level Security (RLS) enabled
  - Encrypted connections (HTTPS)
  - No sensitive data in logs
  - Regular security audits
  - Bug bounty program (post-launch)
  - Penetration testing

**Risk 9: Content Moderation Issues**
- **Impact:** Medium - Inappropriate content
- **Likelihood:** High - User-generated content
- **Mitigation:**
  - Auto-flagging system
  - Manual review for first 3 products
  - Report system for users
  - Admin moderation queue
  - Clear community guidelines

### Development Risks

**Risk 10: Scope Creep**
- **Impact:** High - Delayed launch
- **Likelihood:** High - Common issue
- **Mitigation:**
  - Clear MVP definition
  - Feature prioritization
  - Regular review of requirements
  - Willingness to defer features
  - Focus on core value proposition

**Risk 11: Solo Developer Bottleneck**
- **Impact:** High - Slow development
- **Likelihood:** High - One person doing everything
- **Mitigation:**
  - Realistic timeline (flexible)
  - Code reusability focus
  - Use of third-party services (Supabase, Resend)
  - Comprehensive documentation
  - Consider hiring help for specific tasks

---

## Summary

This Master Implementation Plan provides a comprehensive roadmap for building AKOMAYLESSONPLANNA from start to launch. Key highlights:

**Implementation Strategy:**
- **Sequential implementation** for solo developer
- **Code reusability first** - Invest in shared components
- **Flexible timeline** - Quality over speed
- **Full 11-feature MVP** - Complete platform at launch

**Technical Foundation:**
- **Next.js 16.1.1 + Supabase** - Modern, scalable stack
- **TypeScript + Zod** - Type safety throughout
- **Next.js Server Components + Zustand** - Optimized state management
- **shadcn/ui** - Beautiful, accessible components

**Key Success Factors:**
1. **Strong foundation** (Auth + Database + Shared Components)
2. **Core commerce first** (Products + Cart + Checkout)
3. **Engagement features** (Reviews + Social + Dashboard)
4. **Platform management** (Admin + Email + Messaging)
5. **Comprehensive testing** (Unit + Integration + E2E)
6. **Performance optimization** (Caching + Lazy Loading + CDN)
7. **Security first** (RLS + Rate Limiting + Input Validation)

**Timeline:**
- **20 weeks** (5 months) for complete MVP
- **Flexible schedule** - adapt as needed
- **Milestone-driven** - Clear checkpoints along the way

**Next Steps:**
1. Review and approve this plan
2. Set up development environment
3. Begin Phase 1: Foundation
4. Implement feature by feature
5. Launch when all 11 features complete

---

**Document Status:** ✅ Complete
**Last Updated:** January 14, 2026
**Version:** 1.0

**Ready for Implementation! 🚀**
