-- Migration: 021_lesson_plan_filters_and_strands.sql
-- Purpose: Add lesson-plan filter fields to products, create strands for SHS, enforce weeks 1-9.
-- DepEd Philippines 2026: curriculum, modalities, teaching_framework, class_type, learner_path, strand_id.

-- ============================================================================
-- 1. Create strands table (for Grade 11/12 SHS)
-- ============================================================================

CREATE TABLE IF NOT EXISTS strands (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  code VARCHAR(30) NOT NULL UNIQUE,
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_strands_active ON strands(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_strands_sort ON strands(sort_order);

-- Seed strands (DepEd SHS 2026)
INSERT INTO strands (name, code, sort_order) VALUES
  ('STEM', 'stem', 1),
  ('ABM', 'abm', 2),
  ('HUMSS', 'humss', 3),
  ('GAS', 'gas', 4),
  ('TVL-ICT', 'tvl_ict', 5),
  ('TVL-HE', 'tvl_he', 6),
  ('TVL-IA', 'tvl_ia', 7),
  ('TVL-AFA', 'tvl_afa', 8),
  ('Arts & Design', 'arts_design', 9),
  ('Sports', 'sports', 10)
ON CONFLICT (code) DO NOTHING;

-- ============================================================================
-- 2. Add new columns to products
-- ============================================================================

ALTER TABLE products
  ADD COLUMN IF NOT EXISTS curriculum VARCHAR(50) NULL,
  ADD COLUMN IF NOT EXISTS modalities TEXT[] NULL,
  ADD COLUMN IF NOT EXISTS teaching_framework VARCHAR(50) NULL,
  ADD COLUMN IF NOT EXISTS class_type VARCHAR(20) NULL,
  ADD COLUMN IF NOT EXISTS learner_path VARCHAR(30) NULL,
  ADD COLUMN IF NOT EXISTS strand_id UUID NULL REFERENCES strands(id) ON DELETE SET NULL;

-- ============================================================================
-- 3. Enforce weeks 1-9 (DepEd standard) via trigger (CHECK cannot use subqueries)
-- ============================================================================

-- Drop any existing constraint or trigger
ALTER TABLE products DROP CONSTRAINT IF EXISTS products_weeks_1_to_9;
DROP TRIGGER IF EXISTS products_weeks_1_to_9_trigger ON products;
DROP FUNCTION IF EXISTS products_validate_weeks_1_to_9();

CREATE OR REPLACE FUNCTION products_validate_weeks_1_to_9()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.weeks IS NULL OR array_length(NEW.weeks, 1) IS NULL THEN
    RETURN NEW;
  END IF;
  IF EXISTS (SELECT 1 FROM unnest(NEW.weeks) w WHERE w < 1 OR w > 9) THEN
    RAISE EXCEPTION 'products.weeks must contain only values between 1 and 9 (DepEd standard), got %', NEW.weeks;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER products_weeks_1_to_9_trigger
  BEFORE INSERT OR UPDATE OF weeks ON products
  FOR EACH ROW
  EXECUTE FUNCTION products_validate_weeks_1_to_9();

-- ============================================================================
-- 4. Indexes for new filter columns
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_products_curriculum ON products(curriculum) WHERE status = 'published';
CREATE INDEX IF NOT EXISTS idx_products_modalities ON products USING GIN(modalities) WHERE status = 'published' AND modalities IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_products_teaching_framework ON products(teaching_framework) WHERE status = 'published';
CREATE INDEX IF NOT EXISTS idx_products_class_type ON products(class_type) WHERE status = 'published';
CREATE INDEX IF NOT EXISTS idx_products_strand ON products(strand_id) WHERE status = 'published' AND strand_id IS NOT NULL;

-- ============================================================================
-- Migration complete
-- ============================================================================
