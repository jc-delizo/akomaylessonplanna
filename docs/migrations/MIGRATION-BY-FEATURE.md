# Migrations by Feature

**Last Updated**: January 26, 2026  
**Purpose**: Quick reference for which migrations belong to which features

## Feature 02: User Profiles & Authentication

**Migrations**: 003, 004, 016, 017, 018

**Tables**:
- `followers` - User following relationships
- `profile_views` - Profile view analytics
- `admin_notes` - Admin notes on users
- `audit_log` - Admin action tracking
- `teacher_id_verifications` - Teacher verification documents

**Modifications**:
- `users` table: Added shop_name, shop_description, shop_banner_url (017)
- `users` table: Split name → first_name/last_name (018)

**Storage Buckets**:
- `teacher-verifications` - Teacher ID documents (016)

## Feature 03: Products

**Migrations**: 005, 006

**Tables**:
- `products` - Product listings
- `product_updates` - Product version history
- `product_views` - Product view analytics

**Storage Buckets**:
- `products` - Product files, covers, previews
- `user-avatars` - User profile pictures

## Feature 04: Shopping Cart & Checkout

**Migrations**: 007

**Tables**:
- `cart_items` - Shopping cart items
- `wishlist` - User wishlists
- `orders` - Order records
- `order_items` - Order line items
- `user_library` - Purchased products (download access)
- `withdrawal_requests` - Seller payout requests

## Feature 05: Reviews & Ratings

**Migrations**: 008

**Tables**:
- `reviews` - Product reviews and ratings
- `review_flags` - Flagged reviews for moderation

**Functions**:
- `update_product_rating()` - Updates product rating when review changes

## Feature 06: Social Features

**Migrations**: 009

**Tables**:
- `notifications` - In-app notifications
- `recently_viewed` - Recently viewed products
- `product_shares` - Social sharing analytics

**Functions**:
- `cleanup_old_recently_viewed()` - Cleans up old entries
- `limit_recently_viewed_per_user()` - Limits to 20 items per user

## Feature 07: Seller Dashboard

**Migrations**: 010

**Tables**:
- `seller_metrics_cache` - Cached dashboard metrics
- `export_jobs` - CSV/Excel export jobs
- `scheduled_reports` - Scheduled report configurations

## Feature 08: Advanced Search

**Migrations**: 011

**Tables**:
- `search_analytics` - Search analytics tracking
- `search_queries` - Popular search queries
- `user_search_history` - User search history

**Indexes**:
- Full-text search indexes on products
- GIN indexes for fuzzy search
- Composite indexes for filter combinations

**Functions**:
- `upsert_user_search_history()` - Tracks user searches
- `upsert_search_query()` - Tracks popular searches

## Feature 09: Admin Panel

**Migrations**: 012, 015

**Tables**:
- `announcements` - Platform announcements
- `announcement_stats` - Announcement analytics
- `categories` - Product categories
- `support_tickets` - User support tickets
- `ticket_messages` - Support conversation messages
- `disputes` - Transaction disputes
- `reports` - User reports (products, reviews, users)

**Modifications**:
- `users` table: Added `admin_role` ENUM column

**Note**: Migration 015 may be redundant with 012 (both create reports table)

## Feature 10: Email System

**Migrations**: 013

**Tables**:
- `email_templates` - Email template definitions
- `email_queue` - Email sending queue with retry logic
- `email_template_versions` - Template version history
- `email_configuration` - Email system settings
- `user_email_preferences` - User email preferences (4 categories)
- `email_analytics` - Email delivery and engagement metrics
- `email_daily_stats` - Daily email statistics
- `email_suppression_list` - Unsubscribe list

**Email Types**: 26 email types configured (transactional, selling, buying, social, platform)

## Feature 11: Messaging System

**Migrations**: 014

**Tables**:
- `conversations` - Message conversations
- `messages` - Individual messages
- `message_templates` - Quick reply templates
- `message_reports` - Flagged messages
- `user_blocks` - Blocked users
- `seller_response_times` - Response time analytics

## Foundation Migrations

**Migrations**: 001, 002

**001_foundation.sql**:
- Extensions: `pg_trgm`, `pgcrypto`
- ENUM types: user_role, subscription_tier, product_status, product_type, order_status, etc.
- Core tables: `users`, `grades`, `subjects`, `grade_subjects`

**002_seed_data.sql**:
- 13 grade levels (K-12)
- 56 subjects
- 182 grade-subject relationships
- Admin user account

## Quick Lookup: What Tables Does Feature X Need?

### Feature 02 (Profiles)
- Needs: `users` (from 001)
- Creates: `followers`, `profile_views`, `admin_notes`, `audit_log`, `teacher_id_verifications`

### Feature 03 (Products)
- Needs: `users`, `grades`, `subjects` (from 001)
- Creates: `products`, `product_updates`, `product_views`

### Feature 04 (Cart/Checkout)
- Needs: `users`, `products` (from 001, 005)
- Creates: `cart_items`, `wishlist`, `orders`, `order_items`, `user_library`, `withdrawal_requests`

### Feature 05 (Reviews)
- Needs: `users`, `products`, `orders` (from 001, 005, 007)
- Creates: `reviews`, `review_flags`

### Feature 06 (Social)
- Needs: `users`, `products` (from 001, 005)
- Creates: `notifications`, `recently_viewed`, `product_shares`

### Feature 07 (Seller Dashboard)
- Needs: `users`, `products`, `orders` (from 001, 005, 007)
- Creates: `seller_metrics_cache`, `export_jobs`, `scheduled_reports`

### Feature 08 (Search)
- Needs: `products` (from 005)
- Creates: `search_analytics`, `search_queries`, `user_search_history`

### Feature 09 (Admin)
- Needs: `users` (from 001)
- Creates: `announcements`, `categories`, `support_tickets`, `disputes`, `reports`

### Feature 10 (Email)
- Needs: `users` (from 001)
- Creates: All email system tables (8 tables)

### Feature 11 (Messaging)
- Needs: `users`, `products` (from 001, 005)
- Creates: `conversations`, `messages`, `message_templates`, etc.

## For AI Agents

Use this document to:
1. Quickly find which migrations belong to a feature
2. Understand table dependencies for a feature
3. Determine what needs to exist before adding a new feature
4. Plan migration order when working on features

See `docs/DATABASE-MIGRATIONS-INDEX.md` for detailed migration information.
