/**
 * Prepare Migrations for Manual Application
 * 
 * Creates ready-to-execute SQL files for applying migrations via Supabase Dashboard SQL Editor.
 * This is necessary because Supabase CLI requires Docker and migration history is mismatched.
 */

import * as fs from 'fs'
import * as path from 'path'

const migrationsDir = path.join(process.cwd(), 'supabase', 'migrations')
const outputDir = path.join(process.cwd(), 'docs', 'schema-comparison', 'migrations-to-apply')

// Create output directory
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true })
}

// Migrations to apply to Dev
const devMigrations = [
  '009_feature_06_social_features.sql',
  '011_feature_08_advanced_search.sql',
  '012_feature_09_admin_panel.sql',
  '013_feature_10_email_system.sql'
]

// Migrations to apply to Prod
const prodMigrations = [
  '018_replace_name_with_first_last_name.sql'
]

console.log('📝 Preparing migration files for manual application...\n')

// Prepare Dev migrations
console.log('📋 Dev Database Migrations:')
const devCombinedSQL: string[] = []
devCombinedSQL.push('-- ============================================================================')
devCombinedSQL.push('-- DEV DATABASE MIGRATIONS')
devCombinedSQL.push('-- Apply these migrations to Dev database via Supabase Dashboard SQL Editor')
devCombinedSQL.push('-- Database: enxtvupbiezvwrnuzwsl')
devCombinedSQL.push('-- ============================================================================\n')

for (const migration of devMigrations) {
  const filePath = path.join(migrationsDir, migration)
  if (fs.existsSync(filePath)) {
    const content = fs.readFileSync(filePath, 'utf-8')
    devCombinedSQL.push(`-- Migration: ${migration}`)
    devCombinedSQL.push('-- ' + '='.repeat(70))
    devCombinedSQL.push(content)
    devCombinedSQL.push('\n')
    console.log(`  ✅ ${migration}`)
  } else {
    console.log(`  ❌ ${migration} - NOT FOUND`)
  }
}

// Write combined Dev migrations file
const devOutputPath = path.join(outputDir, 'dev-migrations-combined.sql')
fs.writeFileSync(devOutputPath, devCombinedSQL.join('\n'))
console.log(`\n✅ Dev migrations combined into: ${devOutputPath}`)

// Prepare Prod migrations
console.log('\n📋 Prod Database Migrations:')
const prodCombinedSQL: string[] = []
prodCombinedSQL.push('-- ============================================================================')
prodCombinedSQL.push('-- PROD DATABASE MIGRATION')
prodCombinedSQL.push('-- ⚠️  CRITICAL: Apply this migration to Prod database')
prodCombinedSQL.push('-- Database: iokinyttkzmcnmznxgza')
prodCombinedSQL.push('-- ============================================================================')
prodCombinedSQL.push('-- IMPORTANT: Backup Prod database before applying!')
prodCombinedSQL.push('-- This migration modifies the users table structure.')
prodCombinedSQL.push('-- ============================================================================\n')

for (const migration of prodMigrations) {
  const filePath = path.join(migrationsDir, migration)
  if (fs.existsSync(filePath)) {
    const content = fs.readFileSync(filePath, 'utf-8')
    prodCombinedSQL.push(`-- Migration: ${migration}`)
    prodCombinedSQL.push('-- ' + '='.repeat(70))
    prodCombinedSQL.push(content)
    prodCombinedSQL.push('\n')
    console.log(`  ✅ ${migration}`)
  } else {
    console.log(`  ❌ ${migration} - NOT FOUND`)
  }
}

// Write combined Prod migrations file
const prodOutputPath = path.join(outputDir, 'prod-migration-018.sql')
fs.writeFileSync(prodOutputPath, prodCombinedSQL.join('\n'))
console.log(`\n✅ Prod migration prepared: ${prodOutputPath}`)

// Create instructions file
const instructionsPath = path.join(outputDir, 'APPLY-MIGRATIONS-INSTRUCTIONS.md')
const instructions = `# How to Apply Migrations

## Overview

This directory contains SQL migration files ready to be applied via Supabase Dashboard SQL Editor.

## Files

- \`dev-migrations-combined.sql\` - Apply to Dev database (migrations 009, 011, 012, 013)
- \`prod-migration-018.sql\` - Apply to Prod database (migration 018)

## Step 1: Apply Migrations to Dev Database

1. **Go to Dev Supabase Dashboard**
   - URL: https://supabase.com/dashboard/project/enxtvupbiezvwrnuzwsl
   - Navigate to: SQL Editor

2. **Open Dev Migration File**
   - Open: \`docs/schema-comparison/migrations-to-apply/dev-migrations-combined.sql\`
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
   - Or use: \`pg_dump\` to create backup

2. **Go to Prod Supabase Dashboard**
   - URL: https://supabase.com/dashboard/project/iokinyttkzmcnmznxgza
   - Navigate to: SQL Editor

3. **Open Prod Migration File**
   - Open: \`docs/schema-comparison/migrations-to-apply/prod-migration-018.sql\`
   - Review the migration carefully
   - Copy all SQL content

4. **Execute Migration**
   - Paste SQL into SQL Editor
   - Click "Run" or press Ctrl+Enter
   - Monitor for any errors

5. **Verify Migration Success**
   - Run this query to verify:
     \`\`\`sql
     SELECT column_name 
     FROM information_schema.columns 
     WHERE table_name = 'users' 
     ORDER BY column_name;
     \`\`\`
   - Should show: \`first_name\` and \`last_name\` columns
   - Should NOT show: \`name\` column

6. **Verify Data Migration**
   - Run this query:
     \`\`\`sql
     SELECT first_name, last_name 
     FROM users 
     LIMIT 10;
     \`\`\`
   - Verify data was migrated correctly
   - Check that \`first_name\` has no NULL values

7. **Test Application**
   - Verify application can read \`first_name\`/\`last_name\`
   - Test user registration/login
   - Test user profile display

## Step 3: Verify Schema Synchronization

After applying all migrations, run:

\`\`\`bash
npx tsx scripts/compare-schemas-simple.ts
npx tsx scripts/compare-users-table.ts
\`\`\`

Both databases should now have matching schemas.

## Troubleshooting

### Migration Fails in SQL Editor

- Check for syntax errors
- Verify you're connected to the correct database (Dev vs Prod)
- Check if tables/columns already exist (migration uses IF NOT EXISTS, should be safe)

### Users Table Migration Issues

- If migration fails partway through, check current state:
  \`\`\`sql
  SELECT column_name FROM information_schema.columns WHERE table_name = 'users';
  \`\`\`
- If \`first_name\`/\`last_name\` exist but \`name\` still exists, manually drop \`name\` column
- If data migration failed, check for NULL values and fix manually

### Rollback (If Needed)

If migration 018 needs to be rolled back:

\`\`\`sql
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
\`\`\`

## Next Steps

After migrations are applied:

1. Update \`docs/DATABASE-MIGRATIONS-INDEX.md\` with migration status
2. Update \`docs/schema-comparison/DEV-PROD-SCHEMA-COMPARISON.md\` with final status
3. Run schema comparison scripts to verify synchronization
`

fs.writeFileSync(instructionsPath, instructions)
console.log(`\n✅ Instructions created: ${instructionsPath}`)

console.log('\n' + '='.repeat(70))
console.log('📋 NEXT STEPS:')
console.log('='.repeat(70))
console.log('\n1. Apply Dev migrations:')
console.log('   - Go to Dev Supabase Dashboard → SQL Editor')
console.log('   - Copy content from: docs/schema-comparison/migrations-to-apply/dev-migrations-combined.sql')
console.log('   - Execute in SQL Editor')
console.log('\n2. Apply Prod migration:')
console.log('   - ⚠️  BACKUP Prod database first!')
console.log('   - Go to Prod Supabase Dashboard → SQL Editor')
console.log('   - Copy content from: docs/schema-comparison/migrations-to-apply/prod-migration-018.sql')
console.log('   - Execute in SQL Editor')
console.log('\n3. Verify schemas match:')
console.log('   - Run: npx tsx scripts/compare-schemas-simple.ts')
console.log('   - Run: npx tsx scripts/compare-users-table.ts')
console.log('\nSee docs/schema-comparison/migrations-to-apply/APPLY-MIGRATIONS-INSTRUCTIONS.md for detailed steps.')
