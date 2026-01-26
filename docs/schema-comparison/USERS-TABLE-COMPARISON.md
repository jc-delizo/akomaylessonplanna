# Users Table Structure Comparison

**Date:** 2026-01-26T10:42:42.025Z
**Dev Database:** https://enxtvupbiezvwrnuzwsl.supabase.co
**Prod Database:** https://iokinyttkzmcnmznxgza.supabase.co

## Summary
- Status: ⚠️ Differences Found
- Differences: 3

## Column Comparison

### Dev Users Table
- `first_name`: ✅ Present
- `last_name`: ✅ Present
- `name`: ❌ Missing

### Prod Users Table
- `first_name`: ❌ Missing
- `last_name`: ❌ Missing
- `name`: ✅ Present

## Differences Found

- first_name column: Dev=true, Prod=false
- last_name column: Dev=true, Prod=false
- name column: Dev=false, Prod=true


## Analysis

**Dev** has the updated schema with `first_name` and `last_name` columns (migration 018 applied).
**Prod** still has the old `name` column (migration 018 NOT applied).

**Conclusion:** Dev has migration 018 applied, but Prod does not. Prod needs migration 018 to be applied.

## Migration Reference

According to `DATABASE-MIGRATIONS-INDEX.md`:
- **Migration 018:** `replace_name_with_first_last_name.sql`
  - Purpose: Split single `name` field into `first_name` and `last_name`
  - Status: Applied to Dev ✅ / Not applied to Prod ❌

## Recommendations


⚠️ **CRITICAL:** Prod database needs migration 018 applied!

1. Review migration file: `supabase/migrations/018_replace_name_with_first_last_name.sql`
2. Apply to Prod database using:
   ```bash
   npx supabase db push --db-url "prod-connection-string"
   ```
3. Verify the migration was applied correctly
4. Update application code if needed to handle both schemas during transition

