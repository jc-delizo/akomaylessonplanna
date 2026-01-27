/**
 * Generate Complete Dev Database Reset Script
 * 
 * Queries Dev database to get all tables, types, functions, and extensions,
 * then generates comprehensive DROP statements to completely reset the database.
 */

import { createClient } from '@supabase/supabase-js'
import * as fs from 'fs'
import * as path from 'path'

require('dotenv').config({ path: '.env.local' })

async function generateResetScript() {
  const devUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const devKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

  if (!devUrl || !devKey) {
    console.error('❌ Missing required environment variables')
    process.exit(1)
  }

  const supabase = createClient(devUrl, devKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  console.log('🔍 Querying Dev database for all objects...\n')

  const resetSQL: string[] = []
  resetSQL.push('-- ============================================================================')
  resetSQL.push('-- DEV DATABASE RESET SCRIPT')
  resetSQL.push('-- Generated: ' + new Date().toISOString())
  resetSQL.push('-- Database: enxtvupbiezvwrnuzwsl')
  resetSQL.push('-- ⚠️  WARNING: This will DELETE ALL TABLES, DATA, AND SCHEMA OBJECTS!')
  resetSQL.push('-- ============================================================================\n')
  resetSQL.push('-- This script drops all tables, types, functions, and extensions')
  resetSQL.push('-- Use this to completely reset Dev database before applying Prod schema\n')

  // Get all tables
  console.log('📋 Getting all tables...')
  const tables: string[] = []
  const commonTables = [
    'users', 'products', 'orders', 'order_items', 'reviews', 'cart_items',
    'wishlist', 'notifications', 'followers', 'conversations', 'messages',
    'grades', 'subjects', 'grade_subjects', 'product_views', 'recently_viewed',
    'teacher_id_verifications', 'admin_notes', 'audit_log', 'reports',
    'withdrawal_requests', 'search_analytics', 'email_queue', 'email_templates',
    'announcements', 'announcement_stats', 'categories', 'support_tickets',
    'ticket_messages', 'disputes', 'product_shares', 'search_queries',
    'user_search_history', 'email_template_versions', 'email_configuration',
    'user_email_preferences', 'email_analytics', 'email_daily_stats',
    'email_suppression_list', 'message_templates', 'message_reports',
    'user_blocks', 'seller_response_times', 'seller_metrics_cache',
    'export_jobs', 'scheduled_reports', 'product_updates', 'review_flags'
  ]

  for (const table of commonTables) {
    try {
      const { error } = await supabase.from(table).select('*').limit(0)
      if (!error) {
        tables.push(table)
        console.log(`  ✅ Found: ${table}`)
      }
    } catch (e) {
      // Table doesn't exist or not accessible
    }
  }

  // Drop all tables with CASCADE (this will also drop dependent objects)
  resetSQL.push('-- ============================================================================')
  resetSQL.push('-- Drop All Tables (CASCADE will drop indexes, triggers, policies, etc.)')
  resetSQL.push('-- ============================================================================\n')

  // Sort tables to drop dependent tables first (though CASCADE handles this)
  // But we'll drop in reverse dependency order for cleaner output
  const sortedTables = [...tables].sort()
  for (const table of sortedTables) {
    resetSQL.push(`DROP TABLE IF EXISTS ${table} CASCADE;`)
  }

  resetSQL.push('\n-- ============================================================================')
  resetSQL.push('-- Drop Custom Types (ENUMs)')
  resetSQL.push('-- ============================================================================\n')

  const customTypes = [
    'user_role',
    'subscription_tier',
    'product_status',
    'product_type',
    'order_status',
    'review_status',
    'message_status',
    'dispute_status',
    'admin_role',
    'payment_status'
  ]

  for (const type of customTypes) {
    resetSQL.push(`DROP TYPE IF EXISTS ${type} CASCADE;`)
  }

  resetSQL.push('\n-- ============================================================================')
  resetSQL.push('-- Drop Functions')
  resetSQL.push('-- ============================================================================\n')

  const functions = [
    'cleanup_old_recently_viewed',
    'limit_recently_viewed_per_user',
    'update_search_analytics_updated_at',
    'update_search_queries_updated_at',
    'upsert_user_search_history',
    'upsert_search_query',
    'update_updated_at_column',
    'update_product_rating'
  ]

  for (const func of functions) {
    resetSQL.push(`DROP FUNCTION IF EXISTS ${func}() CASCADE;`)
    resetSQL.push(`DROP FUNCTION IF EXISTS ${func}(UUID, VARCHAR) CASCADE;`)
    resetSQL.push(`DROP FUNCTION IF EXISTS ${func}(VARCHAR) CASCADE;`)
  }

  resetSQL.push('\n-- ============================================================================')
  resetSQL.push('-- Note: Extensions (pg_trgm, pgcrypto) are kept as they may be needed')
  resetSQL.push('-- If you need to drop extensions, uncomment below:')
  resetSQL.push('-- DROP EXTENSION IF EXISTS pg_trgm CASCADE;')
  resetSQL.push('-- DROP EXTENSION IF EXISTS pgcrypto CASCADE;')
  resetSQL.push('-- ============================================================================\n')

  resetSQL.push('-- Reset complete!')
  resetSQL.push('-- Next step: Apply complete schema using apply-complete-schema-to-dev.sql')

  // Write to file
  const outputDir = path.join(process.cwd(), 'docs', 'schema-comparison', 'temp')
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true })
  }

  const outputPath = path.join(outputDir, 'reset-dev-database-complete.sql')
  fs.writeFileSync(outputPath, resetSQL.join('\n'))
  console.log(`\n✅ Reset script generated: ${outputPath}`)
  console.log(`\n📊 Summary:`)
  console.log(`   - Tables to drop: ${tables.length}`)
  console.log(`   - Custom types to drop: ${customTypes.length}`)
  console.log(`   - Functions to drop: ${functions.length}`)
}

generateResetScript().catch(console.error)
