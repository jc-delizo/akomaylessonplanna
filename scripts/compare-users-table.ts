/**
 * Users Table Column Comparison Script
 * 
 * Compares the users table structure between Dev and Prod databases.
 * Specifically checks for first_name/last_name vs name column differences.
 */

import { createClient } from '@supabase/supabase-js'
import * as fs from 'fs'
import * as path from 'path'

// Load environment variables
require('dotenv').config({ path: '.env.local' })

async function getUsersTableColumns(supabaseUrl: string, serviceRoleKey: string, envName: string): Promise<{ columns: string[], hasFirstName: boolean, hasLastName: boolean, hasName: boolean }> {
  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  console.log(`\n📋 Checking users table structure in ${envName}...`)

  // Try to query the users table with a limit 0 to check structure
  // We'll try to select different column combinations to see what exists
  
  const columns: string[] = []
  let hasFirstName = false
  let hasLastName = false
  let hasName = false

  // Test for first_name
  try {
    const { error } = await supabase.from('users').select('first_name').limit(0)
    if (!error) {
      columns.push('first_name')
      hasFirstName = true
      console.log(`   ✅ Has 'first_name' column`)
    }
  } catch (e) {
    console.log(`   ❌ No 'first_name' column`)
  }

  // Test for last_name
  try {
    const { error } = await supabase.from('users').select('last_name').limit(0)
    if (!error) {
      columns.push('last_name')
      hasLastName = true
      console.log(`   ✅ Has 'last_name' column`)
    }
  } catch (e) {
    console.log(`   ❌ No 'last_name' column`)
  }

  // Test for name
  try {
    const { error } = await supabase.from('users').select('name').limit(0)
    if (!error) {
      columns.push('name')
      hasName = true
      console.log(`   ✅ Has 'name' column`)
    }
  } catch (e) {
    console.log(`   ❌ No 'name' column`)
  }

  // Try to get a sample row to see actual structure (if any data exists)
  try {
    const { data, error } = await supabase.from('users').select('*').limit(1)
    if (!error && data && data.length > 0) {
      const actualColumns = Object.keys(data[0])
      console.log(`   📊 Actual columns found: ${actualColumns.join(', ')}`)
      return {
        columns: actualColumns,
        hasFirstName: actualColumns.includes('first_name'),
        hasLastName: actualColumns.includes('last_name'),
        hasName: actualColumns.includes('name')
      }
    }
  } catch (e) {
    // No data or error
  }

  return { columns, hasFirstName, hasLastName, hasName }
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

  console.log('🔍 Comparing users table structure between Dev and Prod...\n')

  const outputDir = path.join(process.cwd(), 'docs', 'schema-comparison')
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true })
  }

  // Get users table structure from both databases
  const devStructure = await getUsersTableColumns(devUrl, devKey, 'Dev')
  const prodStructure = await getUsersTableColumns(prodUrl, prodKey, 'Prod')

  // Compare
  console.log('\n📊 Comparison Results:')
  console.log(`\n   Dev users table:`)
  console.log(`      - Has 'first_name': ${devStructure.hasFirstName ? '✅' : '❌'}`)
  console.log(`      - Has 'last_name': ${devStructure.hasLastName ? '✅' : '❌'}`)
  console.log(`      - Has 'name': ${devStructure.hasName ? '✅' : '❌'}`)
  
  console.log(`\n   Prod users table:`)
  console.log(`      - Has 'first_name': ${prodStructure.hasFirstName ? '✅' : '❌'}`)
  console.log(`      - Has 'last_name': ${prodStructure.hasLastName ? '✅' : '❌'}`)
  console.log(`      - Has 'name': ${prodStructure.hasName ? '✅' : '❌'}`)

  const differences: string[] = []
  
  if (devStructure.hasFirstName !== prodStructure.hasFirstName) {
    differences.push(`first_name column: Dev=${devStructure.hasFirstName}, Prod=${prodStructure.hasFirstName}`)
  }
  if (devStructure.hasLastName !== prodStructure.hasLastName) {
    differences.push(`last_name column: Dev=${devStructure.hasLastName}, Prod=${prodStructure.hasLastName}`)
  }
  if (devStructure.hasName !== prodStructure.hasName) {
    differences.push(`name column: Dev=${devStructure.hasName}, Prod=${prodStructure.hasName}`)
  }

  if (differences.length > 0) {
    console.log(`\n   ⚠️  DIFFERENCES FOUND:`)
    differences.forEach(d => console.log(`      - ${d}`))
  } else {
    console.log(`\n   ✅ Users table structure matches!`)
  }

  // Generate detailed report
  const reportPath = path.join(outputDir, 'USERS-TABLE-COMPARISON.md')
  const report = `# Users Table Structure Comparison

**Date:** ${new Date().toISOString()}
**Dev Database:** ${devUrl}
**Prod Database:** ${prodUrl}

## Summary
- Status: ${differences.length === 0 ? '✅ Match' : '⚠️ Differences Found'}
- Differences: ${differences.length}

## Column Comparison

### Dev Users Table
- \`first_name\`: ${devStructure.hasFirstName ? '✅ Present' : '❌ Missing'}
- \`last_name\`: ${devStructure.hasLastName ? '✅ Present' : '❌ Missing'}
- \`name\`: ${devStructure.hasName ? '✅ Present' : '❌ Missing'}

### Prod Users Table
- \`first_name\`: ${prodStructure.hasFirstName ? '✅ Present' : '❌ Missing'}
- \`last_name\`: ${prodStructure.hasLastName ? '✅ Present' : '❌ Missing'}
- \`name\`: ${prodStructure.hasName ? '✅ Present' : '❌ Missing'}

${differences.length > 0 ? `## Differences Found\n\n${differences.map(d => `- ${d}`).join('\n')}\n` : ''}

## Analysis

${devStructure.hasFirstName && devStructure.hasLastName && !devStructure.hasName ? 
  '**Dev** has the updated schema with `first_name` and `last_name` columns (migration 018 applied).' : ''}
${prodStructure.hasName && !prodStructure.hasFirstName && !prodStructure.hasLastName ? 
  '**Prod** still has the old `name` column (migration 018 NOT applied).' : ''}
${devStructure.hasFirstName && devStructure.hasLastName && prodStructure.hasName && !prodStructure.hasFirstName ? 
  '\n**Conclusion:** Dev has migration 018 applied, but Prod does not. Prod needs migration 018 to be applied.' : ''}

## Migration Reference

According to \`DATABASE-MIGRATIONS-INDEX.md\`:
- **Migration 018:** \`replace_name_with_first_last_name.sql\`
  - Purpose: Split single \`name\` field into \`first_name\` and \`last_name\`
  - Status: ${devStructure.hasFirstName ? 'Applied to Dev ✅' : 'Not applied to Dev ❌'} / ${prodStructure.hasFirstName ? 'Applied to Prod ✅' : 'Not applied to Prod ❌'}

## Recommendations

${prodStructure.hasName && !prodStructure.hasFirstName ? `
⚠️ **CRITICAL:** Prod database needs migration 018 applied!

1. Review migration file: \`supabase/migrations/018_replace_name_with_first_last_name.sql\`
2. Apply to Prod database using:
   \`\`\`bash
   npx supabase db push --db-url "prod-connection-string"
   \`\`\`
3. Verify the migration was applied correctly
4. Update application code if needed to handle both schemas during transition
` : differences.length === 0 ? `
✅ Users table structure is consistent between Dev and Prod.
` : `
⚠️ Review the differences above and determine which schema is correct.
`}
`

  fs.writeFileSync(reportPath, report)
  console.log(`\n✅ Detailed report saved to: ${reportPath}`)
  
  // Also update the main comparison report
  const mainReportPath = path.join(outputDir, 'DEV-PROD-SCHEMA-COMPARISON.md')
  if (fs.existsSync(mainReportPath)) {
    let mainReport = fs.readFileSync(mainReportPath, 'utf-8')
    
    // Add users table comparison section
    const usersSection = `\n## Users Table Structure Comparison

${differences.length > 0 ? `⚠️ **DIFFERENCES FOUND:**\n` : `✅ **MATCH:**\n`}
- Dev: ${devStructure.hasFirstName ? 'has `first_name`' : 'no `first_name`'}, ${devStructure.hasLastName ? 'has `last_name`' : 'no `last_name`'}, ${devStructure.hasName ? 'has `name`' : 'no `name`'}
- Prod: ${prodStructure.hasFirstName ? 'has `first_name`' : 'no `first_name`'}, ${prodStructure.hasLastName ? 'has `last_name`' : 'no `last_name`'}, ${prodStructure.hasName ? 'has `name`' : 'no `name`'}

${differences.length > 0 ? `\n**Action Required:** See \`USERS-TABLE-COMPARISON.md\` for detailed analysis and migration steps.\n` : ''}
`
    
    // Insert before "## Limitations" section
    mainReport = mainReport.replace('## Limitations', usersSection + '\n## Limitations')
    fs.writeFileSync(mainReportPath, mainReport)
    console.log(`✅ Updated main comparison report`)
  }
}

main().catch(console.error)
