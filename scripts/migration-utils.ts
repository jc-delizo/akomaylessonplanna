/**
 * Migration Utilities for AI Agents
 * 
 * Provides helper functions to query migration information,
 * understand dependencies, and validate migration order.
 */

import * as fs from 'fs'
import * as path from 'path'

const migrationsDir = path.join(process.cwd(), 'supabase', 'migrations')

interface MigrationInfo {
  number: number
  filename: string
  feature?: string
  tables: string[]
  dependencies: number[]
}

// Feature to migration mapping
const featureMigrations: Record<string, number[]> = {
  'foundation': [1, 2],
  'feature-02-profiles': [3, 4, 16, 17, 18],
  'feature-03-products': [5, 6],
  'feature-04-cart-checkout': [7],
  'feature-05-reviews': [8],
  'feature-06-social': [9],
  'feature-07-seller-dashboard': [10],
  'feature-08-search': [11],
  'feature-09-admin': [12, 15],
  'feature-10-email': [13],
  'feature-11-messaging': [14]
}

// Migration dependencies (from DATABASE-MIGRATIONS-INDEX.md)
const migrationDependencies: Record<number, number[]> = {
  1: [],
  2: [1],
  3: [1],
  4: [1],
  5: [1],
  6: [5],
  7: [5],
  8: [5, 7],
  9: [5],
  10: [5, 7],
  11: [5],
  12: [1],
  13: [1],
  14: [5],
  15: [12],
  16: [1],
  17: [1],
  18: [1]
}

// Tables created by each migration (simplified - full list in MIGRATION-BY-FEATURE.md)
const migrationTables: Record<number, string[]> = {
  1: ['users', 'grades', 'subjects', 'grade_subjects'],
  2: [], // Seed data only
  3: [], // RLS fixes only
  4: ['followers', 'profile_views', 'admin_notes', 'audit_log'],
  5: ['products', 'product_updates', 'product_views'],
  6: [], // Storage buckets only
  7: ['cart_items', 'wishlist', 'orders', 'order_items', 'user_library', 'withdrawal_requests'],
  8: ['reviews', 'review_flags'],
  9: ['notifications', 'recently_viewed', 'product_shares'],
  10: ['seller_metrics_cache', 'export_jobs', 'scheduled_reports'],
  11: ['search_analytics', 'search_queries', 'user_search_history'],
  12: ['announcements', 'announcement_stats', 'categories', 'support_tickets', 'ticket_messages', 'disputes', 'reports'],
  13: ['email_templates', 'email_queue', 'email_template_versions', 'email_configuration', 'user_email_preferences', 'email_analytics', 'email_daily_stats', 'email_suppression_list'],
  14: ['conversations', 'messages', 'message_templates', 'message_reports', 'user_blocks', 'seller_response_times'],
  15: ['reports'], // May be redundant with 012
  16: [], // Storage bucket only
  17: [], // Users table modification only
  18: [] // Users table modification only
}

/**
 * Get all migrations for a specific feature
 */
export function getMigrationsByFeature(featureName: string): number[] {
  const normalized = featureName.toLowerCase().replace(/\s+/g, '-')
  return featureMigrations[normalized] || []
}

/**
 * Get dependencies for a migration
 */
export function getMigrationDependencies(migrationNumber: number): number[] {
  return migrationDependencies[migrationNumber] || []
}

/**
 * Get tables created by a migration
 */
export function getTablesByMigration(migrationNumber: number): string[] {
  return migrationTables[migrationNumber] || []
}

/**
 * Get all tables for a feature
 */
export function getTablesByFeature(featureName: string): string[] {
  const migrations = getMigrationsByFeature(featureName)
  const tables = new Set<string>()
  
  for (const migrationNum of migrations) {
    const migrationTables = getTablesByMigration(migrationNum)
    migrationTables.forEach(table => tables.add(table))
  }
  
  return Array.from(tables).sort()
}

/**
 * Validate migration order
 * Returns array of issues if any
 */
export function validateMigrationOrder(): string[] {
  const issues: string[] = []
  const migrationFiles = fs.readdirSync(migrationsDir)
    .filter(f => f.endsWith('.sql'))
    .map(f => {
      const match = f.match(/^(\d+)_/)
      return match ? { filename: f, number: parseInt(match[1]) } : null
    })
    .filter((f): f is { filename: string; number: number } => f !== null)
    .sort((a, b) => a.number - b.number)

  // Check for gaps
  for (let i = 0; i < migrationFiles.length; i++) {
    const expected = i + 1
    if (migrationFiles[i].number !== expected) {
      issues.push(`Missing migration ${expected} (found ${migrationFiles[i].number})`)
    }
  }

  // Check dependencies
  for (const file of migrationFiles) {
    const deps = getMigrationDependencies(file.number)
    for (const dep of deps) {
      if (!migrationFiles.some(f => f.number === dep)) {
        issues.push(`Migration ${file.number} depends on ${dep} which doesn't exist`)
      }
    }
  }

  return issues
}

/**
 * List all migrations with their features
 */
export function listMigrationsByFeature(): Record<string, number[]> {
  return { ...featureMigrations }
}

/**
 * Get migration info for a specific migration number
 */
export function getMigrationInfo(migrationNumber: number): MigrationInfo | null {
  const migrationFiles = fs.readdirSync(migrationsDir)
    .filter(f => f.match(/^(\d+)_/))
  
  const file = migrationFiles.find(f => {
    const match = f.match(/^(\d+)_/)
    return match && parseInt(match[1]) === migrationNumber
  })

  if (!file) return null

  // Determine feature
  let feature: string | undefined
  for (const [feat, migrations] of Object.entries(featureMigrations)) {
    if (migrations.includes(migrationNumber)) {
      feature = feat
      break
    }
  }

  return {
    number: migrationNumber,
    filename: file,
    feature,
    tables: getTablesByMigration(migrationNumber),
    dependencies: getMigrationDependencies(migrationNumber)
  }
}

// CLI interface
if (require.main === module) {
  const args = process.argv.slice(2)
  
  if (args[0] === 'feature' && args[1]) {
    const migrations = getMigrationsByFeature(args[1])
    const tables = getTablesByFeature(args[1])
    console.log(`\nFeature: ${args[1]}`)
    console.log(`Migrations: ${migrations.join(', ')}`)
    console.log(`Tables: ${tables.join(', ')}`)
  } else if (args[0] === 'dependencies' && args[1]) {
    const num = parseInt(args[1])
    const deps = getMigrationDependencies(num)
    console.log(`\nMigration ${num} dependencies: ${deps.join(', ') || 'none'}`)
  } else if (args[0] === 'validate') {
    const issues = validateMigrationOrder()
    if (issues.length === 0) {
      console.log('\n✅ Migration order is valid')
    } else {
      console.log('\n❌ Issues found:')
      issues.forEach(issue => console.log(`  - ${issue}`))
    }
  } else if (args[0] === 'list') {
    console.log('\nMigrations by Feature:')
    for (const [feature, migrations] of Object.entries(featureMigrations)) {
      console.log(`  ${feature}: ${migrations.join(', ')}`)
    }
  } else {
    console.log('\nUsage:')
    console.log('  npx tsx scripts/migration-utils.ts feature <feature-name>')
    console.log('  npx tsx scripts/migration-utils.ts dependencies <migration-number>')
    console.log('  npx tsx scripts/migration-utils.ts validate')
    console.log('  npx tsx scripts/migration-utils.ts list')
  }
}

export {
  featureMigrations,
  migrationDependencies,
  migrationTables
}
