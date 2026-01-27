# Reset Dev Database Instructions

## Overview

This guide will help you completely reset the Dev database and apply the Prod schema.

**⚠️ WARNING**: This will DELETE ALL DATA in the Dev database!

## Prerequisites

- Access to Dev Supabase Dashboard
- Reset script: `docs/schema-comparison/temp/reset-dev-database-complete.sql`
- Complete schema file: `docs/schema-comparison/temp/apply-complete-schema-to-dev.sql`

## Step 1: Reset Dev Database

1. **Go to Dev Supabase Dashboard**
   - URL: https://supabase.com/dashboard/project/enxtvupbiezvwrnuzwsl
   - Navigate to: **SQL Editor**

2. **Open Reset Script**
   - File: `docs/schema-comparison/temp/reset-dev-database-complete.sql`
   - Copy all SQL content

3. **Execute Reset**
   - Paste SQL into SQL Editor
   - Click **"Run"** or press **Ctrl+Enter**
   - Wait for execution to complete
   - Verify output shows all tables dropped

4. **Verify Reset**
   - Go to: **Table Editor**
   - Should show no tables (or only system tables)
   - If tables still exist, check for errors in SQL output

## Step 2: Apply Complete Schema

1. **Still in Dev SQL Editor**
   - Clear the editor (or open new query)

2. **Open Complete Schema File**
   - File: `docs/schema-comparison/temp/apply-complete-schema-to-dev.sql`
   - Copy all SQL content (file is ~200 KB, may take a moment to load)

3. **Execute Schema**
   - Paste SQL into SQL Editor
   - Click **"Run"** or press **Ctrl+Enter**
   - Wait for execution (may take 1-2 minutes for all migrations)
   - Monitor for any errors

4. **Check for Errors**
   - Review SQL Editor output
   - Look for any red error messages
   - Common issues:
     - Policy already exists (should be handled by existence checks)
     - Trigger already exists (should be handled by existence checks)
     - Syntax errors (report these)

## Step 3: Verify Schema Application

### Check Tables Created

Go to **Table Editor** and verify these tables exist:

**Core Tables:**
- ✅ users
- ✅ grades
- ✅ subjects
- ✅ grade_subjects

**Feature Tables:**
- ✅ products
- ✅ orders
- ✅ order_items
- ✅ reviews
- ✅ cart_items
- ✅ wishlist
- ✅ notifications
- ✅ recently_viewed
- ✅ search_analytics
- ✅ search_queries
- ✅ reports
- ✅ email_queue
- ✅ email_templates
- ✅ announcements
- ✅ conversations
- ✅ messages

### Verify Users Table Structure

Run this query in SQL Editor:

```sql
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'users'
ORDER BY ordinal_position;
```

**Expected columns:**
- ✅ `first_name` (VARCHAR, NOT NULL)
- ✅ `last_name` (VARCHAR, DEFAULT '')
- ❌ `name` (should NOT exist)

### Run Comparison Scripts

```bash
# Compare table existence
npx tsx scripts/compare-schemas-simple.ts

# Compare users table structure
npx tsx scripts/compare-users-table.ts
```

Both should show **100% match** with Prod.

## Troubleshooting

### Reset Script Fails

**Error**: "table does not exist"
- **Solution**: This is normal - some tables may not exist. The script uses `IF EXISTS` so it's safe.

**Error**: "permission denied"
- **Solution**: Ensure you're using the service role key or have proper permissions.

### Schema Application Fails

**Error**: "policy already exists"
- **Solution**: The schema file includes existence checks. If this error appears, there may be a bug in the existence check logic. Report it.

**Error**: "trigger already exists"
- **Solution**: Same as above - existence checks should prevent this.

**Error**: "syntax error"
- **Solution**: Check the error message for line number. Review that section of the schema file. Report the error.

### Verification Shows Mismatches

**Tables missing in Dev:**
- Re-run the schema application
- Check for errors during application
- Verify you're looking at the correct database (Dev vs Prod)

**Users table structure mismatch:**
- Verify migration 018 was applied correctly
- Check if `name` column still exists (should be dropped)
- Check if `first_name`/`last_name` exist (should exist)

## Success Criteria

✅ All tables from Prod exist in Dev  
✅ Users table has `first_name`/`last_name` (not `name`)  
✅ Schema comparison shows 100% match  
✅ No errors in SQL execution  
✅ All policies and triggers created successfully  

## Next Steps

After successful reset and schema application:

1. Update `docs/DATABASE-MIGRATIONS-INDEX.md` with migration status
2. Update `docs/schema-comparison/DEV-PROD-SCHEMA-COMPARISON.md` with final status
3. Document any issues encountered
4. Test application functionality in Dev environment

## Rollback

If something goes wrong and you need to restore Dev:

1. Use Supabase Dashboard → Database → Backups (if backup exists)
2. Or manually restore from a previous state
3. Or re-run reset and schema application

**Note**: There is no automatic rollback. Always backup before major changes.
