-- Migration: 036_deped_curriculum_alignment.sql
-- Purpose: Align subjects with DepEd MATATAG (Grades 1-8), K to 12 (Grades 9-10), and SHS 2025-2026 (Grades 11-12). Delete orphaned subjects.
-- Reference: MATATAG Curriculum SY 2024-2025/2025-2026, SHS Strengthened Curriculum 2025-2026.

-- ============================================================================
-- 1. Add new subjects
-- ============================================================================

-- MATATAG: GMRC (Good Manners and Right Conduct), Language (Mother Tongue), Reading and Literacy, Makabansa
INSERT INTO subjects (name, code) VALUES
  ('Good Manners and Right Conduct', 'GMRC'),
  ('Language (Mother Tongue)', 'LANG_MT'),
  ('Reading and Literacy', 'READLIT'),
  ('Makabansa', 'MAKABANSA')
ON CONFLICT (name) DO NOTHING;

-- SHS 2025-2026: Revised core subjects (5 core + Life and Career Skills)
INSERT INTO subjects (name, code) VALUES
  ('Effective Communication', 'EFFCOMM'),
  ('Mabisang Komunikasyon', 'MABISANGKOM'),
  ('General Science', 'GENSCI'),
  ('Pag-aaral ng Kasaysayan at Lipunang Pilipino', 'KASAYSAYAN'),
  ('Life and Career Skills', 'LIFECAREER')
ON CONFLICT (name) DO NOTHING;

-- ============================================================================
-- 2. Rebuild grade_subjects (full MATATAG / K to 12 / SHS 2025-2026)
-- ============================================================================

-- Clear all grade_subjects (we will rebuild from scratch)
DELETE FROM grade_subjects;

-- Kindergarten (MATATAG - same as Grade 1)
INSERT INTO grade_subjects (grade_id, subject_id)
SELECT g.id, s.id FROM grades g, subjects s
WHERE g.name = 'Kindergarten' AND s.code IN ('LANG_MT', 'READLIT', 'MATH', 'MAKABANSA', 'GMRC')
ON CONFLICT (grade_id, subject_id) DO NOTHING;

-- Grade 1 (MATATAG - 5 Core Subjects)
INSERT INTO grade_subjects (grade_id, subject_id)
SELECT g.id, s.id FROM grades g, subjects s
WHERE g.name = 'Grade 1' AND s.code IN ('LANG_MT', 'READLIT', 'MATH', 'MAKABANSA', 'GMRC')
ON CONFLICT (grade_id, subject_id) DO NOTHING;

-- Grade 2 (MATATAG - no Science)
INSERT INTO grade_subjects (grade_id, subject_id)
SELECT g.id, s.id FROM grades g, subjects s
WHERE g.name = 'Grade 2' AND s.code IN ('FIL', 'ENG', 'MATH', 'MAKABANSA', 'GMRC')
ON CONFLICT (grade_id, subject_id) DO NOTHING;

-- Grade 3 (MATATAG - Science introduced)
INSERT INTO grade_subjects (grade_id, subject_id)
SELECT g.id, s.id FROM grades g, subjects s
WHERE g.name = 'Grade 3' AND s.code IN ('FIL', 'ENG', 'MATH', 'MAKABANSA', 'GMRC', 'SCI')
ON CONFLICT (grade_id, subject_id) DO NOTHING;

-- Grades 4-6 (MATATAG)
INSERT INTO grade_subjects (grade_id, subject_id)
SELECT g.id, s.id FROM grades g, subjects s
WHERE g.name IN ('Grade 4', 'Grade 5', 'Grade 6')
AND s.code IN ('FIL', 'ENG', 'MATH', 'SCI', 'AP', 'TLE', 'MAPEH', 'GMRC')
ON CONFLICT (grade_id, subject_id) DO NOTHING;

-- Grades 7-8 (MATATAG Curriculum)
INSERT INTO grade_subjects (grade_id, subject_id)
SELECT g.id, s.id FROM grades g, subjects s
WHERE g.name IN ('Grade 7', 'Grade 8')
AND s.code IN ('ENG', 'FIL', 'MATH', 'SCI', 'AP', 'MAPEH', 'TLE', 'GMRC')
ON CONFLICT (grade_id, subject_id) DO NOTHING;

-- Grades 9-10 (K to 12 Curriculum - traditional)
INSERT INTO grade_subjects (grade_id, subject_id)
SELECT g.id, s.id FROM grades g, subjects s
WHERE g.name IN ('Grade 9', 'Grade 10')
AND s.code IN ('ENG', 'FIL', 'MATH', 'SCI', 'AP', 'MAPEH', 'TLE', 'ESP')
ON CONFLICT (grade_id, subject_id) DO NOTHING;

-- Grades 11-12 (SHS 2025-2026 - 5 core + Life and Career Skills)
INSERT INTO grade_subjects (grade_id, subject_id)
SELECT g.id, s.id FROM grades g, subjects s
WHERE g.name IN ('Grade 11', 'Grade 12')
AND s.code IN ('EFFCOMM', 'MABISANGKOM', 'GENMATH', 'GENSCI', 'KASAYSAYAN', 'LIFECAREER')
ON CONFLICT (grade_id, subject_id) DO NOTHING;

-- ============================================================================
-- 3. Revert HUMSS strand_subjects (keep original from 022; SHS 2025-2026 uses new track structure)
-- ============================================================================

-- Remove any HUMSS mappings that may have been added by a previous 036 run, restore original
DELETE FROM strand_subjects
WHERE strand_id = (SELECT id FROM strands WHERE code = 'humss');

INSERT INTO strand_subjects (strand_id, subject_id)
SELECT st.id, s.id FROM strands st, subjects s
WHERE st.code = 'humss' AND s.code IN ('UCSP', 'MIL', 'CPAR', 'LIT', 'HIST')
ON CONFLICT (strand_id, subject_id) DO NOTHING;

-- ============================================================================
-- 4. Delete SPED subjects (orphaned after migration 034)
-- ============================================================================

DELETE FROM subjects s
WHERE s.code LIKE 'SPED_%'
AND NOT EXISTS (SELECT 1 FROM product_subjects ps WHERE ps.subject_id = s.id)
AND NOT EXISTS (SELECT 1 FROM products p WHERE p.subject_id = s.id);

-- ============================================================================
-- 5. Delete orphaned subjects (not in grade_subjects, strand_subjects, products)
-- ============================================================================

DELETE FROM subjects s
WHERE NOT EXISTS (SELECT 1 FROM grade_subjects gs WHERE gs.subject_id = s.id)
AND NOT EXISTS (SELECT 1 FROM strand_subjects ss WHERE ss.subject_id = s.id)
AND NOT EXISTS (SELECT 1 FROM product_subjects ps WHERE ps.subject_id = s.id)
AND NOT EXISTS (SELECT 1 FROM products p WHERE p.subject_id = s.id);

-- ============================================================================
-- Migration complete
-- ============================================================================
