# SPED Removal — Implementation Summary

**Date**: February 2026  
**Scope**: Remove all SPED (Special Education) functionality from AKOMAYLESSONPLANNA  
**Plan**: [remove_sped_from_system_88183f78.plan.md](.cursor/plans/remove_sped_from_system_88183f78.plan.md)

---

## Overview

SPED (Special Education) was removed from the platform. The system now supports only **Regular** class type. Strands (Grade 11/12 SHS), grade levels, and subjects remain unchanged.

**Database strategy**: Migration 034 removes SPED from the database. Drops `products.learner_path`, `products.sped_level_id`, `users.teaching_learner_paths`, `users.teaching_sped_level_ids`, and the `sped_levels` table. Keeps `products.class_type` and `users.teaching_class_types` (Regular only).

---

## Changes by Phase

### Phase 1: Config and Lesson Plan API

| File | Changes |
|------|---------|
| `lib/config/lesson-plan-config.ts` | Removed SPED from CLASS_TYPES; removed LEARNER_PATHS, SPED_SUBJECT_CODES, getLearnerPathLabel, LearnerPathValue |
| `app/api/lesson-plan-config/route.ts` | Removed sped_levels and spedSubjects queries; response now returns only `regular` and `classTypes: ['regular']` |

### Phase 2: Filters

| File | Changes |
|------|---------|
| `components/products/filter-sidebar.tsx` | Removed Class type, SPED Learner path, SPED Level selects; simplified hierarchy and subjects; Grade Level and Strand always shown when applicable |
| `components/search/filter-chips.tsx` | Removed Class type, SPED Path, SPED Level chips; removed spedLevels state |
| `app/marketplace/browse/page.tsx` | Simplified handleFilterRemove (removed class_type branch) |

### Phase 3: Profile Edit and API

| File | Changes |
|------|---------|
| `app/profile/edit/page.tsx` | Removed teachingSpedLevelIds, teachingLearnerPaths; removed SPED Learner Path and SPED Levels cards; removed Class Type card (Regular implicit); removed teachingClassTypes state; simplified isTeachingComplete; always sends teaching_class_types: ['regular'] |
| `app/api/me/profile/route.ts` | Removed teaching_sped_level_ids, teaching_learner_paths from destructuring, validation, and updateData; validClassTypes = ['regular']; defaults teaching_class_types to ['regular'] when undefined or empty |

### Phase 4: Product Upload and Edit

| File | Changes |
|------|---------|
| `app/shop/products/new/page.tsx` | Removed class_type, learner_path, sped_level_id from form; removed SPED blocks; always require grade_id; simplified validation and Step 5 categorization |
| `app/shop/products/[id]/edit/page.tsx` | Same changes as product upload |

### Phase 5: Product and Search APIs

| File | Changes |
|------|---------|
| `app/api/products/route.ts` | Always require grade_id; set class_type = 'regular' on insert; removed learner_path, sped_level_id |
| `app/api/products/[id]/route.ts` | Removed sped_level join; removed class_type, learner_path, sped_level_id from update |
| `app/api/search/route.ts` | Removed spedLevelId, learnerPath params; removed sped_level join and filters |

### Phase 6: Display Components and SEO

| File | Changes |
|------|---------|
| `components/products/product-card.tsx` | Removed sped_level from type; simplified productContextLine (no SPED branch) |
| `components/products/product-detail-layout.tsx` | Removed getLearnerPathLabel, sped_level; removed SPED Class badge block |
| `lib/seo/generate-metadata.ts` | Removed sped_level from params; simplified context line (no SPED branch) |

### Phase 7: Recommendations and Recently Viewed

| File | Changes |
|------|---------|
| `components/recommendations/personalized-recommendations.tsx` | Removed sped_level from Product type |
| `components/recommendations/related-products.tsx` | Removed sped_level from Product type |
| `components/recently-viewed/recently-viewed-section.tsx` | Removed sped_level from interface and ProductCard |
| `components/recently-viewed/recently-viewed-page-content.tsx` | Same |
| `app/api/recently-viewed/route.ts` | Removed sped_level join |
| `app/api/recommendations/related/[productId]/route.ts` | Removed sped_level join |
| `app/api/recommendations/personalized/route.ts` | Removed sped_level join from all productSelect statements |

### Phase 8: Marketplace and Product Detail Pages

| File | Changes |
|------|---------|
| `app/marketplace/page.tsx` | Removed sped_level from productSelect; removed teaching_sped_level_ids from profile select and teachingComplete logic |
| `app/products/[id]/page.tsx` | Removed sped_level join from both fetches; removed sped_level from generateProductMetadata call |

### Phase 9: Documentation

| File | Changes |
|------|---------|
| `IMPLEMENTATION-STATUS.md` | Updated Lesson Plan Phase 2 and Feature 02 to reflect SPED removal; added migration 034 |

### Phase 10: Profile Teaching Tab + Database (Feb 2026)

| File | Changes |
|------|---------|
| `app/profile/edit/page.tsx` | Removed Class Type card; removed teachingClassTypes state and CLASS_TYPES import; isTeachingComplete uses strands or subjects+grades only |
| `app/api/me/profile/route.ts` | Default teaching_class_types to ['regular'] when undefined or empty |
| `app/marketplace/page.tsx` | Treat empty teaching_class_types as ['regular'] for teachingComplete |
| `supabase/migrations/034_remove_sped_from_database.sql` | Drops products.sped_level_id, products.learner_path, users.teaching_sped_level_ids, users.teaching_learner_paths, sped_levels table |

---

## Files Modified (Summary)

- **Config**: 2 files
- **Filters**: 3 files
- **Profile**: 2 files
- **Product forms**: 2 files
- **APIs**: 8 files
- **Display**: 3 files
- **Recommendations / Recently viewed**: 7 files
- **Pages**: 2 files
- **Docs**: 1 file

**Total**: ~30 files modified

---

## Verification

1. **Filters**: Browse page shows Grade Level and Strand (when G11/12) only; no Class type, Learner path, or SPED Level.
2. **Profile Teaching**: Strands, Grade Levels Taught, Subjects Taught; Class Type card removed (Regular implicit); no SPED Learner Path or SPED Levels.
3. **Product upload/edit**: Grade Level and Strand required when applicable; no SPED fields.
4. **Product display**: ProductCard and ProductDetailLayout show grade/strand/subject; no SPED-specific display.
5. **APIs**: All product queries omit sped_level join; new products get class_type = 'regular'.
