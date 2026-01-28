# Lesson-Plan Phase 2: Hierarchy (Regular/SPED, SHS, MATATAG)

This guide describes how to implement the **Phase 2** lesson-plan hierarchy: Class type (Regular vs SPED), SHS strands and strand-based subjects, SPED Graded/Non-Graded paths and levels, and MATATAG vs K–12 subject sets. Phase 1 (filters, weeks 1–9, modalities, curriculum, language, document type, product form fields) is already done.

---

## Prerequisites

Before starting Phase 2, ensure:

- **Migration 021** has been applied: `strands` table exists, `products` has `curriculum`, `modalities`, `teaching_framework`, `class_type`, `learner_path`, `strand_id`, and the weeks 1–9 trigger is in place.
- **Filter sidebar** uses weeks 1–9, Language (12 options), Modality (multiselect), Document type, and Curriculum from [lib/config/lesson-plan-config.ts](../../lib/config/lesson-plan-config.ts).
- **Search API** supports `weeks`, `modalities`, `curriculum`, `document_type` (or `specific_type`), and `language`.
- **Product form** (new and edit) collects Language, Curriculum, Modality, Teaching framework, and weeks 1–9; **Products API** persists them.

---

## References

- **Canonical rules and invariants:** [LESSON-PLAN-HIERARCHY-SPEC.md](LESSON-PLAN-HIERARCHY-SPEC.md) — selection rules, SHS "must never" rule, Kindergarten domains, strand naming.
- **Filter options and constants:** [lib/config/lesson-plan-config.ts](../../lib/config/lesson-plan-config.ts) — modalities, languages, curricula, document types, weeks 1–9, teaching frameworks.
- **Final filter design (summary):** Entry point is **Class type** (Regular / SPED). Under Regular: Grade → Subject (per grade); for Grade 11/12, **Strand** is required, then subjects = core + specialized for that strand. Under SPED: **Graded (Inclusive)** uses the same grade/subject map with an IEP flag; **Non-Graded (Transition)** uses levels (Primary, Intermediate, Pre-Vocational, Transition Program) and a separate SPED subject list.
- **Hierarchy source:** The design comes from a DepEd-aligned lesson-plan hierarchy (Regular Class vs SPED Class; Graded vs Non-Graded under SPED; SHS 2026 strands and core/specialized subjects). If a `lesson-plan-hierarchy.json` or similar spec exists in the repo or in planning docs, use it for exact subject names, level names, and strand–subject mappings.

---

## Todo 9: Migration 022 (DB)

**Purpose:** Add schema and seed data for SPED levels/subjects, SHS strand–subject mapping, and (optionally) MATATAG vs K–12 subject sets per grade.

**Order:** Do this first. The config API and UI depend on these tables and columns.

### Deliverables

1. **New migration file:** `022_lesson_plan_hierarchy.sql` (or similar) under [supabase/migrations/](../../supabase/migrations/).

2. **SPED:**
   - **Option A:** Create `sped_levels` with rows: `Primary Level`, `Intermediate Level`, `Pre-Vocational Level`, `Transition Program`. Add `sped_level_id UUID NULL REFERENCES sped_levels(id)` to `products`. Use when `class_type = 'sped'` and `learner_path = 'non_graded'`.
   - **Option B:** Reuse or extend `grades` to represent “levels” for Non-Graded SPED (e.g. synthetic grade rows or a `type` column). Document the convention.
   - **SPED subjects:** Either a `sped_subjects` table (e.g. id, name, code) and a link from products (e.g. subject_id when class_type=sped and learner_path=non_graded), or store SPED subject names in config/API only and keep products using a generic “SPED subject” concept. From the hierarchy spec, Non-Graded SPED subjects include: Functional Academics (Math, Reading, Writing), Daily Living Skills, Social-Emotional Skills, Motor Skills, Communication Skills, Vocational/Occupational Skills, Orientation and Mobility, Recreational and Leisure Skills.
   - **Exceptionalities** (ASD, Intellectual Disability, etc.) can be Phase 2.1 or a separate field; document if you add them.

3. **Strand–subjects:**
   - Create `strand_subjects(strand_id UUID REFERENCES strands(id), subject_id UUID REFERENCES subjects(id), PRIMARY KEY (strand_id, subject_id))`.
   - Seed rows so each SHS strand (STEM, ABM, HUMSS, GAS, TVL-ICT, TVL-HE, TVL-IA, TVL-AFA, Arts & Design, Sports) has its **specialized** subjects. Core subjects for Grade 11/12 remain in `grade_subjects`; the config API will return “core + strand_specialized” for a given strand.
   - Ensure `subjects` has the SHS specialized subjects (or add them in this migration) and that they are referenced in `strand_subjects`.

4. **MATATAG vs K–12:**
   - In 2026, MATATAG applies to Grades 1, 2, 4, 5, 7, 8; legacy K–12 applies to 3, 6, 9, 10. Subject lists differ (e.g. Grades 1–2 use “Language” and “Reading and Literacy” instead of “English” and “Filipino”).
   - **Option A:** Add a `curriculum_id` or `curriculum`-aware view and seed/update `grade_subjects` (or a parallel table) so “subjects per grade” can vary by curriculum. The config API then returns the correct list per grade using `curriculum`.
   - **Option B:** Keep a single `grade_subjects` and implement “MATATAG vs K–12” entirely in the config API / static config (e.g. a JSON or TS structure that maps grade + curriculum → subject names/codes). The API resolves these to `subject_id`s when needed.

---

## Todo 10: Config API

**Purpose:** Expose the hierarchy so the filter UI and product form can show the right grades, subjects, strands, and SPED levels/subjects.

**Order:** After migration 022, before UI changes.

### Deliverables

1. **Option A — New route:** `GET /api/lesson-plan-config` (or `GET /api/lesson-plan/hierarchy`).
   - Response shape (conceptual):
     - `classTypes`: `["regular", "sped"]`
     - `regular`: `{ grades: [{ id, name, sortOrder }], strands: [{ id, name, code }] (for grade 11/12), subjectsByGrade: { [gradeId]: [{ id, name, code }] }, subjectsByStrand: { [strandId]: [{ id, name, code }] } }`  
       For Grade 11/12, subjects = core (from grade_subjects) + specialized (from strand_subjects).
     - `sped`: `{ paths: ["graded", "non_graded"], levels: [{ id, name }] (for non_graded), subjectsByLevelOrPath: ... }`  
       Graded reuses regular grade/subject; Non-Graded returns levels and SPED subjects.
   - Cache with appropriate `Cache-Control` (e.g. 5–10 minutes) since hierarchy changes rarely.

2. **Option B — Extend grades API:**
   - [app/api/grades/route.ts](../../app/api/grades/route.ts): Add optional query param `class_type`; when `class_type=sped`, return SPED levels or a distinct list instead of (or in addition to) K–12 grades when useful.
   - [app/api/grades/[gradeId]/subjects/route.ts](../../app/api/grades/[gradeId]/subjects/route.ts): Add optional `strand_id`. When `gradeId` is Grade 11 or 12 and `strand_id` is present, return core subjects for that grade plus specialized subjects for that strand (join `grade_subjects` and `strand_subjects`). When `class_type=sped` and `learner_path=non_graded`, support a “level” or similar key and return SPED subjects for that context.

3. **Contract to document (and implement):**
   - When `class_type=regular` and grade is 11 or 12: client must send `strand_id`; API returns core + specialized subjects for that strand. See [LESSON-PLAN-HIERARCHY-SPEC.md](LESSON-PLAN-HIERARCHY-SPEC.md): SHS specialized subjects only after strand is selected.
   - When `class_type=sped` and `learner_path=graded`: use the same grade/subject contract as regular (optionally with an `is_iep` hint in product).
   - When `class_type=sped` and `learner_path=non_graded`: API returns levels and SPED subjects; product uses `sped_level_id` (or equivalent) and a subject from the SPED list.

---

## Todo 11: Hierarchy UI

**Purpose:** Filter sidebar and product form (new + edit) support Class type, SPED paths/levels, and SHS strand-driven subjects. Search API supports the new filters.

**Order:** Last. Implement after the config API returns the new structure.

### Deliverables

1. **Entry point — Class type:**
   - Add “Class type” (or “Learner type”) at the top of the filter sidebar and of the product form: **Regular** | **SPED**.
   - Persist in filters as `class_type`; persist in products as `products.class_type` (already added in migration 021).
   - When “SPED” is chosen, show the next choice: **Graded (Inclusive)** vs **Non-Graded (Transition)**; store as `learner_path` in products and in filters if needed.

2. **Regular + SHS (Grade 11/12):**
   - When class type is Regular and grade is 11 or 12, require **Strand** (dropdown or buttons). Load strands from config API or from existing strands table/API.
   - Subject list = core + specialized for the selected strand. Use the config API (Option A) or the extended grades API with `strand_id` (Option B). See [LESSON-PLAN-HIERARCHY-SPEC.md](LESSON-PLAN-HIERARCHY-SPEC.md): SHS specialized subjects only after strand is selected.
   - In the product form, when saving a Grade 11/12 product, set `strand_id` and `subject_id` from the strand-aware subject list.

3. **SPED:**
   - **Graded (Inclusive):** Use the same grade and subject options as Regular; products use standard `grade_id` and `subject_id`. Optionally set an IEP-related flag or metadata (e.g. a tag or `learner_path = 'graded'`).
   - **Non-Graded (Transition):** Show “Level” (Primary, Intermediate, Pre-Vocational, Transition Program) and “Subject” from the SPED subject list. Persist `learner_path = 'non_graded'`, `sped_level_id` (if you added it), and the chosen SPED subject (via `subject_id` if SPED subjects live in `subjects`, or a dedicated field if not).

4. **Files to touch:**
   - [components/products/filter-sidebar.tsx](../../components/products/filter-sidebar.tsx) — Class type, Graded/Non-Graded for SPED, Strand for G11/12, and subject list driven by config API.
   - [app/marketplace/browse/page.tsx](../../app/marketplace/browse/page.tsx) — Pass `class_type`, `strand_id`, `learner_path` (and `sped_level_id` if used) in URL and to search.
   - [components/search/filter-chips.tsx](../../components/search/filter-chips.tsx) — Chips for Class type, Strand (when applicable), and SPED path/level.
   - [app/shop/products/new/page.tsx](../../app/shop/products/new/page.tsx) and [app/shop/products/[id]/edit/page.tsx](../../app/shop/products/[id]/edit/page.tsx) — Class type at top; conditional Strand (G11/12) and SPED path/level/subject; call config API for options; persist `class_type`, `learner_path`, `strand_id`, and SPED fields.
   - [app/api/search/route.ts](../../app/api/search/route.ts) — Accept `class_type`, `strand_id`, `learner_path`, and (if applicable) `sped_level_id`; filter products accordingly. Update cache key to include these params.

---

## Todo 12: Phase B — Subject Multiselect

**Purpose:** Implement subject multiselect so products and filters can use multiple subjects (integrated/interdisciplinary teaching). [LESSON-PLAN-HIERARCHY-SPEC.md](LESSON-PLAN-HIERARCHY-SPEC.md) and [lesson-plan-config.ts](../../lib/config/lesson-plan-config.ts) already declare `SUBJECT_SELECTION === 'multi'`; this todo is the implementation.

**Order:** After Todo 11 (Hierarchy UI). Phase B depends on hierarchy (grade/strand/SPED-aware subject lists) being in place.

### Deliverables

1. **Migration 023 — product_subjects M:N**
   - New table: `product_subjects(product_id, subject_id, sort_order)` with PK `(product_id, subject_id)`, FKs to `products` and `subjects`.
   - Backfill: `INSERT INTO product_subjects (product_id, subject_id, sort_order) SELECT id, subject_id, 0 FROM products WHERE subject_id IS NOT NULL`.
   - Keep `products.subject_id` as the primary subject for backward compatibility; set it to the first of the selected subjects when writing.

2. **Products API**
   - **POST /api/products:** Accept `subject_ids` (array) or legacy `subject_id`. Require at least one subject. Insert into `product_subjects` and set `products.subject_id = subject_ids[0]`.
   - **GET /api/products** (list) and **GET /api/products/[id]:** Return `subject_ids` from `product_subjects` (and keep `subject` for backward compatibility).
   - **PUT /api/products/[id]:** Accept `subject_ids`; replace `product_subjects` rows for that product and set `products.subject_id = subject_ids[0]`.

3. **Search API**
   - Accept `subject_ids` (comma-separated) or legacy `subject_id`. Filter products where `id` is in (product_ids from `product_subjects` where `subject_id` in the given ids) or `products.subject_id` in the given ids. Include `subjectIds` in the cache key.

4. **Product forms (new and edit)**
   - Use multiselect (e.g. checkboxes) for subjects; form state includes `subject_ids: string[]` and `subject_id` (primary/first). Validation: at least one subject. Submit sends `subject_ids`. When hierarchy changes (class_type, grade_id, strand_id, learner_path), clear `subject_ids` and `subject_id`. Use `SUBJECT_SELECTION` from [lesson-plan-config.ts](../../lib/config/lesson-plan-config.ts) in labels if desired.

5. **Filter sidebar and browse**
   - Filter sidebar: subject filter is multiselect (e.g. checkboxes); state uses `filters.subject_ids` (array) and `filters.subject_id` (first). When class_type, grade_id, strand_id, or learner_path changes, clear subject_ids/subject_id.
   - Browse: parse `subject_ids` from URL as array (comma-separated); include `subject_ids` in query params to search; when removing the subject chip, clear both `subject_ids` and `subject_id`.

6. **Filter chips**
   - When `filters.subject_ids` or `filters.subject_id` is set, show a chip (e.g. key `subject_ids`, label "Subject(s)", value = resolved subject names joined). On remove, clear `subject_ids` and `subject_id`.

7. **Config**
   - Ensure UI and validation reference `SUBJECT_SELECTION === 'multi'` from [lesson-plan-config.ts](../../lib/config/lesson-plan-config.ts) where relevant (e.g. labels, invariants).

**Files to touch:**  
[supabase/migrations/](../../supabase/migrations/) (new `023_*.sql`), [app/api/products/route.ts](../../app/api/products/route.ts), [app/api/products/[id]/route.ts](../../app/api/products/[id]/route.ts), [app/api/search/route.ts](../../app/api/search/route.ts), [app/shop/products/new/page.tsx](../../app/shop/products/new/page.tsx), [app/shop/products/[id]/edit/page.tsx](../../app/shop/products/[id]/edit/page.tsx), [components/products/filter-sidebar.tsx](../../components/products/filter-sidebar.tsx), [app/marketplace/browse/page.tsx](../../app/marketplace/browse/page.tsx), [components/search/filter-chips.tsx](../../components/search/filter-chips.tsx), [lib/config/lesson-plan-config.ts](../../lib/config/lesson-plan-config.ts).

---

## Implementation Order

Execute in this order:

1. **Step 1 — Migration 022:** Add SPED levels (or convention), SPED subjects (or mapping), `strand_subjects` and seed data, and any MATATAG vs K–12 subject structure you choose. Run the migration.
2. **Step 2 — Config API:** Implement either `GET /api/lesson-plan-config` or extend the grades/subjects APIs with `class_type`, `strand_id`, and SPED params. Document and stabilize the response shape the UI will use.
3. **Step 3 — Hierarchy UI:** Add Class type and branching in the filter sidebar and product form; wire subject/strand/level options to the config API; add search API params and filters; add filter chips for the new dimensions.
4. **Step 4 — Phase B (Subject multiselect):** Run migration 023; update Products API and Search API for `subject_ids`; add subject multiselect in product forms, filter sidebar, browse, and filter chips; use `SUBJECT_SELECTION` in UI as in Todo 12.

---

## Summary

Phase 2 adds **Class type (Regular | SPED)** and, for SPED, **Graded vs Non-Graded** with levels and SPED subjects; for Regular Grade 11/12, **Strand** and strand-based subjects. The DB migration supplies tables and seed data; the config API exposes the hierarchy; the UI and search API consume it. Implement in the order: migration 022 → config API → hierarchy UI and search params. Phase 2 also includes **Phase B (Subject multiselect):** migration 023 (`product_subjects`), APIs and UI for `subject_ids`, and use of `SUBJECT_SELECTION` from config (see Todo 12).

---

Subject multiselect is described in Todo 12 above.
