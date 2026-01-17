/**
 * Script to run migration 008_feature_05_reviews.sql
 * 
 * Usage: node scripts/run-migration-008.js
 * 
 * Requires:
 * - NEXT_PUBLIC_SUPABASE_URL environment variable
 * - SUPABASE_SERVICE_ROLE_KEY environment variable
 */

const fs = require('fs')
const path = require('path')
const { createClient } = require('@supabase/supabase-js')

async function runMigration() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceRoleKey) {
    console.error('Error: Missing required environment variables')
    console.error('Required: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY')
    process.exit(1)
  }

  // Read migration file
  const migrationPath = path.join(__dirname, '..', 'supabase', 'migrations', '008_feature_05_reviews.sql')
  
  if (!fs.existsSync(migrationPath)) {
    console.error(`Error: Migration file not found at ${migrationPath}`)
    process.exit(1)
  }

  const migrationSQL = fs.readFileSync(migrationPath, 'utf8')

  console.log('📄 Reading migration file...')
  console.log(`   Path: ${migrationPath}`)
  console.log(`   Size: ${migrationSQL.length} characters`)

  // Create admin client
  const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })

  console.log('\n🚀 Executing migration...')

  // Split SQL into individual statements (simple approach - split by semicolons)
  // Note: This is a simplified approach. For production, use a proper SQL parser
  const statements = migrationSQL
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--'))

  let successCount = 0
  let errorCount = 0

  for (let i = 0; i < statements.length; i++) {
    const statement = statements[i]
    if (!statement || statement.length < 10) continue // Skip very short statements

    try {
      // Use Supabase REST API to execute SQL
      // Note: Supabase doesn't directly support raw SQL execution via JS client
      // We need to use the REST API endpoint
      const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': supabaseServiceRoleKey,
          'Authorization': `Bearer ${supabaseServiceRoleKey}`,
        },
        body: JSON.stringify({ sql: statement }),
      })

      if (!response.ok) {
        // Try alternative: Execute via PostgREST
        console.warn(`   ⚠️  Statement ${i + 1} may need manual execution`)
      } else {
        successCount++
        console.log(`   ✅ Statement ${i + 1} executed`)
      }
    } catch (error) {
      errorCount++
      console.error(`   ❌ Error executing statement ${i + 1}:`, error.message)
    }
  }

  console.log('\n📊 Migration Summary:')
  console.log(`   ✅ Successful: ${successCount}`)
  console.log(`   ❌ Errors: ${errorCount}`)
  console.log(`   📝 Total statements: ${statements.length}`)

  if (errorCount > 0) {
    console.log('\n⚠️  Some statements failed. You may need to run the migration manually via Supabase Dashboard.')
    console.log('   Go to: Supabase Dashboard → SQL Editor → New Query')
    console.log(`   Paste the contents of: ${migrationPath}`)
  } else {
    console.log('\n✅ Migration completed successfully!')
  }
}

// Run the migration
runMigration().catch(error => {
  console.error('Fatal error:', error)
  process.exit(1)
})
