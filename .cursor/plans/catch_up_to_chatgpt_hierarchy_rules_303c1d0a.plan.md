---
name: Catch up to ChatGPT hierarchy rules
overview: Add explicit selection rules and invariants to config, create a canonical hierarchy spec for Cursor, and document (or optionally implement) subject multiselect so the codebase aligns with ChatGPT’s structural tightening.
todos: []
isProject: false
---

# Catch Up to ChatGPT’s Hierarchy & Config Tightening

This plan addresses the gaps identified earlier: make quarter single-select and subject multiselect **explicit**, add machine-readable **invariants**, add the **"must never"** SHS rule, clarify **Kindergarten** and **strand naming**, and either document or implement **subject multiselect**.

---

## Scope Decision: Subject Multiselect

**Option A — Document only (included in this plan):** Add the rule and invariants so Cursor and future work respect “subjects are multiselect.” Keep current single `subject_id` in DB/UI. Implementation of multi-subject (schema, API, forms, filters) is a **separate follow-up phase**.

**Option B — Full implementation:** Same as Option A plus a new migration (e.g. `product_subjects` M:N or `subject_ids UUID[]`), API changes, and form/filter multiselect for subjects. This is a larger change and is outlined as Phase B below for optional inclusion.

This plan assumes **Option A** for “catch up”; Phase B is listed as an optional follow-up.

---

## Phase A: Config & Doc Tightening (No Schema Change)

### 1. Add selection rules and invariants to config

**File:** [lib/config/lesson-plan-config.ts](lib/config/lesson-plan-config.ts)

- **Quarters — explicit single-select:**  
- Add a documented constant, e.g. `QUARTER_SELECTION = 'single'` as const, and a short JSDoc: “Quarters are single-select; one quarter per product/filter.”  
- Keep existing `QUARTERS` as the options array; no breaking changes to current single-select behavior.
- **Subjects — explicit multiselect (rule only):**  
- Add `SUBJECT_SELECTION = 'multi'` as const and JSDoc: “Subjects are multiselect for integrated/interdisciplinary teaching. App currently uses single subject_id; multi-subject support is a follow-up phase.”  
- No change to product form or filter behavior in this phase; this is the **declared rule** so Cursor and future code do not treat subject as single-select by default.
- **Invariants block:**  
- Add a single exported object, e.g. `LESSON_PLAN_INVARIANTS`, with:
- `weeks_max: 9`
- `no_default_language: true`
- `subject_is_multiselect: true`
- `modality_is_multiselect: true`
- `quarter_is_single_select: true`  
- Add a one-line JSDoc: “Machine-readable guardrails for generators and Cursor.”

Existing comments for weeks (“min 1, max 9, multiselect”) and modalities (“multiselect”) stay; they are now reinforced by the invariants object.

### 2. Create canonical hierarchy spec for Cursor

**New file:** [docs/implementationplan/LESSON-PLAN-HIERARCHY-SPEC.md](docs/implementationplan/LESSON-PLAN-HIERARCHY-SPEC.md)

Content:

- **Purpose:** Single place for “constitution” rules that Cursor and implementors must follow. Points to [lib/config/lesson-plan-config.ts](lib/config/lesson-plan-config.ts) as the source of options and invariants.
- **SHS — strict rule (ChatGPT’s “must never”):**  
- One dedicated line: **“Cursor must never generate or allow SHS specialized subjects unless a Strand has been explicitly selected.”**  
- Short note that for Grade 11/12, `strand_id` is required before any specialized subjects are shown or stored.
- **Selection rules:**  
- Quarters: single-select; one quarter per product/filter.  
- Subjects: multiselect by design (integrated/interdisciplinary); current app uses single subject until Phase B.  
- Weeks: multiselect, 1–9. Modalities: multiselect. Language: no default.
- **Kindergarten:**  
- When defining or seeding Kindergarten subjects, use **split developmental domains** (e.g. Language Development, Literacy Development, Numeracy Development, Socio-Emotional Development, Physical Development, Aesthetic Development).  
- Note: “Verify exact labels against the official DepEd Kindergarten Curriculum Guide.”
- **Strand naming:**  
- “Keep DepEd-style strand names (e.g. TVL-ICT, TVL-HE, TVL-IA, TVL-AFA). Do not normalize to ICT/Home Economics; retain TVL prefix for clarity and teacher familiarity.”
- **References:**  
- Link to [LESSON-PLAN-PHASE-2-IMPLEMENTATION-GUIDE.md](docs/implementationplan/LESSON-PLAN-PHASE-2-IMPLEMENTATION-GUIDE.md) and [lesson-plan-config.ts](lib/config/lesson-plan-config.ts).

### 3. Reference the spec from the Phase 2 guide

**File:** [docs/implementationplan/LESSON-PLAN-PHASE-2-IMPLEMENTATION-GUIDE.md](docs/implementationplan/LESSON-PLAN-PHASE-2-IMPLEMENTATION-GUIDE.md)

- In the **References** section, add a bullet: “**Canonical rules and invariants:** [LESSON-PLAN-HIERARCHY-SPEC.md](LESSON-PLAN-HIERARCHY-SPEC.md) — selection rules, SHS ‘must never’ rule, Kindergarten domains, strand naming.”  
- Optional: in Todo 11 (Hierarchy UI) or the SHS part of Todo 10, add a one-line reminder: “See LESSON-PLAN-HIERARCHY-SPEC.md: SHS specialized subjects only after strand is selected.”

---

## Optional: Canonical JSON (JSON-as-law)

If you want a strict **JSON + MD** pairing (like the one you gave ChatGPT) inside the repo:

- **New file:** [lib/config/lesson-plan-hierarchy.json](lib/config/lesson-plan-hierarchy.json)  
- Minimal structure: `config.quarters = { "selection": "single", "options": ["Quarter 1","Quarter 2","Quarter 3","Quarter 4"] }`; `config.subjects = { "selection": "multi" }`; `config.invariants = { "weeks_max": 9, "no_default_language": true, "subject_is_multiselect": true, "modality_is_multiselect": true, "quarter_is_single_select": true }`.  
- Can stay minimal and not duplicate full hierarchy (grades/subjects per grade); the TS config remains the runtime source, and the JSON is the “law” for Cursor and tooling.
- **Spec doc:** LESSON-PLAN-HIERARCHY-SPEC.md adds a line: “For machine-consumable selection rules and invariants, see [lesson-plan-hierarchy.json](../../lib/config/lesson-plan-hierarchy.json).”

This is **optional**; the TS config + spec MD alone already “catch up” to the rules ChatGPT suggested.

---

## Phase B (Follow-up): Subject Multiselect Implementation

Only if you choose to **implement** multi-subject (not just document it):

1. **Schema:** New migration adding either (a) `product_subjects(product_id, subject_id)` M:N table with FK to `products` and `subjects`, or (b) `subject_ids UUID[]` on `products`. Decide whether to keep `subject_id` for backward compatibility (e.g. “primary” subject) or migrate fully to multiple subjects.
2. **API:** Products API and any product-read APIs accept/return `subject_ids` (or equivalent); search accepts multiple subject filters (e.g. “any of these subjects”).
3. **Forms:** Product new/edit use a multiselect for subjects (from grade/strand-aware options) and persist the chosen set.
4. **Filters:** Filter sidebar and browse page support multiselect for subject; URL and search API use a multi-value subject param.
5. **Config:** Ensure UI and validation use `SUBJECT_SELECTION === 'multi'` from [lesson-plan-config.ts](lib/config/lesson-plan-config.ts).

Phase B is a separate implementation plan; this “catch up” plan only ensures the **rule** and **invariants** are in place so Phase B can be done consistently.

---

## Summary


| ChatGPT point                   | Action in this plan                                                                                            |
| ------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| Quarters explicit single-select | Add `QUARTER_SELECTION` and doc in config; invariants include `quarter_is_single_select`                       |
| Subjects explicit multiselect   | Add `SUBJECT_SELECTION = 'multi'` and invariants; spec says “multiselect by design”; implementation is Phase B |
| Invariants block                | Add `LESSON_PLAN_INVARIANTS` in lesson-plan-config.ts                                                          |
| “Must never” SHS                | Add to LESSON-PLAN-HIERARCHY-SPEC.md and reference from Phase 2 guide                                          |
| Kindergarten split domains      | Spec lists split domains and says “verify vs DepEd KG CG”                                                      |
| Strand naming                   | Spec says keep TVL-ICT etc.; do not normalize                                                                  |
| Optional JSON-as-law            | Add minimal lesson-plan-hierarchy.json if you want JSON + MD in-repo                                           |


**Deliverables (Phase A):**

- [lib/config/lesson-plan-config.ts](lib/config/lesson-plan-config.ts): selection constants + `LESSON_PLAN_INVARIANTS`  
- [docs/implementationplan/LESSON-PLAN-HIERARCHY-SPEC.md](docs/implementationplan/LESSON-PLAN-HIERARCHY-SPEC.md): new spec with SHS rule, selection rules, Kindergarten, strand naming  
- [docs/implementationplan/LESSON-PLAN-PHASE-2-IMPLEMENTATION-GUIDE.md](docs/implementationplan/LESSON-PLAN-PHASE-2-IMPLEMENTATION-GUIDE.md): one reference + optional SHS reminder

**No DB migrations, no API/UI behavior changes** in Phase A; only config and docs.