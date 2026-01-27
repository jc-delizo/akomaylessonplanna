/**
 * Create Complete Schema File for Dev Database
 * 
 * Combines all 18 migrations into a single, well-formatted file
 * with all syntax issues fixed (policies and triggers with existence checks).
 */

import * as fs from 'fs'
import * as path from 'path'

const migrationsDir = path.join(process.cwd(), 'supabase', 'migrations')
const outputDir = path.join(process.cwd(), 'docs', 'schema-comparison', 'temp')

// All migrations in order
const allMigrations = [
  '001_foundation.sql',
  '002_seed_data.sql',
  '003_fix_users_rls_policies.sql',
  '004_feature_02_profiles.sql',
  '005_feature_03_products.sql',
  '006_storage_buckets_and_policies.sql',
  '007_feature_04_cart_and_checkout.sql',
  '008_feature_05_reviews.sql',
  '009_feature_06_social_features.sql',
  '010_feature_07_seller_dashboard.sql',
  '011_feature_08_advanced_search.sql',
  '012_feature_09_admin_panel.sql',
  '013_feature_10_email_system.sql',
  '014_feature_11_messaging_system.sql',
  '015_add_reports_table.sql',
  '016_teacher_verification_storage.sql',
  '017_seller_settings_fields.sql',
  '018_replace_name_with_first_last_name.sql'
]

function wrapPolicyCreation(content: string): string {
  // Use regex to match CREATE POLICY statements (including multi-line)
  const policyRegex = /CREATE POLICY\s+"([^"]+)"\s+ON\s+(\w+)\s+(FOR\s+\w+)\s+((?:USING|WITH CHECK)[\s\S]*?);/gi
  
  return content.replace(policyRegex, (match, policyName, tableName, forClause, usingCheck) => {
    const cleanUsingCheck = usingCheck.trim()
    
    return `-- Create policy "${policyName}" if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = '${tableName}' 
    AND policyname = '${policyName}'
  ) THEN
    CREATE POLICY "${policyName}" ON ${tableName} ${forClause} ${cleanUsingCheck};
  END IF;
END $$;`
  })
}

function wrapTriggerCreation(content: string): string {
  const lines = content.split('\n')
  const result: string[] = []
  let inTrigger = false
  let triggerLines: string[] = []
  let triggerName = ''
  let tableName = ''
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    
    const createTriggerMatch = line.match(/CREATE TRIGGER\s+(\w+)/i)
    
    if (createTriggerMatch) {
      inTrigger = true
      triggerName = createTriggerMatch[1]
      triggerLines = [line]
    } else if (inTrigger) {
      triggerLines.push(line)
      
      if (!tableName && !line.includes('EXECUTE FUNCTION')) {
        const tableMatch = line.match(/ON\s+([a-z_][a-z0-9_]*)\s*$/i)
        if (tableMatch) {
          const potentialTable = tableMatch[1]
          const keywords = ['update', 'delete', 'insert', 'select', 'to', 'from', 'where', 'set', 'each', 'row', 'before', 'after', 'function', 'trigger']
          if (!keywords.includes(potentialTable.toLowerCase())) {
            tableName = potentialTable
          }
        }
      }
      
      if (line.includes('EXECUTE FUNCTION') && line.trim().endsWith(';')) {
        const funcMatch = line.match(/EXECUTE\s+FUNCTION\s+([\w_]+)\(\)/i)
        const functionName = funcMatch ? funcMatch[1] : ''
        
        const fullTriggerSQL = triggerLines.join('\n')
        
        const tableMatch = fullTriggerSQL.match(/ON\s+([a-z_][a-z0-9_]*)\s+(?:FOR\s+EACH|BEFORE|AFTER|INSTEAD\s+OF)/i)
        if (tableMatch && !tableName) {
          tableName = tableMatch[1]
        }
        
        if (!tableName) {
          const simpleTableMatch = fullTriggerSQL.match(/ON\s+([a-z_][a-z0-9_]*)\s*$/im)
          if (simpleTableMatch) {
            const potentialTable = simpleTableMatch[1]
            const keywords = ['update', 'delete', 'insert', 'select', 'to', 'from', 'where', 'set', 'each', 'row', 'before', 'after', 'function', 'trigger']
            if (!keywords.includes(potentialTable.toLowerCase())) {
              tableName = potentialTable
            }
          }
        }
        
        const triggerDefMatch = fullTriggerSQL.match(/CREATE TRIGGER\s+\w+\s+([\s\S]*?)\s+EXECUTE\s+FUNCTION/i)
        let triggerOptions = ''
        if (triggerDefMatch) {
          triggerOptions = triggerDefMatch[1].trim()
          triggerOptions = triggerOptions.replace(/\s+/g, ' ').trim()
        }
        
        result.push(`-- Create trigger "${triggerName}" if it doesn't exist`)
        result.push(`DO $$`)
        result.push(`BEGIN`)
        result.push(`  IF NOT EXISTS (`)
        result.push(`    SELECT 1 FROM pg_trigger `)
        result.push(`    WHERE tgname = '${triggerName}' `)
        result.push(`    AND tgrelid = '${tableName}'::regclass::oid`)
        result.push(`  ) THEN`)
        result.push(`    EXECUTE format('CREATE TRIGGER %I %s EXECUTE FUNCTION %I()',`)
        result.push(`      '${triggerName}',`)
        result.push(`      '${triggerOptions}',`)
        result.push(`      '${functionName}'`)
        result.push(`    );`)
        result.push(`  END IF;`)
        result.push(`END $$;`)
        result.push('')
        
        inTrigger = false
        triggerLines = []
        triggerName = ''
        tableName = ''
      }
    } else {
      result.push(line)
    }
  }
  
  if (inTrigger) {
    result.push(...triggerLines)
  }
  
  return result.join('\n')
}

function removeDropStatements(content: string): string {
  content = content.replace(/DROP POLICY IF EXISTS "[^"]+" ON [^;]+;/gi, '')
  content = content.replace(/DROP TRIGGER IF EXISTS [^;]+;/gi, '')
  content = content.replace(/-- Drop existing policies if they exist/gi, '-- Policies will be created only if they don\'t exist')
  content = content.replace(/-- Drop existing triggers if they exist/gi, '-- Triggers will be created only if they don\'t exist')
  content = content.replace(/\n{3,}/g, '\n\n')
  
  return content
}

console.log('📝 Creating complete schema file with all fixes...\n')

const completeSQL: string[] = []
completeSQL.push('-- ============================================================================')
completeSQL.push('-- COMPLETE DATABASE SCHEMA (All Migrations 001-018)')
completeSQL.push('-- Apply this to Dev database after resetting')
completeSQL.push('-- This recreates the exact Prod schema')
completeSQL.push('-- Generated: ' + new Date().toISOString())
completeSQL.push('-- ============================================================================')
completeSQL.push('-- Note: All policies and triggers use existence checks for idempotency')
completeSQL.push('-- Safe to run multiple times')
completeSQL.push('-- ============================================================================\n')

for (const migration of allMigrations) {
  const filePath = path.join(migrationsDir, migration)
  if (fs.existsSync(filePath)) {
    let content = fs.readFileSync(filePath, 'utf-8')
    content = removeDropStatements(content)
    content = wrapPolicyCreation(content)
    content = wrapTriggerCreation(content)
    
    completeSQL.push(`-- ============================================================================`)
    completeSQL.push(`-- Migration: ${migration}`)
    completeSQL.push(`-- ============================================================================\n`)
    completeSQL.push(content)
    completeSQL.push('\n')
    console.log(`  ✅ Processed: ${migration}`)
  } else {
    console.log(`  ❌ NOT FOUND: ${migration}`)
  }
}

completeSQL.push('\n-- ============================================================================')
completeSQL.push('-- Schema Application Complete')
completeSQL.push('-- ============================================================================')
completeSQL.push('-- Next steps:')
completeSQL.push('-- 1. Verify all tables were created')
completeSQL.push('-- 2. Run: npx tsx scripts/compare-schemas-simple.ts')
completeSQL.push('-- 3. Verify Dev schema matches Prod 100%')
completeSQL.push('-- ============================================================================')

const outputPath = path.join(outputDir, 'apply-complete-schema-to-dev.sql')
fs.writeFileSync(outputPath, completeSQL.join('\n'))
console.log(`\n✅ Complete schema file created: ${outputPath}`)
console.log(`\n📊 File size: ${(fs.statSync(outputPath).size / 1024).toFixed(2)} KB`)
