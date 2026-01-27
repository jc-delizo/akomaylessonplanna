/**
 * Apply All Migrations to Dev using Supabase CLI
 * 
 * Since all tables are already deleted in Dev, we can use supabase db push
 * to apply all migrations from the migrations folder.
 */

import { execSync } from 'child_process'

const devProjectRef = 'enxtvupbiezvwrnuzwsl'

console.log('📋 Applying All Migrations to Dev Database\n')
console.log('='.repeat(70))
console.log('⚠️  This will apply all 18 migrations to Dev database')
console.log('='.repeat(70))

// Step 1: Link to Dev
console.log('\n🔗 Step 1: Linking to Dev project...')
try {
  execSync(`npx supabase link --project-ref ${devProjectRef}`, {
    stdio: 'inherit',
    cwd: process.cwd()
  })
  console.log('✅ Linked to Dev project')
} catch (error: any) {
  console.error('❌ Failed to link to Dev project')
  console.error('   Make sure you are logged in: npx supabase login')
  process.exit(1)
}

// Step 2: Push all migrations
console.log('\n📤 Step 2: Pushing all migrations to Dev...')
console.log('   This will apply migrations 001-018 in order')
try {
  execSync('npx supabase db push', {
    stdio: 'inherit',
    cwd: process.cwd()
  })
  console.log('\n✅ All migrations applied successfully!')
} catch (error: any) {
  console.error('\n❌ Failed to push migrations')
  console.error('   Error:', error.message)
  console.error('\n   Alternative: Use the complete schema file via SQL Editor:')
  console.error('   docs/schema-comparison/temp/apply-complete-schema-to-dev.sql')
  process.exit(1)
}

console.log('\n' + '='.repeat(70))
console.log('✅ Schema Applied Successfully!')
console.log('='.repeat(70))
console.log('\n📋 Next steps:')
console.log('   1. Verify tables in Supabase Dashboard → Table Editor')
console.log('   2. Run: npx tsx scripts/compare-schemas-simple.ts')
console.log('   3. Run: npx tsx scripts/compare-users-table.ts')
console.log('   Both should show 100% match with Prod')
