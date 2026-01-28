-- Optional verification for migration 022.
-- Run after 022_lesson_plan_hierarchy.sql. Returns subject codes referenced in
-- 022's strand_subjects seed that are missing from subjects (empty result = OK).
-- See Phase 2 plan: docs/implementationplan/LESSON-PLAN-PHASE-2-IMPLEMENTATION-GUIDE.md
SELECT unnest(ARRAY[
  'PRECALC','BASICALC','GENBIO','GENCHEM','GENPHYS','DRRR','EMPTECH','ENTREP','WORKIMM',
  'FABM','APPECON','ORG','BUSMATH','BUSFIN','POM','UCSP','MIL','CPAR','LIT','HIST',
  'PERDEV','COMP','TLE','PE','HEALTH'
]) AS code
EXCEPT
SELECT code FROM subjects;
