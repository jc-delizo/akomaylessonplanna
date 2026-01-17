-- Migration: 002_seed_data.sql
-- Feature: Seed Initial Data
-- Description: Seed grades, subjects, and grade-subject relationships

-- ============================================================================
-- 1. Seed Grades (Kindergarten to Grade 12)
-- ============================================================================

INSERT INTO grades (name, sort_order) VALUES
('Kindergarten', 1),
('Grade 1', 2),
('Grade 2', 3),
('Grade 3', 4),
('Grade 4', 5),
('Grade 5', 6),
('Grade 6', 7),
('Grade 7', 8),
('Grade 8', 9),
('Grade 9', 10),
('Grade 10', 11),
('Grade 11', 12),
('Grade 12', 13)
ON CONFLICT (name) DO NOTHING;

-- ============================================================================
-- 2. Seed Subjects
-- ============================================================================

INSERT INTO subjects (name, code) VALUES
('Mathematics', 'MATH'),
('Science', 'SCI'),
('English', 'ENG'),
('Filipino', 'FIL'),
('Araling Panlipunan', 'AP'),
('Edukasyon sa Pagpapakatao', 'ESP'),
('Music, Arts, Physical Education, and Health', 'MAPEH'),
('Technology and Livelihood Education', 'TLE'),
('Computer', 'COMP'),
('Physical Education', 'PE'),
('Health', 'HEALTH'),
('Values Education', 'VALED'),
('Mother Tongue', 'MT'),
('Reading', 'READ'),
('Writing', 'WRITE'),
('Social Studies', 'SOCSTUD'),
('History', 'HIST'),
('Geography', 'GEO'),
('Economics', 'ECON'),
('Chemistry', 'CHEM'),
('Physics', 'PHYS'),
('Biology', 'BIO'),
('Earth Science', 'EARTH'),
('Algebra', 'ALG'),
('Geometry', 'GEOM'),
('Trigonometry', 'TRIG'),
('Calculus', 'CALC'),
('Statistics', 'STAT'),
('Literature', 'LIT'),
('Grammar', 'GRAM'),
('Research', 'RES'),
('Practical Research', 'PRACRES'),
('General Mathematics', 'GENMATH'),
('Statistics and Probability', 'STATPROB'),
('Pre-Calculus', 'PRECALC'),
('Basic Calculus', 'BASICALC'),
('General Biology', 'GENBIO'),
('General Chemistry', 'GENCHEM'),
('General Physics', 'GENPHYS'),
('Earth and Life Science', 'EARTHLIFE'),
('Physical Science', 'PHYSCI'),
('Personal Development', 'PERDEV'),
('Understanding Culture, Society and Politics', 'UCSP'),
('Introduction to Philosophy of the Human Person', 'IPHP'),
('Contemporary Philippine Arts from the Regions', 'CPAR'),
('Media and Information Literacy', 'MIL'),
('Disaster Readiness and Risk Reduction', 'DRRR'),
('Empowerment Technologies', 'EMPTECH'),
('Entrepreneurship', 'ENTREP'),
('Organization and Management', 'ORG'),
('Fundamentals of Accountancy, Business and Management', 'FABM'),
('Applied Economics', 'APPECON'),
('Business Math', 'BUSMATH'),
('Business Finance', 'BUSFIN'),
('Principles of Marketing', 'POM'),
('Work Immersion', 'WORKIMM')
ON CONFLICT (name) DO NOTHING;

-- ============================================================================
-- 3. Seed Grade-Subject Relationships
-- ============================================================================

-- Elementary Grades (Kindergarten to Grade 6) - Core Subjects
INSERT INTO grade_subjects (grade_id, subject_id)
SELECT g.id, s.id 
FROM grades g, subjects s
WHERE g.sort_order BETWEEN 1 AND 7 -- Kindergarten to Grade 6
AND s.code IN ('MATH', 'SCI', 'ENG', 'FIL', 'AP', 'ESP', 'MAPEH', 'MT', 'READ', 'WRITE', 'VALED')
ON CONFLICT DO NOTHING;

-- Junior High School (Grade 7 to Grade 10) - Core Subjects
INSERT INTO grade_subjects (grade_id, subject_id)
SELECT g.id, s.id 
FROM grades g, subjects s
WHERE g.sort_order BETWEEN 8 AND 11 -- Grade 7 to Grade 10
AND s.code IN ('MATH', 'SCI', 'ENG', 'FIL', 'AP', 'ESP', 'MAPEH', 'TLE', 'COMP', 'PE', 'HEALTH')
ON CONFLICT DO NOTHING;

-- Senior High School (Grade 11 to Grade 12) - Core Subjects
INSERT INTO grade_subjects (grade_id, subject_id)
SELECT g.id, s.id 
FROM grades g, subjects s
WHERE g.sort_order BETWEEN 12 AND 13 -- Grade 11 to Grade 12
AND s.code IN ('ENG', 'FIL', 'GENMATH', 'STATPROB', 'EARTHLIFE', 'PHYSCI', 'PERDEV', 'UCSP', 'IPHP', 'CPAR', 'MIL', 'PE', 'HEALTH')
ON CONFLICT DO NOTHING;

-- Grade 7 Specific Subjects
INSERT INTO grade_subjects (grade_id, subject_id)
SELECT g.id, s.id 
FROM grades g, subjects s
WHERE g.name = 'Grade 7'
AND s.code IN ('ALG', 'GENBIO', 'EARTH')
ON CONFLICT DO NOTHING;

-- Grade 8 Specific Subjects
INSERT INTO grade_subjects (grade_id, subject_id)
SELECT g.id, s.id 
FROM grades g, subjects s
WHERE g.name = 'Grade 8'
AND s.code IN ('ALG', 'GENCHEM', 'EARTH')
ON CONFLICT DO NOTHING;

-- Grade 9 Specific Subjects
INSERT INTO grade_subjects (grade_id, subject_id)
SELECT g.id, s.id 
FROM grades g, subjects s
WHERE g.name = 'Grade 9'
AND s.code IN ('GEOM', 'GENCHEM', 'GENBIO')
ON CONFLICT DO NOTHING;

-- Grade 10 Specific Subjects
INSERT INTO grade_subjects (grade_id, subject_id)
SELECT g.id, s.id 
FROM grades g, subjects s
WHERE g.name = 'Grade 10'
AND s.code IN ('TRIG', 'GENPHYS', 'GENBIO', 'GENCHEM')
ON CONFLICT DO NOTHING;

-- Grade 11 STEM Track
INSERT INTO grade_subjects (grade_id, subject_id)
SELECT g.id, s.id 
FROM grades g, subjects s
WHERE g.name = 'Grade 11'
AND s.code IN ('PRECALC', 'BASICALC', 'GENBIO', 'GENCHEM', 'GENPHYS', 'DRRR', 'EMPTECH', 'ENTREP')
ON CONFLICT DO NOTHING;

-- Grade 12 STEM Track
INSERT INTO grade_subjects (grade_id, subject_id)
SELECT g.id, s.id 
FROM grades g, subjects s
WHERE g.name = 'Grade 12'
AND s.code IN ('BASICALC', 'GENBIO', 'GENCHEM', 'GENPHYS', 'WORKIMM')
ON CONFLICT DO NOTHING;

-- Grade 11 ABM Track
INSERT INTO grade_subjects (grade_id, subject_id)
SELECT g.id, s.id 
FROM grades g, subjects s
WHERE g.name = 'Grade 11'
AND s.code IN ('FABM', 'APPECON', 'ORG', 'BUSMATH', 'BUSFIN', 'POM', 'ENTREP')
ON CONFLICT DO NOTHING;

-- Grade 12 ABM Track
INSERT INTO grade_subjects (grade_id, subject_id)
SELECT g.id, s.id 
FROM grades g, subjects s
WHERE g.name = 'Grade 12'
AND s.code IN ('FABM', 'BUSFIN', 'POM', 'WORKIMM')
ON CONFLICT DO NOTHING;

-- ============================================================================
-- Migration Complete
-- ============================================================================
