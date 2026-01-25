# Migration Alignment Guide

This guide explains how to check if your local migration files are aligned with what's currently in your database.

## Overview

Supabase tracks migrations in two places:
1. **Local migration files** in `supabase/migrations/` directory
2. **Applied migrations** in the database's `supabase_migrations.schema_migrations` table

It's important to ensure these are in sync to avoid schema drift and migration conflicts.

## Quick Start

### Option 1: Use the Helper Script (Recommended)

Run the PowerShell script to check alignment:

```powershell
# Check against linked remote database (production)
.\scripts\check-migrations-alignment.ps1

# Or check against local database
.\scripts\check-migrations-alignment.ps1 --local
```

This script will:
1. Check your Supabase connection
2. List all migrations (local vs applied)
3. Compare schema differences
4. Provide a summary and next steps

### Option 2: Manual Commands

#### Check Migration List

Shows which migrations exist locally vs which are applied in the database:

```powershell
# For linked remote database
npx supabase migration list --linked

# For local database
npx supabase migration list --local
```

**Output interpretation:**
- ✅ **Applied** - Migration exists in both local files and database
- ⚠️ **Pending** - Migration exists locally but not applied to database
- ❌ **Missing** - Migration applied to database but missing from local files

#### Check Schema Differences

Compares your local migration files to the actual database schema:

```powershell
# For linked remote database
npx supabase db diff --linked

# For local database
npx supabase db diff --local
```

**What it does:**
- Creates a temporary "shadow" database from your local migrations
- Compares it with the target database
- Shows SQL differences (tables, columns, indexes, etc.)

**If no differences:** Your migrations are aligned! ✅

**If differences found:** You have schema drift. The output shows SQL that would align them.

## Common Scenarios

### Scenario 1: All Migrations Aligned ✅

**What you see:**
```
Migration list: All migrations show as "Applied"
Schema diff: "No schema differences found"
```

**Action:** Nothing needed! Your migrations are in sync.

### Scenario 2: Pending Migrations ⚠️

**What you see:**
```
Migration list: Some migrations show as "Pending"
Schema diff: Shows missing tables/columns
```

**Cause:** You have new migration files that haven't been applied to the database.

**Action:** Apply pending migrations:
```powershell
npx supabase db push
```

### Scenario 3: Missing Local Migrations ❌

**What you see:**
```
Migration list: Some migrations show as "Missing" (applied in DB but not in local files)
```

**Cause:** Migrations were applied directly to the database (via dashboard or another environment) but the migration files are missing locally.

**Action:** 
1. Get the migration SQL from Supabase Dashboard → Database → Migrations
2. Create a new migration file with that SQL
3. Or use `supabase db pull` to generate migration files from the database

### Scenario 4: Schema Drift ⚠️

**What you see:**
```
Migration list: All migrations applied
Schema diff: Shows differences (e.g., extra columns, missing indexes)
```

**Cause:** Database was modified manually (via SQL Editor or dashboard) outside of migrations.

**Action:** 
1. Review the differences shown in `db diff`
2. Create a new migration to align the schema:
   ```powershell
   npx supabase db diff --linked -f fix_schema_drift.sql
   ```
3. Review and apply the generated migration

## Repairing Migration History

If your migration history is out of sync, you can repair it:

```powershell
# Mark a migration as applied (if it was applied manually)
npx supabase migration repair --status applied <timestamp>

# Mark a migration as reverted (if it needs to be rolled back)
npx supabase migration repair --status reverted <timestamp>
```

**Example:**
```powershell
# If migration 20240101000000_foundation.sql was applied but not recorded
npx supabase migration repair --status applied 20240101000000
```

⚠️ **Warning:** Only use repair if you're certain about the migration state. Incorrect repair can cause issues.

## Checking Against Different Environments

### Production Database

```powershell
# Ensure you're linked to production
npx supabase link --project-ref iokinyttkzmcnmznxgza

# Check alignment
npx supabase migration list --linked
npx supabase db diff --linked
```

### Local Development Database

```powershell
# Start local Supabase (if not running)
npx supabase start

# Check alignment
npx supabase migration list --local
npx supabase db diff --local
```

### Custom Database URL

```powershell
# Check against any Postgres database
npx supabase migration list --db-url "postgresql://user:pass@host:port/db"
npx supabase db diff --db-url "postgresql://user:pass@host:port/db"
```

## Best Practices

1. **Check alignment regularly** - Especially before deploying or after manual database changes
2. **Use migrations for all changes** - Avoid manual SQL changes in production
3. **Review differences carefully** - Schema drift might indicate manual changes or missing migrations
4. **Test locally first** - Always test migrations on local/staging before production
5. **Keep migration files in version control** - Never delete migration files that are applied

## Troubleshooting

### "Not logged in" Error

```powershell
npx supabase login
```

### "Project not linked" Error

```powershell
npx supabase link --project-ref iokinyttkzmcnmznxgza
```

### "Migration history table not found"

This means migrations haven't been initialized. Run:
```powershell
npx supabase db push
```

### Schema Diff Shows Unexpected Differences

1. Check if someone made manual changes via SQL Editor
2. Verify all migration files are present locally
3. Compare with Supabase Dashboard → Database → Migrations
4. Consider using `supabase db pull` to sync local files with database

## Related Commands

| Command | Purpose |
|---------|---------|
| `supabase migration list` | Show migration status |
| `supabase db diff` | Compare schemas |
| `supabase db push` | Apply pending migrations |
| `supabase db pull` | Generate migrations from database |
| `supabase migration repair` | Fix migration history |
| `supabase migration new <name>` | Create new migration file |

## Additional Resources

- [Supabase CLI Documentation](https://supabase.com/docs/reference/cli)
- [Supabase Migration Guide](https://supabase.com/docs/guides/cli/local-development#database-migrations)
- [Production Migration Guide](./PRODUCTION-MIGRATION-GUIDE.md)
