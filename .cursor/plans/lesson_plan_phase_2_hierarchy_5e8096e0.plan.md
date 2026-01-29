---
name: Lesson Plan Phase 2 Hierarchy
overview: "Implement the Lesson Plan Phase 2 hierarchy: Class type (Regular/SPED), SPED paths and levels, SHS strand–subject mapping, and MATATAG vs K–12 handling. Work is split into Migration 022, a new Config API, and Hierarchy UI + search wiring."
todos: []
isProject: false
---

# Lesson Plan Phase 2: Hierarchy Implementation Plan

Implement the Phase 2 lesson-plan hierarchy from [LESSON-PLAN-PHASE-2-IMPLEMENTATION-GUIDE.md](docs/implementationplan/LESSON-PLAN-PHASE-2-IMPLEMENTATION-GUIDE.md): Class type (Regular | SPED), SPED Graded/Non-Graded with levels and subjects, SHS strand-driven subjects for Grade 11/12, and optional MATATAG vs K–12 handling. Execution order: **Migration 022 → Config API → Hierarchy UI and Search**.

---

## Current state (already done)

- **Migration 021** applied: `strands` table and seed data exist; `products` has `curriculum`, `modalities`, `teaching_framework`, `class_type`, `learner_path`, `strand_id`. No `sped_level_id` yet.
- **Filter sidebar** uses weeks 1–9, Language, Modality, Document type, Curriculum; loads grades from [app/api/grades/route.ts](app/api/grades/route.ts) and subjects from [app/api/grades/[gradeId]/subjects/route.ts](app/api/grades/[gradeId]/subjects/route.ts). No Class type, Strand, or SPED path/level.
- **Product form** (new/edit) collects grade_id, subject_id, curriculum, modalities, teaching_framework, weeks; does not collect or persist `class_type`, `learner_path`, `strand_id`.
- **Products API** ([app/api/products/route.ts](app/api/products/route.ts), [app/api/products/[id]/route.ts](app/api/products/[id]/route.ts)) does not persist `class_type`, `learner_path`, `strand_id`.
- **Search API** ([app/api/search/route.ts](app/api/search/route.ts)) does not accept or filter by `class_type`, `strand_id`, `learner_path`, or `sped_level_id`; cache key does not include them.
- **Filter chips** ([components/search/filter-chips.tsx](components/search/filter-chips.tsx)) have no chips for Class type, Strand, or SPED path/level.
- **Browse page** ([app/marketplace/browse/page.tsx](app/marketplace/browse/page.tsx)) passes all `filters` into the URL and to `/api/search`; adding new filter keys will flow through once sidebar and search support them.

---

## Step 1 — Migration 022 (DB)

**File:** `supabase/migrations/022_lesson_plan_hierarchy.sql`

### 1.1 SPED levels (Option A)

- Create table `sped_levels` with `id`, `name`, `sort_order`, `created_at`.
- Seed: `Primary Level`, `Intermediate Level`, `Pre-Vocational Level`, `Transition Program`.
- Add to `products`: `sped_level_id UUID NULL REFERENCES sped_levels(id) ON DELETE SET NULL`.
- Add index: `idx_products_sped_level ON products(sped_level_id) WHERE status = 'published' AND sped_level_id IS NOT NULL`.

### 1.2 SPED subjects

- Add Non-Graded SPED subjects into the existing `subjects` table (by name/code) so products can keep using `subject_id`. Suggested codes/names from the guide: Functional Academics (Math/Reading/Writing), Daily Living Skills, Social-Emotional Skills, Motor Skills, Communication Skills, Vocational/Occupational Skills, Orientation and Mobility, Recreational and Leisure Skills. Use `INSERT ... ON CONFLICT DO NOTHING` if subjects use a unique constraint on `name` or `code`.
- No new `sped_subjects` table: reuse `subjects` and identify “SPED-only” subjects in config/API (e.g. by code prefix or a small lookup set).

### 1.3 Strand–subjects (SHS specialized)

- Create `strand_subjects(strand_id UUID NOT NULL REFERENCES strands(id) ON DELETE CASCADE, subject_id UUID NOT NULL REFERENCES subjects(id) ON DELETE CASCADE, PRIMARY KEY (strand_id, subject_id))`.
- Add indexes: `idx_strand_subjects_strand`, `idx_strand_subjects_subject`.
- Seed specialized subjects per strand using existing strand `code`s (stem, abm, humss, gas, tvl_ict, tvl_he, tvl_ia, tvl_afa, arts_design, sports) and existing `subjects.code`s from [supabase/migrations/002_seed_data.sql](supabase/migrations/002_seed_data.sql) (e.g. PRECALC, BASICALC, GENBIO, … for STEM; FABM, APPECON, … for ABM; etc.). Core subjects for Grade 11/12 stay in `grade_subjects` only; do not remove or change existing `grade_subjects` rows in this migration.

### 1.4 MATATAG vs K–12 (Option B — config-only)

- No DB schema change. Document that “subjects per grade by curriculum” will be handled in the Config API (or in [lib/config/lesson-plan-config.ts](lib/config/lesson-plan-config.ts)) via a mapping `(gradeId or gradeSortOrder, curriculum) → subjectIds`. Optional follow-up can introduce a curriculum-aware table later.

---

## Step 2 — Config API

**Purpose:** Single place for the UI to get class types, grades, strands, subjects-by-grade, subjects-by-strand (G11/12), SPED paths/levels, and SPED subjects.

### 2.1 New route: `GET /api/lesson-plan-config`

**File:** `app/api/lesson-plan-config/route.ts`

- Implement **Option A** from the guide: one route that returns the full hierarchy.
- **Response shape (contract):**
  - `classTypes`: `["regular", "sped"]`
  - `regular`: `{ grades: [{ id, name, sortOrder }], strands: [{ id, name, code }], subjectsByGrade: { [gradeId]: [{ id, name, code }] }, subjectsByStrand: { [strandId]: [{ id, name, code }] } }`
    - `subjectsByGrade`: from `grade_subjects` for each grade.
    - `subjectsByStrand`: from `strand_subjects` for each strand (specialized only). For G11/G12, UI will merge “core for that grade” + “specialized for that strand”.
  - `sped`: `{ paths: ["graded", "non_graded"], levels: [{ id, name, sortOrder }], subjectsByLevel: { [levelId]: [{ id, name, code }] } }` or a single `spedSubjects: [{ id, name, code }]` for Non-Graded (since levels don’t change the subject list in the guide). Prefer the simpler form: `sped.levels` from `sped_levels`, `sped.spedSubjects` as the list of SPED subject rows from `subjects` (those identified by config/code set).
- **Data loading:** Use Supabase client in this route to query `grades`, `strands`, `subjects`, `grade_subjects`, `strand_subjects`, `sped_levels`. Build `subjectsByGrade` and `subjectsByStrand` in code. For “core for G11/G12”, use existing `grade_subjects` ( Grade 11/12 = grades with `name IN ('Grade 11','Grade 12')` or `sort_order IN (12,13)` ).
- **Cache:** `Cache-Control: public, s-maxage=300, stale-while-revalidate=600` (5–10 min).
- **Strands:** Already in DB from 021; no new strands API needed if this route returns them under `regular.strands`.

### 2.2 Optional: extend grades/subjects APIs (Option B)

- If you prefer not to add a new route: extend [app/api/grades/route.ts](app/api/grades/route.ts) with optional `class_type=sped` and return SPED levels or a distinct list when requested; extend [app/api/grades/[gradeId]/subjects/route.ts](app/api/grades/[gradeId]/subjects/route.ts) with optional `strand_id` and, for G11/12 + `strand_id`, return core (from `grade_subjects`) + specialized (from `strand_subjects`). The guide allows either; the plan assumes **Option A** (single hierarchy endpoint) for clarity and fewer round-trips from the UI.

### 2.3 Document contract

- When `class_type=regular` and grade is 11 or 12: client must send `strand_id`; subject list = core for that grade + `subjectsByStrand[strand_id]`.
- When `class_type=sped` and `learner_path=graded`: same grade/subject as regular (reuse grades + `subjectsByGrade`).
- When `class_type=sped` and `learner_path=non_graded`: product uses `sped_level_id` and a subject from `sped.spedSubjects` (stored in `subject_id`).

---

## Step 3 — Hierarchy UI and Search

### 3.1 Config constants

- In [lib/config/lesson-plan-config.ts](lib/config/lesson-plan-config.ts), add:
  - `CLASS_TYPES = [{ value: 'regular', label: 'Regular' }, { value: 'sped', label: 'SPED' }]`
  - `LEARNER_PATHS = [{ value: 'graded', label: 'Graded (Inclusive)' }, { value: 'non_graded', label: 'Non-Graded (Transition)' }]`
- Use these in filter sidebar and product form for labels/values.

### 3.2 Filter sidebar ([components/products/filter-sidebar.tsx](components/products/filter-sidebar.tsx))

- **Class type (entry point):** Add at the top, before Product Type: “Class type” with options Regular | SPED. Persist as `class_type`. On change, clear `learner_path`, `strand_id`, `sped_level_id` and, if switching to regular, clear any SPED-specific state; when switching to SPED, keep or reset grade/subject depending on path.
- **When class_type = SPED:** Show “Learner path”: Graded (Inclusive) | Non-Graded (Transition). Persist as `learner_path`. If Non-Graded, show “Level” (dropdown from config API `sped.levels`) and “Subject” (from `sped.spedSubjects`). Persist `sped_level_id` and `subject_id`. If Graded, show same Grade + Subject as Regular (use grades + subjectsByGrade from config).
- **When class_type = Regular:** Keep current Grade + Subject flow. When selected grade is Grade 11 or 12 (derive from config `regular.grades` by name), show “Strand” (from `regular.strands`). Persist `strand_id`. Subject list = core for that grade + specialized for that strand (from config API).
- **Data source:** Replace “fetch /api/grades + /api/grades/:id/subjects” with a single fetch to `GET /api/lesson-plan-config`, then derive grades, strands, subjectsByGrade, subjectsByStrand, sped.levels, sped.spedSubjects. Optionally keep a fallback to existing grades API for non–lesson-plan product types if needed.
- **Clear rules:** Changing class_type clears learner_path, strand_id, sped_level_id. Changing learner_path from non_graded to graded clears sped_level_id and SPED subject. Changing grade clears subject_id and, if G11/12, strand_id. Changing strand_id (G11/12) refreshes subject list only.

### 3.3 Browse page ([app/marketplace/browse/page.tsx](app/marketplace/browse/page.tsx))

- No structural change. It already sends all entries of `filters` to the URL and to `/api/search`. Ensure the sidebar writes `class_type`, `learner_path`, `strand_id`, `sped_level_id` into the same `filters` object that is passed to `handleFilterChange` and into the search URL. Parsing of `sped_level_id` from URL (and array-style params if any) already follows the same pattern as other keys (see existing handling for `weeks`, `modalities`).

### 3.4 Filter chips ([components/search/filter-chips.tsx](components/search/filter-chips.tsx))

- Add chips for:
  - **class_type:** label “Class type”, value “Regular” or “SPED” from config.
  - **learner_path:** when `class_type === 'sped'`, label “Path”, value “Graded (Inclusive)” or “Non-Graded (Transition)”.
  - **strand_id:** when present, label “Strand”, value from config/API (strand name by id). May need to pass strands from parent or fetch config once.
  - **sped_level_id:** when present, label “Level”, value from config (level name by id).
- For “Subject” when SPED Non-Graded, keep using `subject_id` and resolve name via config’s `spedSubjects` or existing subject lookup.

### 3.5 Product form — New ([app/shop/products/new/page.tsx](app/shop/products/new/page.tsx))

- **Categorization step (Step 2):** Add “Class type” at the top: Regular | SPED. Store in form state as `class_type`.
- **When class_type = SPED:** Show “Learner path”: Graded | Non-Graded. If Non-Graded, show “Level” (required) and “Subject” from SPED subjects; persist `sped_level_id`, `subject_id`, `learner_path = 'non_graded'`. If Graded, show same Grade + Subject as Regular; persist `learner_path = 'graded'`, `grade_id`, `subject_id` (no `sped_level_id`).
- **When class_type = Regular:** Show Grade, then if grade is 11 or 12, show Strand (required), then Subject = core + specialized for that strand. Persist `grade_id`, `strand_id`, `subject_id`.
- **Validation:** For Regular, require grade_id, subject_id; for G11/12 require strand_id. For SPED Graded, require grade_id, subject_id; for SPED Non-Graded require sped_level_id, subject_id from SPED list.
- **Submit payload:** Include `class_type`, `learner_path` (when SPED), `strand_id` (when Regular and G11/12), `sped_level_id` (when SPED Non-Graded), and `grade_id`/`subject_id` as applicable. Ensure product type is still required; for Non-Graded SPED, `grade_id` can be null if the schema allows, or use a placeholder grade—confirm with products table constraints. Migration 022 does not change `products.grade_id` to nullable; so for Non-Graded SPED you may need to either keep a “N/A” grade in the DB or add a migration to make `grade_id` nullable when `class_type=sped` and `learner_path=non_graded`. The guide says “product uses sped_level_id and the chosen SPED subject”; it does not require a grade for Non-Graded. **Decision:** Add in Migration 022: `ALTER TABLE products ALTER COLUMN grade_id DROP NOT NULL` (and keep a CHECK or app logic so that when class_type='regular' or learner_path='graded', grade_id is required). Or keep grade_id required and use a sentinel “Non-Graded” grade — the guide says “products use … sped_level_id … and the chosen SPED subject”. Simplest is: make `grade_id` nullable in 022 and enforce “required when class_type=regular or learner_path=graded” in app/API.
- **Data source:** Fetch hierarchy from `GET /api/lesson-plan-config` once (e.g. in a useEffect), then drive Grade/Strand/Subject/Level/SPED subject options from that.

### 3.6 Product form — Edit ([app/shop/products/[id]/edit/page.tsx](app/shop/products/[id]/edit/page.tsx))

- Mirror the same structure as the new-product form: Class type, SPED path/level, Strand for G11/12, and the same validation and payload. Load existing product’s `class_type`, `learner_path`, `strand_id`, `sped_level_id` into form state and pre-select Level/Strand/Subject accordingly.
- When loading a product that has `class_type`/`learner_path`/`strand_id`/`sped_level_id`, the edit form should fetch config and prefill those fields and the dependent dropdowns (grades/subjects/levels/SPED subjects).

### 3.7 Products API — persistence

- **POST** [app/api/products/route.ts](app/api/products/route.ts): In the `.insert()` payload, add `class_type: body.class_type || null`, `learner_path: body.learner_path || null`, `strand_id: body.strand_id || null`, `sped_level_id: body.sped_level_id || null`. Validation: if `body.class_type === 'sped'` and `body.learner_path === 'non_graded'`, require `body.sped_level_id` and a `body.subject_id` that is in the SPED subject set (or skip server-side check initially and rely on UI). For Regular G11/12, require `body.strand_id` when grade is 11 or 12 (check via grade name/sort_order from DB).
- **PATCH** [app/api/products/[id]/route.ts](app/api/products/[id]/route.ts): In `updateData`, add `if (body.class_type !== undefined) updateData.class_type = body.class_type ?? null`, and similarly for `learner_path`, `strand_id`, `sped_level_id`.

### 3.8 Search API ([app/api/search/route.ts](app/api/search/route.ts))

- **Query params:** Parse `class_type`, `strand_id`, `learner_path`, `sped_level_id` from `searchParams`.
- **Filtering:** 
  - If `class_type` present: `dbQuery = dbQuery.eq('class_type', class_type)`.
  - If `strand_id` present: `dbQuery = dbQuery.eq('strand_id', strand_id)`.
  - If `learner_path` present: `dbQuery = dbQuery.eq('learner_path', learner_path)`.
  - If `sped_level_id` present: `dbQuery = dbQuery.eq('sped_level_id', sped_level_id)`.
- **Cache key:** Add `class_type`, `strand_id`, `learner_path`, `sped_level_id` to the object passed to [lib/cache/search-cache.ts](lib/cache/search-cache.ts) `generateSearchCacheKey` (the route currently builds an object and passes it; add these four keys there).

### 3.9 Search cache key

- Call site is in [app/api/search/route.ts](app/api/search/route.ts). The object passed as the second argument to `generateSearchCacheKey` must include the new params so cache keys reflect them. No change to the signature of `generateSearchCacheKey` is required if it serializes the whole object.

---

## Design choices summary


| Area                         | Choice                                                                              | Rationale                                                                                      |
| ---------------------------- | ----------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| SPED levels                  | New `sped_levels` table + `products.sped_level_id`                                  | Clear schema; easy to filter and display.                                                      |
| SPED subjects                | Rows in existing `subjects` table; “SPED” set defined in config/API                 | Reuse `subject_id` on products; no new FKs.                                                    |
| Strand–subjects              | New `strand_subjects`; core stays in `grade_subjects`                               | Matches guide; config API returns core + specialized per strand for G11/12.                    |
| MATATAG vs K–12              | Config/API-only mapping (no new tables in 022)                                      | Reduces migration scope; can add curriculum-aware tables later.                                |
| Config API                   | New `GET /api/lesson-plan-config` (Option A)                                        | One round-trip for full hierarchy; simpler UI logic.                                           |
| Non-Graded SPED and grade_id | Make `grade_id` nullable in 022; enforce “required when not SPED Non-Graded” in API | Aligns with guide (“product uses sped_level_id and SPED subject”) and avoids a sentinel grade. |


---

## File checklist


| Task                   | File(s)                                                                                                       |
| ---------------------- | ------------------------------------------------------------------------------------------------------------- |
| Migration 022          | `supabase/migrations/022_lesson_plan_hierarchy.sql`                                                           |
| Config API             | `app/api/lesson-plan-config/route.ts`                                                                         |
| Config constants       | `lib/config/lesson-plan-config.ts` (CLASS_TYPES, LEARNER_PATHS)                                               |
| Filter sidebar         | `components/products/filter-sidebar.tsx`                                                                      |
| Filter chips           | `components/search/filter-chips.tsx`                                                                          |
| Product form new       | `app/shop/products/new/page.tsx`                                                                              |
| Product form edit      | `app/shop/products/[id]/edit/page.tsx`                                                                        |
| Products API POST      | `app/api/products/route.ts`                                                                                   |
| Products API PATCH     | `app/api/products/[id]/route.ts`                                                                              |
| Search API + cache key | `app/api/search/route.ts`                                                                                     |
| Browse page            | `app/marketplace/browse/page.tsx` (only if extra parsing for new params is needed; current logic may suffice) |


---

## Order of implementation

1. **Migration 022** — Create and apply `022_lesson_plan_hierarchy.sql` (SPED levels, `sped_level_id`, `strand_subjects` seed, optional `grade_id` nullable).
2. **Config API** — Implement `GET /api/lesson-plan-config` and constants in `lesson-plan-config.ts`.
3. **Products API** — Add persistence of `class_type`, `learner_path`, `strand_id`, `sped_level_id` in POST and PATCH.
4. **Search API** — Add params, filters, and cache-key entries for `class_type`, `strand_id`, `learner_path`, `sped_level_id`.
5. **Filter sidebar** — Class type, SPED path/level, Strand for G11/12, wired to config API.
6. **Filter chips** — Chips for Class type, Strand, Path, Level.
7. **Product form (new then edit)** — Class type, conditional Grade/Strand/Level/Subject and validation, wired to config API and APIs that persist new fields.

After implementation, run through: filter by Class type and Strand/Level; create/edit a Regular G11/12 product with strand; create/edit a SPED Non-Graded product with level and SPED subject; and verify search results and chips reflect the new filters.