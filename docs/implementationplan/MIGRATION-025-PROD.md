# Migration 025 – display_name (Production)

**Why `/sellers/[username]` returns 404:** The seller page selects the `display_name` column. If migration 025 has not been run, that column does not exist and the Supabase query fails, which leads to a 404. Run this migration on **local and production** Supabase.

**Also check:** The user (e.g. `delizojohncarlo25`) must exist and have `role = 'seller'` or `role = 'admin'`. Buyers get 404 on `/sellers/[username]`.

---

## Migration to run in production Supabase

**File:** `supabase/migrations/025_add_display_name.sql`

Run this SQL in the Supabase Dashboard → SQL Editor (or via `supabase db push` with production URL):

```sql
-- Migration: 025_add_display_name.sql
-- Feature: Customize Shop - optional display name shown above full name on public seller page
-- Description: Add display_name to users table (nullable, max 255 chars)

ALTER TABLE users
ADD COLUMN IF NOT EXISTS display_name VARCHAR(255) NULL;
```

---

## Option A: Supabase Dashboard (production)

1. Open your **production** Supabase project.
2. Go to **SQL Editor**.
3. Paste the SQL above and click **Run**.

---

## Option B: Supabase CLI (production)

If you use the CLI with a production database URL:

```bash
# From project root, with production DB URL set
npx supabase db push --db-url "postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres"
```

Or link production and push:

```bash
npx supabase link --project-ref <your-prod-ref>
npx supabase db push
```

---

## After running the migration

- `/sellers/delizojohncarlo25` (and any seller username) should load if that user exists and has `role = 'seller'` or `'admin'`.
- Sellers can set an optional display name in **Shop → Customize Shop**; it appears above their full name on the public seller page.
