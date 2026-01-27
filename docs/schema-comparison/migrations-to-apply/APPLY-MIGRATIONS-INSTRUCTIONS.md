# How to Apply Migrations

## Overview

This directory contains SQL migration files ready to be applied via Supabase Dashboard SQL Editor.

## Files

- **`dev-migrations-combined-safe.sql`** ⭐ **RECOMMENDED** - Safe version without DROP statements (no destructive operation warning)
- `dev-migrations-combined.sql` - Original version (may show destructive operation warning)
- `prod-migration-018.sql` - Apply to Prod database (migration 018)

**Note:** The safe version removes `DROP POLICY` and `DROP TRIGGER` statements to avoid Supabase's destructive operation warning. Both versions are functionally identical and safe to use. See `WHY-DESTRUCTIVE-WARNING.md` for details.

## Step 1: Apply Migrations to Dev Database

1. **Go to Dev Supabase Dashboard**
   - URL: https://supabase.com/dashboard/project/enxtvupbiezvwrnuzwsl
   - Navigate to: SQL Editor

2. **Open Dev Migration File**
   - **Recommended:** Open `docs/schema-comparison/migrations-to-apply/dev-migrations-combined-safe.sql` (no warnings)
   - Or use: `docs/schema-comparison/migrations-to-apply/dev-migrations-combined.sql` (may show destructive operation warning, but safe to proceed)
   - Copy all SQL content

3. **Execute in SQL Editor**
   - Paste SQL into SQL Editor
   - Click "Run" or press Ctrl+Enter
   - Verify no errors

4. **Verify Tables Created**
   - Go to: Table Editor
   - Check that these tables exist:
     - ✅ notifications
     - ✅ recently_viewed
     - ✅ product_shares
     - ✅ search_analytics
     - ✅ search_queries
     - ✅ reports
     - ✅ email_queue
     - ✅ email_templates

## Step 2: Apply Migration 018 to Prod Database

⚠️ **CRITICAL: Backup Prod database first!**

1. **Backup Production Database**
   - Go to: Supabase Dashboard → Database → Backups
   - Create a manual backup
   - Or use: `pg_dump` to create backup

2. **Go to Prod Supabase Dashboard**
   - URL: https://supabase.com/dashboard/project/iokinyttkzmcnmznxgza
   - Navigate to: SQL Editor

3. **Open Prod Migration File**
   - Open: `docs/schema-comparison/migrations-to-apply/prod-migration-018.sql`
   - Review the migration carefully
   - Copy all SQL content

4. **Execute Migration**
   - Paste SQL into SQL Editor
   - Click "Run" or press Ctrl+Enter
   - Monitor for any errors

5. **Verify Migration Success**
   - Run this query to verify:
     ```sql
     SELECT column_name 
     FROM information_schema.columns 
     WHERE table_name = 'users' 
     ORDER BY column_name;
     ```
   - Should show: `first_name` and `last_name` columns
   - Should NOT show: `name` column

6. **Verify Data Migration**
   - Run this query:
     ```sql
     SELECT first_name, last_name 
     FROM users 
     LIMIT 10;
     ```
   - Verify data was migrated correctly
   - Check that `first_name` has no NULL values

7. **Test Application**
   - Verify application can read `first_name`/`last_name`
   - Test user registration/login
   - Test user profile display

## Step 3: Verify Schema Synchronization

After applying all migrations, run:

```bash
npx tsx scripts/compare-schemas-simple.ts
npx tsx scripts/compare-users-table.ts
```

Both databases should now have matching schemas.

## Troubleshooting

### Migration Fails in SQL Editor

- Check for syntax errors
- Verify you're connected to the correct database (Dev vs Prod)
- Check if tables/columns already exist (migration uses IF NOT EXISTS, should be safe)

### Users Table Migration Issues

- If migration fails partway through, check current state:
  ```sql
  SELECT column_name FROM information_schema.columns WHERE table_name = 'users';
  ```
- If `first_name`/`last_name` exist but `name` still exists, manually drop `name` column
- If data migration failed, check for NULL values and fix manually

### Rollback (If Needed)

If migration 018 needs to be rolled back:

```sql
-- Restore name column
ALTER TABLE users ADD COLUMN name VARCHAR(255);

-- Combine first_name and last_name back to name
UPDATE users 
SET name = CASE 
  WHEN last_name IS NULL OR last_name = '' THEN first_name
  ELSE first_name || ' ' || last_name
END;

-- Drop new columns
ALTER TABLE users DROP COLUMN IF EXISTS first_name;
ALTER TABLE users DROP COLUMN IF EXISTS last_name;
```

## Next Steps

After migrations are applied:

1. Update `docs/DATABASE-MIGRATIONS-INDEX.md` with migration status
2. Update `docs/schema-comparison/DEV-PROD-SCHEMA-COMPARISON.md` with final status
3. Run schema comparison scripts to verify synchronization
