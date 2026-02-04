-- Migration: 034_remove_sped_from_database.sql
-- Purpose: Remove all SPED columns and tables. Class type is Regular only.

-- ============================================================================
-- 1. products: drop SPED columns
-- ============================================================================

DROP INDEX IF EXISTS idx_products_sped_level;
ALTER TABLE products DROP COLUMN IF EXISTS sped_level_id;
ALTER TABLE products DROP COLUMN IF EXISTS learner_path;

-- ============================================================================
-- 2. users: drop SPED teaching preference columns
-- ============================================================================

DROP INDEX IF EXISTS idx_users_teaching_sped_level_ids;
ALTER TABLE users DROP COLUMN IF EXISTS teaching_sped_level_ids;
ALTER TABLE users DROP COLUMN IF EXISTS teaching_learner_paths;

COMMENT ON COLUMN users.teaching_class_types IS 'Array of class types teacher teaches: regular only';

-- ============================================================================
-- 3. Drop sped_levels table
-- ============================================================================

DROP TABLE IF EXISTS sped_levels;

-- ============================================================================
-- Migration complete
-- ============================================================================
