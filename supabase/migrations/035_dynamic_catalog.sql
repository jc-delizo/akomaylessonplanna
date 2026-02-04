-- Migration: 035_dynamic_catalog.sql
-- Purpose: Dynamic filter/catalog management. Create product_types, product_type_specific_types,
-- curricula, modalities, languages, teaching_frameworks, quarters tables. Add sort_order to subjects.
-- Super Admin manages via Admin Catalog section.

-- ============================================================================
-- 1. Add sort_order to subjects (if missing)
-- ============================================================================

ALTER TABLE subjects ADD COLUMN IF NOT EXISTS sort_order INTEGER NOT NULL DEFAULT 0;
CREATE INDEX IF NOT EXISTS idx_subjects_sort ON subjects(sort_order);

-- ============================================================================
-- 2. Create product_types table
-- ============================================================================

CREATE TABLE IF NOT EXISTS product_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug VARCHAR(50) NOT NULL UNIQUE,
  label VARCHAR(100) NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_product_types_active ON product_types(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_product_types_sort ON product_types(sort_order);

-- ============================================================================
-- 3. Create product_type_specific_types table
-- ============================================================================

CREATE TABLE IF NOT EXISTS product_type_specific_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_type_id UUID NOT NULL REFERENCES product_types(id) ON DELETE CASCADE,
  value VARCHAR(50) NOT NULL,
  label VARCHAR(100) NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(product_type_id, value)
);

CREATE INDEX IF NOT EXISTS idx_specific_types_product_type ON product_type_specific_types(product_type_id);
CREATE INDEX IF NOT EXISTS idx_specific_types_active ON product_type_specific_types(is_active) WHERE is_active = true;

-- ============================================================================
-- 4. Create curricula table
-- ============================================================================

CREATE TABLE IF NOT EXISTS curricula (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  value VARCHAR(50) NOT NULL UNIQUE,
  label VARCHAR(100) NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_curricula_active ON curricula(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_curricula_sort ON curricula(sort_order);

-- ============================================================================
-- 5. Create modalities table
-- ============================================================================

CREATE TABLE IF NOT EXISTS modalities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  value VARCHAR(50) NOT NULL UNIQUE,
  label VARCHAR(100) NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_modalities_active ON modalities(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_modalities_sort ON modalities(sort_order);

-- ============================================================================
-- 6. Create languages table
-- ============================================================================

CREATE TABLE IF NOT EXISTS languages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  value VARCHAR(50) NOT NULL UNIQUE,
  label VARCHAR(100) NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_languages_active ON languages(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_languages_sort ON languages(sort_order);

-- ============================================================================
-- 7. Create teaching_frameworks table
-- ============================================================================

CREATE TABLE IF NOT EXISTS teaching_frameworks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  value VARCHAR(50) NOT NULL UNIQUE,
  label VARCHAR(100) NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_teaching_frameworks_active ON teaching_frameworks(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_teaching_frameworks_sort ON teaching_frameworks(sort_order);

-- ============================================================================
-- 8. Create quarters table
-- ============================================================================

CREATE TABLE IF NOT EXISTS quarters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  value VARCHAR(10) NOT NULL UNIQUE,
  label VARCHAR(50) NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_quarters_active ON quarters(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_quarters_sort ON quarters(sort_order);

-- ============================================================================
-- 9. Seed product_types
-- ============================================================================

INSERT INTO product_types (slug, label, sort_order) VALUES
  ('exams', 'Exams', 1),
  ('lesson_plans', 'Lesson Plans', 2),
  ('rpms', 'RPMS', 3),
  ('posters', 'Posters', 4),
  ('tarpaulins', 'Tarpaulins', 5)
ON CONFLICT (slug) DO NOTHING;

-- ============================================================================
-- 10. Seed product_type_specific_types (exams, lesson_plans)
-- ============================================================================

INSERT INTO product_type_specific_types (product_type_id, value, label, sort_order)
SELECT pt.id, 'periodical_exam', 'Periodical Exam', 1
FROM product_types pt WHERE pt.slug = 'exams'
ON CONFLICT (product_type_id, value) DO NOTHING;

INSERT INTO product_type_specific_types (product_type_id, value, label, sort_order)
SELECT pt.id, 'summative_test', 'Summative Test', 2
FROM product_types pt WHERE pt.slug = 'exams'
ON CONFLICT (product_type_id, value) DO NOTHING;

INSERT INTO product_type_specific_types (product_type_id, value, label, sort_order)
SELECT pt.id, 'dll', 'Daily Lesson Log (DLL)', 1
FROM product_types pt WHERE pt.slug = 'lesson_plans'
ON CONFLICT (product_type_id, value) DO NOTHING;

INSERT INTO product_type_specific_types (product_type_id, value, label, sort_order)
SELECT pt.id, 'dlp', 'Detailed Lesson Plan (DLP)', 2
FROM product_types pt WHERE pt.slug = 'lesson_plans'
ON CONFLICT (product_type_id, value) DO NOTHING;

-- ============================================================================
-- 11. Seed curricula
-- ============================================================================

INSERT INTO curricula (value, label, sort_order) VALUES
  ('matatag', 'MATATAG Curriculum', 1),
  ('k_to_12', 'K to 12 Curriculum', 2)
ON CONFLICT (value) DO NOTHING;

-- ============================================================================
-- 12. Seed modalities
-- ============================================================================

INSERT INTO modalities (value, label, sort_order) VALUES
  ('face_to_face', 'Face-to-face', 1),
  ('online', 'Online', 2),
  ('modular', 'Modular', 3),
  ('blended', 'Blended', 4)
ON CONFLICT (value) DO NOTHING;

-- ============================================================================
-- 13. Seed languages
-- ============================================================================

INSERT INTO languages (value, label, sort_order) VALUES
  ('english', 'English', 1),
  ('filipino', 'Filipino', 2),
  ('cebuano_bisaya', 'Cebuano/Bisaya', 3),
  ('ilocano', 'Ilocano', 4),
  ('hiligaynon', 'Hiligaynon', 5),
  ('waray', 'Waray', 6),
  ('kapampangan', 'Kapampangan', 7),
  ('pangasinense', 'Pangasinense', 8),
  ('bicolano', 'Bicolano', 9),
  ('maranao', 'Maranao', 10),
  ('maguindanaon', 'Maguindanaon', 11),
  ('tausug', 'Tausug', 12)
ON CONFLICT (value) DO NOTHING;

-- ============================================================================
-- 14. Seed teaching_frameworks
-- ============================================================================

INSERT INTO teaching_frameworks (value, label, sort_order) VALUES
  ('4as', '4As', 1),
  ('5es', '5Es', 2),
  ('inquiry_based', 'Inquiry-Based', 3),
  ('direct_instruction', 'Direct Instruction', 4),
  ('custom', 'Custom', 5)
ON CONFLICT (value) DO NOTHING;

-- ============================================================================
-- 15. Seed quarters
-- ============================================================================

INSERT INTO quarters (value, label, sort_order) VALUES
  ('1', 'Quarter 1', 1),
  ('2', 'Quarter 2', 2),
  ('3', 'Quarter 3', 3),
  ('4', 'Quarter 4', 4)
ON CONFLICT (value) DO NOTHING;

-- ============================================================================
-- 16. Triggers for updated_at
-- ============================================================================

DROP TRIGGER IF EXISTS update_product_types_updated_at ON product_types;
CREATE TRIGGER update_product_types_updated_at
  BEFORE UPDATE ON product_types
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_product_type_specific_types_updated_at ON product_type_specific_types;
CREATE TRIGGER update_product_type_specific_types_updated_at
  BEFORE UPDATE ON product_type_specific_types
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_curricula_updated_at ON curricula;
CREATE TRIGGER update_curricula_updated_at
  BEFORE UPDATE ON curricula
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_modalities_updated_at ON modalities;
CREATE TRIGGER update_modalities_updated_at
  BEFORE UPDATE ON modalities
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_languages_updated_at ON languages;
CREATE TRIGGER update_languages_updated_at
  BEFORE UPDATE ON languages
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_teaching_frameworks_updated_at ON teaching_frameworks;
CREATE TRIGGER update_teaching_frameworks_updated_at
  BEFORE UPDATE ON teaching_frameworks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_quarters_updated_at ON quarters;
CREATE TRIGGER update_quarters_updated_at
  BEFORE UPDATE ON quarters
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 17. RLS (admin-only write; public read for config)
-- ============================================================================

ALTER TABLE product_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_type_specific_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE curricula ENABLE ROW LEVEL SECURITY;
ALTER TABLE modalities ENABLE ROW LEVEL SECURITY;
ALTER TABLE languages ENABLE ROW LEVEL SECURITY;
ALTER TABLE teaching_frameworks ENABLE ROW LEVEL SECURITY;
ALTER TABLE quarters ENABLE ROW LEVEL SECURITY;

-- Public read for config API (anonymous + authenticated)
CREATE POLICY "Anyone can read product_types" ON product_types FOR SELECT USING (true);
CREATE POLICY "Anyone can read product_type_specific_types" ON product_type_specific_types FOR SELECT USING (true);
CREATE POLICY "Anyone can read curricula" ON curricula FOR SELECT USING (true);
CREATE POLICY "Anyone can read modalities" ON modalities FOR SELECT USING (true);
CREATE POLICY "Anyone can read languages" ON languages FOR SELECT USING (true);
CREATE POLICY "Anyone can read teaching_frameworks" ON teaching_frameworks FOR SELECT USING (true);
CREATE POLICY "Anyone can read quarters" ON quarters FOR SELECT USING (true);

-- Admin manage (service role or authenticated admin - applied via API route check)
CREATE POLICY "Service role can manage product_types" ON product_types FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role can manage product_type_specific_types" ON product_type_specific_types FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role can manage curricula" ON curricula FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role can manage modalities" ON modalities FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role can manage languages" ON languages FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role can manage teaching_frameworks" ON teaching_frameworks FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role can manage quarters" ON quarters FOR ALL USING (auth.role() = 'service_role');

-- ============================================================================
-- Migration complete
-- ============================================================================
