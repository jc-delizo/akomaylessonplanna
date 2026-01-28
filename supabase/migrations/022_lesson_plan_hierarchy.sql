-- Migration: 022_lesson_plan_hierarchy.sql
-- Purpose: SPED levels, SPED subjects, strand_subjects for SHS specialized subjects, grade_id nullable for SPED Non-Graded.
-- DepEd Philippines 2026: Phase 2 hierarchy (Class type, SPED path/level, Strand–subject mapping).

-- ============================================================================
-- 1. SPED levels (Option A)
-- ============================================================================

CREATE TABLE IF NOT EXISTS sped_levels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL UNIQUE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sped_levels_sort ON sped_levels(sort_order);

-- Seed SPED Non-Graded levels (DepEd transition program)
INSERT INTO sped_levels (name, sort_order) VALUES
  ('Primary Level', 1),
  ('Intermediate Level', 2),
  ('Pre-Vocational Level', 3),
  ('Transition Program', 4)
ON CONFLICT (name) DO NOTHING;

-- Add sped_level_id to products (when class_type = 'sped' and learner_path = 'non_graded')
ALTER TABLE products
  ADD COLUMN IF NOT EXISTS sped_level_id UUID NULL REFERENCES sped_levels(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_products_sped_level ON products(sped_level_id)
  WHERE status = 'published' AND sped_level_id IS NOT NULL;

-- Make grade_id nullable so SPED Non-Graded products can omit grade (enforce in app when class_type=regular or learner_path=graded)
ALTER TABLE products ALTER COLUMN grade_id DROP NOT NULL;

-- ============================================================================
-- 2. SPED subjects (Non-Graded: Functional Academics, Daily Living, etc.)
-- ============================================================================

-- Add Non-Graded SPED subjects into existing subjects table; identify via code prefix SPED_ in config/API
INSERT INTO subjects (name, code) VALUES
  ('Functional Academics (Math, Reading, Writing)', 'SPED_FA'),
  ('Daily Living Skills', 'SPED_DLS'),
  ('Social-Emotional Skills', 'SPED_SOCEM'),
  ('Motor Skills', 'SPED_MOTOR'),
  ('Communication Skills', 'SPED_COMM'),
  ('Vocational/Occupational Skills', 'SPED_VOC'),
  ('Orientation and Mobility', 'SPED_ORIENT'),
  ('Recreational and Leisure Skills', 'SPED_REC')
ON CONFLICT (name) DO NOTHING;

-- ============================================================================
-- 3. Strand–subjects (SHS specialized subjects per strand)
-- ============================================================================

CREATE TABLE IF NOT EXISTS strand_subjects (
  strand_id UUID NOT NULL REFERENCES strands(id) ON DELETE CASCADE,
  subject_id UUID NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  PRIMARY KEY (strand_id, subject_id)
);

CREATE INDEX IF NOT EXISTS idx_strand_subjects_strand ON strand_subjects(strand_id);
CREATE INDEX IF NOT EXISTS idx_strand_subjects_subject ON strand_subjects(subject_id);

-- Seed specialized subjects per strand (DepEd SHS 2026). Core for G11/G12 stays in grade_subjects.
-- STEM
INSERT INTO strand_subjects (strand_id, subject_id)
SELECT st.id, s.id FROM strands st, subjects s
WHERE st.code = 'stem' AND s.code IN ('PRECALC', 'BASICALC', 'GENBIO', 'GENCHEM', 'GENPHYS', 'DRRR', 'EMPTECH', 'ENTREP', 'WORKIMM')
ON CONFLICT (strand_id, subject_id) DO NOTHING;

-- ABM
INSERT INTO strand_subjects (strand_id, subject_id)
SELECT st.id, s.id FROM strands st, subjects s
WHERE st.code = 'abm' AND s.code IN ('FABM', 'APPECON', 'ORG', 'BUSMATH', 'BUSFIN', 'POM', 'ENTREP', 'WORKIMM')
ON CONFLICT (strand_id, subject_id) DO NOTHING;

-- HUMSS (typical specialized)
INSERT INTO strand_subjects (strand_id, subject_id)
SELECT st.id, s.id FROM strands st, subjects s
WHERE st.code = 'humss' AND s.code IN ('UCSP', 'MIL', 'CPAR', 'LIT', 'HIST')
ON CONFLICT (strand_id, subject_id) DO NOTHING;

-- GAS
INSERT INTO strand_subjects (strand_id, subject_id)
SELECT st.id, s.id FROM strands st, subjects s
WHERE st.code = 'gas' AND s.code IN ('PERDEV', 'ENTREP', 'MIL', 'UCSP')
ON CONFLICT (strand_id, subject_id) DO NOTHING;

-- TVL-ICT
INSERT INTO strand_subjects (strand_id, subject_id)
SELECT st.id, s.id FROM strands st, subjects s
WHERE st.code = 'tvl_ict' AND s.code IN ('EMPTECH', 'COMP', 'ENTREP')
ON CONFLICT (strand_id, subject_id) DO NOTHING;

-- TVL-HE
INSERT INTO strand_subjects (strand_id, subject_id)
SELECT st.id, s.id FROM strands st, subjects s
WHERE st.code = 'tvl_he' AND s.code IN ('TLE', 'ENTREP')
ON CONFLICT (strand_id, subject_id) DO NOTHING;

-- TVL-IA
INSERT INTO strand_subjects (strand_id, subject_id)
SELECT st.id, s.id FROM strands st, subjects s
WHERE st.code = 'tvl_ia' AND s.code IN ('EMPTECH', 'TLE', 'ENTREP')
ON CONFLICT (strand_id, subject_id) DO NOTHING;

-- TVL-AFA
INSERT INTO strand_subjects (strand_id, subject_id)
SELECT st.id, s.id FROM strands st, subjects s
WHERE st.code = 'tvl_afa' AND s.code IN ('TLE', 'ENTREP')
ON CONFLICT (strand_id, subject_id) DO NOTHING;

-- Arts & Design
INSERT INTO strand_subjects (strand_id, subject_id)
SELECT st.id, s.id FROM strands st, subjects s
WHERE st.code = 'arts_design' AND s.code IN ('CPAR', 'LIT')
ON CONFLICT (strand_id, subject_id) DO NOTHING;

-- Sports
INSERT INTO strand_subjects (strand_id, subject_id)
SELECT st.id, s.id FROM strands st, subjects s
WHERE st.code = 'sports' AND s.code IN ('PE', 'HEALTH')
ON CONFLICT (strand_id, subject_id) DO NOTHING;

-- ============================================================================
-- Migration complete
-- ============================================================================
