# Copy Prod Schema to Dev - Quick Guide

Since you've already deleted all tables in Dev, the easiest way to copy the Prod schema is to use the complete schema SQL file we've already prepared.

## Option 1: Use Complete Schema File (Recommended - No Docker Required)

The file `docs/schema-comparison/temp/apply-complete-schema-to-dev.sql` contains the complete Prod schema with all 18 migrations combined and all syntax issues fixed.

### Steps:

1. **Go to Dev Supabase Dashboard**
   - URL: https://supabase.com/dashboard/project/enxtvupbiezvwrnuzwsl
   - Navigate to: **SQL Editor**

2. **Open the Complete Schema File**
   - File: `docs/schema-comparison/temp/apply-complete-schema-to-dev.sql`
   - Copy all SQL content (file is ~205 KB)

3. **Execute in SQL Editor**
   - Paste SQL into SQL Editor
   - Click **"Run"** or press **Ctrl+Enter**
   - Wait for execution (may take 1-2 minutes)
   - Check for any errors

4. **Verify**
   ```bash
   npx tsx scripts/compare-schemas-simple.ts
   npx tsx scripts/compare-users-table.ts
   ```

## Option 2: Use Supabase CLI (Requires Migration History Repair)

If you prefer using CLI, you'll need to repair the migration history first:

```bash
# Link to Dev
npx supabase link --project-ref enxtvupbiezvwrnuzwsl

# Repair migration history (mark all remote migrations as reverted)
npx supabase migration repair --status reverted 20260114064715 20260114064735 20260114064746 20260114064807 20260114064836 20260114064953 20260114065021 20260114065047 20260114134159 20260114134352 20260114142130 20260114152335 20260114164004 20260114164206 20260115154430 20260116025014 20260116031558 20260116063513 20260116094709 20260116124930 20260121162717

# Then push migrations
npx supabase db push
```

**Note**: This is more complex and may not work if the migration history table was also deleted.

## Recommendation

**Use Option 1** - it's simpler, faster, and doesn't require Docker or migration history repair. The complete schema file is already prepared and ready to use.
