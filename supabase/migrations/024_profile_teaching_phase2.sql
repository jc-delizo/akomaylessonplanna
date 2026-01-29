-- Migration: 024_profile_teaching_phase2.sql
-- Purpose: Add Phase 2 teaching preference columns to users table for Profile Teaching tab Option B
-- Allows teachers to specify: Class type (Regular/SPED), Learner path (SPED), Strand (Regular G11/12), SPED levels

-- Add Phase 2 teaching preference columns to users table
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS teaching_class_types TEXT[] NULL,
  ADD COLUMN IF NOT EXISTS teaching_learner_paths TEXT[] NULL,
  ADD COLUMN IF NOT EXISTS teaching_strand_ids UUID[] NULL,
  ADD COLUMN IF NOT EXISTS teaching_sped_level_ids UUID[] NULL;

-- Add indexes for array columns (GIN indexes for efficient array queries)
CREATE INDEX IF NOT EXISTS idx_users_teaching_class_types ON users USING GIN(teaching_class_types);
CREATE INDEX IF NOT EXISTS idx_users_teaching_strand_ids ON users USING GIN(teaching_strand_ids);
CREATE INDEX IF NOT EXISTS idx_users_teaching_sped_level_ids ON users USING GIN(teaching_sped_level_ids);

-- Add comments
COMMENT ON COLUMN users.teaching_class_types IS 'Array of class types teacher teaches: regular, sped';
COMMENT ON COLUMN users.teaching_learner_paths IS 'Array of SPED learner paths: graded, non_graded';
COMMENT ON COLUMN users.teaching_strand_ids IS 'Array of strand UUIDs for Regular G11/12 teaching';
COMMENT ON COLUMN users.teaching_sped_level_ids IS 'Array of SPED level UUIDs for Non-Graded teaching';
