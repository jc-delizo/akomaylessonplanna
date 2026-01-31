-- Migration: 028_reports_resolution_fields.sql
-- Description: Add resolution fields to reports table for admin user management
-- Feature: Admin User Management (Feature 09 extension)

-- Add resolved_by if not exists (migration 015 lacks it)
ALTER TABLE reports ADD COLUMN IF NOT EXISTS resolved_by UUID REFERENCES users(id);

-- Add resolution_type
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'reports' AND column_name = 'resolution_type'
  ) THEN
    ALTER TABLE reports ADD COLUMN resolution_type VARCHAR(30)
      CHECK (resolution_type IN ('dismissed', 'user_banned', 'user_warned', 'product_suspended', 'review_deleted'));
  END IF;
END $$;
