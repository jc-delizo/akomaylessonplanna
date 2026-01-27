# Supabase Migrations Directory

This directory contains all database migrations for AKOMAYLESSONPLANNA.

## Migration Naming Convention

Migrations are numbered sequentially: `001_feature_name.sql`, `002_feature_name.sql`, etc.

**Format**: `[number]_[descriptive_name].sql`

**Examples**:
- `001_foundation.sql` - Foundation migration
- `005_feature_03_products.sql` - Feature 03 products migration
- `018_replace_name_with_first_last_name.sql` - Users table refactor

## Current Migrations

Total: **18 migrations** (001-018)

See `docs/DATABASE-MIGRATIONS-INDEX.md` for complete list with descriptions.

## Feature Organization

While migrations are stored in a flat structure (required by Supabase CLI), they are logically organized by feature:

- **Foundation** (001-002): Extensions, ENUMs, core tables, seed data
- **Feature 02** (003, 004, 016, 017, 018): User profiles & authentication
- **Feature 03** (005, 006): Products
- **Feature 04** (007): Shopping cart & checkout
- **Feature 05** (008): Reviews & ratings
- **Feature 06** (009): Social features
- **Feature 07** (010): Seller dashboard
- **Feature 08** (011): Advanced search
- **Feature 09** (012, 015): Admin panel
- **Feature 10** (013): Email system
- **Feature 11** (014): Messaging system

See `docs/migrations/MIGRATION-BY-FEATURE.md` for detailed feature breakdown.

## Creating New Migrations

1. **Create migration file**:
   ```bash
   npx supabase migration new feature_name
   ```
   This creates a timestamped file. Rename it to follow the convention: `019_feature_name.sql`

2. **Write migration SQL**:
   - Use `CREATE TABLE IF NOT EXISTS` for idempotency
   - Use `CREATE INDEX IF NOT EXISTS` for indexes
   - Wrap policies in existence checks (see examples in existing migrations)
   - Wrap triggers in `EXECUTE format()` blocks (see examples)

3. **Test on Dev**:
   ```bash
   npx supabase db push --db-url "dev-connection-string"
   ```

4. **Update Documentation**:
   - Add entry to `docs/DATABASE-MIGRATIONS-INDEX.md`
   - Update `docs/migrations/MIGRATION-BY-FEATURE.md` if new feature
   - Update `docs/migrations/MIGRATION-ORGANIZATION.md` if needed

5. **Apply to Prod** (after testing):
   ```bash
   npx supabase db push --db-url "prod-connection-string"
   ```

## Migration Best Practices

### DO ✓
- ✓ Use `IF NOT EXISTS` for all CREATE statements
- ✓ Wrap policies in existence checks (DO blocks)
- ✓ Wrap triggers in `EXECUTE format()` blocks
- ✓ Include descriptive comments
- ✓ Test on Dev before Prod
- ✓ Update documentation immediately

### DON'T ✗
- ✗ Never modify existing migration files
- ✗ Never skip Dev testing
- ✗ Don't delete migration files
- ✗ Don't use DROP statements without IF EXISTS
- ✗ Don't forget to update documentation

## Migration Order

**Critical**: Migrations must be applied in numerical order (001, 002, 003, ...).

Supabase tracks applied migrations in `supabase_migrations.schema_migrations` table. Skipping or reordering migrations will cause errors.

## Checking Migration Status

```bash
# List all migrations (local vs applied)
npx supabase migration list --linked

# Check schema differences
npx supabase db diff --linked
```

## Related Documentation

- `docs/DATABASE-MIGRATIONS-INDEX.md` - Complete migration index with details
- `docs/migrations/MIGRATION-BY-FEATURE.md` - Migrations grouped by feature
- `docs/migrations/MIGRATION-ORGANIZATION.md` - Organization guide
- `docs/implementationplan/database-schema-complete.md` - Complete schema documentation

## For AI Agents

When working with migrations:

1. **Check dependencies**: See `docs/DATABASE-MIGRATIONS-INDEX.md` dependency graph
2. **Find feature migrations**: Use `docs/migrations/MIGRATION-BY-FEATURE.md`
3. **Understand structure**: Read this README and migration organization docs
4. **Verify order**: Always apply migrations sequentially
5. **Test first**: Always test on Dev before Prod

Use `scripts/migration-utils.ts` for programmatic access to migration information.
