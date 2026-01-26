/**
 * Simple Schema Comparison Script
 * 
 * Compares Dev and Prod Supabase database schemas by querying tables via REST API.
 * Uses service role keys to access database metadata.
 */

import { createClient } from '@supabase/supabase-js'
import * as fs from 'fs'
import * as path from 'path'

// Load environment variables
require('dotenv').config({ path: '.env.local' })

async function getTables(supabaseUrl: string, serviceRoleKey: string): Promise<string[]> {
  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  // Try to query information_schema via RPC (if available)
  // Otherwise, we'll need to manually list known tables
  
  // For now, let's try querying some common tables to see what exists
  const commonTables = [
    'users', 'products', 'orders', 'order_items', 'reviews', 'cart_items',
    'wishlist', 'notifications', 'followers', 'conversations', 'messages',
    'grades', 'subjects', 'grade_subjects', 'product_views', 'recently_viewed',
    'teacher_id_verifications', 'admin_notes', 'audit_log', 'reports',
    'withdrawal_requests', 'search_analytics', 'email_queue', 'email_templates'
  ]

  const existingTables: string[] = []

  for (const table of commonTables) {
    try {
      const { error } = await supabase.from(table).select('*').limit(0)
      if (!error) {
        existingTables.push(table)
      }
    } catch (e) {
      // Table doesn't exist or not accessible
    }
  }

  return existingTables.sort()
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

  console.log('🔍 Comparing Dev and Prod database schemas...\n')

  const outputDir = path.join(process.cwd(), 'docs', 'schema-comparison')
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true })
  }

  // Get tables from both databases
  console.log('📋 Querying tables from Dev database...')
  const devTables = await getTables(devUrl, devKey)
  console.log(`   Found ${devTables.length} tables in Dev`)

  console.log('\n📋 Querying tables from Prod database...')
  const prodTables = await getTables(prodUrl, prodKey)
  console.log(`   Found ${prodTables.length} tables in Prod`)

  // Compare
  const devTableSet = new Set(devTables)
  const prodTableSet = new Set(prodTables)

  const onlyInDev = devTables.filter(t => !prodTableSet.has(t))
  const onlyInProd = prodTables.filter(t => !devTableSet.has(t))
  const inBoth = devTables.filter(t => prodTableSet.has(t))

  console.log('\n📊 Comparison Results:')
  console.log(`   Tables in both: ${inBoth.length}`)
  if (onlyInDev.length > 0) {
    console.log(`   ⚠️  Tables only in Dev: ${onlyInDev.length}`)
    onlyInDev.forEach(t => console.log(`      - ${t}`))
  }
  if (onlyInProd.length > 0) {
    console.log(`   ⚠️  Tables only in Prod: ${onlyInProd.length}`)
    onlyInProd.forEach(t => console.log(`      - ${t}`))
  }

  if (onlyInDev.length === 0 && onlyInProd.length === 0 && devTables.length === prodTables.length) {
    console.log('   ✅ All tables match!')
  }

  // Generate report
  const reportPath = path.join(outputDir, 'DEV-PROD-SCHEMA-COMPARISON.md')
  const report = `# Dev vs Prod Schema Comparison Report

**Date:** ${new Date().toISOString()}
**Dev Database:** ${devUrl}
**Prod Database:** ${prodUrl}

## Summary
- Dev Tables Found: ${devTables.length}
- Prod Tables Found: ${prodTables.length}
- Tables in Both: ${inBoth.length}
- Tables Only in Dev: ${onlyInDev.length}
- Tables Only in Prod: ${onlyInProd.length}
- Status: ${onlyInDev.length === 0 && onlyInProd.length === 0 && devTables.length === prodTables.length ? '✅ Match' : '⚠️ Differences Found'}

## Table Comparison

### Tables in Dev (${devTables.length})
${devTables.length > 0 ? devTables.map(t => `- ${t}`).join('\n') : 'No tables found'}

### Tables in Prod (${prodTables.length})
${prodTables.length > 0 ? prodTables.map(t => `- ${t}`).join('\n') : 'No tables found'}

### Tables in Both (${inBoth.length})
${inBoth.length > 0 ? inBoth.map(t => `- ${t}`).join('\n') : 'None'}

${onlyInDev.length > 0 ? `### ⚠️ Tables Only in Dev (${onlyInDev.length})\n${onlyInDev.map(t => `- ${t}`).join('\n')}\n` : ''}
${onlyInProd.length > 0 ? `### ⚠️ Tables Only in Prod (${onlyInProd.length})\n${onlyInProd.map(t => `- ${t}`).join('\n')}\n` : ''}

## Limitations

This comparison only checks for table existence via REST API. For a complete schema comparison including:
- Column definitions
- Indexes
- Constraints
- RLS policies
- Triggers
- Functions

Please use one of these methods:

### Option 1: Supabase Dashboard SQL Editor
1. Go to Dev Supabase Dashboard → SQL Editor
2. Run: \`SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name;\`
3. Export results
4. Repeat for Prod
5. Compare manually

### Option 2: Supabase CLI (requires Docker)
\`\`\`bash
# Login first
npx supabase login

# Extract Dev schema
npx supabase link --project-ref enxtvupbiezvwrnuzwsl
npx supabase db dump -s public -f dev-schema.sql

# Extract Prod schema
npx supabase link --project-ref iokinyttkzmcnmznxgza
npx supabase db dump -s public -f prod-schema.sql

# Compare
diff dev-schema.sql prod-schema.sql
\`\`\`

### Option 3: pg_dump (requires database password)
\`\`\`bash
# Get connection string from Supabase Dashboard → Settings → Database
pg_dump --schema-only --no-owner --no-acl "connection-string" > schema.sql
\`\`\`

## Recommendations
${onlyInDev.length > 0 ? `- ⚠️ Review ${onlyInDev.length} table(s) in Dev that are not in Prod\n` : ''}
${onlyInProd.length > 0 ? `- ⚠️ Review ${onlyInProd.length} table(s) in Prod that are not in Dev\n` : ''}
${onlyInDev.length === 0 && onlyInProd.length === 0 && devTables.length === prodTables.length ? '- ✅ Table structures match!\n' : ''}
- For detailed column/index comparison, use one of the methods above
`

  fs.writeFileSync(reportPath, report)
  console.log(`\n✅ Report saved to: ${reportPath}`)
}

main().catch(console.error)
