---
name: Phase 2 Implementation
overview: "Execute the Phase 2 Implementation Plan: verify Migration 022 and subject-code coverage, add config API contract documentation, and confirm hierarchy UI (filter sidebar, browse URL, product forms) and search/APIs match the spec. No MATATAG vs K–12 work in scope unless you opt in."
todos: []
isProject: false
---

# Phase 2 Implementation Plan — Execution

This plan implements the steps in [phase_2_implementation_plan_8916d1c1.plan.md](c:\Users\odvip.cursor\plans\phase_2_implementation_plan_8916d1c1.plan.md) and aligns with [LESSON-PLAN-PHASE-2-IMPLEMENTATION-GUIDE.md](docs/implementationplan/LESSON-PLAN-PHASE-2-IMPLEMENTATION-GUIDE.md). Phase 2 is largely done; the work is verification, one documentation change, and optional robustness.

---

## Step 1: Migration 022 — Verify and Fix Gaps

**Goal:** Ensure the DB has SPED levels, SPED subjects, `strand_subjects`, nullable `grade_id`, and that every subject code used in 022’s `strand_subjects` seed exists in `subjects`.

### 1.1 Apply migration 022 (if not already applied)

- Ensure [021_lesson_plan_filters_and_strands.sql](supabase/migrations/021_lesson_plan_filters_and_strands.sql) is applied first (defines `strands` and product columns).
- Apply [022_lesson_plan_hierarchy.sql](supabase/migrations/022_lesson_plan_hierarchy.sql) in the target environment (e.g. `supabase db push` or your normal migration path).
- If you use the Supabase MCP, run the migration via the appropriate MCP tool after confirming the tool schema.

### 1.2 Confirm strand_subjects subject codes exist

022 seeds `strand_subjects` by joining on subject **codes**. All codes referenced in 022 are already present in [002_seed_data.sql](supabase/migrations/002_seed_data.sql):


| 022 strand blocks              | Subject codes used                                                          |
| ------------------------------ | --------------------------------------------------------------------------- |
| STEM                           | PRECALC, BASICALC, GENBIO, GENCHEM, GENPHYS, DRRR, EMPTECH, ENTREP, WORKIMM |
| ABM                            | FABM, APPECON, ORG, BUSMATH, BUSFIN, POM, ENTREP, WORKIMM                   |
| HUMSS                          | UCSP, MIL, CPAR, LIT, HIST                                                  |
| GAS                            | PERDEV, ENTREP, MIL, UCSP                                                   |
| TVL-* / Arts & Design / Sports | EMPTECH, COMP, ENTREP, TLE, CPAR, LIT, PE, HEALTH                           |


**Action:** No missing subjects were found. Optional safeguard: add a one-off SQL script or migration step that `SELECT`s these codes from `subjects` and fails/errors if any are missing, or run that query manually once after applying 022. Do **not** change 022’s seed logic unless a future run reveals a missing code.

### 1.3 G11/G12 core subjects

[002_seed_data.sql](supabase/migrations/002_seed_data.sql) already seeds `grade_subjects` for Grade 11 and 12 with core and track-specific subjects (lines 107–175). No migration change needed.

---

## Step 2: Config API — Contract and Cache

**Goal:** Keep `/api/lesson-plan-config` as the single hierarchy source, document its response shape and the SHS rule, and leave cache as-is.

### 2.1 Document response shape and SHS rule

In [app/api/lesson-plan-config/route.ts](app/api/lesson-plan-config/route.ts):

- At the top (after or within the existing block comment), add a short description of the **response shape** and a pointer to the spec:
  - `classTypes`, `regular.{ grades, strands, subjectsByGrade, subjectsByStrand }`, `sped.{ paths, levels, spedSubjects }`.
  - State that **SHS specialized subjects are only valid after a strand is selected** and reference [docs/implementationplan/LESSON-PLAN-HIERARCHY-SPEC.md](docs/implementationplan/LESSON-PLAN-HIERARCHY-SPEC.md).

No change to runtime behavior or cache.

### 2.2 Cache

Existing `Cache-Control: public, s-maxage=300, stale-while-revalidate=600` is sufficient. No change.

---

## Step 3: Hierarchy UI — Verify and Small Fixes

**Goal:** Confirm Class type → SPED path → Level/Strand → Grade → Subject flow, URL restore, and product form load/save match the spec.

### 3.1 Filter sidebar

- **Behavior (already implemented):** Class type, Learner path (SPED), Level (SPED non-graded), Grade, Strand (G11/12), Subject from hierarchy; `updateFilter` clears dependent fields when `class_type` or `learner_path` changes ([components/products/filter-sidebar.tsx](components/products/filter-sidebar.tsx) lines 117–146).
- **Verification:** Manually test (or add a short QA checklist):
  - SPED → Non-Graded → Level + SPED subject.
  - Regular → Grade 11/12 → Strand → core + specialized subjects; confirm specialized subjects only appear after strand is chosen (per [LESSON-PLAN-HIERARCHY-SPEC.md](docs/implementationplan/LESSON-PLAN-HIERARCHY-SPEC.md)).

### 3.2 Browse URL and search

- **Behavior:** [app/marketplace/browse/page.tsx](app/marketplace/browse/page.tsx) builds `initialFilters` from `searchParams.forEach` (lines 54–62) and writes all filter keys into the URL via `queryParams` (93–100). Non-array keys (including `class_type`, `strand_id`, `learner_path`, `sped_level_id`) are restored as-is.
- **Verification:** Load browse with `?class_type=sped&learner_path=non_graded&sped_level_id=<id>` (and similarly for `class_type=regular&grade_id=…&strand_id=…`) and confirm filters and results match. Confirm search API receives these params (see 3.4).

### 3.3 Product form (new and edit)

- **Edit form:** [app/shop/products/[id]/edit/page.tsx](app/shop/products/[id]/edit/page.tsx) loads `class_type`, `learner_path`, `strand_id`, `sped_level_id` from the product (136–146) and submits them in the PUT body (265–268). Clearing class_type clears dependent fields (419–425). Validation requires strand for G11/12 and level for SPED non-graded (233–237).
- **Products PUT:** [app/api/products/[id]/route.ts](app/api/products/[id]/route.ts) persists `class_type`, `learner_path`, `strand_id`, `sped_level_id` (239–242).
- **Verification:** Open edit for a product that has `class_type`/`strand_id`/`learner_path`/`sped_level_id` set; confirm form shows them and that saving preserves them. Confirm clearing class_type clears dependents and that validation messages match the spec.

### 3.4 Search API and filter chips

- [app/api/search/route.ts](app/api/search/route.ts): Confirmed it reads and filters by `class_type`, `strand_id`, `learner_path`, `sped_level_id` and includes them in the cache key. No code change needed.
- [components/search/filter-chips.tsx](components/search/filter-chips.tsx): Chips for Class type, Path, Strand, Level are already in place. No change unless you want different labels or order.

---

## Optional: MATATAG vs K–12 (Todo 9.4)

The plan and guide call out MATATAG vs K–12 subject sets by grade. **Out of scope** unless you explicitly add it. If you do:

- Choose Option A (DB: curriculum-aware `grade_subjects` or parallel table) or Option B (API/static map: grade + curriculum → subject ids).
- Implement per the “Optional: MATATAG vs K–12 in the Config API” section of the Phase 2 plan and document in the Phase 2 guide.

---

## Checklist for “Phase 2 complete”

- Migration 022 applied; `sped_levels`, `sped_level_id`, nullable `grade_id`, SPED subjects, `strand_subjects` present.
- All subject codes used in 022’s strand_subjects seed exist in `subjects` (verified from 002; optional runtime check).
- `/api/lesson-plan-config` documents response shape and references LESSON-PLAN-HIERARCHY-SPEC.md for the SHS rule.
- Filter sidebar: Class type → SPED path → Level / Strand → Grade → Subject; SHS specialized subjects only after strand (verified manually or via checklist).
- Browse: URL and search use `class_type`, `strand_id`, `learner_path`, `sped_level_id`; filters restore from URL (verified).
- Product new/edit: hierarchy fields loaded and persisted; validation and clearing behavior match spec (verified).
- Filter chips and search API already include hierarchy params; no code change required.

---

## Summary

**Code changes:** Only the config API comment/type describing the response shape and the SHS rule + link to LESSON-PLAN-HIERARCHY-SPEC.md in [app/api/lesson-plan-config/route.ts](app/api/lesson-plan-config/route.ts).

**Procedural work:** Apply 022 if needed; optionally run a subject-code existence check; run the verification steps above (filter sidebar, browse URL restore, edit-form load/save, and search params). MATATAG vs K–12 is deferred unless you decide to implement it.