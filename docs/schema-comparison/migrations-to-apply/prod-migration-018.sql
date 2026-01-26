-- ============================================================================
-- PROD DATABASE MIGRATION
-- ⚠️  CRITICAL: Apply this migration to Prod database
-- Database: iokinyttkzmcnmznxgza
-- ============================================================================
-- IMPORTANT: Backup Prod database before applying!
-- This migration modifies the users table structure.
-- ============================================================================

-- Migration: 018_replace_name_with_first_last_name.sql
-- ======================================================================
-- Migration: Replace name field with first_name and last_name
-- Date: 2025-01-XX
-- Description: Splits the single 'name' field into 'first_name' and 'last_name' fields
--              Migrates existing data by splitting on first space

-- Step 1: Add new columns (nullable initially to allow migration)
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS first_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS last_name VARCHAR(255);

-- Step 2: Migrate existing data
-- Split name on first space:
-- - If name has space: first_name = first part, last_name = rest
-- - If no space: first_name = name, last_name = ''
-- - If name is NULL: first_name = 'User', last_name = ''
UPDATE users
SET 
  first_name = CASE 
    WHEN name IS NULL OR name = '' THEN 
      'User'
    WHEN position(' ' in name) > 0 THEN 
      substring(name from 1 for position(' ' in name) - 1)
    ELSE 
      name
  END,
  last_name = CASE 
    WHEN name IS NULL OR name = '' THEN 
      ''
    WHEN position(' ' in name) > 0 THEN 
      substring(name from position(' ' in name) + 1)
    ELSE 
      ''
  END
WHERE first_name IS NULL OR last_name IS NULL;

-- Step 3: Make first_name NOT NULL (last_name can be empty string)
ALTER TABLE users 
ALTER COLUMN first_name SET NOT NULL;

-- Step 4: Set default empty string for last_name if NULL
UPDATE users SET last_name = '' WHERE last_name IS NULL;
ALTER TABLE users 
ALTER COLUMN last_name SET DEFAULT '';

-- Step 5: Drop the old name column
ALTER TABLE users DROP COLUMN IF EXISTS name;

-- Note: No indexes or constraints specifically on the name column to update
-- The name field was not indexed separately


