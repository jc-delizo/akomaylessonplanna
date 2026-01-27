/**
 * Apply Complete Schema to Dev Database
 * 
 * Script to guide applying the complete schema file to Dev database.
 * Includes verification steps and error handling.
 */

import * as fs from 'fs'
import * as path from 'path'

const schemaFile = path.join(process.cwd(), 'docs', 'schema-comparison', 'temp', 'apply-complete-schema-to-dev.sql')
const resetFile = path.join(process.cwd(), 'docs', 'schema-comparison', 'temp', 'reset-dev-database-complete.sql')

console.log('📋 Apply Complete Schema to Dev Database\n')
console.log('='.repeat(70))

// Check files exist
if (!fs.existsSync(schemaFile)) {
  console.error(`❌ Schema file not found: ${schemaFile}`)
  console.error('   Run: npx tsx scripts/create-complete-schema.ts')
  process.exit(1)
}

if (!fs.existsSync(resetFile)) {
  console.error(`❌ Reset file not found: ${resetFile}`)
  console.error('   Run: npx tsx scripts/reset-dev-database.ts')
  process.exit(1)
}

const schemaSize = fs.statSync(schemaFile).size
const resetSize = fs.statSync(resetFile).size

console.log('\n📁 Files Ready:')
console.log(`   ✅ Reset script: ${resetFile} (${(resetSize / 1024).toFixed(2)} KB)`)
console.log(`   ✅ Schema file: ${schemaFile} (${(schemaSize / 1024).toFixed(2)} KB)`)

console.log('\n' + '='.repeat(70))
console.log('📝 INSTRUCTIONS')
console.log('='.repeat(70))

console.log('\n⚠️  WARNING: This will DELETE ALL DATA in Dev database!')
console.log('\nStep 1: Reset Dev Database')
console.log('   1. Go to: https://supabase.com/dashboard/project/enxtvupbiezvwrnuzwsl')
console.log('   2. Navigate to: SQL Editor')
console.log('   3. Open: docs/schema-comparison/temp/reset-dev-database-complete.sql')
console.log('   4. Copy all SQL content')
console.log('   5. Paste into SQL Editor')
console.log('   6. Click "Run" or press Ctrl+Enter')
console.log('   7. Verify all tables were dropped')

console.log('\nStep 2: Apply Complete Schema')
console.log('   1. Still in Dev SQL Editor')
console.log('   2. Open: docs/schema-comparison/temp/apply-complete-schema-to-dev.sql')
console.log('   3. Copy all SQL content')
console.log('   4. Paste into SQL Editor')
console.log('   5. Click "Run" or press Ctrl+Enter')
console.log('   6. Wait for execution to complete (may take 1-2 minutes)')
console.log('   7. Check for any errors')

console.log('\nStep 3: Verify Schema')
console.log('   Run these commands:')
console.log('   ```bash')
console.log('   npx tsx scripts/compare-schemas-simple.ts')
console.log('   npx tsx scripts/compare-users-table.ts')
console.log('   ```')
console.log('   Both should show 100% match with Prod')

console.log('\n' + '='.repeat(70))
console.log('✅ Ready to Execute')
console.log('='.repeat(70))
console.log('\nFiles are prepared and ready to use.')
console.log('Follow the instructions above to reset and apply schema.')
