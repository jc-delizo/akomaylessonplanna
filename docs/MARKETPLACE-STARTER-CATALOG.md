# Marketplace starter catalog

The marketplace starter catalog is a reproducible set of 500 published resources. It gives every buyer-facing filter useful results while the organic seller catalog grows.

## What it creates

- 100 resources for each active product type: exams, lesson plans, RPMS tools, posters, and tarpaulins
- Coverage for every active grade, subject, Senior High School strand, curriculum, quarter, language, modality, teaching framework, and Week 1–9
- One genuine generated PDF and one unique WebP cover for every listing
- An `AkoMay Official Resources` seller profile reserved for platform-managed content
- Honest empty engagement metrics: no seeded sales, reviews, ratings, wishlists, or view counts

The documents are clearly described as platform-curated starter resources. They are not represented as official DepEd issuances, and their descriptions ask teachers to review and adapt them for their learners.

## Commands

Set `SUPABASE_URL` and `SUPABASE_SECRET_KEY` in the shell running the command. Credentials are never stored by the script or committed to the repository.

```bash
# Read the live taxonomy, build the 500-resource plan, and verify coverage.
# This is the default and does not change Supabase.
npm run catalog:plan

# Create or update the seller, storage objects, listings, and subject mappings.
npm run catalog:seed

# Verify the seeded database rows and sample files without rewriting them.
npm run catalog:verify

# Exercise every filter option through the deployed public API.
npm run catalog:verify-live
```

Use `MARKETPLACE_BASE_URL` or `--base-url=https://example.com` with `catalog:verify-live` to test another deployment.

## Rerun and ownership behavior

The seed is idempotent. Product IDs, slugs, and storage paths are deterministic for catalog version `v1`; rerunning it updates the same 500 resources instead of making duplicates. The database slug prefix is `starter-catalog-v1-`, and the storage path segment is `catalog-v1`.

The seed intentionally has no delete mode. Removing production catalog content should be an explicit, audited admin operation that first resolves the exact rows and objects carrying those identifiers.
