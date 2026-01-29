---
name: Phase 2 Phase B implementation plan
overview: Add Phase B (Subject Multiselect) as a documented, ordered part of Phase 2 so that "implement Phase 2" includes both hierarchy (Todos 9–11) and subject multiselect (Phase B). The plan adds a Todo 12 section and Step 4 to the existing Phase 2 guide and optionally creates a standalone Phase B implementation guide for agents.
todos: []
isProject: false
---

# Phase 2 Phase B — Implementation Plan

Goal: Document Phase B (subject multiselect) as part of Phase 2 so you can tell an agent to "implement Phase 2" and have it cover both hierarchy (Todos 9–11) and Phase B. Two approaches: **inline** (add Todo 12 to the existing guide) or **separate doc** (new Phase B guide + link from Phase 2).

---

## Recommended: Inline Todo 12 in the Phase 2 Guide

Keep a single source of truth. Add Phase B as **Todo 12** inside [docs/implementationplan/LESSON-PLAN-PHASE-2-IMPLEMENTATION-GUIDE.md](docs/implementationplan/LESSON-PLAN-PHASE-2-IMPLEMENTATION-GUIDE.md), then extend Implementation Order and Summary.

### 1. Insert "Todo 12: Phase B — Subject Multiselect" after Todo 11

Place it before the "Implementation Order" section. Suggested content:

**Purpose:** Implement subject multiselect so products and filters can use multiple subjects (integrated/interdisciplinary teaching). [LESSON-PLAN-HIERARCHY-SPEC.md](LESSON-PLAN-HIERARCHY-SPEC.md) and [lesson-plan-config.ts](lib/config/lesson-plan-config.ts) already declare `SUBJECT_SELECTION === 'multi'`; this todo is the implementation.

**Order:** After Todo 11 (Hierarchy UI). Phase B depends on hierarchy (grade/strand/SPED-aware subject lists) being in place.

**Deliverables:**

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
  - Use multiselect (e.g. checkboxes) for subjects; form state includes `subject_ids: string[]` and `subject_id` (primary/first). Validation: at least one subject. Submit sends `subject_ids`. When hierarchy changes (class_type, grade_id, strand_id, learner_path), clear `subject_ids` and `subject_id`. Use `SUBJECT_SELECTION` from [lesson-plan-config.ts](lib/config/lesson-plan-config.ts) in labels if desired.
5. **Filter sidebar and browse**
  - Filter sidebar: subject filter is multiselect (e.g. checkboxes); state uses `filters.subject_ids` (array) and `filters.subject_id` (first). When class_type, grade_id, or learner_path changes, clear subject_ids/subject_id.
  - Browse: parse `subject_ids` from URL as array (comma-separated); include `subject_ids` in query params to search; when removing the subject chip, clear both `subject_ids` and `subject_id`.
6. **Filter chips**
  - When `filters.subject_ids` or `filters.subject_id` is set, show a chip (e.g. key `subject_ids`, label "Subject(s)", value = resolved subject names joined). On remove, clear `subject_ids` and `subject_id`.
7. **Config**
  - Ensure UI and validation reference `SUBJECT_SELECTION === 'multi'` from [lesson-plan-config.ts](lib/config/lesson-plan-config.ts) where relevant (e.g. labels, invariants).

**Files to touch:**  
[supabase/migrations/](supabase/migrations/) (new `023_*.sql`), [app/api/products/route.ts](app/api/products/route.ts), [app/api/products/[id]/route.ts](app/api/products/[id]/route.ts), [app/api/search/route.ts](app/api/search/route.ts), [app/shop/products/new/page.tsx](app/shop/products/new/page.tsx), [app/shop/products/[id]/edit/page.tsx](app/shop/products/[id]/edit/page.tsx), [components/products/filter-sidebar.tsx](components/products/filter-sidebar.tsx), [app/marketplace/browse/page.tsx](app/marketplace/browse/page.tsx), [components/search/filter-chips.tsx](components/search/filter-chips.tsx), [lib/config/lesson-plan-config.ts](lib/config/lesson-plan-config.ts).

---

### 2. Update "Implementation Order" in the same guide

Add Step 4:

- **Step 4 — Phase B (Subject multiselect):** Run migration 023; update Products API and Search API for `subject_ids`; add subject multiselect in product forms, filter sidebar, browse, and filter chips; use `SUBJECT_SELECTION` in UI as in Todo 12.

So the full order becomes: Migration 022 → Config API → Hierarchy UI → **Phase B (Todo 12)**.

---

### 3. Update "Summary" in the same guide

Append one sentence so Phase B is part of Phase 2 in writing, e.g.:

"Phase 2 also includes **Phase B (Subject multiselect):** migration 023 (`product_subjects`), APIs and UI for `subject_ids`, and use of `SUBJECT_SELECTION` from config (see Todo 12)."

---

### 4. Fix the end of the Phase 2 guide

There are two identical "See also" lines at the end pointing to `LESSON-PLAN-PHASE-2-PHASE-B-IMPLEMENTATION-GUIDE.md`. Either:

- **If Phase B is inlined as Todo 12:** Remove both "See also" blocks (Phase B is now in the same doc), or keep a single line: "Subject multiselect is described in Todo 12 above."
- **If you add a standalone Phase B doc (see Alternative below):** Keep one "See also" link and remove the duplicate.

---

## Alternative: Standalone Phase B Implementation Guide

If you prefer a separate document for Phase B (e.g. for a dedicated agent run or reuse):

1. **Create** [docs/implementationplan/LESSON-PLAN-PHASE-2-PHASE-B-IMPLEMENTATION-GUIDE.md](docs/implementationplan/LESSON-PLAN-PHASE-2-PHASE-B-IMPLEMENTATION-GUIDE.md) with:
  - **Prerequisites:** Todos 9–11 (Migration 022, Config API, Hierarchy UI) are done.
  - **References:** [LESSON-PLAN-PHASE-2-IMPLEMENTATION-GUIDE.md](LESSON-PLAN-PHASE-2-IMPLEMENTATION-GUIDE.md), [LESSON-PLAN-HIERARCHY-SPEC.md](LESSON-PLAN-HIERARCHY-SPEC.md), [lesson-plan-config.ts](lib/config/lesson-plan-config.ts).
  - **Todo / Deliverables:** Same as Todo 12 above (migration 023, Products API, Search API, forms, filter/browse/chips, config).
  - **Implementation order:** 1) Migration 023; 2) Products API; 3) Search API; 4) Forms; 5) Filter sidebar + browse + chips; 6) Config/SUBJECT_SELECTION.
  - **Summary:** One short paragraph stating Phase B adds subject multiselect via `product_subjects` and `subject_ids` end to end.
2. **Edit** the main Phase 2 guide:
  - Add **Step 4 — Phase B:** "Implement subject multiselect per [LESSON-PLAN-PHASE-2-PHASE-B-IMPLEMENTATION-GUIDE.md](LESSON-PLAN-PHASE-2-PHASE-B-IMPLEMENTATION-GUIDE.md)."
  - In Summary, add one sentence that Phase 2 includes Phase B and link to that guide.
  - Keep a single "See also" link to the Phase B guide and remove the duplicate.

---

## How to instruct an agent

- **If you inline Todo 12:** Tell the agent to "implement Phase 2 per [LESSON-PLAN-PHASE-2-IMPLEMENTATION-GUIDE.md](docs/implementationplan/LESSON-PLAN-PHASE-2-IMPLEMENTATION-GUIDE.md), including Todo 12 (Phase B — Subject multiselect)."
- **If you use a standalone Phase B guide:** Tell the agent to "implement Phase 2 per the Phase 2 guide, then implement Phase B per [LESSON-PLAN-PHASE-2-PHASE-B-IMPLEMENTATION-GUIDE.md](docs/implementationplan/LESSON-PLAN-PHASE-2-PHASE-B-IMPLEMENTATION-GUIDE.md)."

---

## Summary of deliverables


| Action                       | Description                                                                                                                                                            |
| ---------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Add Todo 12 to Phase 2 guide | Full "Todo 12: Phase B — Subject Multiselect" section with purpose, order, deliverables (migration 023, APIs, forms, filter/browse/chips, config), and files to touch. |
| Extend Implementation Order  | Add Step 4 for Phase B (after Step 3 Hierarchy UI).                                                                                                                    |
| Extend Summary               | One sentence stating Phase 2 includes Phase B (Todo 12).                                                                                                               |
| Fix end of Phase 2 guide     | Remove duplicate "See also" and either drop the link (if inlined) or keep one link to a Phase B doc (if you create it).                                                |
| Optional: create Phase B doc | New file with Prerequisites, References, Todo/deliverables, order, and summary; Phase 2 guide then adds Step 4 and a single see-also.                                  |


Recommendation: **inline Todo 12** so one doc describes the full Phase 2 implementation order (Steps 1–4) and one agent instruction suffices.