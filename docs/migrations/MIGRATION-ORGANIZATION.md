# Migration Organization Guide

**Last Updated**: January 26, 2026  
**Purpose**: Help AI agents and developers quickly understand migration organization by feature

## Overview

Migrations are numbered sequentially (001-018) but logically belong to specific features. This document provides feature-based organization for easier navigation and understanding.

## Migration File Structure

**Important**: Supabase CLI requires migrations in a **flat directory structure**. Files remain in `supabase/migrations/` with sequential numbering.

**Feature grouping is documented, not structural**. Use this guide to understand which migrations belong to which features.

## Feature-Based Organization

### Foundation & Setup
- **001_foundation.sql** - Extensions, ENUMs, core tables (users, grades, subjects)
- **002_seed_data.sql** - Initial reference data (grades, subjects, admin user)

### Feature 02: User Profiles & Authentication
- **003_fix_users_rls_policies.sql** - RLS policy fixes for users table
- **004_feature_02_profiles.sql** - Profile features (followers, profile_views, admin_notes, audit_log)
- **016_teacher_verification_storage.sql** - Teacher ID verification storage bucket
- **017_seller_settings_fields.sql** - Seller shop customization (shop_name, shop_description, shop_banner_url)
- **018_replace_name_with_first_last_name.sql** - Split name field into first_name/last_name

**Tables Created**: `followers`, `profile_views`, `admin_notes`, `audit_log`, `teacher_id_verifications`

### Feature 03: Products
- **005_feature_03_products.sql** - Product listings (products, product_updates, product_views)
- **006_storage_buckets_and_policies.sql** - Storage buckets (products, user-avatars, teacher-ids)

**Tables Created**: `products`, `product_updates`, `product_views`

### Feature 04: Shopping Cart & Checkout
- **007_feature_04_cart_and_checkout.sql** - Cart, orders, wishlist, library, withdrawals

**Tables Created**: `cart_items`, `wishlist`, `orders`, `order_items`, `user_library`, `withdrawal_requests`

### Feature 05: Reviews & Ratings
- **008_feature_05_reviews.sql** - Reviews system with moderation

**Tables Created**: `reviews`, `review_flags`

### Feature 06: Social Features
- **009_feature_06_social_features.sql** - Notifications, recently viewed, product shares

**Tables Created**: `notifications`, `recently_viewed`, `product_shares`

### Feature 07: Seller Dashboard
- **010_feature_07_seller_dashboard.sql** - Seller analytics and dashboard

**Tables Created**: `seller_metrics_cache`, `export_jobs`, `scheduled_reports`

### Feature 08: Advanced Search
- **011_feature_08_advanced_search.sql** - Search analytics and full-text search

**Tables Created**: `search_analytics`, `search_queries`, `user_search_history`

### Feature 09: Admin Panel
- **012_feature_09_admin_panel.sql** - Admin features (announcements, categories, support, disputes, reports)
- **015_add_reports_table.sql** - Reports table (may be redundant with 012)

**Tables Created**: `announcements`, `announcement_stats`, `categories`, `support_tickets`, `ticket_messages`, `disputes`, `reports`

### Feature 10: Email System
- **013_feature_10_email_system.sql** - Complete email system with templates and queue

**Tables Created**: `email_templates`, `email_queue`, `email_template_versions`, `email_configuration`, `user_email_preferences`, `email_analytics`, `email_daily_stats`, `email_suppression_list`

### Feature 11: Messaging System
- **014_feature_11_messaging_system.sql** - Buyer-seller messaging

**Tables Created**: `conversations`, `messages`, `message_templates`, `message_reports`, `user_blocks`, `seller_response_times`

## Quick Reference: Migration to Feature Map

| Migration | Feature | Key Tables |
|-----------|---------|------------|
| 001 | Foundation | users, grades, subjects |
| 002 | Foundation | (seed data only) |
| 003 | Feature 02 | (RLS fixes) |
| 004 | Feature 02 | followers, profile_views |
| 005 | Feature 03 | products |
| 006 | Feature 03 | (storage buckets) |
| 007 | Feature 04 | orders, cart_items, wishlist |
| 008 | Feature 05 | reviews |
| 009 | Feature 06 | notifications, recently_viewed |
| 010 | Feature 07 | seller_metrics_cache |
| 011 | Feature 08 | search_analytics, search_queries |
| 012 | Feature 09 | announcements, categories, reports |
| 013 | Feature 10 | email_queue, email_templates |
| 014 | Feature 11 | conversations, messages |
| 015 | Feature 09 | reports (redundant?) |
| 016 | Feature 02 | (storage bucket) |
| 017 | Feature 02 | (users table modification) |
| 018 | Feature 02 | (users table modification) |

## Dependency Graph by Feature

```
Foundation (001-002)
 ├─> Feature 02: Profiles (003, 004, 016, 017, 018)
 ├─> Feature 03: Products (005, 006)
 │    ├─> Feature 04: Cart/Checkout (007)
 │    │    └─> Feature 05: Reviews (008)
 │    ├─> Feature 06: Social (009)
 │    ├─> Feature 07: Seller Dashboard (010)
 │    ├─> Feature 08: Search (011)
 │    └─> Feature 11: Messaging (014)
 ├─> Feature 09: Admin (012, 015)
 └─> Feature 10: Email (013)
```

## For AI Agents

When working on a specific feature:

1. **Find Feature Migrations**: Use `docs/migrations/MIGRATION-BY-FEATURE.md` for quick lookup
2. **Check Dependencies**: Review dependency graph above
3. **Understand Tables**: See table list for each feature
4. **Migration Order**: Always apply migrations in numerical order (001-018)

## Creating New Migrations

When adding a new feature:

1. Determine which feature it belongs to
2. Create migration with next sequential number (e.g., `019_feature_XX_new_feature.sql`)
3. Update `docs/DATABASE-MIGRATIONS-INDEX.md` with migration details
4. Update this file (`MIGRATION-ORGANIZATION.md`) to add to feature group
5. Update `docs/migrations/MIGRATION-BY-FEATURE.md` with new migration

## Notes

- Migration files must remain in flat structure (`supabase/migrations/`)
- Feature grouping is for documentation and understanding only
- Always apply migrations in numerical order
- Check `docs/DATABASE-MIGRATIONS-INDEX.md` for detailed migration information
