-- Migration: 027_platform_settings_marketplace_closed.sql
-- Purpose: Add platform_settings table for marketplace shutoff (and future flags).
-- Feature: Marketplace shutoff (admin toggle on /admin/announcements)

-- ============================================================================
-- 1. Create platform_settings table
-- ============================================================================

CREATE TABLE IF NOT EXISTS platform_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for updated_at (optional, for auditing)
CREATE INDEX IF NOT EXISTS idx_platform_settings_updated_at ON platform_settings(updated_at DESC);

-- ============================================================================
-- 2. Seed marketplace_closed (false = marketplace open)
-- ============================================================================

INSERT INTO platform_settings (key, value, updated_at)
VALUES ('marketplace_closed', 'false', NOW())
ON CONFLICT (key) DO NOTHING;

-- ============================================================================
-- 3. RLS: allow public read; allow update only for admin users
-- ============================================================================

ALTER TABLE platform_settings ENABLE ROW LEVEL SECURITY;

-- Anyone can read platform settings (for public GET /api/marketplace-status)
CREATE POLICY "Allow public read platform_settings"
  ON platform_settings FOR SELECT
  USING (true);

-- Only admin users can update (Super Admin check is in app layer)
CREATE POLICY "Only admins can update platform_settings"
  ON platform_settings FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

-- Only admins can insert (e.g. new keys in future)
CREATE POLICY "Only admins can insert platform_settings"
  ON platform_settings FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );
