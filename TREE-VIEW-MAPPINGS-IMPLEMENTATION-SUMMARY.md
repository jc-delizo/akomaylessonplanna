# Nested Hierarchy Mappings - Implementation Summary

**Date:** February 3, 2026
**Status:** Complete
**Plan:** [nested_hierarchy_mappings_3ee80566.plan.md](.cursor/plans/nested_hierarchy_mappings_3ee80566.plan.md)

---

## Overview

Unified Grade-Subject and Strand-Subject mappings into a single **Hierarchy Mappings** page with a nested tree structure. Grades 1–10 show subjects directly; Grades 11–12 expand to reveal **Core** (grade-subjects) and **Strand** (STEM, HUMSS, etc.) sections, each with its own subject checkboxes and per-section save.

---

## Target Structure

```
▼ Grade 1
  ☑ Mathematics
  ☑ Science
  ☑ English
  ...
▼ Grade 2
  ...
▼ Grade 11
  ▼ Core
    ☑ [core subjects for Grade 11]
  ▼ STEM
    ☑ General Physics
    ☑ General Chemistry
    ...
  ▼ HUMSS
    ☑ Introduction to World Religions
    ...
▼ Grade 12
  ▼ Core
    ☑ [core subjects for Grade 12]
  ▼ STEM
    ...
  ▼ HUMSS
    ...
```

---

## Implementation

### Unified Page

**`app/admin/catalog/hierarchy-mappings/page.tsx`**
- Single page replacing both grade-subjects and strand-subjects
- Grades 1–10: One `MappingTreeSection` per grade (subjects from grade_subjects)
- Grades 11–12: Parent `Collapsible` per grade containing:
  - **Core** section: subjects from grade_subjects, save via PUT grade-subjects
  - **Strand** sections: one per strand, subjects from strand_subjects, save via PUT strand-subjects
- Expand state: `expandedIds: Set<string>` with keys `grade:${id}`, `grade:${id}:core`, `grade:${id}:strand:${strandId}`
- Toolbar: "Expand all" and "Collapse all"
- Per-section save with loading state (`savingKey`)

### Reusable Component

**`components/admin/catalog/mapping-tree-section.tsx`**
- Collapsible section with trigger (chevron, label, subject count badge)
- Expanded content: subject checkboxes + inline Save button
- Props: id, label, subLabel, subjects, selectedSubjectIds, onToggle, onSave, isExpanded, onToggleExpand, saving, **indentLevel**
- `indentLevel` adds left padding (pl-4, pl-8, pl-12) for nested nodes under Grade 11/12

### Route Cleanup

- **Deleted:** `app/admin/catalog/grade-subjects/page.tsx`
- **Deleted:** `app/admin/catalog/strand-subjects/page.tsx`
- **Sidebar:** Replaced "Grade-Subject Mappings" and "Strand-Subject Mappings" with single "Hierarchy Mappings" link

---

## API

No changes. Existing endpoints used as-is:
- `GET /api/admin/catalog/grade-subjects`
- `PUT /api/admin/catalog/grade-subjects`
- `GET /api/admin/catalog/strand-subjects`
- `PUT /api/admin/catalog/strand-subjects`

---

## Files Changed

| File | Action |
|------|--------|
| `app/admin/catalog/hierarchy-mappings/page.tsx` | Created (unified nested tree) |
| `app/admin/catalog/grade-subjects/page.tsx` | Deleted |
| `app/admin/catalog/strand-subjects/page.tsx` | Deleted |
| `components/admin/admin-sidebar.tsx` | Replaced two nav items with "Hierarchy Mappings" |
| `components/admin/catalog/mapping-tree-section.tsx` | Added indentLevel prop for nesting |
