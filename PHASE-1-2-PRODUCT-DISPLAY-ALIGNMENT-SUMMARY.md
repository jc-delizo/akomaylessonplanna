# Phase 1/2 Product Display Alignment — Implementation Summary

**Date**: January 28, 2026  
**Plan**: [phase_1_2_product_display_alignment_7f797145.plan.md](.cursor/plans/phase_1_2_product_display_alignment_7f797145.plan.md)  
**Status**: ✅ Complete

---

## Goal

Ensure everywhere products are **loaded or displayed** matches how sellers upload them: Class type, SPED path/level, Strand, and nullable grade for SPED non-graded. The filter system and product form (new/edit) were already Phase 2–aware; this work aligned **APIs and UI that display products**.

---

## 1. APIs — strand and sped_level with products

| Area | File(s) | Change |
|------|---------|--------|
| Search | `app/api/search/route.ts` | Added optional joins `strand:strands!products_strand_id_fkey(id,name,code)`, `sped_level:sped_levels!products_sped_level_id_fkey(id,name)` to main products select. |
| Product detail fetch | `app/products/[id]/page.tsx` | Same optional strand/sped_level joins in product select and in `generateMetadata` fetch. |
| Product GET by ID | `app/api/products/[id]/route.ts` | Same optional strand/sped_level joins in GET select; PUT response select updated (and seller to first_name/last_name). |
| Marketplace | `app/marketplace/page.tsx` | Single `productSelect` with strand/sped_level used for featured, new, trending, bestseller, recommended, fallback trending. |
| Related recommendations | `app/api/recommendations/related/[productId]/route.ts` | Strand/sped_level joins; seller first_name/last_name; same-category query handles null `grade_id` (SPED non-graded). |
| Personalized recommendations | `app/api/recommendations/personalized/route.ts` | All product selects (anonymous trending, Pro/Pioneer profile-based, free same-grade, fallback) use strand/sped_level and seller first_name/last_name. |
| Recently-viewed | `app/api/recently-viewed/route.ts` | Product select includes strand, sped_level; seller first_name, last_name. |

No change to filter logic; only response shape. Products may have `grade === null`.

---

## 2. ProductCard — null grade and Phase 2 context

**File**: `components/products/product-card.tsx`

- **Types**: `grade` and `subject` optional (`| null`); added `class_type`, `strand`, `sped_level`. Seller may have `name` or `first_name`/`last_name`.
- **Display line**: Helper `productContextLine(product)`:
  - SPED + `sped_level`: `sped_level.name • subject.name`
  - Regular + `strand`: `grade?.name • strand.name • subject.name` (or shorter)
  - Else: `grade?.name • subject.name` with empty string when missing.
- **Alt text**: Same context line so it never reads "undefined".
- **Seller**: `sellerName` from `seller.name` or `first_name + last_name`.

---

## 3. ProductDetailLayout — null-safe breadcrumb and metadata

**File**: `components/products/product-detail-layout.tsx`

- **Types**: `grade`/`subject` optional; added `class_type`, `learner_path`, `strand`, `sped_level`.
- **Breadcrumb**:
  - SPED non-graded (`!grade && sped_level`): Marketplace / SPED / Level name / Subject / Title (no grade link).
  - Regular + grade + subject: Marketplace / Grade / [Strand if present] / Subject / Title.
  - Subject-only fallback when no grade/level.
- **Metadata bullets**: Built from array of parts — SPED (Learner path, Level), Regular+strand (Grade, Strand), Subject, Quarter, Weeks, version — with separators; all null-safe.

---

## 4. Product detail page and generateMetadata

- **Page** (`app/products/[id]/page.tsx`): Already passed product to layout; after adding strand/sped_level joins, layout receives them. No extra change.
- **generateMetadata**: Passes `strand`, `sped_level`, `class_type` to `generateProductMetadata`; product fetch includes `class_type` and strand/sped_level.
- **generateProductMetadata** (`lib/seo/generate-metadata.ts`): Optional params `strand`, `sped_level`, `class_type`. Description context line: "Level • Subject" (SPED + sped_level), "Grade • Strand • Subject" (regular + strand), or "Grade • Subject"; fallback "K-12" when empty.

---

## 5. Marketplace page

Uses shared `productSelect` (with strand/sped_level) for all product queries. No display logic change; ProductCard and layout use the joined shape.

---

## 6. Seller upload — Step 5 confirmation

**File**: `app/shop/products/new/page.tsx`

In Step 5 **Categorization** summary:

- **Class type**: Shown when `formData.class_type` is set (from `CLASS_TYPES`).
- **Learner path**: When SPED, from `LEARNER_PATHS` by `formData.learner_path`.
- **Level**: When SPED non-graded and `formData.sped_level_id`, from `hierarchy.sped.levels`.
- **Strand**: When Regular and G11/12 and `formData.strand_id`, from `strands`.
- **Grade**: "N/A" when `isSpedNonGraded`, else grade name or "N/A".

Existing Grade, Subjects, Quarter, Weeks kept.

---

## 7. Other product card consumers

| Component | Change |
|-----------|--------|
| `components/recommendations/related-products.tsx` | Product type: grade/subject optional; strand, sped_level, class_type; seller first_name/last_name. Pass-through to ProductCard unchanged; API returns full shape. |
| `components/recommendations/personalized-recommendations.tsx` | Same type relaxations. |
| `components/recently-viewed/recently-viewed-section.tsx` | RecentlyViewedItem product type: grade/subject optional; strand, sped_level, class_type; seller first_name/last_name. Pass-through includes strand, sped_level, class_type. |
| `components/recently-viewed/recently-viewed-page-content.tsx` | Same interface and pass-through. |

---

## 8. Profile Teaching tab

Left unchanged (Option A). Phase 2 teacher preferences (Class type, SPED path, Strand, etc.) can be added later if required.

---

## Definition of done (from plan)

- ✅ Search, product detail, marketplace, and recommendation responses include `strand` and `sped_level` when applicable; products can have `grade === null`.
- ✅ ProductCard and ProductDetailLayout never assume `product.grade` exists; they show "Level • Subject" or "Grade • Strand • Subject" when that matches the product.
- ✅ Product detail breadcrumb and metadata are null-safe and reflect class type / strand / level where set.
- ✅ Step 5 (Review & Confirm) shows Class type, Learner path, Level (SPED non-graded), Strand (G11/12), and "N/A" Grade when appropriate.
- ✅ Profile Teaching tab unchanged.

---

## Files touched

| Area | File(s) |
|------|---------|
| Search API | `app/api/search/route.ts` |
| Product detail page | `app/products/[id]/page.tsx` |
| Product API GET/PUT | `app/api/products/[id]/route.ts` |
| Marketplace | `app/marketplace/page.tsx` |
| Related recommendations | `app/api/recommendations/related/[productId]/route.ts` |
| Personalized recommendations | `app/api/recommendations/personalized/route.ts` |
| Recently-viewed API | `app/api/recently-viewed/route.ts` |
| ProductCard | `components/products/product-card.tsx` |
| ProductDetailLayout | `components/products/product-detail-layout.tsx` |
| generateProductMetadata | `lib/seo/generate-metadata.ts` |
| Step 5 confirmation | `app/shop/products/new/page.tsx` |
| Related/personalized/recently-viewed types & pass-through | `components/recommendations/related-products.tsx`, `personalized-recommendations.tsx`, `components/recently-viewed/recently-viewed-section.tsx`, `recently-viewed-page-content.tsx` |

---

**Tech stack**: Next.js 16.1.1, @base-ui/react, Supabase client-side auth, local shadcn registry, no TanStack Query. Schema and migrations per `docs/implementationplan/database-schema-complete.md` and Phase 2 migrations (021–023).
