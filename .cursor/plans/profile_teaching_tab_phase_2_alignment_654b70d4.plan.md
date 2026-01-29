---
name: Profile Teaching Tab Phase 2 Alignment
overview: "Extend the Profile Teaching tab (Option B) to support Phase 2 hierarchy: Class type (Regular/SPED), Learner path (SPED), Strand (Regular G11/12), and SPED levels. Add database columns, update UI with conditional fields, and update API to store/retrieve Phase 2 preferences."
todos:
  - id: migration
    content: "Create migration 024_profile_teaching_phase2.sql: add teaching_class_types, teaching_learner_paths, teaching_strand_ids, teaching_sped_level_ids columns with GIN indexes"
    status: completed
  - id: ui-state
    content: Add Phase 2 state variables (teachingClassTypes, teachingLearnerPaths, teachingStrandIds, teachingSpedLevelIds) and fetch hierarchy from /api/lesson-plan-config
    status: completed
  - id: ui-class-type
    content: Add Class Type multi-select section (Regular/SPED) with conditional rendering logic
    status: completed
  - id: ui-learner-path
    content: Add Learner Path section (shown if SPED selected) with Graded/Non-Graded options
    status: completed
  - id: ui-strand
    content: Add Strand multi-select section (shown if Regular + G11/12) with strands from hierarchy
    status: completed
  - id: ui-sped-levels
    content: Add SPED Levels multi-select section (shown if SPED Non-Graded) with levels from hierarchy
    status: completed
  - id: ui-validation
    content: Update isTeachingComplete() validation and form submission to include Phase 2 fields
    status: completed
  - id: api-get
    content: Update GET /api/me/profile to include Phase 2 columns in SELECT
    status: completed
  - id: api-put
    content: Update PUT /api/me/profile to accept, validate, and save Phase 2 fields
    status: completed
isProject: false
---

# Profile Teaching Tab Phase 2 Alignment (Option B) - Implementation Plan

## Goal

Extend the Profile Teaching tab to allow teachers to specify Phase 2 teaching preferences: Class type (Regular/SPED), Learner path (if SPED), Strand (if Regular G11/12), and SPED levels (if SPED Non-Graded). This enables more precise product recommendations and teacher profile matching.

## Current State

- **Teaching Tab** (`app/profile/edit/page.tsx`): Has "Subjects Taught" and "Grade Levels Taught" multi-select checkboxes
- **Database**: `users` table has `subjects_taught TEXT[]` and `grade_levels_taught TEXT[]` storing names
- **API**: `/api/me/profile` GET/PUT handles `subjects_taught` and `grade_levels_taught`
- **Usage**: Personalized recommendations use `grade_levels_taught` and `subjects_taught` to filter products

## Database Changes

### Migration: Add Phase 2 teaching preference columns

**File**: `supabase/migrations/024_profile_teaching_phase2.sql`

```sql
-- Add Phase 2 teaching preference columns to users table
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS teaching_class_types TEXT[] NULL,
  ADD COLUMN IF NOT EXISTS teaching_learner_paths TEXT[] NULL,
  ADD COLUMN IF NOT EXISTS teaching_strand_ids UUID[] NULL,
  ADD COLUMN IF NOT EXISTS teaching_sped_level_ids UUID[] NULL;

-- Add indexes for array columns (GIN indexes for efficient array queries)
CREATE INDEX IF NOT EXISTS idx_users_teaching_class_types ON users USING GIN(teaching_class_types);
CREATE INDEX IF NOT EXISTS idx_users_teaching_strand_ids ON users USING GIN(teaching_strand_ids);
CREATE INDEX IF NOT EXISTS idx_users_teaching_sped_level_ids ON users USING GIN(teaching_sped_level_ids);

-- Add comments
COMMENT ON COLUMN users.teaching_class_types IS 'Array of class types teacher teaches: regular, sped';
COMMENT ON COLUMN users.teaching_learner_paths IS 'Array of SPED learner paths: graded, non_graded';
COMMENT ON COLUMN users.teaching_strand_ids IS 'Array of strand UUIDs for Regular G11/12 teaching';
COMMENT ON COLUMN users.teaching_sped_level_ids IS 'Array of SPED level UUIDs for Non-Graded teaching';
```

**Note**: Keep `subjects_taught` and `grade_levels_taught` for backward compatibility. They can be populated from Phase 2 selections or deprecated later.

## UI Changes

### 1. Update Teaching Tab Component

**File**: `app/profile/edit/page.tsx`

**Changes**:

- Add state for Phase 2 fields:
  - `teachingClassTypes: string[]` (e.g., ['regular', 'sped'])
  - `teachingLearnerPaths: string[]` (e.g., ['graded', 'non_graded'])
  - `teachingStrandIds: string[]` (UUIDs)
  - `teachingSpedLevelIds: string[]` (UUIDs)
- Fetch hierarchy from `/api/lesson-plan-config` (same as product form)
- Add UI sections:
  1. **Class Type** (optional multi-select): Regular, SPED
  2. **Learner Path** (conditional, shown if SPED selected): Graded (Inclusive), Non-Graded (Transition)
  3. **Strand** (conditional, shown if Regular + Grade 11/12 selected): Load strands from hierarchy
  4. **SPED Levels** (conditional, shown if SPED Non-Graded): Primary Level, Intermediate Level, etc.
  5. Keep existing **Subjects Taught** and **Grade Levels Taught** (can be populated from Phase 2 or kept separate)

**UI Flow**:

```
Class Type (optional) → [Regular] [SPED]
  ↓ If SPED selected
Learner Path (optional) → [Graded (Inclusive)] [Non-Graded (Transition)]
  ↓ If Non-Graded selected
SPED Levels (optional) → [Primary Level] [Intermediate Level] [Pre-Vocational Level] [Transition Program]
  ↓ If Regular selected
Grade Levels (existing) → [Grade 7] ... [Grade 12]
  ↓ If Grade 11/12 selected
Strand (optional) → [STEM] [ABM] [HUMSS] ... [Sports]
Subjects (existing) → [Math] [Science] ... (filtered by grade/strand/SPED level)
```

**Implementation details**:

- Use `CLASS_TYPES`, `LEARNER_PATHS` from `lib/config/lesson-plan-config.ts`
- Fetch hierarchy on mount: `const hierarchy = await fetch('/api/lesson-plan-config').then(r => r.json())`
- Conditional rendering based on selections
- Clear dependent fields when parent changes (e.g., clear strands when class type changes)
- Update `isTeachingComplete()` validation to require at least one Phase 2 selection OR existing subjects/grades

### 2. Update Form Submission

**File**: `app/profile/edit/page.tsx`

**Changes**:

- Include Phase 2 fields in PUT request body:
  ```typescript
  {
    // ... existing fields
    teaching_class_types: teachingClassTypes,
    teaching_learner_paths: teachingLearnerPaths,
    teaching_strand_ids: teachingStrandIds,
    teaching_sped_level_ids: teachingSpedLevelIds,
  }
  ```

## API Changes

### 1. Update Profile GET Endpoint

**File**: `app/api/me/profile/route.ts`

**Changes**:

- Include new Phase 2 columns in SELECT:
  ```typescript
  .select('*, teaching_class_types, teaching_learner_paths, teaching_strand_ids, teaching_sped_level_ids')
  ```

### 2. Update Profile PUT Endpoint

**File**: `app/api/me/profile/route.ts`

**Changes**:

- Accept new fields in request body:
  ```typescript
  const {
    // ... existing fields
    teaching_class_types,
    teaching_learner_paths,
    teaching_strand_ids,
    teaching_sped_level_ids,
  } = body
  ```
- Validate:
  - `teaching_class_types`: array of 'regular' | 'sped'
  - `teaching_learner_paths`: array of 'graded' | 'non_graded' (only if SPED in class_types)
  - `teaching_strand_ids`: array of valid UUIDs (must exist in `strands` table)
  - `teaching_sped_level_ids`: array of valid UUIDs (must exist in `sped_levels` table)
- Update database:
  ```typescript
  if (teaching_class_types !== undefined) updateData.teaching_class_types = teaching_class_types
  if (teaching_learner_paths !== undefined) updateData.teaching_learner_paths = teaching_learner_paths
  if (teaching_strand_ids !== undefined) updateData.teaching_strand_ids = teaching_strand_ids
  if (teaching_sped_level_ids !== undefined) updateData.teaching_sped_level_ids = teaching_sped_level_ids
  ```

## Optional: Update Recommendation Logic

**Files**: 

- `app/api/recommendations/personalized/route.ts`
- `app/marketplace/page.tsx`

**Enhancement** (optional, can be done later):

- Use Phase 2 preferences for more precise matching:
  - If user teaches SPED Non-Graded Primary Level → match products with `class_type='sped'`, `learner_path='non_graded'`, `sped_level_id` matching
  - If user teaches Regular G11 STEM → match products with `class_type='regular'`, `strand_id` matching, `grade_id=G11`
- Keep existing logic as fallback for users who haven't set Phase 2 preferences

## Files to Modify

1. **Database Migration**: `supabase/migrations/024_profile_teaching_phase2.sql` (new)
2. **UI Component**: `app/profile/edit/page.tsx`
3. **API GET**: `app/api/me/profile/route.ts`
4. **API PUT**: `app/api/me/profile/route.ts`
5. **Optional**: `app/api/recommendations/personalized/route.ts` (enhancement)
6. **Optional**: `app/marketplace/page.tsx` (enhancement)

## Validation Rules

- Class type: optional, can select both Regular and SPED
- Learner path: only shown/valid if SPED selected in class types
- Strand: only shown/valid if Regular selected AND Grade 11/12 selected in grade levels
- SPED levels: only shown/valid if SPED Non-Graded selected
- At least one teaching preference must be set (class type, subjects, or grades)

## Testing Checklist

- Migration applies successfully
- UI loads hierarchy from `/api/lesson-plan-config`
- Class type selection shows/hides dependent fields correctly
- Form submission saves Phase 2 fields
- Profile GET returns Phase 2 fields
- Validation prevents invalid combinations (e.g., strands without Regular)
- Clearing class type clears dependent fields
- Existing subjects/grades still work (backward compatibility)

## Notes

- Keep `subjects_taught` and `grade_levels_taught` for now (backward compatibility)
- Phase 2 fields are optional - teachers can use either old or new system
- Recommendation logic enhancement is optional and can be done in a follow-up

