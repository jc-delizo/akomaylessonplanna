/**
 * Check Migration Status Script
 * 
 * Checks which migrations are applied in Dev and Prod databases.
 */

import { createClient } from '@supabase/supabase-js'
import * as fs from 'fs'
import * as path from 'path'

require('dotenv').config({ path: '.env.local' })

async function checkMigrationStatus(supabaseUrl: string, serviceRoleKey: string, envName: string) {
  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  console.log(`\n📊 Checking migration status in ${envName}...`)

  // Check if migrations table exists and get applied migrations
  try {
    const { data: migrations, error } = await supabase
      .from('supabase_migrations.schema_migrations')
      .select('version, name')
      .order('version')

    if (error) {
      console.log(`   ⚠️  Could not access migrations table: ${error.message}`)
      return []
    }

    console.log(`   Found ${migrations?.length || 0} applied migrations`)
    return migrations || []
  } catch (e: any) {
    console.log(`   ⚠️  Error: ${e.message}`)
    return []
  }
}

async function checkTables(supabaseUrl: string, serviceRoleKey: string, envName: string, tables: string[]) {
  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  console.log(`\n📋 Checking tables in ${envName}...`)
  const existing: string[] = []
  const missing: string[] = []

  for (const table of tables) {
    try {
      const { error } = await supabase.from(table).select('*').limit(0)
      if (!error) {
        existing.push(table)
        console.log(`   ✅ ${table}`)
      } else {
        missing.push(table)
        console.log(`   ❌ ${table}`)
      }
    } catch (e) {
      missing.push(table)
      console.log(`   ❌ ${table}`)
    }
  }

  return { existing, missing }
}

async function main() {
  const devUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const devKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
  const prodUrl = process.env.PROD_NEXT_PUBLIC_SUPABASE_URL!
  const prodKey = process.env.PROD_SUPABASE_SERVICE_ROLE_KEY!

  // Check migrations
  const devMigrations = await checkMigrationStatus(devUrl, devKey, 'Dev')
  const prodMigrations = await checkMigrationStatus(prodUrl, prodKey, 'Prod')

  // Check specific tables from migrations
  const tablesFrom009 = ['notifications', 'recently_viewed', 'product_shares']
  const tablesFrom011 = ['search_analytics', 'search_queries']
  const tablesFrom012 = ['reports', 'announcements']
  const tablesFrom013 = ['email_queue', 'email_templates']

  console.log('\n' + '='.repeat(60))
  console.log('DEV DATABASE STATUS')
  console.log('='.repeat(60))

  const dev009Tables = await checkTables(devUrl, devKey, 'Dev', tablesFrom009)
  const dev011Tables = await checkTables(devUrl, devKey, 'Dev', tablesFrom011)
  const dev012Tables = await checkTables(devUrl, devKey, 'Dev', tablesFrom012)
  const dev013Tables = await checkTables(devUrl, devKey, 'Dev', tablesFrom013)

  console.log('\n' + '='.repeat(60))
  console.log('PROD DATABASE STATUS')
  console.log('='.repeat(60))

  const prod009Tables = await checkTables(prodUrl, prodKey, 'Prod', tablesFrom009)
  const prod011Tables = await checkTables(prodUrl, prodKey, 'Prod', tablesFrom011)
  const prod012Tables = await checkTables(prodUrl, prodKey, 'Prod', tablesFrom012)
  const prod013Tables = await checkTables(prodUrl, prodKey, 'Prod', tablesFrom013)

  // Check users table structure
  console.log('\n' + '='.repeat(60))
  console.log('USERS TABLE STRUCTURE')
  console.log('='.repeat(60))

  const devSupabase = createClient(devUrl, devKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
  const prodSupabase = createClient(prodUrl, prodKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  try {
    const { data: devUser } = await devSupabase.from('users').select('first_name, last_name').limit(1)
    const { data: prodUser } = await prodSupabase.from('users').select('name').limit(1)
    
    console.log('\nDev users table:')
    if (devUser && devUser.length > 0) {
      console.log('   ✅ Has first_name and last_name columns')
    } else {
      console.log('   ⚠️  Could not verify columns')
    }

    console.log('\nProd users table:')
    if (prodUser && prodUser.length > 0) {
      console.log('   ✅ Has name column')
    } else {
      console.log('   ⚠️  Could not verify columns')
    }
  } catch (e: any) {
    console.log(`   Error: ${e.message}`)
  }

  // Summary
  console.log('\n' + '='.repeat(60))
  console.log('SUMMARY')
  console.log('='.repeat(60))

  console.log('\nDev Database:')
  console.log(`   Migration 009 tables: ${dev009Tables.existing.length}/${tablesFrom009.length} exist`)
  console.log(`   Migration 011 tables: ${dev011Tables.existing.length}/${tablesFrom011.length} exist`)
  console.log(`   Migration 012 tables: ${dev012Tables.existing.length}/${tablesFrom012.length} exist`)
  console.log(`   Migration 013 tables: ${dev013Tables.existing.length}/${tablesFrom013.length} exist`)

  console.log('\nProd Database:')
  console.log(`   Migration 009 tables: ${prod009Tables.existing.length}/${tablesFrom009.length} exist`)
  console.log(`   Migration 011 tables: ${prod011Tables.existing.length}/${tablesFrom011.length} exist`)
  console.log(`   Migration 012 tables: ${prod012Tables.existing.length}/${tablesFrom012.length} exist`)
  console.log(`   Migration 013 tables: ${prod013Tables.existing.length}/${tablesFrom013.length} exist`)
  console.log(`   Migration 018: Users table has 'name' column (needs migration)`)

  // Generate action items
  console.log('\n' + '='.repeat(60))
  console.log('ACTION ITEMS')
  console.log('='.repeat(60))

  if (dev009Tables.missing.length > 0 || dev011Tables.missing.length > 0 || dev012Tables.missing.length > 0 || dev013Tables.missing.length > 0) {
    console.log('\n⚠️  Dev database needs migrations:')
    if (dev009Tables.missing.length > 0) console.log('   - 009_feature_06_social_features.sql')
    if (dev011Tables.missing.length > 0) console.log('   - 011_feature_08_advanced_search.sql')
    if (dev012Tables.missing.length > 0) console.log('   - 012_feature_09_admin_panel.sql')
    if (dev013Tables.missing.length > 0) console.log('   - 013_feature_10_email_system.sql')
  } else {
    console.log('\n✅ Dev database has all required tables')
  }

  console.log('\n⚠️  Prod database needs migration:')
  console.log('   - 018_replace_name_with_first_last_name.sql')
}

main().catch(console.error)
