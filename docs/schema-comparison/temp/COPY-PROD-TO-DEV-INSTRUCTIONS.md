# Copy Prod Schema to Dev

## Overview
This guide will help you copy the complete schema from Prod to Dev.

## Step 1: Reset Dev Database

1. Go to Dev Supabase Dashboard: https://supabase.com/dashboard/project/enxtvupbiezvwrnuzwsl
2. Navigate to SQL Editor
3. Open: C:\Users\odvip\OneDrive\Desktop\JC\akomaylessonplanna\docs\schema-comparison\temp\reset-dev-database.sql
4. Copy and paste the SQL
5. Click "Run" to drop all tables in Dev

⚠️ **WARNING**: This will delete all data in Dev!

## Step 2: Apply Prod Schema

Since we cannot directly dump the schema via REST API, you have two options:

### Option A: Use Supabase Dashboard (Recommended)

1. Go to Prod Supabase Dashboard: https://supabase.com/dashboard/project/iokinyttkzmcnmznxgza
2. Navigate to Database → Schema
3. Use the "Copy Schema" feature if available
4. Or manually run migrations 001-018 in order

### Option B: Re-run All Migrations

Since Prod has migration 018 applied, you can:

1. Reset Dev (Step 1 above)
2. Apply all migrations 001-018 to Dev in order
3. This will recreate the exact same schema as Prod

## Step 3: Verify Schema Match

After applying schema, run:
```bash
npx tsx scripts/compare-schemas-simple.ts
npx tsx scripts/compare-users-table.ts
```

Both should show 100% match.

## Tables Found in Prod (28):
- admin_notes
- announcements
- audit_log
- cart_items
- categories
- conversations
- disputes
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
- support_tickets
- teacher_id_verifications
- users
- wishlist
- withdrawal_requests
