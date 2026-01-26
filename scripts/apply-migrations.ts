/**
 * Apply Migrations Script
 * 
 * Applies specific migrations to Dev or Prod database using Supabase admin client.
 * This script reads migration files and executes them via Supabase REST API.
 */

import { createClient } from '@supabase/supabase-js'
import * as fs from 'fs'
import * as path from 'path'

// Load environment variables
require('dotenv').config({ path: '.env.local' })

async function applyMigration(
  supabaseUrl: string,
  serviceRoleKey: string,
  migrationFile: string,
  envName: string
): Promise<{ success: boolean; error?: string }> {
  console.log(`\n📝 Applying ${migrationFile} to ${envName}...`)

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  // Read migration file
  const migrationPath = path.join(process.cwd(), 'supabase', 'migrations', migrationFile)
  if (!fs.existsSync(migrationPath)) {
    return { success: false, error: `Migration file not found: ${migrationPath}` }
  }

  const migrationSQL = fs.readFileSync(migrationPath, 'utf-8')

  // Split SQL into individual statements (semicolon-separated)
  // Remove comments and empty lines
  const statements = migrationSQL
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--') && !s.startsWith('/*'))

  console.log(`   Found ${statements.length} SQL statements`)

  // Execute each statement
  // Note: Supabase REST API doesn't support arbitrary SQL execution
  // We need to use RPC functions or direct PostgreSQL connection
  // For now, let's use a workaround: create an RPC function to execute SQL
  
  // Actually, we can't execute arbitrary SQL via REST API
  // We need to use Supabase CLI or direct PostgreSQL connection
  
  console.log(`   ⚠️  Cannot execute SQL directly via REST API`)
  console.log(`   Please use Supabase CLI or provide database connection string`)
  
  return { success: false, error: 'Direct SQL execution not supported via REST API' }
}

async function main() {
  const devUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const devKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
  const prodUrl = process.env.PROD_NEXT_PUBLIC_SUPABASE_URL!
  const prodKey = process.env.PROD_SUPABASE_SERVICE_ROLE_KEY!

  if (!devUrl || !devKey || !prodUrl || !prodKey) {
    console.error('❌ Missing required environment variables')
    process.exit(1)
  }

  console.log('🚀 Migration Application Script')
  console.log('Note: This script requires Supabase CLI or database connection strings')
  console.log('For direct SQL execution, use: npx supabase db push --db-url "connection-string"\n')

  // List migrations that need to be applied
  const devMigrations = ['009_feature_06_social_features.sql', '011_feature_08_advanced_search.sql', '012_feature_09_admin_panel.sql', '013_feature_10_email_system.sql']
  const prodMigrations = ['018_replace_name_with_first_last_name.sql']

  console.log('📋 Migrations to apply to Dev:')
  devMigrations.forEach(m => console.log(`   - ${m}`))
  
  console.log('\n📋 Migrations to apply to Prod:')
  prodMigrations.forEach(m => console.log(`   - ${m}`))

  console.log('\n⚠️  This script cannot execute SQL directly.')
  console.log('Please use one of these methods:')
  console.log('\n1. Supabase CLI (recommended):')
  console.log('   npx supabase login')
  console.log('   npx supabase link --project-ref [project-ref]')
  console.log('   npx supabase db push')
  console.log('\n2. Direct connection string:')
  console.log('   npx supabase db push --db-url "postgresql://..."')
}

main().catch(console.error)
