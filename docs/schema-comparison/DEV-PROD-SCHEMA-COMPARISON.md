# Dev vs Prod Schema Comparison Report

**Date:** 2026-01-26T15:34:02.191Z
**Dev Database:** https://enxtvupbiezvwrnuzwsl.supabase.co
**Prod Database:** https://iokinyttkzmcnmznxgza.supabase.co

## Summary
- Dev Tables Found: 24
- Prod Tables Found: 24
- Tables in Both: 24
- Tables Only in Dev: 0
- Tables Only in Prod: 0
- Status: ✅ Match

## Table Comparison

### Tables in Dev (24)
- admin_notes
- audit_log
- cart_items
- conversations
- email_queue
- email_templates
- followers
- grade_subjects
- grades
- messages
- notifications
- order_items
- orders
- product_views
- products
- recently_viewed
- reports
- reviews
- search_analytics
- subjects
- teacher_id_verifications
- users
- wishlist
- withdrawal_requests

### Tables in Prod (24)
- admin_notes
- audit_log
- cart_items
- conversations
- email_queue
- email_templates
- followers
- grade_subjects
- grades
- messages
- notifications
- order_items
- orders
- product_views
- products
- recently_viewed
- reports
- reviews
- search_analytics
- subjects
- teacher_id_verifications
- users
- wishlist
- withdrawal_requests

### Tables in Both (24)
- admin_notes
- audit_log
- cart_items
- conversations
- email_queue
- email_templates
- followers
- grade_subjects
- grades
- messages
- notifications
- order_items
- orders
- product_views
- products
- recently_viewed
- reports
- reviews
- search_analytics
- subjects
- teacher_id_verifications
- users
- wishlist
- withdrawal_requests





## Users Table Structure Comparison

✅ **MATCH:**

- Dev: has `first_name`, has `last_name`, no `name`
- Prod: has `first_name`, has `last_name`, no `name`



## Limitations

This comparison only checks for table existence via REST API. For a complete schema comparison including:
- Column definitions
- Indexes
- Constraints
- RLS policies
- Triggers
- Functions

Please use one of these methods:

### Option 1: Supabase Dashboard SQL Editor
1. Go to Dev Supabase Dashboard → SQL Editor
2. Run: `SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name;`
3. Export results
4. Repeat for Prod
5. Compare manually

### Option 2: Supabase CLI (requires Docker)
```bash
# Login first
npx supabase login

# Extract Dev schema
npx supabase link --project-ref enxtvupbiezvwrnuzwsl
npx supabase db dump -s public -f dev-schema.sql

# Extract Prod schema
npx supabase link --project-ref iokinyttkzmcnmznxgza
npx supabase db dump -s public -f prod-schema.sql

# Compare
diff dev-schema.sql prod-schema.sql
```

### Option 3: pg_dump (requires database password)
```bash
# Get connection string from Supabase Dashboard → Settings → Database
pg_dump --schema-only --no-owner --no-acl "connection-string" > schema.sql
```

## Recommendations


- ✅ Table structures match!

- For detailed column/index comparison, use one of the methods above
