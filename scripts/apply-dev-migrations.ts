/**
 * Apply Migrations to Dev Database
 * 
 * Applies migrations 009, 011, 012, 013 to Dev database.
 * Uses Supabase CLI linking approach.
 */

import { execSync } from 'child_process'
import * as fs from 'fs'
import * as path from 'path'

const devRef = 'enxtvupbiezvwrnuzwsl'
const migrationsToApply = [
  '009_feature_06_social_features.sql',
  '011_feature_08_advanced_search.sql',
  '012_feature_09_admin_panel.sql',
  '013_feature_10_email_system.sql'
]

console.log('🚀 Applying migrations to Dev database...\n')
console.log('Migrations to apply:')
migrationsToApply.forEach(m => console.log(`  - ${m}`))

// Verify migration files exist
console.log('\n📋 Verifying migration files...')
const migrationsDir = path.join(process.cwd(), 'supabase', 'migrations')
let allFilesExist = true

for (const migration of migrationsToApply) {
  const filePath = path.join(migrationsDir, migration)
  if (fs.existsSync(filePath)) {
    console.log(`  ✅ ${migration}`)
  } else {
    console.log(`  ❌ ${migration} - NOT FOUND`)
    allFilesExist = false
  }
}

if (!allFilesExist) {
  console.error('\n❌ Some migration files are missing!')
  process.exit(1)
}

// Check if logged in
console.log('\n🔐 Checking Supabase CLI authentication...')
try {
  execSync('npx supabase projects list', { stdio: 'pipe' })
  console.log('  ✅ Already logged in')
} catch (error) {
  console.log('  ⚠️  Not logged in. Please run: npx supabase login')
  console.log('  Then re-run this script.')
  process.exit(1)
}

// Link to Dev project
console.log(`\n🔗 Linking to Dev project (${devRef})...`)
try {
  execSync(`npx supabase link --project-ref ${devRef}`, { 
    stdio: 'inherit',
    cwd: process.cwd()
  })
  console.log('  ✅ Linked successfully')
} catch (error: any) {
  console.error(`  ❌ Failed to link: ${error.message}`)
  process.exit(1)
}

// Check which migrations are pending
console.log('\n📊 Checking migration status...')
try {
  const output = execSync('npx supabase migration list --linked', {
    encoding: 'utf-8',
    cwd: process.cwd()
  })
  console.log(output)
} catch (error: any) {
  console.error(`  ⚠️  Could not check migration status: ${error.message}`)
}

// Apply migrations
console.log('\n📤 Applying migrations...')
console.log('  Note: This will apply all pending migrations, not just the ones listed above.')
console.log('  Supabase CLI will automatically determine which migrations need to be applied.\n')

try {
  execSync('npx supabase db push', {
    stdio: 'inherit',
    cwd: process.cwd()
  })
  console.log('\n✅ Migrations applied successfully!')
} catch (error: any) {
  console.error(`\n❌ Failed to apply migrations: ${error.message}`)
  console.error('\nTroubleshooting:')
  console.error('  1. Ensure you have Docker Desktop running (required for db push)')
  console.error('  2. Check Supabase Dashboard → Database → Migrations for status')
  console.error('  3. Try applying migrations manually via Supabase Dashboard SQL Editor')
  process.exit(1)
}

console.log('\n📋 Next steps:')
console.log('  1. Verify tables were created in Dev database')
console.log('  2. Run: npx tsx scripts/compare-schemas-simple.ts')
console.log('  3. Verify Dev now has all 24 tables')
