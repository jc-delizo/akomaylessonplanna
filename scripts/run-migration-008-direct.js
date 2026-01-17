/**
 * Script to run migration 008_feature_05_reviews.sql directly via Supabase
 * 
 * Usage: 
 *   node scripts/run-migration-008-direct.js
 * 
 * Requires environment variables:
 * - NEXT_PUBLIC_SUPABASE_URL
 * - SUPABASE_SERVICE_ROLE_KEY
 */

require('dotenv').config({ path: '.env.local' })
const fs = require('fs')
const path = require('path')

async function runMigration() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceRoleKey) {
    console.error('❌ Error: Missing required environment variables')
    console.error('   Required: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY')
    console.error('   Make sure these are set in .env.local')
    process.exit(1)
  }

  // Read migration file
  const migrationPath = path.join(__dirname, '..', 'supabase', 'migrations', '008_feature_05_reviews.sql')
  
  if (!fs.existsSync(migrationPath)) {
    console.error(`❌ Error: Migration file not found at ${migrationPath}`)
    process.exit(1)
  }

  const migrationSQL = fs.readFileSync(migrationPath, 'utf8')

  console.log('📄 Migration file loaded')
  console.log(`   Path: ${migrationPath}`)
  console.log(`   Size: ${migrationSQL.length} characters\n`)

  // Execute SQL via Supabase Management API
  // Note: Supabase doesn't expose raw SQL execution via REST API
  // This requires using the Supabase Dashboard SQL Editor or Supabase CLI
  
  console.log('⚠️  Supabase JS client does not support raw SQL execution.')
  console.log('   Please run this migration via one of these methods:\n')
  console.log('   1. Supabase Dashboard (Easiest):')
  console.log('      - Go to: https://supabase.com/dashboard')
  console.log('      - Select your project')
  console.log('      - Navigate to SQL Editor')
  console.log('      - Click "New Query"')
  console.log('      - Copy and paste the migration file contents')
  console.log('      - Click "Run"\n')
  console.log('   2. Supabase CLI:')
  console.log('      - Run: supabase db push\n')
  console.log(`   Migration file location: ${migrationPath}`)
  
  // Try to use fetch to execute via Management API (if available)
  // This is a fallback attempt - may not work
  try {
    console.log('\n🔄 Attempting to execute via Supabase Management API...')
    
    // Note: This endpoint may not exist or may require different auth
    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseServiceRoleKey,
        'Authorization': `Bearer ${supabaseServiceRoleKey}`,
        'Prefer': 'return=minimal',
      },
      body: JSON.stringify({ query: migrationSQL }),
    })

    if (response.ok) {
      console.log('✅ Migration executed successfully!')
      return
    } else {
      const errorText = await response.text()
      console.log(`⚠️  API execution failed: ${response.status}`)
      console.log(`   ${errorText}\n`)
    }
  } catch (error) {
    console.log(`⚠️  API execution not available: ${error.message}\n`)
  }

  console.log('💡 Recommendation: Use Supabase Dashboard SQL Editor for reliable execution.')
}

runMigration().catch(error => {
  console.error('❌ Fatal error:', error)
  process.exit(1)
})
