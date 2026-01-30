# Migration 024 – Profile Teaching Phase 2 (teaching_class_types, etc.)

**Why `PUT /api/me/profile` returns 500 (PGRST204):** The profile update sends `teaching_class_types`, `teaching_learner_paths`, `teaching_strand_ids`, and `teaching_sped_level_ids`. If migration 024 has not been run, those columns do not exist on `users` and Supabase returns: *"Could not find the 'teaching_class_types' column of 'users' in the schema cache"*. Run this migration on the Supabase project your app uses (local and/or production).

---

## Migration to run

**File:** `supabase/migrations/024_profile_teaching_phase2.sql`

Run the following SQL in the Supabase Dashboard → SQL Editor (or use `supabase db push` with your DB URL):

```sql
-- Migration: 024_profile_teaching_phase2.sql
-- Purpose: Add Phase 2 teaching preference columns to users table for Profile Teaching tab
-- Allows teachers to specify: Class type (Regular/SPED), Learner path (SPED), Strand (Regular G11/12), SPED levels

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS teaching_class_types TEXT[] NULL,
  ADD COLUMN IF NOT EXISTS teaching_learner_paths TEXT[] NULL,
  ADD COLUMN IF NOT EXISTS teaching_strand_ids UUID[] NULL,
  ADD COLUMN IF NOT EXISTS teaching_sped_level_ids UUID[] NULL;

CREATE INDEX IF NOT EXISTS idx_users_teaching_class_types ON users USING GIN(teaching_class_types);
CREATE INDEX IF NOT EXISTS idx_users_teaching_strand_ids ON users USING GIN(teaching_strand_ids);
CREATE INDEX IF NOT EXISTS idx_users_teaching_sped_level_ids ON users USING GIN(teaching_sped_level_ids);

COMMENT ON COLUMN users.teaching_class_types IS 'Array of class types teacher teaches: regular, sped';
COMMENT ON COLUMN users.teaching_learner_paths IS 'Array of SPED learner paths: graded, non_graded';
COMMENT ON COLUMN users.teaching_strand_ids IS 'Array of strand UUIDs for Regular G11/12 teaching';
COMMENT ON COLUMN users.teaching_sped_level_ids IS 'Array of SPED level UUIDs for Non-Graded teaching';
```

---

## Option A: Supabase Dashboard

1. Open your Supabase project (the one used by this app).
2. Go to **SQL Editor**.
3. Paste the SQL above and click **Run**.

---

## Option B: Supabase CLI

From the project root, with your database URL:

```bash
npx supabase db push --db-url "postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres"
```

Or if the project is already linked:

```bash
npx supabase db push
```

---

## After running the migration

- `PUT /api/me/profile` should succeed when saving the profile (including the Teaching tab).
- Profile edit page Teaching tab (class types, learner paths, strands, SPED levels) will persist correctly.
