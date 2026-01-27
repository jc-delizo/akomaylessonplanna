-- ============================================================================
-- DEV DATABASE RESET SCRIPT
-- Generated: 2026-01-26T14:55:16.249Z
-- Database: enxtvupbiezvwrnuzwsl
-- ⚠️  WARNING: This will DELETE ALL TABLES, DATA, AND SCHEMA OBJECTS!
-- ============================================================================

-- This script drops all tables, types, functions, and extensions
-- Use this to completely reset Dev database before applying Prod schema

-- ============================================================================
-- Drop All Tables (CASCADE will drop indexes, triggers, policies, etc.)
-- ============================================================================

DROP TABLE IF EXISTS admin_notes CASCADE;
DROP TABLE IF EXISTS announcement_stats CASCADE;
DROP TABLE IF EXISTS announcements CASCADE;
DROP TABLE IF EXISTS audit_log CASCADE;
DROP TABLE IF EXISTS cart_items CASCADE;
DROP TABLE IF EXISTS categories CASCADE;
DROP TABLE IF EXISTS conversations CASCADE;
DROP TABLE IF EXISTS disputes CASCADE;
DROP TABLE IF EXISTS followers CASCADE;
DROP TABLE IF EXISTS grade_subjects CASCADE;
DROP TABLE IF EXISTS grades CASCADE;
DROP TABLE IF EXISTS message_reports CASCADE;
DROP TABLE IF EXISTS message_templates CASCADE;
DROP TABLE IF EXISTS messages CASCADE;
DROP TABLE IF EXISTS order_items CASCADE;
DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS product_updates CASCADE;
DROP TABLE IF EXISTS product_views CASCADE;
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS review_flags CASCADE;
DROP TABLE IF EXISTS reviews CASCADE;
DROP TABLE IF EXISTS seller_response_times CASCADE;
DROP TABLE IF EXISTS subjects CASCADE;
DROP TABLE IF EXISTS support_tickets CASCADE;
DROP TABLE IF EXISTS teacher_id_verifications CASCADE;
DROP TABLE IF EXISTS ticket_messages CASCADE;
DROP TABLE IF EXISTS user_blocks CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS wishlist CASCADE;
DROP TABLE IF EXISTS withdrawal_requests CASCADE;

-- ============================================================================
-- Drop Custom Types (ENUMs)
-- ============================================================================

DROP TYPE IF EXISTS user_role CASCADE;
DROP TYPE IF EXISTS subscription_tier CASCADE;
DROP TYPE IF EXISTS product_status CASCADE;
DROP TYPE IF EXISTS product_type CASCADE;
DROP TYPE IF EXISTS order_status CASCADE;
DROP TYPE IF EXISTS review_status CASCADE;
DROP TYPE IF EXISTS message_status CASCADE;
DROP TYPE IF EXISTS dispute_status CASCADE;
DROP TYPE IF EXISTS admin_role CASCADE;
DROP TYPE IF EXISTS payment_status CASCADE;

-- ============================================================================
-- Drop Functions
-- ============================================================================

DROP FUNCTION IF EXISTS cleanup_old_recently_viewed() CASCADE;
DROP FUNCTION IF EXISTS cleanup_old_recently_viewed(UUID, VARCHAR) CASCADE;
DROP FUNCTION IF EXISTS cleanup_old_recently_viewed(VARCHAR) CASCADE;
DROP FUNCTION IF EXISTS limit_recently_viewed_per_user() CASCADE;
DROP FUNCTION IF EXISTS limit_recently_viewed_per_user(UUID, VARCHAR) CASCADE;
DROP FUNCTION IF EXISTS limit_recently_viewed_per_user(VARCHAR) CASCADE;
DROP FUNCTION IF EXISTS update_search_analytics_updated_at() CASCADE;
DROP FUNCTION IF EXISTS update_search_analytics_updated_at(UUID, VARCHAR) CASCADE;
DROP FUNCTION IF EXISTS update_search_analytics_updated_at(VARCHAR) CASCADE;
DROP FUNCTION IF EXISTS update_search_queries_updated_at() CASCADE;
DROP FUNCTION IF EXISTS update_search_queries_updated_at(UUID, VARCHAR) CASCADE;
DROP FUNCTION IF EXISTS update_search_queries_updated_at(VARCHAR) CASCADE;
DROP FUNCTION IF EXISTS upsert_user_search_history() CASCADE;
DROP FUNCTION IF EXISTS upsert_user_search_history(UUID, VARCHAR) CASCADE;
DROP FUNCTION IF EXISTS upsert_user_search_history(VARCHAR) CASCADE;
DROP FUNCTION IF EXISTS upsert_search_query() CASCADE;
DROP FUNCTION IF EXISTS upsert_search_query(UUID, VARCHAR) CASCADE;
DROP FUNCTION IF EXISTS upsert_search_query(VARCHAR) CASCADE;
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;
DROP FUNCTION IF EXISTS update_updated_at_column(UUID, VARCHAR) CASCADE;
DROP FUNCTION IF EXISTS update_updated_at_column(VARCHAR) CASCADE;
DROP FUNCTION IF EXISTS update_product_rating() CASCADE;
DROP FUNCTION IF EXISTS update_product_rating(UUID, VARCHAR) CASCADE;
DROP FUNCTION IF EXISTS update_product_rating(VARCHAR) CASCADE;

-- ============================================================================
-- Note: Extensions (pg_trgm, pgcrypto) are kept as they may be needed
-- If you need to drop extensions, uncomment below:
-- DROP EXTENSION IF EXISTS pg_trgm CASCADE;
-- DROP EXTENSION IF EXISTS pgcrypto CASCADE;
-- ============================================================================

-- Reset complete!
-- Next step: Apply complete schema using apply-complete-schema-to-dev.sql