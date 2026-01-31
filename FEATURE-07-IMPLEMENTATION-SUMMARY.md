# Feature 07: Seller Dashboard & Analytics – Implementation Summary

**Date:** January 31, 2026  
**Status:** ✅ **IMPLEMENTATION COMPLETE** (per plan scope)

---

## Overview

Feature 07 full implementation focused on data correctness, Pro/Pioneer tier distinctions, real charts (Recharts), and export functionality. Scheduled reports and real traffic sources were out of scope.

---

## 1. API and Data Correctness

### 1.1 Dashboard overview API (`app/api/seller/dashboard/overview/route.ts`)

- **Cache:** Removed single-metric cache read for overview; all overview metrics are computed on each request.
- **Sales trend:** Now compares current-period sales with previous-period completed order count; formula `(current - previous) / previous * 100` with division-by-zero handling.
- **Views trend:** Uses `product_views` table for period-over-period view counts; `totalViews` still sums `products.views_count`.

### 1.2 Analytics page revenue and data

- **Revenue:** Analytics page uses real `revenue` from `/api/seller/products` (per-product sum of `order_items.net_earnings` for completed orders).
- **Recommendations:** Pro/Pioneer fetches `/api/seller/analytics/recommendations` and renders dynamically; static block removed.
- **Pro APIs:** Analytics page calls `/api/seller/analytics/revenue` and `/api/seller/analytics/products` for charts and data.

### 1.3 Seller products API (`app/api/seller/products/route.ts`)

- Per-product `revenue` added: sum of `order_items.net_earnings` for completed orders; returned on each product object.

### 1.4–1.6 Analytics APIs – relation handling

- **Revenue, products, demographics:** Replaced manual `Array.isArray(item.order) ? item.order[0] : item.order` (and nested relations) with `getRelation()` from `@/lib/utils/supabase-relations` for consistency and null safety.

### 1.7 Export API (`app/api/seller/export/route.ts`)

- **Commission:** Earnings export uses seller `subscription_tier`: Pioneer 15%, Free/Pro 20%.
- **Subscription tier:** Passed into `processExportJob`; Excel/PDF remain placeholder (comments note xlsx/jspdf required for real files).

### 1.8 Traffic API (`app/api/seller/analytics/traffic/route.ts`)

- Comment added: traffic sources are mock data; real implementation would require schema (e.g. `product_views.source` or referrer tracking).

### 1.9 Orders API (`app/api/seller/orders/route.ts`)

- Status filter changed from PostgREST nested filter to in-memory filter after fetch to avoid issues with filtering on nested `order` relation.

---

## 2. Charts (Recharts)

- **Library:** `recharts` added to `package.json`.

### 2.1 Overview (`app/shop/page.tsx`)

- Pro/Pioneer revenue chart placeholder replaced with `AreaChart` using overview API `chartData`.

### 2.2 Earnings (`app/shop/earnings/page.tsx`)

- **Revenue by Month:** `BarChart` using `earnings.charts.revenueByMonth`.
- **Sales by Category:** `PieChart` using `earnings.charts.salesByCategory`.
- **Earnings Trend:** `AreaChart` using `earnings.charts.earningsTrend`.

### 2.3 Analytics (`app/shop/analytics/page.tsx`)

- **Revenue Over Time:** Chart from `/api/seller/analytics/revenue`.
- **Sales by Product:** Bar chart from `/api/seller/analytics/products` (top products).
- **Sales by Category:** Pie chart from `/api/seller/analytics/products` (category sales).
- **Recommendations:** Rendered from `/api/seller/analytics/recommendations` for Pro/Pioneer.

---

## 3. Export UI – Format Selector (Pro/Pioneer)

- **Orders** (`app/shop/orders/page.tsx`): Format selector (CSV; Pro/Pioneer: + Excel, PDF) and Export button; CSV = client-side, Excel/PDF = POST `/api/seller/export` then poll. Fixed button to call `handleExport` (was incorrectly `handleExportCSV`).
- **Analytics** (`app/shop/analytics/page.tsx`): Format selector + Export button; CSV = existing client-side CSV; Excel/PDF = POST `export_type: 'analytics_report'` and poll.
- **Products** (`app/shop/products/page.tsx`): Export section in header: format selector + Export button; CSV = client-side from current filtered products; Excel/PDF = POST `export_type: 'products'` and poll.
- **Earnings** (`app/shop/earnings/page.tsx`): Export section in header: format selector + Export button; all formats via POST `export_type: 'earnings'` and poll.

Free tier sees only CSV in the selector; Pro/Pioneer see CSV, Excel, PDF. Excel/PDF backend still produce placeholder content until xlsx/jspdf (or equivalent) are added.

---

## 4. Out of Scope (Not Implemented)

- **Scheduled reports:** UI and cron; deferred.
- **Excel/PDF binary generation:** Documented; requires additional libraries (xlsx, jspdf or similar).

---

## 5. Demographics, Funnel, Traffic (Wire Plan – Jan 2026)

Implemented per plan `wire_demographics_funnel_traffic_1c209665.plan.md`.

### 5.1 Buyer Demographics

- **API:** `GET /api/seller/analytics/demographics` now filters to **completed orders only** (`order.payment_status === 'completed'`). Response shape unchanged: `gradeLevels`, `regions`, `repeatCustomerRate`, `totalBuyers`, `repeatBuyers`.
- **Analytics page:** Pro/Pioneer fetch demographics in the same `useEffect` as revenue/products. **Buyer Demographics** card replaced with:
  - **Grade levels:** BarChart from `gradeLevels`.
  - **Regions:** PieChart from `regions`.
  - **Repeat customer rate:** Stat line with percentage and buyer counts.
  - Empty state: "No demographic data yet" when no data.

### 5.2 Conversion Funnel

- **Migration:** `031_seller_analytics_cart_events.sql` – table `cart_add_events` (id, product_id, seller_id, created_at); index (seller_id, created_at DESC); RLS: sellers SELECT own, authenticated INSERT.
- **Recording:** After inserting into `cart_items`, one row inserted into `cart_add_events` (product_id, seller_id from product) in:
  - `POST /api/cart` (add to cart)
  - `POST /api/wishlist/move-to-cart`
  - `POST /api/cart/merge-guest` (one event per product added)
- **API:** `GET /api/seller/analytics/funnel` (Pro/Pioneer). Returns `stages: [ { name: 'Product Views', value }, { name: 'Add to Cart', value }, { name: 'Purchases', value } ]` (views from product_views, cart from cart_add_events, purchases from order_items with completed order).
- **Analytics page:** **Conversion Funnel** card replaced with horizontal BarChart (three stages). Empty state: "No funnel data yet" when all values are 0.

### 5.3 Traffic Sources

- **Migration:** `032_analytics_product_views_source.sql` – add `product_views.source VARCHAR(100) NULL`; index on source where not null.
- **Recording:** 
  - `GET /api/products/[id]`: reads `?source=` from query, normalizes to enum (search, marketplace, direct, profile, category, other), inserts into `product_views` with source.
  - `POST /api/products/[id]/view`: accepts body `{ source }`, normalizes, inserts into `product_views` and increments `products.views_count`.
- **Product page:** `searchParams.source` passed to `ProductDetailLayout` as `trafficSource`; layout sends it in POST /view body.
- **Client source param:** Product links now include `?source=...` where context is known:
  - **ProductCard / SearchResultsGrid:** `trafficSource` prop; search results use "search", category page uses "category", marketplace/ProductTabs use "marketplace", related/recently-viewed use "other".
  - **SellerProductCard:** `trafficSource="direct"` from shop products page.
- **API:** `GET /api/seller/analytics/traffic` no longer mock; aggregates `product_views` by source for seller's products, returns `trafficSources: [ { source: label, count, percentage } ]` with SOURCE_LABELS (Search, Marketplace, Direct, Profile, Category, Other).
- **Analytics page:** **Traffic Sources** card replaced with PieChart from `trafficSources`. Empty state: "No traffic data yet".

### 5.4 Files Touched (Wire Plan)

| Area | Files |
|------|--------|
| Migrations | `supabase/migrations/031_seller_analytics_cart_events.sql`, `supabase/migrations/032_analytics_product_views_source.sql` |
| APIs | `app/api/seller/analytics/demographics/route.ts`, `app/api/seller/analytics/funnel/route.ts` (new), `app/api/seller/analytics/traffic/route.ts`, `app/api/products/[id]/route.ts`, `app/api/products/[id]/view/route.ts`, `app/api/cart/route.ts`, `app/api/wishlist/move-to-cart/route.ts`, `app/api/cart/merge-guest/route.ts` |
| Shop UI | `app/shop/analytics/page.tsx` |
| Product / layout | `app/products/[id]/page.tsx`, `components/products/product-detail-layout.tsx`, `components/products/product-card.tsx`, `components/products/seller-product-card.tsx`, `components/products/product-tabs.tsx`, `components/search/search-results-grid.tsx`, `components/recommendations/personalized-recommendations.tsx`, `components/recommendations/related-products.tsx`, `components/recently-viewed/recently-viewed-section.tsx`, `components/recently-viewed/recently-viewed-page-content.tsx`, `app/categories/[categorySlug]/page.tsx`, `app/shop/products/page.tsx` |

---

## Files Touched (Cumulative)

| Area | Files |
|------|--------|
| APIs | `app/api/seller/dashboard/overview/route.ts`, `app/api/seller/products/route.ts`, `app/api/seller/export/route.ts`, `app/api/seller/orders/route.ts`, `app/api/seller/analytics/revenue/route.ts`, `app/api/seller/analytics/products/route.ts`, `app/api/seller/analytics/demographics/route.ts`, `app/api/seller/analytics/traffic/route.ts`, `app/api/seller/analytics/funnel/route.ts`, `app/api/products/[id]/route.ts`, `app/api/products/[id]/view/route.ts`, `app/api/cart/route.ts`, `app/api/wishlist/move-to-cart/route.ts`, `app/api/cart/merge-guest/route.ts` |
| Shop UI | `app/shop/page.tsx`, `app/shop/orders/page.tsx`, `app/shop/earnings/page.tsx`, `app/shop/analytics/page.tsx`, `app/shop/products/page.tsx` |
| Migrations | `031_seller_analytics_cart_events.sql`, `032_analytics_product_views_source.sql` |
| Deps | `package.json` (recharts) |

---

## Reference

- Plan: `feature_07_seller_dashboard_full_implementation_c608efbc.plan.md`, `wire_demographics_funnel_traffic_1c209665.plan.md`
- Design: [docs/brainstorming/9-feature-07-seller-dashboard-and-analytics.md](docs/brainstorming/9-feature-07-seller-dashboard-and-analytics.md)
