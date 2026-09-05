# Engineering Audit — 2026-09-05

## Executive summary

The application has a broad feature surface, but the original repository was
not ready for live financial transactions. This pass focused on the highest-risk
boundaries: authorization, webhook authentication, payment and withdrawal
integrity, purchased-file access, database privilege escalation, dependency
security, and repeatable CI checks.

Live checkout remains intentionally disabled by default. Provider-side
GCash/Maya payment initiation, disbursement, and refund operations are still
scaffolds and must be implemented and tested in a provider sandbox before real
money is accepted.

## Improvements completed in this pass

### Security and authorization

- Admin authorization now fails closed and requires a valid `admin_role`.
- Admin API routes perform privileged data access only after server-side role or
  permission checks. Legacy direct-client admin mutation policies were removed,
  and database triggers no longer treat a mutable profile role as a trusted
  service context.
- Admin invitations now use Supabase Auth's invitation flow, apply the requested
  role only after a successful invite, and roll back incomplete accounts.
- The first-super-admin bootstrap endpoint requires a dedicated secret, cannot
  create additional super admins, uses secure generated passwords, and rolls
  back incomplete profile creation.
- Login, signup, and OAuth callback redirects reject external redirect targets.
- Cron endpoints require `CRON_SECRET`; scheduled GET requests run the actual
  jobs instead of only reporting status.
- GCash and Maya callbacks require configured secrets, verify signatures with
  timing-safe comparisons, validate exact centavo amounts, and reject invalid
  payment state transitions.
- Resend webhooks verify the unmodified request body with the official SDK and
  claim provider event IDs before applying analytics updates.
- Public profile reads are restricted to an explicit safe column projection;
  email addresses, admin fields, verification data, and account state are no
  longer readable through the public `users` table grant.
- Facebook data-deletion callbacks validate signed requests, avoid deleting Auth
  accounts after a failed profile deletion, and persist a privacy-preserving
  confirmation status that users can check without authentication.
- Database triggers protect user roles, subscription and verification fields,
  product moderation fields, computed counters, review ownership, and review
  moderation fields from direct client mutation.
- Privileged database functions are revoked from public/authenticated roles and
  explicitly granted only to `service_role` where appropriate.
- Legacy definer functions for maintenance and global search analytics are now
  service-only; personal search-history writes verify that the requested user ID
  matches the authenticated user.

### Financial and entitlement integrity

- Successful payment completion, library grants, and sales counters now commit
  atomically in PostgreSQL.
- Payment references have a uniqueness guard to reduce replay risk.
- Download counters update atomically through a service-only function.
- Purchased files use short-lived signed URLs; the insecure raw-URL fallback was
  removed.
- Withdrawal requests reserve funds under an advisory transaction lock, include
  pending/processing reservations in the available balance, and exclude approved
  refunds from eligible earnings.
- Review eligibility now uses an actual purchased-and-downloaded library record;
  the previous function referenced columns that do not exist.

### Reliability and maintainability

- Updated Next.js, React, Supabase, Resend, and development tooling; the npm audit
  is clean at the time of this pass.
- Added unit tests for redirect sanitization, secret verification, bearer-token
  parsing, signatures, exact currency parsing, signed Facebook requests, and
  safe query-parameter handling.
- Added lint, type-check, test, and combined check scripts.
- Added GitHub Actions CI and Dependabot configuration.
- Added application-level loading, not-found, route error, and global error UI.
- Added production security headers.
- Corrected queries that still referenced the removed `users.name` column.
- Corrected admin queries that referenced stale order, moderation, and product
  fields, and made product-moderation transitions compare-and-set operations.
- Sanitized user-supplied PostgREST filter expressions and bounded pagination
  inputs across search, product, seller, messaging, and admin endpoints.
- Fixed middleware path matching and session-cookie propagation for protected
  admin routes.
- Reduced marketplace request waterfalls and removed debug ingestion calls.

## Deployment gates

Complete every item below before enabling production payments:

1. Back up the hosted database and apply
   `supabase/migrations/038_security_and_integrity_hardening.sql` in a staging
   Supabase project first. Check for duplicate non-null payment references before
   creating its unique index.
2. Configure independent high-entropy values for `CREATE_SUPER_ADMIN_SECRET`,
   `CRON_SECRET`, `GCASH_WEBHOOK_SECRET`, `MAYA_WEBHOOK_SECRET`, and
   `RESEND_WEBHOOK_SECRET`. Never reuse an API key as a webhook secret.
3. Keep `PAYMENTS_ENABLED=false` until GCash/Maya payment initiation is fully
   implemented and callback payload/signature rules are confirmed against the
   selected provider's current documentation.
4. Implement verified provider-side disbursements and refunds. Do not mark a
   withdrawal or refund completed before the provider confirms settlement.
5. Configure the Resend webhook endpoint and subscribe only to handled event
   types. Confirm retry behavior in staging.
6. Run the full CI suite against production-like environment values, then test
   purchase, replayed callback, duplicate callback, download, refund, and
   concurrent withdrawal scenarios end to end.

## Remaining findings

| Priority | Area | Remaining work |
| --- | --- | --- |
| Launch blocker | Payments | GCash/Maya initiation is not implemented; checkout is therefore disabled by default. |
| Launch blocker | Payouts/refunds | Actual disbursement and refund provider calls, webhooks, reconciliation, and failure recovery are not implemented. |
| High | File protection | Download authorization is stronger, but personalized PDF watermarking is still a TODO. |
| High | Database authorization | The highest-risk tables were hardened, but every legacy RLS policy needs adversarial integration tests, especially messaging and admin workflows. |
| High | Checkout creation | Order and order-item creation uses compensating cleanup rather than one database transaction and needs a client idempotency key. |
| High | Provider contracts | Payment callback fields and signature construction must be verified against the contracted GCash/Maya gateway, not generic examples. |
| High | Account deletion | Some accounts may require anonymization and a retained-record workflow for financial/legal records instead of immediate deletion; document and automate that lifecycle. |
| High | Side effects | Several email sends occur inline with state changes; adopt a transactional outbox so retries cannot lose or duplicate important notifications. |
| Medium | Test coverage | Unit coverage now exists for security helpers, but browser E2E, API integration, migration, RLS, concurrency, and accessibility tests are still needed. |
| Medium | Static analysis | ESLint has no errors, but the legacy codebase still has a large warning backlog, primarily `any` types and hook dependency warnings. |
| Medium | Abuse controls | In-process/API query limits can be bypassed across instances or through direct Supabase access; move critical limits to PostgreSQL or a shared store. |
| Medium | Operations | Add centralized error reporting, structured audit logs, payment reconciliation jobs, alerts, backup-restore drills, and secret rotation procedures. |
| Low | Product polish | Several notification emails, search-history persistence, admin search/counts, review-report UI, and cache optimizations remain marked TODO. |

## Verification record

The complete migration sequence, including migration 038, was applied to an
isolated PostgreSQL 17 database with local compatibility stubs for Supabase's
`auth` and `storage` schemas. Database assertions covered self-promotion,
product metric/moderation tampering, atomic payment completion, replay handling,
library grants, download counters, review ownership, view deduplication,
withdrawal reservation, refunded-order exclusion, definer-function grants, and
cross-user search-history denial.

The repository currently includes 35 focused unit tests. The expected checks are:

```bash
npm ci
npm run check
npm run build
npm audit --audit-level=high
```

For a hosted release, also run the migration and RLS integration suite in a
staging Supabase project. A generic PostgreSQL schema test cannot reproduce all
Supabase service defaults.
