# Production Migration Guide

This guide explains how to push database migrations to the production Supabase project.

## Overview

The project uses Supabase CLI to manage database migrations. All migration files are stored in `supabase/migrations/` and are applied sequentially to maintain database schema consistency.

**Production Project Reference ID:** `iokinyttkzmcnmznxgza`

## Prerequisites

1. **Node.js** installed (v20.14.0 or higher recommended)
2. **npm** installed
3. **Supabase account** with access to the production project
4. **Internet connection** for authentication

## Quick Start

### Option 1: Use the Helper Script (Recommended)

Run the PowerShell script:

```powershell
.\scripts\push-migrations-prod.ps1
```

This script will:
1. Login to Supabase (opens browser)
2. Link to production project
3. Push all migrations
4. Provide verification steps

### Option 2: Manual Commands

Run these commands in PowerShell:

```powershell
# Step 1: Login (opens browser)
npx supabase login

# Step 2: Link to production
npx supabase link --project-ref iokinyttkzmcnmznxgza

# Step 3: Push migrations
npx supabase db push
```

## Migration Files

The following 16 migrations are applied in order:

1. `001_foundation.sql` - Extensions, ENUM types, core tables (users, grades, subjects)
2. `002_seed_data.sql` - Seed data for grades and subjects
3. `003_fix_users_rls_policies.sql` - RLS policy fixes for users table
4. `004_feature_02_profiles.sql` - User profiles feature
5. `005_feature_03_products.sql` - Products feature
6. `006_storage_buckets_and_policies.sql` - Storage buckets and policies
7. `007_feature_04_cart_and_checkout.sql` - Cart and checkout functionality
8. `008_feature_05_reviews.sql` - Reviews and ratings system
9. `009_feature_06_social_features.sql` - Social features (followers, favorites)
10. `010_feature_07_seller_dashboard.sql` - Seller dashboard and analytics
11. `011_feature_08_advanced_search.sql` - Advanced search functionality
12. `012_feature_09_admin_panel.sql` - Admin panel and moderation
13. `013_feature_10_email_system.sql` - Email queue and templates
14. `014_feature_11_messaging_system.sql` - Messaging system
15. `015_add_reports_table.sql` - Reports table for content moderation
16. `016_teacher_verification_storage.sql` - Teacher verification storage bucket

## Verification

After migrations complete, verify success:

### 1. Check Migration History

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your production project
3. Navigate to **Database** → **Migrations**
4. Verify all 16 migrations appear in the list

### 2. Verify Core Tables

Go to **Table Editor** and verify these tables exist:
- `users` - User accounts
- `grades` - Grade levels (K-12)
- `subjects` - Subject categories
- `products` - Product listings
- `orders` - Order records
- `reviews` - Product reviews
- `cart_items` - Shopping cart items
- `messages` - User messages
- `email_queue` - Email queue system
- `audit_log` - Admin audit trail

### 3. Verify Storage Buckets

Go to **Storage** and verify these buckets exist:
- `products` - Product images/files
- `profiles` - User profile pictures
- `teacher-verifications` - Teacher verification documents

### 4. Verify RLS Policies

Go to **Authentication** → **Policies** and verify:
- RLS is enabled on sensitive tables
- Policies exist for users, products, orders, etc.

### 5. Verify Functions

Go to **Database** → **Functions** and verify:
- Trigger functions exist
- Helper functions are created
- Email queue processing functions exist

## Troubleshooting

### Login Fails

**Error:** `Cannot use automatic login flow inside non-TTY environments`

**Solution:** Run the command in a terminal (PowerShell, CMD, or Git Bash) where you can interact with the browser.

### Linking Fails

**Error:** `Project not found` or `Access denied`

**Solutions:**
1. Verify the project reference ID is correct: `iokinyttkzmcnmznxgza`
2. Ensure you have access to the production project in Supabase Dashboard
3. Check that you're logged in with the correct account

### Migration Fails

**Error:** `Migration failed: [specific error]`

**Solutions:**
1. Read the error message carefully - it will indicate which migration failed
2. Check the specific migration file for syntax errors
3. Verify dependencies - earlier migrations must succeed before later ones
4. Check if tables/functions already exist (migrations use `IF NOT EXISTS` but some operations may conflict)

**Common Issues:**
- **Duplicate table:** Migration uses `CREATE TABLE IF NOT EXISTS` so this shouldn't happen, but if it does, the table may need to be dropped first
- **Missing extension:** Ensure `001_foundation.sql` ran successfully (it creates extensions)
- **Permission denied:** Verify your Supabase account has admin access to the project

### Partial Migration

If migrations stop partway through:

1. **Check migration status** in Supabase Dashboard → Database → Migrations
2. **Identify which migration failed**
3. **Fix the issue** in the migration file
4. **Re-run:** `npx supabase db push` (it will skip already-applied migrations)

## Rollback (If Needed)

⚠️ **Warning:** Rolling back migrations can cause data loss. Only do this if absolutely necessary.

### Option 1: Manual Rollback via SQL Editor

1. Go to Supabase Dashboard → SQL Editor
2. Write reverse SQL statements for the problematic migration
3. Execute carefully

### Option 2: Restore from Backup

1. Go to Supabase Dashboard → Database → Backups
2. Restore to a point before the migration
3. Fix the migration file
4. Re-apply migrations

## Best Practices

1. **Always verify** migrations in development/staging first
2. **Backup database** before major migrations (Supabase does this automatically)
3. **Test migrations** on a copy of production data if possible
4. **Review migration files** before pushing to production
5. **Monitor** the Supabase Dashboard after migrations complete

## Environment Separation

- **Development:** Uses `.env.local` with dev Supabase project
- **Production:** Uses environment variables set in Vercel/hosting platform with production Supabase project

Migrations are applied to whichever project you're linked to. Always verify you're linked to the correct project before pushing:

```powershell
# Check current link
npx supabase projects list
```

## Future Migrations

When creating new migrations:

1. Create migration file: `supabase/migrations/017_new_feature.sql`
2. Test locally first
3. Push to production: `npx supabase db push`
4. Verify in Supabase Dashboard

## Additional Resources

- [Supabase CLI Documentation](https://supabase.com/docs/reference/cli)
- [Supabase Migration Guide](https://supabase.com/docs/guides/cli/local-development#database-migrations)
- [Supabase Dashboard](https://supabase.com/dashboard)

## Support

If you encounter issues:
1. Check the error message in the terminal
2. Review this guide's troubleshooting section
3. Check Supabase Dashboard for detailed error logs
4. Review migration files for syntax errors
