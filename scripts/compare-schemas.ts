/**
 * Schema Comparison Script
 * 
 * Compares Dev and Prod Supabase database schemas.
 * Uses Supabase CLI to extract schemas and compare them.
 */

import * as fs from 'fs'
import * as path from 'path'
import { execSync } from 'child_process'

// Load environment variables
require('dotenv').config({ path: '.env.local' })

interface MigrationInfo {
  version: string
  name: string
  status: string
}

function getMigrationsViaCLI(projectRef: string): MigrationInfo[] {
  try {
    console.log(`   Getting migrations for ${projectRef}...`)
    
    // Link to project first
    execSync(`npx supabase link --project-ref ${projectRef}`, { 
      stdio: 'pipe',
      cwd: process.cwd()
    })

    // Get migration list
    const output = execSync(`npx supabase migration list --linked`, {
      encoding: 'utf-8',
      cwd: process.cwd()
    })

    // Parse output (format: "20240101000000 migration_name [Applied/Pending]")
    const lines = output.split('\n').filter(line => line.trim())
    const migrations: MigrationInfo[] = []

    for (const line of lines) {
      const match = line.match(/^(\d+)\s+(.+?)\s+\[(.+?)\]$/)
      if (match) {
        migrations.push({
          version: match[1],
          name: match[2],
          status: match[3],
        })
      }
    }

    return migrations
  } catch (error: any) {
    console.error(`   ⚠️  Could not get migrations: ${error.message}`)
    return []
  }
}

function extractSchemaViaCLI(projectRef: string, outputFile: string): boolean {
  try {
    console.log(`\n📊 Extracting schema from ${projectRef}...`)
    
    // Link to project
    console.log(`   Linking to project ${projectRef}...`)
    execSync(`npx supabase link --project-ref ${projectRef}`, { 
      stdio: 'pipe',
      cwd: process.cwd()
    })

    // Dump schema (use -s for schema, -f for file)
    console.log(`   Dumping schema to ${outputFile}...`)
    execSync(`npx supabase db dump -s public -f "${outputFile}"`, {
      stdio: 'pipe',
      cwd: process.cwd()
    })

    return true
  } catch (error: any) {
    console.error(`   ❌ Failed to extract schema: ${error.message}`)
    return false
  }
}

async function main() {
  const devUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const devRef = 'enxtvupbiezvwrnuzwsl'
  const prodUrl = process.env.PROD_NEXT_PUBLIC_SUPABASE_URL!
  const prodRef = 'iokinyttkzmcnmznxgza'

  if (!devUrl || !prodUrl) {
    console.error('❌ Missing required environment variables')
    process.exit(1)
  }

  console.log('🔍 Comparing Dev and Prod database schemas...\n')
  console.log('📝 Note: This requires Supabase CLI authentication.')
  console.log('   If not logged in, run: npx supabase login\n')

  const outputDir = path.join(process.cwd(), 'docs', 'schema-comparison')
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true })
  }

  // Step 1: Compare migrations
  console.log('📋 Step 1: Comparing migrations...')
  const devMigrations = getMigrationsViaCLI(devRef)
  const prodMigrations = getMigrationsViaCLI(prodRef)

  const devMigrationVersions = new Set(devMigrations.map(m => m.version))
  const prodMigrationVersions = new Set(prodMigrations.map(m => m.version))

  const onlyInDev = devMigrations.filter(m => !prodMigrationVersions.has(m.version))
  const onlyInProd = prodMigrations.filter(m => !devMigrationVersions.has(m.version))

  console.log(`   Dev migrations: ${devMigrations.length}`)
  console.log(`   Prod migrations: ${prodMigrations.length}`)

  if (onlyInDev.length > 0) {
    console.log(`\n   ⚠️  Migrations in Dev but not in Prod (${onlyInDev.length}):`)
    onlyInDev.forEach(m => console.log(`      - ${m.version}: ${m.name} [${m.status}]`))
  }

  if (onlyInProd.length > 0) {
    console.log(`\n   ⚠️  Migrations in Prod but not in Dev (${onlyInProd.length}):`)
    onlyInProd.forEach(m => console.log(`      - ${m.version}: ${m.name} [${m.status}]`))
  }

  if (onlyInDev.length === 0 && onlyInProd.length === 0 && devMigrations.length > 0) {
    console.log('   ✅ All migrations match!')
  }

  // Step 2: Extract full schemas
  console.log('\n📊 Step 2: Extracting full schemas...')
  
  const devSchemaFile = path.join(outputDir, 'dev-schema.sql')
  const prodSchemaFile = path.join(outputDir, 'prod-schema.sql')

  const devSuccess = extractSchemaViaCLI(devRef, devSchemaFile)
  const prodSuccess = extractSchemaViaCLI(prodRef, prodSchemaFile)

  // Generate report
  const reportPath = path.join(outputDir, 'DEV-PROD-SCHEMA-COMPARISON.md')
  const report = `# Dev vs Prod Schema Comparison Report

**Date:** ${new Date().toISOString()}
**Dev Database:** ${devUrl}
**Prod Database:** ${prodUrl}

## Summary
- Dev Migrations: ${devMigrations.length}
- Prod Migrations: ${prodMigrations.length}
- Migration Differences: ${onlyInDev.length + onlyInProd.length}
- Schema Extraction: ${devSuccess && prodSuccess ? '✅ Success' : '⚠️ Partial'}
- Status: ${onlyInDev.length === 0 && onlyInProd.length === 0 && devSuccess && prodSuccess ? '✅ Match' : '⚠️ Differences Found'}

## Migration Comparison

### Dev Migrations (${devMigrations.length})
${devMigrations.length > 0 ? devMigrations.map(m => `- ${m.version}: ${m.name} [${m.status}]`).join('\n') : 'No migrations found'}

### Prod Migrations (${prodMigrations.length})
${prodMigrations.length > 0 ? prodMigrations.map(m => `- ${m.version}: ${m.name} [${m.status}]`).join('\n') : 'No migrations found'}

${onlyInDev.length > 0 ? `### ⚠️ Migrations in Dev but not in Prod (${onlyInDev.length})\n${onlyInDev.map(m => `- ${m.version}: ${m.name} [${m.status}]`).join('\n')}\n` : ''}
${onlyInProd.length > 0 ? `### ⚠️ Migrations in Prod but not in Dev (${onlyInProd.length})\n${onlyInProd.map(m => `- ${m.version}: ${m.name} [${m.status}]`).join('\n')}\n` : ''}

## Schema Files

${devSuccess ? `- Dev schema: \`dev-schema.sql\` ✅` : `- Dev schema: Not extracted (check CLI login)`}
${prodSuccess ? `- Prod schema: \`prod-schema.sql\` ✅` : `- Prod schema: Not extracted (check CLI login)`}

${devSuccess && prodSuccess ? `
## Schema Comparison

To compare the full schemas, run:
\`\`\`bash
diff docs/schema-comparison/dev-schema.sql docs/schema-comparison/prod-schema.sql
\`\`\`

Or use PowerShell:
\`\`\`powershell
Compare-Object (Get-Content docs/schema-comparison/dev-schema.sql) (Get-Content docs/schema-comparison/prod-schema.sql)
\`\`\`

Or use a visual diff tool to compare the two SQL files.
` : `
## Next Steps

1. Ensure you're logged in: \`npx supabase login\`
2. Re-run this script: \`npx tsx scripts/compare-schemas.ts\`
3. Compare the generated SQL files
`}

## Recommendations
${onlyInDev.length > 0 ? `- ⚠️ Apply ${onlyInDev.length} pending migration(s) to Prod database\n` : ''}
${onlyInProd.length > 0 ? `- ⚠️ Review ${onlyInProd.length} migration(s) in Prod that are not in Dev\n` : ''}
${onlyInDev.length === 0 && onlyInProd.length === 0 && devSuccess && prodSuccess ? '- ✅ Schemas are in sync!\n' : ''}
`

  fs.writeFileSync(reportPath, report)
  console.log(`\n✅ Report saved to: ${reportPath}`)

  if (devSuccess && prodSuccess) {
    console.log('\n📝 To compare schemas, run:')
    console.log(`   diff ${devSchemaFile} ${prodSchemaFile}`)
    console.log(`   Or: Compare-Object (Get-Content ${devSchemaFile}) (Get-Content ${prodSchemaFile})`)
  }
}

main().catch(console.error)
