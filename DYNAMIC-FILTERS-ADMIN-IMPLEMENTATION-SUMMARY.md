# Dynamic Filters Admin - Implementation Summary

**Date:** February 3, 2026
**Status:** ✅ Consumer Updates Complete
**Plan:** [dynamic_filters_admin_26f32a8d.plan.md](.cursor/plans/dynamic_filters_admin_26f32a8d.plan.md)

---

## Overview

All filter dimensions (product types, specific types, grades, strands, subjects, curricula, modalities, languages, teaching frameworks, grade-subject and strand-subject mappings) are now dynamic and manageable via the Admin Catalog section. Super Admins can add, edit, reorder, and soft-delete options. Consumers (filter sidebar, filter chips, product forms, product detail layout) now use config from the API instead of hardcoded values.

---

## Implementation Status

### ✅ Phase 1: Database Schema (Migration 035)
**Status:** Complete

- `product_types` – slug, label, sort_order, is_active
- `product_type_specific_types` – per product type (e.g., DLL/DLP for lesson plans)
- `curricula`, `modalities`, `languages`, `teaching_frameworks`, `quarters` – value, label, sort_order, is_active
- Seed data migrated from `lib/config/lesson-plan-config.ts`
- RLS policies for public read, service role management

### ✅ Phase 2: Config API
**Status:** Complete

- Extended `GET /api/lesson-plan-config` to include:
  - `productTypes`, `specificTypesByProductType`
  - `curricula`, `modalities`, `languages`, `teachingFrameworks`, `quarters`
- Fallback to hardcoded values when DB tables are not yet migrated

### ✅ Phase 3: Admin Catalog API & UI
**Status:** Complete

- Admin API routes under `/api/admin/catalog/` for all dimensions
- Catalog section in Admin sidebar (Super Admin only)
- CRUD pages for product types, grades, strands, subjects, curricula, modalities, languages, teaching frameworks, quarters
- Grade-subject and strand-subject mapping editors
- **Tree view (Feb 2026):** Mappings use expandable tree layout; see [TREE-VIEW-MAPPINGS-IMPLEMENTATION-SUMMARY.md](TREE-VIEW-MAPPINGS-IMPLEMENTATION-SUMMARY.md)

### ✅ Phase 4: Category API
**Status:** Complete

- Category API resolves product-type slugs from `product_types` table
- New product types automatically get category pages at `/categories/[slug]`

### ✅ Phase 5: Consumer Updates (Feb 2026)
**Status:** Complete

**Filter Sidebar** (`components/products/filter-sidebar.tsx`):
- Already used API for hierarchy, product types, specific types, curricula, modalities, languages, quarters
- No changes needed; only imports `WEEKS_OPTIONS` and `SUBJECT_SELECTION` (invariants)

**Filter Chips** (`components/search/filter-chips.tsx`):
- Removed imports of `MODALITIES`, `LANGUAGES`, `CURRICULA`, `DOCUMENT_TYPES`
- Fetches full config from API; resolves product type, document type, modalities, curriculum, language labels from API data

**Product Forms** (`app/shop/products/new/page.tsx`, `app/shop/products/[id]/edit/page.tsx`):
- Removed hardcoded `PRODUCT_TYPES`, `SPECIFIC_TYPES`, `QUARTERS`, `MODALITIES`, `LANGUAGES`, `CURRICULA`, `TEACHING_FRAMEWORKS`
- Fetches catalog from `/api/lesson-plan-config`; drives all Select/Checkbox options from API
- Specific type options depend on selected product type via `specificTypesByProductType[product_type]`

**Product Detail Layout** (`components/products/product-detail-layout.tsx`):
- Removed imports of `getLanguageLabel`, `getCurriculumLabel`, `getModalityLabel`, `getTeachingFrameworkLabel`, `getDocumentTypeLabel`
- Fetches catalog config on mount; resolves all labels from API data with fallback to formatted raw value

---

## Remaining Tasks

### Phase 6: Deprecate Hardcoded Config
- Remove `DOCUMENT_TYPES`, `CURRICULA`, `MODALITIES`, `LANGUAGES`, `TEACHING_FRAMEWORKS`, `CLASS_TYPES` from `lib/config/lesson-plan-config.ts`
- Keep `WEEKS_OPTIONS`, `SUBJECT_SELECTION`, `QUARTER_SELECTION`, `LESSON_PLAN_INVARIANTS` (behavioral constants)

### Phase 7: Cache Invalidation
- Add cache invalidation when admin saves catalog changes (e.g., `revalidatePath` or cache-bust query param)

---

## Files Changed (Consumer Updates)

| File | Changes |
|------|---------|
| `components/search/filter-chips.tsx` | Fetch config from API; resolve labels from productTypes, specificTypesByProductType, curricula, modalities, languages |
| `app/shop/products/new/page.tsx` | Fetch catalog; replace hardcoded options with API data |
| `app/shop/products/[id]/edit/page.tsx` | Same as new page |
| `components/products/product-detail-layout.tsx` | Fetch catalog on mount; resolve labels from API |

---

## Backward Compatibility

- API fallback: If migration 035 is not applied, `/api/lesson-plan-config` returns hardcoded values from `lesson-plan-config.ts`
- Product detail layout: Falls back to formatted raw value when config not yet loaded or value not found
- Filter chips: Same fallback for label resolution
