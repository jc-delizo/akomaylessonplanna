---
name: Phase 2 Implementation Plan
overview: A concrete implementation plan that aligns the codebase with [LESSON-PLAN-PHASE-2-IMPLEMENTATION-GUIDE.md](docs/implementationplan/LESSON-PLAN-PHASE-2-IMPLEMENTATION-GUIDE.md). Much of Phase 2 is already built; this plan documents current state, verification steps, and any remaining or optional work (Migration 022 subject codes, MATATAG vs K–12, edit-form checks).
todos: []
isProject: false
---

# Phase 2 Implementation Plan (Lesson-Plan Hierarchy)

This plan maps the [LESSON-PLAN-PHASE-2-IMPLEMENTATION-GUIDE.md](docs/implementationplan/LESSON-PLAN-PHASE-2-IMPLEMENTATION-GUIDE.md) to the codebase and specifies what is done, what to verify, and what remains.

---

## Current State Summary

Phase 2 is **largely implemented**. The following match the guide:


| Guide section              | Status | Evidence                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| -------------------------- | ------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Todo 9 — Migration 022** | Done   | [022_lesson_plan_hierarchy.sql](supabase/migrations/022_lesson_plan_hierarchy.sql): `sped_levels`, `sped_level_id` on products, `grade_id` nullable, SPED subjects in `subjects`, `strand_subjects` + seed for all strands.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| **Todo 10 — Config API**   | Done   | [app/api/lesson-plan-config/route.ts](app/api/lesson-plan-config/route.ts): GET returns `classTypes`, `regular.{grades, strands, subjectsByGrade, subjectsByStrand}`, `sped.{paths, levels, spedSubjects}`. Cache-Control 5 min.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| **Todo 11 — Hierarchy UI** | Done   | [components/products/filter-sidebar.tsx](components/products/filter-sidebar.tsx): Class type, Learner path (SPED), Level (SPED non-graded), Grade, Strand (G11/12), Subject from hierarchy. Uses `/api/lesson-plan-config`. [app/marketplace/browse/page.tsx](app/marketplace/browse/page.tsx): passes all filters (incl. class_type, strand_id, learner_path, sped_level_id) to URL and search. [components/search/filter-chips.tsx](components/search/filter-chips.tsx): chips for Class type, Path, Strand, Level. [app/shop/products/new/page.tsx](app/shop/products/new/page.tsx) and [app/shop/products/[id]/edit/page.tsx](app/shop/products/[id]/edit/page.tsx): class_type, learner_path, sped_level_id, strand_id, hierarchy fetch, validation. [app/api/search/route.ts](app/api/search/route.ts): reads and filters by class_type, strand_id, learner_path, sped_level_id; cache key includes them. [app/api/products/route.ts](app/api/products/route.ts) and [app/api/products/[id]/route.ts](app/api/products/[id]/route.ts): persist class_type, learner_path, strand_id, sped_level_id. |


---

## Implementation Order (per guide)

The guide dictates: **Migration 022 → Config API → Hierarchy UI**. Given current state, treat the plan as **verify → fix gaps → optional enhancements**.

---

## Step 1: Migration 022 — Verify and Fix Gaps

**Goal:** DB has SPED levels, SPED subjects, strand_subjects, and nullable grade_id; no runtime errors when config API and UI run.

1. **Run migration 022 (if not already applied)**
  - Apply [022_lesson_plan_hierarchy.sql](supabase/migrations/022_lesson_plan_hierarchy.sql) in the target environment.  
  - Resolve any dependency/order issues (e.g. 021 must be applied first for `strands` and product columns).
2. **Confirm strand_subjects seed subject codes exist**
  - 022 seeds `strand_subjects` by joining `strands` and `subjects` on codes (e.g. `PRECALC`, `GENBIO`, `WORKIMM`, `APPECON`, `BUSMATH`, `BUSFIN`, `POM`).  
  - [002_seed_data.sql](supabase/migrations/002_seed_data.sql) defines many subjects; not all codes used in 022 may exist.  
  - **Action:** In DB or a small script, run a query that lists subject codes referenced in 022’s `WHERE s.code IN (...)` and check they exist in `subjects`.  
  - **Fix:** Add missing subjects (and, if desired, grade_subjects for G11/G12) in a new migration or in 022 before/after the strand_subjects INSERTs, so seed rows are created. Document added codes.
3. **Optional — MATATAG vs K–12 (Todo 9.4)**
  - Guide: MATATAG applies to Grades 1,2,4,5,7,8; K–12 to 3,6,9,10; subject lists differ (e.g. Grades 1–2: “Language”, “Reading and Literacy”).  
  - **Option A:** Curriculum-aware `grade_subjects` or a parallel table; config API returns subjects by grade + curriculum.  
  - **Option B:** Keep one `grade_subjects` and resolve MATATAG vs K–12 in the config API or static config (e.g. TS/JSON map grade + curriculum → subject ids/names).  
  - **Action:** Decide A or B; if implementing, add migration/API changes and document in the Phase 2 guide.

---

## Step 2: Config API — Verify Contract and Cache

**Goal:** `/api/lesson-plan-config` remains the single hierarchy source; response shape matches what the UI expects; SHS rule is enforced in UI, not in API.

1. **Contract**
  - [app/api/lesson-plan-config/route.ts](app/api/lesson-plan-config/route.ts) already returns the shape required by the guide (Option A).  
  - **Action:** Add a short comment or inline type at the top of the route describing the response shape and refer to [LESSON-PLAN-HIERARCHY-SPEC.md](docs/implementationplan/LESSON-PLAN-HIERARCHY-SPEC.md) for “SHS specialized subjects only after strand selected.” No code change required if behavior is correct.
2. **G11/12 subjects = core + specialized**
  - API returns `subjectsByGrade` (grade_subjects) and `subjectsByStrand` (strand_subjects) separately.  
  - Filter sidebar and product form merge them for Grade 11/12 when `strand_id` is set.  
  - **Action:** Ensure `grade_subjects` has rows for Grade 11 and Grade 12 (core subjects). If 002 only seeds generic subjects, add G11/G12 core subjects (e.g. per DepEd 2026 SHS core list) in a migration or document that the current seed is sufficient.
3. **Cache**
  - Response already uses `Cache-Control: public, s-maxage=300, stale-while-revalidate=600`.  
  - No change needed unless you introduce query params later (e.g. curriculum).

---

## Step 3: Hierarchy UI — Verify and Small Fixes

**Goal:** Class type → SPED path → Level/Strand → Grade → Subject flow is correct; URL, search, and product forms stay in sync with the spec.

1. **Filter sidebar**
  - Already has Class type, Learner path (when SPED), Level (when non-graded), Grade, Strand (when G11/12), Subject from hierarchy.  
  - **Action:** Manually test: SPED → Non-Graded → Level + SPED subject; Regular → G11/12 → Strand → core+specialized subjects. Ensure “Strand required before specialized subjects” (per [LESSON-PLAN-HIERARCHY-SPEC.md](docs/implementationplan/LESSON-PLAN-HIERARCHY-SPEC.md)) is enforced (subject list empty or only core until strand is chosen).
2. **Browse URL and search**
  - Browse builds `queryParams` from all filter keys and replaces the URL; search reads class_type, strand_id, learner_path, sped_level_id and applies `.eq()`.  
  - **Action:** Confirm initial load restores filters from URL (including class_type, strand_id, learner_path, sped_level_id). Parsing already uses `initialFilters[key] = value` for non-array keys; ensure no key is dropped when syncing URL → state.
3. **Product form (new and edit)**
  - New form has class_type, learner_path, sped_level_id, strand_id, hierarchy, validation (strand required for G11/12, level required for SPED non-graded).  
  - **Action:** In [app/shop/products/[id]/edit/page.tsx](app/shop/products/[id]/edit/page.tsx), confirm load fills `class_type`, `learner_path`, `strand_id`, `sped_level_id` from the product, and submit sends them in the request body. Confirm validation rules match the new form (e.g. clearing class_type clears dependent fields).
4. **Filter chips**
  - Chips already show Class type, Path (when SPED), Strand, Level.  
  - No change required unless you want different labels or ordering.
5. **Search API cache key**
  - [app/api/search/route.ts](app/api/search/route.ts) already includes classType, strandId, learnerPath, spedLevelId in the object passed to `generateSearchCacheKey`.  
  - No change required.

---

## Optional: MATATAG vs K–12 in the Config API

If you choose to implement MATATAG vs K–12 (guide Todo 9.4):

1. **Decision:** Resolve “subjects per grade” by curriculum in DB (Option A) or in API/static config (Option B).
2. **If Option B:**
  - Add a TS/JSON map: `(gradeId or gradeName, curriculum) -> subjectIds or subject codes`.  
  - In [app/api/lesson-plan-config/route.ts](app/api/lesson-plan-config/route.ts), when building `subjectsByGrade`, use `curriculum` (from a future query param or from a fixed “current” curriculum) to filter or override the list per grade.  
  - Document the map and where it lives (e.g. [lib/config/lesson-plan-config.ts](lib/config/lesson-plan-config.ts) or a new `lib/config/matatag-k12-subjects.ts`).
3. **If Option A:**
  - Add migration: curriculum-aware table or columns (e.g. `grade_subjects` extended with `curriculum` or a `grade_curriculum_subjects` table).  
  - Seed MATATAG vs K–12 subject sets, then update the config API to join/filter by curriculum.

---

## Checklist for “Phase 2 complete”

- Migration 022 applied; `sped_levels`, `sped_level_id`, nullable `grade_id`, SPED subjects, `strand_subjects` populated.
- All subject codes used in 022’s strand_subjects seed exist in `subjects`; add missing subjects if needed.
- `/api/lesson-plan-config` returns grades, strands, subjectsByGrade, subjectsByStrand, sped levels, spedSubjects; G11/12 core subjects exist in grade_subjects if desired.
- Filter sidebar: Class type → SPED path → Level / Strand → Grade → Subject; SHS specialized subjects only after strand selected.
- Browse: URL and search use class_type, strand_id, learner_path, sped_level_id; filters restore from URL.
- Product new/edit: class_type, learner_path, strand_id, sped_level_id loaded and persisted; validation matches spec.
- Filter chips show Class type, Path, Strand, Level where applicable.
- Search API filters and cache key include class_type, strand_id, learner_path, sped_level_id.
- (Optional) MATATAG vs K–12 subject sets reflected in config API and UI when curriculum is known.

---

## Summary

Phase 2 is **mostly implemented**. The main follow-ups are: **(1)** verify migration 022 runs cleanly and that every subject code in the strand_subjects seed exists in `subjects`; **(2)** ensure G11/G12 core subjects exist in grade_subjects if the design expects them; **(3)** sanity-check edit form load/save and URL restore for Phase 2 fields; **(4)** optionally add MATATAG vs K–12 per the guide. The plan above gives concrete steps and file references for each.