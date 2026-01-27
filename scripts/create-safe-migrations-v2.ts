/**
 * Create Safe Migration Script with Policy Existence Checks
 * 
 * Creates migrations that check if policies exist before creating them.
 * This handles cases where some migrations were partially applied.
 */

import * as fs from 'fs'
import * as path from 'path'

const migrationsDir = path.join(process.cwd(), 'supabase', 'migrations')
const outputDir = path.join(process.cwd(), 'docs', 'schema-comparison', 'migrations-to-apply')

// Migrations to apply to Dev
const devMigrations = [
  '009_feature_06_social_features.sql',
  '011_feature_08_advanced_search.sql',
  '012_feature_09_admin_panel.sql',
  '013_feature_10_email_system.sql'
]

function wrapPolicyCreation(content: string): string {
  // Use regex to match CREATE POLICY statements (including multi-line)
  // Pattern matches: CREATE POLICY "name" ON table FOR action ... USING/WITH CHECK ... ;
  const policyRegex = /CREATE POLICY\s+"([^"]+)"\s+ON\s+(\w+)\s+(FOR\s+\w+)\s+((?:USING|WITH CHECK)[\s\S]*?);/gi
  
  return content.replace(policyRegex, (match, policyName, tableName, forClause, usingCheck) => {
    // Clean up the usingCheck part (remove extra whitespace)
    const cleanUsingCheck = usingCheck.trim()
    
    // Create a DO block that checks if policy exists before creating
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
  // Match CREATE TRIGGER statements (can be multi-line)
  // Pattern: CREATE TRIGGER name\n  ... ON table\n  ... EXECUTE FUNCTION ...;
  // Need to match across multiple lines, so we'll process line by line
  const lines = content.split('\n')
  const result: string[] = []
  let inTrigger = false
  let triggerLines: string[] = []
  let triggerName = ''
  let tableName = ''
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    
    // Check if this is the start of a CREATE TRIGGER statement
    const createTriggerMatch = line.match(/CREATE TRIGGER\s+(\w+)/i)
    
    if (createTriggerMatch) {
      inTrigger = true
      triggerName = createTriggerMatch[1]
      triggerLines = [line]
    } else if (inTrigger) {
      triggerLines.push(line)
      
      // Check for "ON table_name" pattern - look for the table name after "ON"
      // The pattern is: CREATE TRIGGER ... ON table_name ... EXECUTE FUNCTION
      // Format: "BEFORE UPDATE ON table_name" or "AFTER UPDATE ON table_name"
      // We need to match "ON table_name" where it's NOT part of "EXECUTE FUNCTION"
      if (!tableName && !line.includes('EXECUTE FUNCTION')) {
        // Look for pattern: "ON table_name" at end of line or followed by whitespace/newline
        // Match: "ON table_name" where table_name is not a keyword
        const tableMatch = line.match(/ON\s+([a-z_][a-z0-9_]*)\s*$/i)
        if (tableMatch) {
          const potentialTable = tableMatch[1]
          // Exclude PostgreSQL keywords - these should never be table names
          const keywords = ['update', 'delete', 'insert', 'select', 'to', 'from', 'where', 'set', 'each', 'row', 'before', 'after', 'function', 'trigger']
          if (!keywords.includes(potentialTable.toLowerCase())) {
            tableName = potentialTable
          }
        }
      }
      
      // Check if this line ends the trigger (ends with semicolon and has EXECUTE FUNCTION)
      if (line.includes('EXECUTE FUNCTION') && line.trim().endsWith(';')) {
        // Extract function name
        const funcMatch = line.match(/EXECUTE\s+FUNCTION\s+([\w_]+)\(\)/i)
        const functionName = funcMatch ? funcMatch[1] : ''
        
        // Reconstruct the full trigger SQL
        const fullTriggerSQL = triggerLines.join('\n')
        
        // Extract table name from the full SQL - look for "ON table_name" pattern
        // Pattern: CREATE TRIGGER ... ON table_name ... EXECUTE FUNCTION
        const tableMatch = fullTriggerSQL.match(/ON\s+([a-z_][a-z0-9_]*)\s+(?:FOR\s+EACH|BEFORE|AFTER|INSTEAD\s+OF)/i)
        if (tableMatch && !tableName) {
          tableName = tableMatch[1]
        }
        
        // If still no table name, try simpler pattern
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
        
        // Extract trigger options (everything between CREATE TRIGGER name and EXECUTE FUNCTION)
        // Pattern: CREATE TRIGGER name ... timing ... ON table ... options ... EXECUTE FUNCTION
        // We need to extract: timing + ON table + options (everything except CREATE TRIGGER name and EXECUTE FUNCTION)
        const triggerDefMatch = fullTriggerSQL.match(/CREATE TRIGGER\s+\w+\s+([\s\S]*?)\s+EXECUTE\s+FUNCTION/i)
        let triggerOptions = ''
        if (triggerDefMatch) {
          // Get everything after CREATE TRIGGER name
          triggerOptions = triggerDefMatch[1].trim()
          // Normalize whitespace but preserve structure
          triggerOptions = triggerOptions.replace(/\s+/g, ' ').trim()
        }
        
        // Create a DO block that checks if trigger exists before creating
        // Note: CREATE TRIGGER must be executed using dynamic SQL (EXECUTE) inside DO blocks
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
        
        // Reset
        inTrigger = false
        triggerLines = []
        triggerName = ''
        tableName = ''
      }
    } else {
      result.push(line)
    }
  }
  
  // Handle case where trigger wasn't closed (shouldn't happen, but safety)
  if (inTrigger) {
    result.push(...triggerLines)
  }
  
  return result.join('\n')
}

function removeDropStatements(content: string): string {
  // Remove DROP POLICY statements (they're recreated immediately after)
  content = content.replace(/DROP POLICY IF EXISTS "[^"]+" ON [^;]+;/gi, '')
  
  // Remove DROP TRIGGER statements (they're recreated immediately after)
  content = content.replace(/DROP TRIGGER IF EXISTS [^;]+;/gi, '')
  
  // Remove comments about dropping policies/triggers
  content = content.replace(/-- Drop existing policies if they exist/gi, '-- Policies will be created only if they don\'t exist')
  content = content.replace(/-- Drop existing triggers if they exist/gi, '-- Triggers will be created only if they don\'t exist')
  
  // Clean up extra blank lines
  content = content.replace(/\n{3,}/g, '\n\n')
  
  return content
}

console.log('📝 Creating safe migration files with policy existence checks...\n')

// Prepare Dev migrations
console.log('📋 Dev Database Migrations:')
const devCombinedSQL: string[] = []
devCombinedSQL.push('-- ============================================================================')
devCombinedSQL.push('-- DEV DATABASE MIGRATIONS (SAFE VERSION WITH POLICY CHECKS)')
devCombinedSQL.push('-- Apply these migrations to Dev database via Supabase Dashboard SQL Editor')
devCombinedSQL.push('-- Database: enxtvupbiezvwrnuzwsl')
devCombinedSQL.push('-- Note: Policies and triggers are checked for existence before creation')
devCombinedSQL.push('-- These migrations are idempotent and safe to run multiple times')
devCombinedSQL.push('-- ============================================================================\n')

for (const migration of devMigrations) {
  const filePath = path.join(migrationsDir, migration)
  if (fs.existsSync(filePath)) {
    let content = fs.readFileSync(filePath, 'utf-8')
    content = removeDropStatements(content)
    content = wrapPolicyCreation(content)
    content = wrapTriggerCreation(content)
    
    devCombinedSQL.push(`-- Migration: ${migration}`)
    devCombinedSQL.push('-- ' + '='.repeat(70))
    devCombinedSQL.push(content)
    devCombinedSQL.push('\n')
    console.log(`  ✅ ${migration}`)
  } else {
    console.log(`  ❌ ${migration} - NOT FOUND`)
  }
}

// Write combined Dev migrations file
const devOutputPath = path.join(outputDir, 'dev-migrations-combined-safe.sql')
fs.writeFileSync(devOutputPath, devCombinedSQL.join('\n'))
console.log(`\n✅ Safe Dev migrations created: ${devOutputPath}`)

console.log('\n' + '='.repeat(70))
console.log('✅ Migration file updated with policy existence checks!')
console.log('='.repeat(70))
console.log('\nThis version checks if policies exist before creating them.')
console.log('Safe to run even if some migrations were partially applied.')
