# Lesson Plan Hierarchy — Canonical Rules (DepEd Philippines 2026)

This document is the single place for **"constitution"** rules that Cursor and implementors must follow. Options and invariants live in [lib/config/lesson-plan-config.ts](../../lib/config/lesson-plan-config.ts).

---

## SHS — Strict Rule

**Cursor must never generate or allow SHS specialized subjects unless a Strand has been explicitly selected.**

For Grade 11/12, `strand_id` is required before any specialized subjects are shown or stored. The config API and UI must enforce this.

---

## Selection Rules

- **Quarters:** Single-select; one quarter per product/filter.
- **Subjects:** Multiselect by design (integrated/interdisciplinary teaching). The app currently uses single subject until Phase B; the declared rule is multiselect so Cursor and future code do not treat subject as single-select by default.
- **Weeks:** Multiselect, 1–9 (DepEd standard).
- **Modalities:** Multiselect (e.g. Face-to-face + Modular).
- **Language of instruction:** No default; the user must explicitly choose from the provided list (including regional languages).

---

## Kindergarten

When defining or seeding Kindergarten subjects, use **split developmental domains**, for example:

- Language Development  
- Literacy Development  
- Numeracy Development  
- Socio-Emotional Development  
- Physical Development  
- Aesthetic Development  

**Verify exact labels against the official DepEd Kindergarten Curriculum Guide.**

---

## Strand Naming

Keep DepEd-style strand names (e.g. **TVL-ICT**, **TVL-HE**, **TVL-IA**, **TVL-AFA**). Do not normalize to "ICT" or "Home Economics"; retain the TVL prefix for clarity and teacher familiarity.

---

## References

- [LESSON-PLAN-PHASE-2-IMPLEMENTATION-GUIDE.md](LESSON-PLAN-PHASE-2-IMPLEMENTATION-GUIDE.md) — Phase 2 hierarchy implementation (Class type, SPED, SHS strand–subjects).
- [lib/config/lesson-plan-config.ts](../../lib/config/lesson-plan-config.ts) — Options (QUARTERS, MODALITIES, LANGUAGES, etc.) and invariants (`LESSON_PLAN_INVARIANTS`).
