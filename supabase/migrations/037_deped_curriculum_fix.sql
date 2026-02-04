-- Migration: 037_deped_curriculum_fix.sql
-- Purpose: Fix migration 036 if it was applied with incorrect data. Aligns with MATATAG/K-12/SHS 2025-2026.
-- Safe to run: Idempotent. Run this if 036 was applied before the curriculum correction.

-- ============================================================================
-- 1. Add any missing subjects (MATATAG + SHS 2025-2026)
-- ============================================================================

INSERT INTO subjects (name, code) VALUES
  ('Good Manners and Right Conduct', 'GMRC'),
  ('Language (Mother Tongue)', 'LANG_MT'),
  ('Reading and Literacy', 'READLIT'),
  ('Makabansa', 'MAKABANSA'),
  ('Effective Communication', 'EFFCOMM'),
  ('Mabisang Komunikasyon', 'MABISANGKOM'),
  ('General Science', 'GENSCI'),
  ('Pag-aaral ng Kasaysayan at Lipunang Pilipino', 'KASAYSAYAN'),
  ('Life and Career Skills', 'LIFECAREER')
ON CONFLICT (name) DO NOTHING;

-- ============================================================================
-- 2. Rebuild grade_subjects (full MATATAG / K to 12 / SHS 2025-2026)
-- ============================================================================

DELETE FROM grade_subjects;

INSERT INTO grade_subjects (grade_id, subject_id)
SELECT g.id, s.id FROM grades g, subjects s
WHERE g.name = 'Kindergarten' AND s.code IN ('LANG_MT', 'READLIT', 'MATH', 'MAKABANSA', 'GMRC')
ON CONFLICT (grade_id, subject_id) DO NOTHING;

INSERT INTO grade_subjects (grade_id, subject_id)
SELECT g.id, s.id FROM grades g, subjects s
WHERE g.name = 'Grade 1' AND s.code IN ('LANG_MT', 'READLIT', 'MATH', 'MAKABANSA', 'GMRC')
ON CONFLICT (grade_id, subject_id) DO NOTHING;

INSERT INTO grade_subjects (grade_id, subject_id)
SELECT g.id, s.id FROM grades g, subjects s
WHERE g.name = 'Grade 2' AND s.code IN ('FIL', 'ENG', 'MATH', 'MAKABANSA', 'GMRC')
ON CONFLICT (grade_id, subject_id) DO NOTHING;

INSERT INTO grade_subjects (grade_id, subject_id)
SELECT g.id, s.id FROM grades g, subjects s
WHERE g.name = 'Grade 3' AND s.code IN ('FIL', 'ENG', 'MATH', 'MAKABANSA', 'GMRC', 'SCI')
ON CONFLICT (grade_id, subject_id) DO NOTHING;

INSERT INTO grade_subjects (grade_id, subject_id)
SELECT g.id, s.id FROM grades g, subjects s
WHERE g.name IN ('Grade 4', 'Grade 5', 'Grade 6')
AND s.code IN ('FIL', 'ENG', 'MATH', 'SCI', 'AP', 'TLE', 'MAPEH', 'GMRC')
ON CONFLICT (grade_id, subject_id) DO NOTHING;

INSERT INTO grade_subjects (grade_id, subject_id)
SELECT g.id, s.id FROM grades g, subjects s
WHERE g.name IN ('Grade 7', 'Grade 8')
AND s.code IN ('ENG', 'FIL', 'MATH', 'SCI', 'AP', 'MAPEH', 'TLE', 'GMRC')
ON CONFLICT (grade_id, subject_id) DO NOTHING;

INSERT INTO grade_subjects (grade_id, subject_id)
SELECT g.id, s.id FROM grades g, subjects s
WHERE g.name IN ('Grade 9', 'Grade 10')
AND s.code IN ('ENG', 'FIL', 'MATH', 'SCI', 'AP', 'MAPEH', 'TLE', 'ESP')
ON CONFLICT (grade_id, subject_id) DO NOTHING;

INSERT INTO grade_subjects (grade_id, subject_id)
SELECT g.id, s.id FROM grades g, subjects s
WHERE g.name IN ('Grade 11', 'Grade 12')
AND s.code IN ('EFFCOMM', 'MABISANGKOM', 'GENMATH', 'GENSCI', 'KASAYSAYAN', 'LIFECAREER')
ON CONFLICT (grade_id, subject_id) DO NOTHING;

-- ============================================================================
-- 3. Restore HUMSS strand_subjects (original from 022)
-- ============================================================================

DELETE FROM strand_subjects WHERE strand_id = (SELECT id FROM strands WHERE code = 'humss');

INSERT INTO strand_subjects (strand_id, subject_id)
SELECT st.id, s.id FROM strands st, subjects s
WHERE st.code = 'humss' AND s.code IN ('UCSP', 'MIL', 'CPAR', 'LIT', 'HIST')
ON CONFLICT (strand_id, subject_id) DO NOTHING;

-- ============================================================================
-- 4. Delete SPED and orphaned subjects
-- ============================================================================

DELETE FROM subjects s
WHERE s.code LIKE 'SPED_%'
AND NOT EXISTS (SELECT 1 FROM product_subjects ps WHERE ps.subject_id = s.id)
AND NOT EXISTS (SELECT 1 FROM products p WHERE p.subject_id = s.id);

DELETE FROM subjects s
WHERE NOT EXISTS (SELECT 1 FROM grade_subjects gs WHERE gs.subject_id = s.id)
AND NOT EXISTS (SELECT 1 FROM strand_subjects ss WHERE ss.subject_id = s.id)
AND NOT EXISTS (SELECT 1 FROM product_subjects ps WHERE ps.subject_id = s.id)
AND NOT EXISTS (SELECT 1 FROM products p WHERE p.subject_id = s.id);
