-- Migration: 001_foundation.sql
-- Feature: Database Foundation
-- Description: Enable extensions, create ENUM types, core tables (users, grades, subjects), RLS policies, and indexes

-- ============================================================================
-- 1. Enable Extensions
-- ============================================================================

-- Enable extensions
-- Note: Using gen_random_uuid() from pgcrypto instead of gen_random_uuid() from uuid-ossp
-- as it's more reliable in Supabase environments
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- For fuzzy matching and full-text search
CREATE EXTENSION IF NOT EXISTS "pgcrypto"; -- For encryption (provides gen_random_uuid())

-- ============================================================================
-- 2. Create ENUM Types (if they don't exist)
-- ============================================================================

-- User Roles
DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('buyer', 'seller', 'admin');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Subscription Tiers
DO $$ BEGIN
  CREATE TYPE subscription_tier AS ENUM ('free', 'pro', 'pioneer');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Product Status
DO $$ BEGIN
  CREATE TYPE product_status AS ENUM ('draft', 'pending_review', 'published', 'rejected', 'suspended', 'deleted');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Payment Status (for future use)
DO $$ BEGIN
  CREATE TYPE payment_status AS ENUM ('pending', 'completed', 'failed');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Payment Method (for future use)
DO $$ BEGIN
  CREATE TYPE payment_method AS ENUM ('gcash', 'maya');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Order Status (for future use)
DO $$ BEGIN
  CREATE TYPE order_status AS ENUM ('pending', 'completed', 'failed', 'refunded');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Verification Status (for future use)
DO $$ BEGIN
  CREATE TYPE verification_status AS ENUM ('pending', 'approved', 'rejected');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- ============================================================================
-- 3. Create Core Tables
-- ============================================================================

-- Table: users
-- Purpose: Central user accounts with profiles, roles, subscriptions
CREATE TABLE IF NOT EXISTS users (
  -- Primary Key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Authentication
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255), -- Null for OAuth users
  name VARCHAR(255) NOT NULL,
  username VARCHAR(20) UNIQUE, -- For SEO-friendly URLs /sellers/[username]
  avatar_url TEXT,

  -- Email Verification (Feature 01 - Deferred for sellers only)
  email_verified BOOLEAN DEFAULT false,
  email_verified_at TIMESTAMP,

  -- Role & Permissions (Feature 01)
  role user_role DEFAULT 'buyer',
  is_verified_teacher BOOLEAN DEFAULT false,
  can_sell BOOLEAN DEFAULT false,

  -- Profile (Feature 01 & 02)
  bio TEXT,
  subjects_taught TEXT[], -- ['Math', 'Science']
  grade_levels_taught TEXT[], -- ['Grade 7', 'Grade 8']
  location_city VARCHAR(100),
  location_region VARCHAR(100),
  social_links JSONB, -- {facebook: '', instagram: '', youtube: ''}
  banner_url TEXT, -- Pro/Pioneer feature
  custom_accent_color VARCHAR(7), -- Pro/Pioneer: Hex color
  profile_completion_percent INTEGER DEFAULT 0,
  followers_count INTEGER DEFAULT 0,
  response_time_hours INTEGER,

  -- Subscription
  subscription_tier subscription_tier DEFAULT 'free',
  custom_commission_rate DECIMAL(5,2),
  is_pioneer BOOLEAN DEFAULT false,

  -- Payment
  gcash_number VARCHAR(20),
  maya_number VARCHAR(20),

  -- Notifications (Feature 06)
  email_notifications BOOLEAN DEFAULT true,

  -- Account Deletion (Feature 01 - 30-day grace period)
  marked_for_deletion BOOLEAN DEFAULT false,
  account_deletion_requested_at TIMESTAMP,
  deletion_scheduled_at TIMESTAMP,

  -- Admin
  is_banned BOOLEAN DEFAULT false,
  ban_reason TEXT,

  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  -- Constraints
  CHECK (profile_completion_percent >= 0 AND profile_completion_percent <= 100),
  CHECK (response_time_hours >= 0 OR response_time_hours IS NULL)
);

-- Table: grades
-- Purpose: Philippine K-12 grade levels
CREATE TABLE IF NOT EXISTS grades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(50) NOT NULL UNIQUE, -- "Grade 7", "Kindergarten"
  sort_order INTEGER NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Table: subjects
-- Purpose: School subjects (Math, Science, etc.)
CREATE TABLE IF NOT EXISTS subjects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL UNIQUE, -- "Mathematics", "Science"
  code VARCHAR(20) UNIQUE, -- "MATH", "SCI"
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Table: grade_subjects
-- Purpose: Many-to-many relationship (which subjects for which grades)
CREATE TABLE IF NOT EXISTS grade_subjects (
  grade_id UUID NOT NULL REFERENCES grades(id) ON DELETE CASCADE,
  subject_id UUID NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  PRIMARY KEY (grade_id, subject_id)
);

-- ============================================================================
-- 4. Create Indexes
-- ============================================================================

-- Users table indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_location ON users(location_region, location_city);
CREATE INDEX IF NOT EXISTS idx_users_subjects ON users USING GIN(subjects_taught);
CREATE INDEX IF NOT EXISTS idx_users_grades ON users USING GIN(grade_levels_taught);
CREATE INDEX IF NOT EXISTS idx_users_tier ON users(subscription_tier);
CREATE INDEX IF NOT EXISTS idx_users_verification ON users(is_verified_teacher);
CREATE INDEX IF NOT EXISTS idx_users_email_verified ON users(email_verified);
CREATE INDEX IF NOT EXISTS idx_users_deletion_scheduled ON users(deletion_scheduled_at) WHERE marked_for_deletion = true;
CREATE INDEX IF NOT EXISTS idx_users_created ON users(created_at DESC);

-- Grades table indexes
CREATE INDEX IF NOT EXISTS idx_grades_sort ON grades(sort_order);
CREATE INDEX IF NOT EXISTS idx_grades_active ON grades(is_active) WHERE is_active = true;

-- Subjects table indexes
CREATE INDEX IF NOT EXISTS idx_subjects_active ON subjects(is_active) WHERE is_active = true;

-- Grade_subjects table indexes
CREATE INDEX IF NOT EXISTS idx_grade_subjects_grade ON grade_subjects(grade_id);
CREATE INDEX IF NOT EXISTS idx_grade_subjects_subject ON grade_subjects(subject_id);

-- ============================================================================
-- 5. Create Trigger Function for Updated At
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to users table (drop if exists first)
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at 
  BEFORE UPDATE ON users
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 6. Enable Row Level Security (RLS)
-- ============================================================================

ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 7. Create RLS Policies for users table
-- ============================================================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Users can insert own profile" ON users;
DROP POLICY IF EXISTS "Anyone can view public profiles" ON users;
DROP POLICY IF EXISTS "Admins can select users" ON users;
DROP POLICY IF EXISTS "Admins can update users" ON users;
DROP POLICY IF EXISTS "Admins can delete users" ON users;
DROP POLICY IF EXISTS "Admins have full access to users" ON users;

-- Users can view their own data
CREATE POLICY "Users can view own profile"
  ON users FOR SELECT
  USING (id = auth.uid());

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- Users can insert their own profile (for signup)
-- This allows authenticated users to create their profile after auth signup
CREATE POLICY "Users can insert own profile"
  ON users FOR INSERT
  WITH CHECK (id = auth.uid());

-- Anyone can view public profile information (simplified for foundation)
-- This allows public access to seller profiles for browsing
CREATE POLICY "Anyone can view public profiles"
  ON users FOR SELECT
  USING (true);

-- Admins can select any user (separate policy to avoid recursion during INSERT)
CREATE POLICY "Admins can select users"
  ON users FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Admins can update any user
CREATE POLICY "Admins can update users"
  ON users FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Admins can delete any user
CREATE POLICY "Admins can delete users"
  ON users FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================================================
-- Migration Complete
-- ============================================================================
