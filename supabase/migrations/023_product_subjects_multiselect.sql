-- Migration: 023_product_subjects_multiselect.sql
-- Purpose: Phase B — Subject multiselect via product_subjects M:N. products.subject_id kept as primary for backward compatibility.
-- DepEd Philippines 2026: LESSON_PLAN_INVARIANTS.subject_is_multiselect.

-- ============================================================================
-- 1. Create product_subjects M:N table
-- ============================================================================

CREATE TABLE IF NOT EXISTS product_subjects (
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  subject_id UUID NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (product_id, subject_id)
);

CREATE INDEX IF NOT EXISTS idx_product_subjects_product ON product_subjects(product_id);
CREATE INDEX IF NOT EXISTS idx_product_subjects_subject ON product_subjects(subject_id);

-- ============================================================================
-- 2. Backfill from products.subject_id (one row per product)
-- ============================================================================

INSERT INTO product_subjects (product_id, subject_id, sort_order)
SELECT id, subject_id, 0
FROM products
WHERE subject_id IS NOT NULL
ON CONFLICT (product_id, subject_id) DO NOTHING;

-- ============================================================================
-- Migration complete
-- ============================================================================
