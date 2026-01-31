# Marketplace Shutoff – Implementation Summary

**Date**: January 2026  
**Feature**: Admin-controlled toggle to hide marketplace and browse product listings behind a blur overlay.

---

## Purpose

Allow the system admin (Super Admin) to "shut off" the marketplace and browse page by hiding all products behind a blur overlay and showing the message: "Still perfecting this website for you guys! Will open soon!" Products remain in the DOM but are visually hidden. The toggle is on `/admin/announcements`, to the left of the "Create Announcement" button.

---

## Database

- **Table**: `platform_settings`
  - `key` TEXT PRIMARY KEY
  - `value` JSONB NOT NULL
  - `updated_at` TIMESTAMPTZ DEFAULT NOW()
- **Row**: `key = 'marketplace_closed'`, `value = false` (marketplace open by default).
- **RLS**: Public read; only admin users can UPDATE/INSERT.
- **Migration**: `027_platform_settings_marketplace_closed.sql`

---

## API

- **GET /api/marketplace-status** (public, no auth): Returns `{ marketplaceClosed: boolean }`. Used by the browse page (client).
- **GET /api/admin/settings/platform** (Super Admin only): Response now includes `marketplaceClosed` from `platform_settings`, merged with static defaults.
- **PUT /api/admin/settings/platform** (Super Admin only): Accepts `marketplaceClosed?: boolean`; upserts `platform_settings` for key `marketplace_closed` and returns merged settings.

---

## UI

- **Admin:** `components/admin/marketplace-shutoff-toggle.tsx` – client component with Switch and label "Marketplace open". Renders only for Super Admin; fetches platform settings on mount and PUTs on toggle. Integrated in `app/admin/announcements/page.tsx` (left of Create Announcement).
- **Marketplace:** `app/marketplace/page.tsx` – server component calls `getMarketplaceClosed(supabase)`. When true, wraps hero + product content in a `relative` div and adds an overlay: `absolute inset-0 z-10 flex items-center justify-center backdrop-blur-md bg-white/60` with the message.
- **Browse:** `app/marketplace/browse/page.tsx` – client component fetches `GET /api/marketplace-status` in `useEffect`; when `marketplaceClosed`, same overlay and message as marketplace.

---

## Files

| Area   | File |
|--------|------|
| DB     | `supabase/migrations/027_platform_settings_marketplace_closed.sql` |
| Lib    | `lib/utils/marketplace-status.ts` (`getMarketplaceClosed`) |
| API    | `app/api/marketplace-status/route.ts` (GET) |
| API    | `app/api/admin/settings/platform/route.ts` (GET/PUT extended) |
| Admin  | `components/admin/marketplace-shutoff-toggle.tsx` |
| Admin  | `app/admin/announcements/page.tsx` (toggle integrated) |
| Buyer  | `app/marketplace/page.tsx` (overlay when closed) |
| Buyer  | `app/marketplace/browse/page.tsx` (overlay when closed) |

---

## Docs

- [IMPLEMENTATION-STATUS.md](IMPLEMENTATION-STATUS.md) – subsection "Marketplace shutoff (Admin)"
- [docs/DATABASE-MIGRATIONS-INDEX.md](docs/DATABASE-MIGRATIONS-INDEX.md) – migration 027
- [docs/implementationplan/database-schema-complete.md](docs/implementationplan/database-schema-complete.md) – `platform_settings` table
