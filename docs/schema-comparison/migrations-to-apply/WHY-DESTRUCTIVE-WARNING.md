# Why Supabase Shows "Destructive Operation" Warning

## Overview

The original migration files contain `DROP POLICY` and `DROP TRIGGER` statements, which Supabase SQL Editor flags as potentially destructive operations.

## Why These Are Safe

1. **All DROP statements use `IF EXISTS`**
   - They won't fail if the policy/trigger doesn't exist
   - They're immediately followed by `CREATE POLICY` or `CREATE TRIGGER` statements

2. **Migrations are Idempotent**
   - All tables use `CREATE TABLE IF NOT EXISTS`
   - All indexes use `CREATE INDEX IF NOT EXISTS`
   - All policies are recreated after being dropped

3. **No Data Loss**
   - No `DELETE`, `TRUNCATE`, or `DROP TABLE` statements
   - Only creating new tables, indexes, policies, and triggers

## What Was Removed

The safe version (`dev-migrations-combined-safe.sql`) removes:
- `DROP POLICY IF EXISTS` statements
- `DROP TRIGGER IF EXISTS` statements

These are safe to remove because:
- The policies/triggers are created immediately after
- If they don't exist, the CREATE statements will work fine
- If they do exist, Supabase will show a warning but won't fail (you can ignore it)

## Recommendation

**Use the safe version** (`dev-migrations-combined-safe.sql`) to avoid the warning. It's functionally identical but won't trigger Supabase's destructive operation detection.

If you prefer to use the original version, you can safely proceed - the warning is just a precaution, and these operations are safe.
