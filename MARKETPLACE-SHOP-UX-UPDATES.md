# Marketplace & My Shop UX Updates (Jan 2026)

**Summary**: Four incremental UX changes across marketplace, browse, and My Shop surfaces. Cross-feature (Feature 03/04/07/08); not a discrete feature.

---

## 1. Marketplace: Recommended for You + Default Tab

**Goal:** When the user’s profile **Teaching** tab is not complete, the "Recommended for You" tab is empty and shows a short note with a link to complete the profile. The **default** marketplace tab is **New Arrivals** (not Recommended).

**Changes:**
- **Server** ([app/marketplace/page.tsx](app/marketplace/page.tsx)): Profile fetch extended with `teaching_class_types`, `teaching_strand_ids`, `grade_levels_taught`, `subjects_taught`. Teaching "complete" uses the same rule as profile edit (at least one teaching preference set). (SPED removed Feb 2026) When user is logged in and teaching is **not** complete, recommended products are left empty (no fallback to trending) so the empty state can show the profile prompt. Passes `teachingComplete` to ProductTabs.
- **Client** ([components/products/product-tabs.tsx](components/products/product-tabs.tsx)): New prop `teachingComplete?: boolean` (default `true`). Default tab is **New Arrivals** (or first tab with content, then Recommended). "Recommended for You" tab is always shown (even when count is 0). Empty state for Recommended: when `!teachingComplete`, show "We don't know enough about you yet! Tell us what you teach—grade level and subjects—in your profile so we can recommend the best resources for you." and a "Complete your profile" link to `/profile/edit`; otherwise generic "No products available in this category."

---

## 2. Browse Page: 6-Column Layout (1 Filter + 5 Products)

**Goal:** One row of 6 columns: first column = filter sidebar, next 5 columns = product grid. Filter sidebar gets one full column for a wider layout.

**Changes:**
- [app/marketplace/browse/page.tsx](app/marketplace/browse/page.tsx): Grid changed from `lg:grid-cols-7` to `lg:grid-cols-6`; main content from `lg:col-span-6` to `lg:col-span-5`.
- [components/search/search-results-grid.tsx](components/search/search-results-grid.tsx): Product grid from `xl:grid-cols-4` to `xl:grid-cols-5`.

---

## 3. My Shop: Upload Button Visible on Products Tab

**Goal:** The "Upload Product" button in the nav stays visible when the user is on the Products tab (`/shop/products`).

**Changes:**
- [components/navigation/main-nav.tsx](components/navigation/main-nav.tsx): Removed the `pathname !== '/shop/products'` condition in both desktop and mobile so the Upload Product button is always shown for sellers on every page, including `/shop/products`.

---

## 4. My Shop Orders: Single List, No Status Tabs

**Goal:** Orders page shows one list of all orders by default. Status tabs (All / Completed / Pending / Failed) are removed. Status filter remains in the Filters sheet so users can still filter by status if needed.

**Changes:**
- [app/shop/orders/page.tsx](app/shop/orders/page.tsx): Removed the status tab row (the four buttons). Kept `statusFilter` state and the Filters sheet; default remains `'all'`. List continues to use filters (including status from the sheet).

---

## Reference

- Plan: `.cursor/plans/marketplace_browse_shop_ux_ba411d27.plan.md` (or equivalent in workspace)
- IMPLEMENTATION-STATUS: "Recent UX (Jan 2026)" section
