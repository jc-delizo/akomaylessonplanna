# Feature 01: Authentication & User Management - Implementation Summary

**Date:** January 2026  
**Status:** 🚧 **IN PROGRESS** (Signin/Signup UI update complete)

---

## Implementation Overview

Feature 01 (Authentication & User Management) is in progress. This document captures the **Signin/Signup UI redesign** completed in January 2026, plus related UI polish completed alongside it (standardized input field styling and the “Become a Seller” PRC upload control). Full feature completion (e.g. email verification for sellers, account deletion logic) remains pending.

---

## Signin/Signup UI Update (January 2026) ✅

### Scope

UI-only changes to the login and signup pages. No database or API changes.

### Changes Made

1. **Remove light orange background**
   - **File:** `app/(auth)/layout.tsx`
   - Replaced `bg-orange-50 dark:bg-orange-950` with `bg-background` so the auth area uses the app’s default page background.

2. **Remove card border on auth forms**
   - **Files:** `components/auth/signup-form.tsx`, `components/auth/login-form.tsx`, `app/(auth)/signup/page.tsx`, `app/(auth)/login/page.tsx`
   - Added `ring-0` to the Card `className` in both forms and both loading skeletons so the auth card has no visible border. Shared Card component unchanged.

3. **Standardize input field styling (login-style bottom border)**
   - **Files:** `components/ui/input.tsx`, `components/auth/signup-form.tsx`, `components/auth/login-form.tsx`
   - Standardized `Input` to a minimal bottom-border field style by default (no full outline, no rounded corners, focus via border color).
   - Removed now-redundant per-field `className` overrides from login/signup forms.
   - **Authoritative doc:** `docs/implementationplan/UI-FIELD-STYLING.md`

4. **“Continue with Gmail” button: black border + Google logo**
   - **Files:** `components/auth/signup-form.tsx`, `components/auth/login-form.tsx`
   - **Asset added:** `public/google-g.svg` — four-color Google “G” logo (blue, green, yellow, red) used to the left of the button label.
   - Button styling: `className="w-full border-2 border-black dark:border-white gap-2"` so the outline is a clear black (white in dark mode).
   - Button content: `<Image src="/google-g.svg" alt="" width={20} height={20} className="shrink-0" />` plus “Continue with Gmail” text.

### Files Touched

| File | Edits |
|------|--------|
| `app/(auth)/layout.tsx` | Neutral background (`bg-background`) |
| `components/auth/signup-form.tsx` | Card `ring-0`; inputs use standardized `Input`; Gmail button border + logo |
| `components/auth/login-form.tsx` | Card `ring-0`; inputs use standardized `Input`; Gmail button border + logo |
| `app/(auth)/signup/page.tsx` | Card `ring-0` in SignupLoading |
| `app/(auth)/login/page.tsx` | Card `ring-0` in LoginLoading |
| `public/google-g.svg` | **New** — Google “G” logo SVG |
| `components/ui/input.tsx` | **Updated default** input styling to match login-style bottom-border fields |
| `docs/implementationplan/UI-FIELD-STYLING.md` | **New** — authoritative field styling standard |
| `README.md` | Linked the field styling doc |

### Not Modified

- `components/ui/card.tsx`
- `components/ui/button.tsx`

Auth-specific changes remain at the call sites where possible, but the input field styling is now standardized at the shared `Input` component level (see `docs/implementationplan/UI-FIELD-STYLING.md`).

---

## Verification

- `/login` and `/signup`: neutral background, no card ring/border, borderless inputs, “Continue with Gmail” has black border and Google “G” on the left.
- Loading skeletons use the borderless Card.
- No regressions on other pages that use Card or Input.

---

## Nav: Sign In only, highlighted; Sign Up removed (January 2026) ✅

### Scope

When no user is logged in, show a single highlighted “Sign In” button in the nav (desktop and mobile) and remove the “Sign Up” button. Sign-up remains reachable from the login page via the “Sign up” link.

### Changes Made

- **File:** `components/navigation/main-nav.tsx`
- **Desktop:** Replaced the two links (plain “Sign In” + highlighted “Sign Up”) with one “Sign In” link using the same orange button styling as the former Sign Up (`bg-[#ff7200]`, `rounded-lg`, etc.).
- **Mobile:** Same change in the mobile menu: one “Sign In” link with orange styling, `onClick` to close the menu; Sign Up link removed.

### Related UI polish (same session)

- **Footer:** `components/layout/footer.tsx` — reduced vertical padding, gaps, and margins (e.g. `py-6` → `py-4`, `gap-6 mb-6` → `gap-4 mb-4`, `space-y-1.5` → `space-y-1`, `pt-4` → `pt-3`, section headings `mb-2` → `mb-1.5`) for a more compact footer.
- **Browse loader:** `app/marketplace/browse/page.tsx` — inline loading state (when filters change) now uses `PageLoader` with message “Loading products…” so it matches the Marketplace loader (Spinner + message) instead of the previous custom purple spinner.

---

## Navbar Signin/Signup animation (January 2026) ✅

### Scope

UI-only. Transition when navigating to `/login`, `/signup`, `/forgot-password`, or `/reset-password` from anywhere (including navbar "Sign In").

### Approach

Auth layout content wrapper uses tw-animate-css enter animation: fade-in plus light slide-in-from-bottom over 300ms. Reduced-motion handling via Tailwind's `motion-reduce:animate-none motion-reduce:opacity-100` so content appears immediately when the user prefers reduced motion.

### Changes Made

- **File:** `app/(auth)/layout.tsx`
- Inner content div (`max-w-md w-full space-y-8`) now has: `animate-in fade-in-0 duration-300 slide-in-from-bottom-2 motion-reduce:animate-none motion-reduce:opacity-100`.

### Files Touched

| File | Edits |
|------|--------|
| `app/(auth)/layout.tsx` | Animation classes on inner wrapper (animate-in, fade-in-0, duration-300, slide-in-from-bottom-2, motion-reduce overrides) |

### Verification

- From home or marketplace, click "Sign In" in desktop nav → `/login` shows with fade-in and light slide-up.
- Same from mobile menu.
- Navigate to `/signup` (e.g. via "Sign up" link on login) → signup content fades in.
- With OS "Reduce motion" enabled, auth content appears immediately (no animation).

---

## Sign In button spinner and no page-level loader (January 2026) ✅

Loading feedback was moved from the auth pages to the navbar Sign In button for a smoother transition: click Sign In → button shows spinner → sign-in page appears with the layout animation and no page-level spinner.

### Scope

UI-only. When navigating to `/login` (or `/signup` from the login "Sign up" link), the spinner is shown in the Sign In button (navbar) instead of on the auth page.

### Changes Made

- **File:** `components/navigation/main-nav.tsx` — Added `navigatingToLogin` state, `Loader2` import, `handleSignInClick`; desktop and mobile Sign In show spinner when navigating and use `router.push('/login')` on click. Spinner clears when the (auth) layout mounts (nav unmounts).
- **File:** `app/(auth)/login/page.tsx` — Suspense `fallback` set to `null`; removed `LoginLoading` (spinner + "Loading…") so the auth layout animates in with no page-level loader.
- **File:** `app/(auth)/signup/page.tsx` — Same: Suspense `fallback` set to `null`; removed `SignupLoading` for consistency.

### Verification

- From `/` or `/marketplace`, click "Sign In" in desktop nav → button shows spinner, then login page appears with layout animation and no spinner on the page.
- From mobile menu, tap "Sign In" → menu closes, button shows spinner, then login page appears as above.
- From `/login`, click "Sign up" → signup page appears with layout animation and no page-level spinner.

---

## Become a Seller PRC upload UI polish (January 2026) ✅

### Scope

UI-only changes to the `/become-seller` page to improve the PRC License upload control and align form fields with the app’s standardized input styling.

### Changes Made

- Replaced the native file input (“Choose file”) with a **dropzone-style** control (click or drag-and-drop) that shows the selected filename and supports clearing/replacing.
- Kept the same validation rules as before (PDF/JPG/PNG; max 10MB).
- Image uploads still show an inline preview.

### Files Touched

| File | Edits |
|------|--------|
| `components/ui/file-dropzone.tsx` | **New** — reusable dropzone-style file picker |
| `app/become-seller/page.tsx` | Uses `FileDropzone` for PRC upload; preview uses `next/image` |

---

## Next Steps (Feature 01)

Feature 01 remains in progress. Pending work includes (refer to [Design](docs/brainstorming/2-feature-01-authentication-user-management.md)):

- Email verification for sellers (deferred for buyers)
- Teacher verification (PRC) and “Become a Seller” flow
- Account deletion and 30-day grace period
- Any further auth UI or flow refinements

