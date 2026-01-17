# Running Migration 008_feature_05_reviews.sql

## Option 1: Supabase Dashboard (Recommended - Easiest)

1. Go to your Supabase Dashboard: https://supabase.com/dashboard
2. Select your project
3. Navigate to **SQL Editor** (left sidebar)
4. Click **New Query**
5. Copy the entire contents of `supabase/migrations/008_feature_05_reviews.sql`
6. Paste it into the SQL Editor
7. Click **Run** (or press Ctrl+Enter)
8. Wait for the migration to complete
9. Verify by checking if the `review_flags` table exists in the Table Editor

## Option 2: Supabase CLI (If you have it installed)

```bash
# Make sure you're linked to your project
supabase link --project-ref YOUR_PROJECT_REF

# Run the migration
supabase db push
```

## Option 3: Manual Execution via psql (Advanced)

If you have direct database access:

```bash
psql "postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT].supabase.co:5432/postgres" -f supabase/migrations/008_feature_05_reviews.sql
```

## What This Migration Does

- Creates `reviews` table (if not exists)
- Creates `review_flags` table (if not exists)
- Adds review-related columns to `users` table
- Creates indexes for performance
- Sets up Row Level Security (RLS) policies
- Creates trigger functions for review statistics
- Creates helper functions for review eligibility and auto-flagging

## Verification

After running the migration, verify it worked:

1. Go to Supabase Dashboard → Table Editor
2. Check that `review_flags` table exists
3. Check that `reviews` table exists (if it didn't before)
4. The `/admin/reviews/flagged` page should now work without warnings
