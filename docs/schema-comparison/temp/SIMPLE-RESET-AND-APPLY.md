# Reset Dev and Apply All Migrations

## Quick Steps

1. **Reset Dev Database**
   - Go to: https://supabase.com/dashboard/project/enxtvupbiezvwrnuzwsl → SQL Editor
   - Open: reset-dev-database.sql
   - Copy, paste, and run

2. **Apply All Migrations**
   - Still in Dev SQL Editor
   - Open: all-migrations-001-018-complete.sql
   - Copy, paste, and run
   - This will recreate the exact Prod schema

3. **Verify**
   - Run: npx tsx scripts/compare-schemas-simple.ts
   - Should show 100% match

## Files
- `reset-dev-database.sql` - Drops all tables in Dev
- `all-migrations-001-018-complete.sql` - Recreates Prod schema
