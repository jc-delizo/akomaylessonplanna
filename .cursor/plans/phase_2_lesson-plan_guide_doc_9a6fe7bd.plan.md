---
name: Phase 2 lesson-plan guide doc
overview: Add a single Phase 2 implementation guide under docs/implementationplan/ that describes the three remaining todos (migration-022, config-api, hierarchy-ui), the order to implement them, and the files/APIs to change, so a future dev can implement the lesson-plan hierarchy (Regular/SPED, SHS strands, MATATAG subjects) without re-deriving the design.
todos:
  - id: create-doc
    content: Create docs/implementationplan/LESSON-PLAN-PHASE-2-IMPLEMENTATION-GUIDE.md with title, prerequisites, and references
    status: completed
  - id: section-migration-022
    content: "Write Todo 9 (migration 022) section: SPED levels/subjects, strand_subjects, MATATAG vs K-12 schema and seed data"
    status: completed
  - id: section-config-api
    content: "Write Todo 10 (config API) section: route options, query params, and response shape for hierarchy"
    status: completed
  - id: section-hierarchy-ui
    content: "Write Todo 11 (hierarchy UI) section: class type entry, SHS strand, SPED paths, and files to touch"
    status: completed
  - id: section-order-and-summary
    content: Write implementation order (9 then 10 then 11) and short summary
    status: completed
isProject: false
---

# Phase 2 Lesson-Plan Hierarchy – Implementation Guide (Doc Only)

## Goal

Add one markdown file that serves as the **Phase 2 implementation guide**: what to build, in what order, and which files/APIs to touch. No code or migrations yet—documentation only.

## Where to put it

**File:** [docs/implementationplan/LESSON-PLAN-PHASE-2-IMPLEMENTATION-GUIDE.md](docs/implementationplan/LESSON-PLAN-PHASE-2-IMPLEMENTATION-GUIDE.md)

Rationale: [docs/implementationplan/](docs/implementationplan/) is the project’s authoritative location for setup and implementation docs (see [IMPLEMENTATION-STATUS.md](IMPLEMENTATION-STATUS.md): “Reference correct documentation … use docs/implementationplan/”).

## What the guide will contain

### 1. Title and prerequisites

- Short title: “Lesson-Plan Phase 2: Hierarchy (Regular/SPED, SHS, MATATAG)”
- Prerequisites: Phase 1 done (migration 021 applied, filter sidebar/chips/product form and search API updated).
- Pointers: [lib/config/lesson-plan-config.ts](lib/config/lesson-plan-config.ts) for options; the lesson-plan plan/spec (or the user’s hierarchy JSON) for subject lists, SPED levels, and strand–subject mapping.

### 2. Todo 9: Migration 022 (DB)

- **Purpose:** Add schema and seed data for SPED levels/subjects, SHS strand–subject mapping, and MATATAG vs K–12 subject sets per grade.
- **Deliverables:**
  - New migration file: `022_lesson_plan_hierarchy.sql` (or similar).
  - **SPED:** Either a `sped_levels` table (e.g. Primary, Intermediate, Pre-Vocational, Transition) with `sped_level_id` on `products`, or reuse/adapt `grades` for “levels”; a way to link SPED subjects (e.g. `sped_subjects` or subject tags). List the exact level names and SPED subject names from the hierarchy JSON/spec.
  - **Strand–subjects:** `strand_subjects(strand_id, subject_id)` and seed rows so each SHS strand has its specialized subjects; document that “core” subjects stay in `grade_subjects` for grades 11/12.
  - **MATATAG vs K–12:** Describe how subjects differ by grade in 2026 (which grades use MATATAG vs legacy). Optionally a `curriculum_id` or subject metadata; or document “subject list per grade comes from config/API, not new tables” if the guide chooses config-only.
- **Order:** Implement this todo first; the config API and UI will depend on these tables/fields.

### 3. Todo 10: Config API

- **Purpose:** Expose hierarchy so the filter UI and product form can show the right grades/subjects/strands/SPED levels.
- **Deliverables:**
  - **Option A:** New route `GET /api/lesson-plan-config` (or `/api/lesson-plan/hierarchy`) that returns a JSON shape such as:
    - `classTypes`: `["regular","sped"]`
    - `regular`: `{ grades: [...], strands (for grade 11/12), subjectsByGrade: {...}, subjectsByStrand: {...} }`
    - `sped`: `{ paths: ["graded","non_graded"], levels (non-graded), subjectsByPath/ByLevel }`
  - **Option B:** Extend [app/api/grades/route.ts](app/api/grades/route.ts) and [app/api/grades/[gradeId]/subjects/route.ts](app/api/grades/[gradeId]/subjects/route.ts) with optional `class_type`, `strand_id`, and `learner_path` (SPED) query params and document the response shape for each.
- **Contract:** Document the exact query params and response shape the UI will use (e.g. “when `class_type=regular` and `grade=11`, require `strand_id` and return core + specialized subjects for that strand”).
- **Order:** Implement after migration 022, before UI changes.

### 4. Todo 11: Hierarchy UI

- **Purpose:** Filter sidebar and product form (new + edit) support Class type, SPED paths/levels, and SHS strand-driven subjects.
- **Deliverables:**
  - **Entry point:** “Class type” (or “Learner type”) at top of filter sidebar and of product form: Regular vs SPED. Persist/use `class_type` in filters and `products.class_type`.
  - **Regular + SHS:** When grade is 11 or 12, require “Strand”; subject list = core + specialized for that strand. Use config API (or extended grades API). Products: `strand_id` and subject from strand-aware list.
  - **SPED:** When class type is SPED, show “Graded (Inclusive)” vs “Non-Graded (Transition).” Graded: use normal grade/subject list plus IEP flag. Non-Graded: show “levels” (Primary, Intermediate, Pre-Vocational, Transition) and SPED subjects; document `learner_path` and, if used, `sped_level_id` (or equivalent).
  - **Files to touch:** [components/products/filter-sidebar.tsx](components/products/filter-sidebar.tsx), [app/marketplace/browse/page.tsx](app/marketplace/browse/page.tsx), [components/search/filter-chips.tsx](components/search/filter-chips.tsx), [app/shop/products/new/page.tsx](app/shop/products/new/page.tsx), [app/shop/products/[id]/edit/page.tsx](app/shop/products/[id]/edit/page.tsx); [app/api/search/route.ts](app/api/search/route.ts) for `class_type`, `strand_id`, and SPED params.
- **Order:** Implement last, after the config API returns the new structure.

### 5. Implementation order

- **Step 1:** Migration 022 (DB for SPED, strand_subjects, MATATAG vs K–12 subject data).
- **Step 2:** Config API (or extended grades API) that returns hierarchy by `class_type` / `strand_id` / SPED path.
- **Step 3:** Hierarchy UI in filter sidebar and product form, plus search API support for `class_type`/`strand_id`/SPED.

### 6. References

- Link or summarize the “Final filter design” and hierarchy (Regular vs SPED, Graded vs Non-Graded, SHS strands) from the original lesson-plan discussion so the guide is self-contained.
- Reference [lib/config/lesson-plan-config.ts](lib/config/lesson-plan-config.ts) and, if it exists, any `lesson-plan-hierarchy.json` or spec doc for subject lists, levels, and strand names.

## Plan summary

- **Single artifact:** Create [docs/implementationplan/LESSON-PLAN-PHASE-2-IMPLEMENTATION-GUIDE.md](docs/implementationplan/LESSON-PLAN-PHASE-2-IMPLEMENTATION-GUIDE.md).
- **Sections:** Prerequisites; Todo 9 (migration 022) with concrete schema/data bullets; Todo 10 (config API) with route and contract; Todo 11 (hierarchy UI) with entry point, Regular/SHS, and SPED behavior; implementation order (9 → 10 → 11); references.
- **Tone:** Actionable “what to build and in what order,” not full pseudocode—enough for a developer to implement Phase 2 without re-reading the full lesson-plan thread.
- **No code or migrations in this task:** This plan is only for writing the guide document.
