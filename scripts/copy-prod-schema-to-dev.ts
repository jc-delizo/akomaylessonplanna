/**
 * Copy Prod Schema to Dev using Supabase CLI
 * 
 * Steps:
 * 1. Link to Prod project
 * 2. Dump schema from Prod
 * 3. Link to Dev project
 * 4. Apply schema to Dev
 */

import { execSync } from 'child_process'
import * as fs from 'fs'
import * as path from 'path'

const prodProjectRef = 'iokinyttkzmcnmznxgza'
const devProjectRef = 'enxtvupbiezvwrnuzwsl'
const tempSchemaFile = path.join(process.cwd(), 'docs', 'schema-comparison', 'temp', 'prod-schema-dump.sql')

console.log('📋 Copying Prod Schema to Dev using Supabase CLI\n')
console.log('='.repeat(70))

// Step 1: Link to Prod
console.log('\n🔗 Step 1: Linking to Prod project...')
try {
  execSync(`npx supabase link --project-ref ${prodProjectRef}`, {
    stdio: 'inherit',
    cwd: process.cwd()
  })
  console.log('✅ Linked to Prod project')
} catch (error: any) {
  console.error('❌ Failed to link to Prod project')
  console.error('   Make sure you are logged in: npx supabase login')
  process.exit(1)
}

// Step 2: Dump schema from Prod
console.log('\n📥 Step 2: Dumping schema from Prod...')
try {
  execSync(`npx supabase db dump -s public -f "${tempSchemaFile}" --linked`, {
    stdio: 'inherit',
    cwd: process.cwd()
  })
  console.log(`✅ Schema dumped to: ${tempSchemaFile}`)
  
  if (!fs.existsSync(tempSchemaFile)) {
    throw new Error('Schema file was not created')
  }
  
  const fileSize = fs.statSync(tempSchemaFile).size
  console.log(`   File size: ${(fileSize / 1024).toFixed(2)} KB`)
} catch (error: any) {
  console.error('❌ Failed to dump schema from Prod')
  console.error('   Error:', error.message)
  console.error('\n   Note: db dump requires Docker Desktop to be running')
  console.error('   Alternative: Use the existing apply-complete-schema-to-dev.sql file')
  process.exit(1)
}

// Step 3: Link to Dev
console.log('\n🔗 Step 3: Linking to Dev project...')
try {
  execSync(`npx supabase link --project-ref ${devProjectRef}`, {
    stdio: 'inherit',
    cwd: process.cwd()
  })
  console.log('✅ Linked to Dev project')
} catch (error: any) {
  console.error('❌ Failed to link to Dev project')
  process.exit(1)
}

// Step 4: Apply schema to Dev
console.log('\n📤 Step 4: Applying schema to Dev...')
console.log('   ⚠️  Note: supabase db push requires migrations in supabase/migrations/')
console.log('   Since we have a complete SQL file, you have two options:')
console.log('\n   Option A: Apply via Supabase Dashboard SQL Editor (Recommended)')
console.log(`   1. Open: https://supabase.com/dashboard/project/${devProjectRef}`)
console.log('   2. Go to: SQL Editor')
console.log(`   3. Open file: ${tempSchemaFile}`)
console.log('   4. Copy all SQL content')
console.log('   5. Paste and execute')
console.log('\n   Option B: Use supabase db push (requires migrations folder)')
console.log('   This would require converting the SQL file to migration files')

console.log('\n' + '='.repeat(70))
console.log('✅ Schema dump complete!')
console.log('='.repeat(70))
console.log(`\n📁 Prod schema saved to: ${tempSchemaFile}`)
console.log('\nNext step: Apply the schema to Dev using Option A above')
