-- Migration: 025_add_display_name.sql
-- Feature: Customize Shop - optional display name shown above full name on public seller page
-- Description: Add display_name to users table (nullable, max 255 chars)

ALTER TABLE users
ADD COLUMN IF NOT EXISTS display_name VARCHAR(255) NULL;
