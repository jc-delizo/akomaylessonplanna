# Database Migrations Index

**Last Updated**: January 25, 2026  
**Total Migrations**: 20  
**Status**: All migrations applied to development database

---

## Overview

This document provides a complete index of all database migrations for AKOMAYLESSONPLANNA. Each migration is listed with its purpose, tables affected, and dependencies.

**Migration Workflow:**
1. Create migration: `npx supabase migration new feature_name`
2. Apply to dev database: `npx supabase db push --db-url "dev-connection-string"`
3. Test on dev environment
4. Apply to prod database: `npx supabase db push --db-url "prod-connection-string"`

See [DEPLOYMENT-WORKFLOW.md](implementationplan/DEPLOYMENT-WORKFLOW.md) for detailed workflow.

---

## Migration List

### 001_foundation.sql

**Purpose**: Initialize database foundation with extensions, enums, and core tables

**What it creates:**
- PostgreSQL extensions: `uuid-ossp`, `pg_trgm`
- ENUM types:
  - `user_role` (buyer, seller, admin)
  - `subscription_tier` (free, pro, pioneer)
  - `product_status` (draft, pending_review, published, rejected, suspended, deleted)
  - `product_type` (exams, lesson_plans, rpms, posters, tarpaulins)
  - `order_status` (pending, completed, failed, refunded)
  - Additional enums for reviews, messages, disputes
- Core tables:
  - `grades` - K-12 grade levels
  - `subjects` - Academic subjects
  - `grade_subjects` - Grade-subject relationships

**Dependencies**: None (foundation migration)

**Status**: ✅ Applied

---

### 002_seed_data.sql

**Purpose**: Populate initial reference data

**What it creates:**
- 13 grade levels (Kindergarten to Grade 12)
- 56 subjects (Math, Science, English, Filipino, AP, etc.)
- 182 grade-subject relationships
- Admin user account (for testing)

**Dependencies**: 001 (requires grades and subjects tables)

**Status**: ✅ Applied

---

### 003_fix_users_rls_policies.sql

**Purpose**: Fix and improve Row Level Security policies for users table

**What it modifies:**
- Updates RLS policies on `users` table
- Ensures proper access control for user profiles
- Fixes policy for user updates

**Dependencies**: 001 (users table)

**Status**: ✅ Applied

---

### 004_feature_02_profiles.sql

**Purpose**: User profiles and social features

**What it creates:**
- `followers` - User following relationships
- `profile_views` - Profile view analytics
- `admin_notes` - Admin notes on users
- `audit_log` - Admin action tracking

**Dependencies**: 001 (users table)

**Feature**: Feature 02 (User Profiles)

**Status**: ✅ Applied

---

### 005_feature_03_products.sql

**Purpose**: Product listings and management

**What it creates:**
- `products` - Main product listings
- `product_updates` - Version history
- `product_views` - Product view analytics
- RLS policies for products
- Indexes for performance

**Dependencies**: 001 (users, grades, subjects tables)

**Feature**: Feature 03 (Product Listings) ✅ COMPLETE

**Status**: ✅ Applied

---

### 006_storage_buckets_and_policies.sql

**Purpose**: Configure Supabase Storage buckets and access policies

**What it creates:**
- Storage buckets:
  - `products` - Product files, covers, previews
  - `user-avatars` - User profile pictures
  - `teacher-ids` - Teacher verification documents
- Storage RLS policies for secure file access

**Dependencies**: 005 (products table)

**Status**: ✅ Applied

---

### 007_feature_04_cart_and_checkout.sql

**Purpose**: Shopping cart and checkout flow

**What it creates:**
- `cart_items` - Shopping cart items
- `wishlist` - User wishlists
- `orders` - Order records
- `order_items` - Order line items
- `user_library` - Purchased products (download access)
- `withdrawal_requests` - Seller payout requests
- RLS policies for cart and orders
- Indexes for performance

**Dependencies**: 005 (products table)

**Feature**: Feature 04 (Shopping Cart & Checkout) ✅ COMPLETE

**Status**: ✅ Applied

---

### 008_feature_05_reviews.sql

**Purpose**: Reviews and ratings system

**What it creates:**
- `reviews` - Product reviews and ratings
- `review_flags` - Flagged reviews for moderation
- RLS policies for reviews
- Indexes for review queries
- Triggers for updating product ratings

**Dependencies**: 005, 007 (products, orders tables)

**Feature**: Feature 05 (Reviews & Ratings)

**Status**: ✅ Applied

---

### 009_feature_06_social_features.sql

**Purpose**: Social features and notifications

**What it creates:**
- `notifications` - In-app notifications
- `recently_viewed` - Recently viewed products
- `product_shares` - Social sharing analytics
- RLS policies for notifications
- Indexes for notification queries

**Dependencies**: 005 (products table)

**Feature**: Feature 06 (Social Features)

**Status**: ✅ Applied

---

### 010_feature_07_seller_dashboard.sql

**Purpose**: Seller dashboard and analytics

**What it creates:**
- `seller_metrics_cache` - Cached dashboard metrics
- `export_jobs` - CSV/Excel export jobs
- `scheduled_reports` - Scheduled report configurations
- Indexes for dashboard queries
- Functions for metric calculations

**Dependencies**: 005, 007 (products, orders tables)

**Feature**: Feature 07 (Seller Dashboard & Analytics)

**Status**: ✅ Applied

---

### 011_feature_08_advanced_search.sql

**Purpose**: Advanced search and discovery

**What it creates:**
- `search_analytics` - Search analytics tracking
- `search_queries` - Popular search queries
- Full-text search indexes on products
- GIN indexes for search performance
- Search ranking functions

**Dependencies**: 005 (products table)

**Feature**: Feature 08 (Advanced Search & Discovery)

**Status**: ✅ Applied

---

### 012_feature_09_admin_panel.sql

**Purpose**: Admin panel and content moderation

**What it creates:**
- `categories` - Product categories
- `support_tickets` - User support tickets
- `ticket_messages` - Support conversation messages
- `disputes` - Transaction disputes
- `announcements` - Platform announcements
- `announcement_stats` - Announcement analytics
- `reports` - User reports (products, reviews, users)
- Admin RLS policies
- Indexes for admin queries

**Dependencies**: All previous (comprehensive admin features)

**Feature**: Feature 09 (Admin Panel) ✅ COMPLETE

**Status**: ✅ Applied

---

### 013_feature_10_email_system.sql

**Purpose**: Email system with templates and queue

**What it creates:**
- `email_templates` - Email template definitions
- `email_queue` - Email sending queue with retry logic
- `email_template_versions` - Template version history
- `email_configuration` - Email system settings
- `user_email_preferences` - User email preferences (4 categories)
- `email_analytics` - Email delivery and engagement metrics
- `email_daily_stats` - Daily email statistics
- `email_suppression_list` - Unsubscribe list
- RLS policies for email system
- Indexes for queue processing

**Dependencies**: 001 (users table)

**Feature**: Feature 10 (Email System) ✅ COMPLETE

**Status**: ✅ Applied

**Key Tables:**
- `email_queue`: Uses template system (template_id + template_data JSONB)
- `user_email_preferences`: Four categories (selling_notifications, buying_notifications, social_notifications, announcements)

---

### 014_feature_11_messaging_system.sql

**Purpose**: Buyer-seller messaging system

**What it creates:**
- `conversations` - Message conversations
- `messages` - Individual messages
- `message_templates` - Quick reply templates
- `message_reports` - Flagged messages
- `user_blocks` - Blocked users
- `seller_response_times` - Response time analytics
- RLS policies for messaging
- Indexes for conversation queries

**Dependencies**: 005 (products table for product-linked conversations)

**Feature**: Feature 11 (Messaging System)

**Status**: ✅ Applied

---

### 015_add_reports_table.sql

**Purpose**: Add or enhance reports functionality

**What it creates/modifies:**
- `reports` table (may be enhancement to migration 012)

**Dependencies**: 012 (admin panel tables)

**Note**: May be redundant with migration 012 which also creates reports table. Requires verification.

**Status**: ✅ Applied

---

### 016_teacher_verification_storage.sql

**Purpose**: Configure storage for teacher ID verification documents

**What it creates:**
- Storage bucket for teacher verification files
- RLS policies for teacher ID uploads
- Policies ensuring only user can upload their own verification

**Dependencies**: 001 (users table)

**Feature**: Feature 02 (Teacher verification)

**Status**: ✅ Applied

---

### 017_seller_settings_fields.sql

**Purpose**: Add seller shop customization fields

**What it creates:**
- `shop_name` VARCHAR(255) - Custom shop name
- `shop_description` TEXT - Shop description/bio
- `shop_banner_url` TEXT - Shop banner image

**Table Modified**: `users`

**Dependencies**: 001 (users table)

**Feature**: Feature 02 (User Profiles - seller customization)

**Status**: ✅ Applied

---

### 018_replace_name_with_first_last_name.sql

**Purpose**: Split single name field into first_name and last_name

**What it does:**
1. Adds `first_name` and `last_name` columns to `users` table
2. Migrates existing `name` data by splitting on first space
3. Makes `first_name` NOT NULL
4. Drops old `name` column

**Table Modified**: `users`

**Migration Logic**:
- Name with space: first_name = first part, last_name = rest
- Name without space: first_name = name, last_name = ''
- NULL name: first_name = 'User', last_name = ''

**Dependencies**: 001 (users table)

**Status**: ✅ Applied

---

### 019_handle_new_user_trigger.sql

**Purpose**: Create trigger on auth.users to insert into public.users when a new auth user is created (OAuth or email signup). Uses first_name/last_name to match migration 018. Fixes "Database error saving new user" when an existing trigger used the old `name` column.

**What it does:**
1. Drops existing triggers on auth.users (on_auth_user_created, handle_new_user_trigger)
2. Drops and recreates `public.handle_new_user()` with first_name/last_name logic
3. Creates trigger `on_auth_user_created` AFTER INSERT ON auth.users

**Dependencies**: 001, 018 (users table with first_name/last_name)

**Status**: Pending / apply to dev

---

### 020_fix_users_rls_recursion.sql

**Purpose**: Fix "infinite recursion detected in policy for relation users" (42P17). Admin policies used `EXISTS (SELECT 1 FROM users WHERE ...)`, which re-triggers RLS. Use a SECURITY DEFINER helper so the check bypasses RLS.

**What it does:**
1. Creates `public.is_admin()` SECURITY DEFINER STABLE that returns true iff current user has role 'admin'
2. Drops "Admins can select users", "Admins can update users", "Admins can delete users" on users
3. Recreates those policies using `public.is_admin()`

**Dependencies**: 001, 003 (users table and existing RLS)

**Status**: Pending / apply to dev

---

### 024_profile_teaching_phase2.sql

**Purpose**: Add Phase 2 teaching preference columns to `users` for the Profile Teaching tab (class types, learner paths, strands, SPED levels).

**What it does:**
1. Adds `teaching_class_types` (TEXT[]), `teaching_learner_paths` (TEXT[]), `teaching_strand_ids` (UUID[]), `teaching_sped_level_ids` (UUID[]) to `users`
2. Creates GIN indexes on the array columns
3. Adds column comments

**Table Modified**: `users`

**Dependencies**: 001 (users table)

**Status**: Apply if profile update fails with PGRST204 ("Could not find the 'teaching_class_types' column"). See [MIGRATION-024-PROFILE-TEACHING.md](implementationplan/MIGRATION-024-PROFILE-TEACHING.md).

---

## Migration Dependencies Graph

```
001 (foundation)
 ├─> 002 (seed data)
 ├─> 003 (RLS fixes)
 ├─> 004 (profiles)
 │    └─> 017 (seller settings)
 │    └─> 018 (name split)
 ├─> 005 (products)
 │    ├─> 006 (storage)
 │    ├─> 007 (cart/checkout)
 │    │    └─> 008 (reviews)
 │    ├─> 009 (social features)
 │    ├─> 010 (seller dashboard)
 │    ├─> 011 (search)
 │    └─> 014 (messaging)
 ├─> 012 (admin panel)
 │    └─> 015 (reports - may be redundant)
 ├─> 013 (email system)
 └─> 016 (teacher verification storage)
```

---

## Feature-Based Organization

Migrations are logically organized by feature for easier understanding. See `docs/migrations/MIGRATION-BY-FEATURE.md` for detailed feature breakdown.

### Feature Groups

- **Foundation** (001-002): Extensions, ENUMs, core tables, seed data
- **Feature 02: User Profiles** (003, 004, 016, 017, 018): Profiles, authentication, teacher verification, seller settings
- **Feature 03: Products** (005, 006): Product listings, storage buckets
- **Feature 04: Cart & Checkout** (007): Shopping cart, orders, wishlist, library
- **Feature 05: Reviews** (008): Reviews and ratings system
- **Feature 06: Social Features** (009): Notifications, recently viewed, sharing
- **Feature 07: Seller Dashboard** (010): Seller analytics and dashboard
- **Feature 08: Advanced Search** (011): Search analytics and full-text search
- **Feature 09: Admin Panel** (012, 015): Admin features, moderation, support
- **Feature 10: Email System** (013): Complete email system with templates
- **Feature 11: Messaging** (014): Buyer-seller messaging system

**Quick Reference**: Use `docs/migrations/MIGRATION-ORGANIZATION.md` for feature-based navigation.

---

---

## Running Migrations

### For Development Database

```bash
# Apply all pending migrations
npx supabase db push --db-url "postgresql://postgres.[dev-ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres"

# Apply specific migration
npx supabase migration up [migration-name]

# Check migration status
npx supabase migration list
```

### For Production Database

```bash
# ALWAYS test on dev first!
# Then apply to production:
npx supabase db push --db-url "postgresql://postgres.[prod-ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres"
```

### Rollback (if needed)

```bash
# Rollback last migration
npx supabase db rollback

# Note: Only rollback if migration has not been applied to production yet
```

---

## Verification Commands

### Check table exists

```bash
npx supabase db inspect --table users
```

### Check all tables in database

```bash
npx supabase db inspect
```

### Verify RLS policies

```sql
SELECT schemaname, tablename, policyname
FROM pg_policies
WHERE tablename = 'products';
```

### Check indexes

```sql
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'products';
```

---

## Creating New Migrations

When adding new features:

1. **Create migration file**
   ```bash
   npx supabase migration new feature_name
   ```

2. **Edit the migration file**
   - Add SQL statements
   - Include comments explaining purpose
   - Create tables, indexes, RLS policies

3. **Test on dev database**
   ```bash
   npx supabase db push --db-url "dev-connection-string"
   ```

4. **Verify in Supabase Dashboard**
   - Check Table Editor
   - Verify RLS policies
   - Test queries

5. **Update this index**
   - Add entry to this document
   - Include purpose, tables, dependencies

6. **Update database schema doc**
   - Update `database-schema-complete.md`
   - Keep schema doc in sync with migrations

7. **Apply to production when ready**
   ```bash
   npx supabase db push --db-url "prod-connection-string"
   ```

---

## Migration Best Practices

### DO ✓

- ✓ Test migrations on dev database first
- ✓ Keep migrations small and focused
- ✓ Include rollback instructions in comments
- ✓ Document all table changes
- ✓ Update database-schema-complete.md immediately
- ✓ Add this index when creating new migrations
- ✓ Use IF NOT EXISTS for idempotency
- ✓ Include descriptive comments

### DON'T ✗

- ✗ Never modify existing migration files
- ✗ Never skip dev testing before prod
- ✗ Never apply untested migrations to production
- ✗ Don't delete migration files (breaks history)
- ✗ Don't apply migrations manually (use CLI)
- ✗ Don't forget to update documentation

---

## Migration Status Tracking

### Applied Migrations

All 18 migrations are currently applied to the development database.

**To check migration status:**
```bash
npx supabase migration list
```

**To verify specific migration was applied:**
```sql
SELECT * FROM supabase_migrations.schema_migrations
WHERE version = '20250114000001'; -- Replace with migration timestamp
```

---

## Troubleshooting

### Migration fails to apply

**Check:**
1. Syntax errors in SQL
2. Missing dependencies (tables referenced don't exist)
3. Duplicate table/column names
4. RLS policy conflicts

**Solution:**
```bash
# View detailed error
npx supabase db push --db-url "connection-string" --debug

# Fix SQL in migration file
# Try again
```

---

### Migration applied but tables not visible

**Check:**
1. Verify you're looking at correct Supabase project
2. Refresh Table Editor in dashboard
3. Check schema (public vs other schema)

**Solution:**
```sql
-- List all tables
SELECT tablename FROM pg_tables
WHERE schemaname = 'public';
```

---

### Need to rollback migration

**Before production:**
```bash
npx supabase db rollback
```

**After production:**
- Create new migration to undo changes
- Don't modify existing migration files
- Test thoroughly on dev first

---

## Related Documentation

- [Database Schema Complete](implementationplan/database-schema-complete.md) - Full schema documentation
- [Migration Alignment Guide](MIGRATION-ALIGNMENT-GUIDE.md) - Alignment checking
- [Deployment Workflow](implementationplan/DEPLOYMENT-WORKFLOW.md) - Dev/prod migration workflow
- [Master Implementation Plan](implementationplan/MASTER-IMPLEMENTATION-PLAN.md) - Overall plan
- [Migration Organization](migrations/MIGRATION-ORGANIZATION.md) - Feature-based organization guide
- [Migrations by Feature](migrations/MIGRATION-BY-FEATURE.md) - Quick feature lookup

---

## Future Migrations

When planning new features, follow this pattern:

1. Design feature → Create brainstorming doc
2. Design database tables → Update schema doc
3. Create migration → Add to this index
4. Implement feature → Create implementation summary
5. Update IMPLEMENTATION-STATUS.md

**This ensures documentation stays in sync with codebase.**

---

**For AI Agents**: This index provides a complete overview of all database migrations. Always check this before modifying the database schema to understand dependencies and existing structures.

**Feature Organization**: Migrations are organized by feature for easier navigation. See `docs/migrations/MIGRATION-BY-FEATURE.md` for quick feature lookups and `docs/migrations/MIGRATION-ORGANIZATION.md` for organization details.

**Helper Scripts**: Use `scripts/migration-utils.ts` for programmatic access to migration information.
