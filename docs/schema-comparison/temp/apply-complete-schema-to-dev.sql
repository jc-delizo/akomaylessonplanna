-- ============================================================================
-- COMPLETE DATABASE SCHEMA (All Migrations 001-018)
-- Apply this to Dev database after resetting
-- This recreates the exact Prod schema
-- Generated: 2026-01-26T14:56:08.960Z
-- ============================================================================
-- Note: All policies and triggers use existence checks for idempotency
-- Safe to run multiple times
-- ============================================================================

-- ============================================================================
-- Migration: 001_foundation.sql
-- ============================================================================

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
-- Create trigger "update_users_updated_at" if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'update_users_updated_at' 
    AND tgrelid = 'users'::regclass::oid
  ) THEN
    EXECUTE format('CREATE TRIGGER %I %s EXECUTE FUNCTION %I()',
      'update_users_updated_at',
      'BEFORE UPDATE ON users FOR EACH ROW',
      'update_updated_at_column'
    );
  END IF;
END $$;


-- ============================================================================
-- 6. Enable Row Level Security (RLS)
-- ============================================================================

ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 7. Create RLS Policies for users table
-- ============================================================================

-- Policies will be created only if they don't exist









-- Users can view their own data
-- Create policy "Users can view own profile" if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'users' 
    AND policyname = 'Users can view own profile'
  ) THEN
    CREATE POLICY "Users can view own profile" ON users FOR SELECT USING (id = auth.uid());
  END IF;
END $$;

-- Users can update their own profile
-- Create policy "Users can update own profile" if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'users' 
    AND policyname = 'Users can update own profile'
  ) THEN
    CREATE POLICY "Users can update own profile" ON users FOR UPDATE USING (id = auth.uid())
  WITH CHECK (id = auth.uid());
  END IF;
END $$;

-- Users can insert their own profile (for signup)
-- This allows authenticated users to create their profile after auth signup
-- Create policy "Users can insert own profile" if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'users' 
    AND policyname = 'Users can insert own profile'
  ) THEN
    CREATE POLICY "Users can insert own profile" ON users FOR INSERT WITH CHECK (id = auth.uid());
  END IF;
END $$;

-- Anyone can view public profile information (simplified for foundation)
-- This allows public access to seller profiles for browsing
-- Create policy "Anyone can view public profiles" if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'users' 
    AND policyname = 'Anyone can view public profiles'
  ) THEN
    CREATE POLICY "Anyone can view public profiles" ON users FOR SELECT USING (true);
  END IF;
END $$;

-- Admins can select any user (separate policy to avoid recursion during INSERT)
-- Create policy "Admins can select users" if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'users' 
    AND policyname = 'Admins can select users'
  ) THEN
    CREATE POLICY "Admins can select users" ON users FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );
  END IF;
END $$;

-- Admins can update any user
-- Create policy "Admins can update users" if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'users' 
    AND policyname = 'Admins can update users'
  ) THEN
    CREATE POLICY "Admins can update users" ON users FOR UPDATE USING (
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
  END IF;
END $$;

-- Admins can delete any user
-- Create policy "Admins can delete users" if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'users' 
    AND policyname = 'Admins can delete users'
  ) THEN
    CREATE POLICY "Admins can delete users" ON users FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );
  END IF;
END $$;

-- ============================================================================
-- Migration Complete
-- ============================================================================



-- ============================================================================
-- Migration: 002_seed_data.sql
-- ============================================================================

-- Migration: 002_seed_data.sql
-- Feature: Seed Initial Data
-- Description: Seed grades, subjects, and grade-subject relationships

-- ============================================================================
-- 1. Seed Grades (Kindergarten to Grade 12)
-- ============================================================================

INSERT INTO grades (name, sort_order) VALUES
('Kindergarten', 1),
('Grade 1', 2),
('Grade 2', 3),
('Grade 3', 4),
('Grade 4', 5),
('Grade 5', 6),
('Grade 6', 7),
('Grade 7', 8),
('Grade 8', 9),
('Grade 9', 10),
('Grade 10', 11),
('Grade 11', 12),
('Grade 12', 13)
ON CONFLICT (name) DO NOTHING;

-- ============================================================================
-- 2. Seed Subjects
-- ============================================================================

INSERT INTO subjects (name, code) VALUES
('Mathematics', 'MATH'),
('Science', 'SCI'),
('English', 'ENG'),
('Filipino', 'FIL'),
('Araling Panlipunan', 'AP'),
('Edukasyon sa Pagpapakatao', 'ESP'),
('Music, Arts, Physical Education, and Health', 'MAPEH'),
('Technology and Livelihood Education', 'TLE'),
('Computer', 'COMP'),
('Physical Education', 'PE'),
('Health', 'HEALTH'),
('Values Education', 'VALED'),
('Mother Tongue', 'MT'),
('Reading', 'READ'),
('Writing', 'WRITE'),
('Social Studies', 'SOCSTUD'),
('History', 'HIST'),
('Geography', 'GEO'),
('Economics', 'ECON'),
('Chemistry', 'CHEM'),
('Physics', 'PHYS'),
('Biology', 'BIO'),
('Earth Science', 'EARTH'),
('Algebra', 'ALG'),
('Geometry', 'GEOM'),
('Trigonometry', 'TRIG'),
('Calculus', 'CALC'),
('Statistics', 'STAT'),
('Literature', 'LIT'),
('Grammar', 'GRAM'),
('Research', 'RES'),
('Practical Research', 'PRACRES'),
('General Mathematics', 'GENMATH'),
('Statistics and Probability', 'STATPROB'),
('Pre-Calculus', 'PRECALC'),
('Basic Calculus', 'BASICALC'),
('General Biology', 'GENBIO'),
('General Chemistry', 'GENCHEM'),
('General Physics', 'GENPHYS'),
('Earth and Life Science', 'EARTHLIFE'),
('Physical Science', 'PHYSCI'),
('Personal Development', 'PERDEV'),
('Understanding Culture, Society and Politics', 'UCSP'),
('Introduction to Philosophy of the Human Person', 'IPHP'),
('Contemporary Philippine Arts from the Regions', 'CPAR'),
('Media and Information Literacy', 'MIL'),
('Disaster Readiness and Risk Reduction', 'DRRR'),
('Empowerment Technologies', 'EMPTECH'),
('Entrepreneurship', 'ENTREP'),
('Organization and Management', 'ORG'),
('Fundamentals of Accountancy, Business and Management', 'FABM'),
('Applied Economics', 'APPECON'),
('Business Math', 'BUSMATH'),
('Business Finance', 'BUSFIN'),
('Principles of Marketing', 'POM'),
('Work Immersion', 'WORKIMM')
ON CONFLICT (name) DO NOTHING;

-- ============================================================================
-- 3. Seed Grade-Subject Relationships
-- ============================================================================

-- Elementary Grades (Kindergarten to Grade 6) - Core Subjects
INSERT INTO grade_subjects (grade_id, subject_id)
SELECT g.id, s.id 
FROM grades g, subjects s
WHERE g.sort_order BETWEEN 1 AND 7 -- Kindergarten to Grade 6
AND s.code IN ('MATH', 'SCI', 'ENG', 'FIL', 'AP', 'ESP', 'MAPEH', 'MT', 'READ', 'WRITE', 'VALED')
ON CONFLICT DO NOTHING;

-- Junior High School (Grade 7 to Grade 10) - Core Subjects
INSERT INTO grade_subjects (grade_id, subject_id)
SELECT g.id, s.id 
FROM grades g, subjects s
WHERE g.sort_order BETWEEN 8 AND 11 -- Grade 7 to Grade 10
AND s.code IN ('MATH', 'SCI', 'ENG', 'FIL', 'AP', 'ESP', 'MAPEH', 'TLE', 'COMP', 'PE', 'HEALTH')
ON CONFLICT DO NOTHING;

-- Senior High School (Grade 11 to Grade 12) - Core Subjects
INSERT INTO grade_subjects (grade_id, subject_id)
SELECT g.id, s.id 
FROM grades g, subjects s
WHERE g.sort_order BETWEEN 12 AND 13 -- Grade 11 to Grade 12
AND s.code IN ('ENG', 'FIL', 'GENMATH', 'STATPROB', 'EARTHLIFE', 'PHYSCI', 'PERDEV', 'UCSP', 'IPHP', 'CPAR', 'MIL', 'PE', 'HEALTH')
ON CONFLICT DO NOTHING;

-- Grade 7 Specific Subjects
INSERT INTO grade_subjects (grade_id, subject_id)
SELECT g.id, s.id 
FROM grades g, subjects s
WHERE g.name = 'Grade 7'
AND s.code IN ('ALG', 'GENBIO', 'EARTH')
ON CONFLICT DO NOTHING;

-- Grade 8 Specific Subjects
INSERT INTO grade_subjects (grade_id, subject_id)
SELECT g.id, s.id 
FROM grades g, subjects s
WHERE g.name = 'Grade 8'
AND s.code IN ('ALG', 'GENCHEM', 'EARTH')
ON CONFLICT DO NOTHING;

-- Grade 9 Specific Subjects
INSERT INTO grade_subjects (grade_id, subject_id)
SELECT g.id, s.id 
FROM grades g, subjects s
WHERE g.name = 'Grade 9'
AND s.code IN ('GEOM', 'GENCHEM', 'GENBIO')
ON CONFLICT DO NOTHING;

-- Grade 10 Specific Subjects
INSERT INTO grade_subjects (grade_id, subject_id)
SELECT g.id, s.id 
FROM grades g, subjects s
WHERE g.name = 'Grade 10'
AND s.code IN ('TRIG', 'GENPHYS', 'GENBIO', 'GENCHEM')
ON CONFLICT DO NOTHING;

-- Grade 11 STEM Track
INSERT INTO grade_subjects (grade_id, subject_id)
SELECT g.id, s.id 
FROM grades g, subjects s
WHERE g.name = 'Grade 11'
AND s.code IN ('PRECALC', 'BASICALC', 'GENBIO', 'GENCHEM', 'GENPHYS', 'DRRR', 'EMPTECH', 'ENTREP')
ON CONFLICT DO NOTHING;

-- Grade 12 STEM Track
INSERT INTO grade_subjects (grade_id, subject_id)
SELECT g.id, s.id 
FROM grades g, subjects s
WHERE g.name = 'Grade 12'
AND s.code IN ('BASICALC', 'GENBIO', 'GENCHEM', 'GENPHYS', 'WORKIMM')
ON CONFLICT DO NOTHING;

-- Grade 11 ABM Track
INSERT INTO grade_subjects (grade_id, subject_id)
SELECT g.id, s.id 
FROM grades g, subjects s
WHERE g.name = 'Grade 11'
AND s.code IN ('FABM', 'APPECON', 'ORG', 'BUSMATH', 'BUSFIN', 'POM', 'ENTREP')
ON CONFLICT DO NOTHING;

-- Grade 12 ABM Track
INSERT INTO grade_subjects (grade_id, subject_id)
SELECT g.id, s.id 
FROM grades g, subjects s
WHERE g.name = 'Grade 12'
AND s.code IN ('FABM', 'BUSFIN', 'POM', 'WORKIMM')
ON CONFLICT DO NOTHING;

-- ============================================================================
-- Migration Complete
-- ============================================================================



-- ============================================================================
-- Migration: 003_fix_users_rls_policies.sql
-- ============================================================================

-- Migration: 003_fix_users_rls_policies.sql
-- Feature: Fix RLS policies for users table
-- Description: Add missing INSERT policy and fix infinite recursion in admin policy

-- ============================================================================
-- Fix RLS Policies for users table
-- ============================================================================

-- Drop existing problematic policies









-- Users can view their own data
-- Create policy "Users can view own profile" if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'users' 
    AND policyname = 'Users can view own profile'
  ) THEN
    CREATE POLICY "Users can view own profile" ON users FOR SELECT USING (id = auth.uid());
  END IF;
END $$;

-- Users can update their own profile
-- Create policy "Users can update own profile" if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'users' 
    AND policyname = 'Users can update own profile'
  ) THEN
    CREATE POLICY "Users can update own profile" ON users FOR UPDATE USING (id = auth.uid())
  WITH CHECK (id = auth.uid());
  END IF;
END $$;

-- Users can insert their own profile (for signup)
-- This allows authenticated users to create their profile after auth signup
-- CRITICAL: This was missing and caused signup to fail
-- Create policy "Users can insert own profile" if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'users' 
    AND policyname = 'Users can insert own profile'
  ) THEN
    CREATE POLICY "Users can insert own profile" ON users FOR INSERT WITH CHECK (id = auth.uid());
  END IF;
END $$;

-- Anyone can view public profile information (simplified for foundation)
-- This allows public access to seller profiles for browsing
-- Create policy "Anyone can view public profiles" if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'users' 
    AND policyname = 'Anyone can view public profiles'
  ) THEN
    CREATE POLICY "Anyone can view public profiles" ON users FOR SELECT USING (true);
  END IF;
END $$;

-- Admins can select any user (separate policy to avoid recursion during INSERT)
-- FIXED: Split from ALL to avoid infinite recursion when inserting
-- Create policy "Admins can select users" if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'users' 
    AND policyname = 'Admins can select users'
  ) THEN
    CREATE POLICY "Admins can select users" ON users FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );
  END IF;
END $$;

-- Admins can update any user
-- Create policy "Admins can update users" if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'users' 
    AND policyname = 'Admins can update users'
  ) THEN
    CREATE POLICY "Admins can update users" ON users FOR UPDATE USING (
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
  END IF;
END $$;

-- Admins can delete any user
-- Create policy "Admins can delete users" if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'users' 
    AND policyname = 'Admins can delete users'
  ) THEN
    CREATE POLICY "Admins can delete users" ON users FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );
  END IF;
END $$;

-- ============================================================================
-- Migration Complete
-- ============================================================================



-- ============================================================================
-- Migration: 004_feature_02_profiles.sql
-- ============================================================================

-- Migration: 004_feature_02_profiles.sql
-- Feature: User Profiles & Profile Management (Feature 02)
-- Description: Create followers, profile_views, admin_notes, and audit_log tables with RLS policies and triggers

-- ============================================================================
-- 1. Create Followers Table
-- ============================================================================

CREATE TABLE IF NOT EXISTS followers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE, -- User who follows
  following_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE, -- Seller being followed
  created_at TIMESTAMP DEFAULT NOW(),

  -- Constraints
  UNIQUE(follower_id, following_id),
  CHECK (follower_id != following_id) -- Cannot follow yourself
);

-- Indexes for followers
CREATE INDEX IF NOT EXISTS idx_followers_follower ON followers(follower_id);
CREATE INDEX IF NOT EXISTS idx_followers_following ON followers(following_id);
CREATE INDEX IF NOT EXISTS idx_followers_created ON followers(created_at DESC);

-- ============================================================================
-- 2. Create Profile Views Table
-- ============================================================================

CREATE TABLE IF NOT EXISTS profile_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE, -- Profile being viewed
  viewer_id UUID REFERENCES users(id) ON DELETE SET NULL, -- User viewing (nullable for anonymous)
  viewed_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for profile_views
CREATE INDEX IF NOT EXISTS idx_profile_views_profile ON profile_views(profile_user_id, viewed_at DESC);
CREATE INDEX IF NOT EXISTS idx_profile_views_viewer ON profile_views(viewer_id);

-- ============================================================================
-- 3. Create Admin Notes Table
-- ============================================================================

CREATE TABLE IF NOT EXISTS admin_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  admin_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE, -- Admin who wrote note
  note TEXT NOT NULL CHECK (LENGTH(note) >= 1 AND LENGTH(note) <= 500),
  is_mention BOOLEAN DEFAULT false, -- If note includes @mention of another admin
  mentioned_admin UUID REFERENCES users(id), -- Admin mentioned in note
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for admin_notes
CREATE INDEX IF NOT EXISTS idx_admin_notes_user ON admin_notes(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_notes_admin ON admin_notes(admin_id);

-- ============================================================================
-- 4. Create Audit Log Table
-- ============================================================================

CREATE TABLE IF NOT EXISTS audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID NOT NULL REFERENCES users(id) ON DELETE SET NULL,
  action VARCHAR(50) NOT NULL, -- user_banned, product_approved, review_deleted, etc.
  entity_type VARCHAR(20) NOT NULL, -- user, product, review, report
  entity_id UUID NOT NULL, -- ID of the entity acted upon
  changes JSONB, -- Before/after values for edits
  reason TEXT, -- Why action was taken
  ip_address INET, -- Admin's IP address
  user_agent TEXT, -- Browser info
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for audit_log
CREATE INDEX IF NOT EXISTS idx_audit_log_admin ON audit_log(admin_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_log_entity ON audit_log(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_created ON audit_log(created_at DESC);

-- ============================================================================
-- Create trigger "trigger_update_followers_count" if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'trigger_update_followers_count' 
    AND tgrelid = 'followers'::regclass::oid
  ) THEN
    EXECUTE format('CREATE TRIGGER %I %s EXECUTE FUNCTION %I()',
      'trigger_update_followers_count',
      'AFTER INSERT OR DELETE ON followers FOR EACH ROW',
      'update_followers_count'
    );
  END IF;
END $$;


-- ============================================================================
-- 6. Enable Row Level Security (RLS)
-- ============================================================================

ALTER TABLE followers ENABLE ROW LEVEL SECURITY;
ALTER TABLE profile_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 7. Create RLS Policies for followers table
-- ============================================================================

-- Policies will be created only if they don't exist




-- Anyone can view followers (for follower count, but not full list)
-- Create policy "Anyone can view followers" if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'followers' 
    AND policyname = 'Anyone can view followers'
  ) THEN
    CREATE POLICY "Anyone can view followers" ON followers FOR SELECT USING (true);
  END IF;
END $$;

-- Users can follow/unfollow (manage their own follows)
-- Create policy "Users can manage own follows" if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'followers' 
    AND policyname = 'Users can manage own follows'
  ) THEN
    CREATE POLICY "Users can manage own follows" ON followers FOR ALL USING (follower_id = auth.uid())
  WITH CHECK (follower_id = auth.uid());
  END IF;
END $$;

-- Admins have full access
-- Create policy "Admins have full access to followers" if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'followers' 
    AND policyname = 'Admins have full access to followers'
  ) THEN
    CREATE POLICY "Admins have full access to followers" ON followers FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );
  END IF;
END $$;

-- ============================================================================
-- 8. Create RLS Policies for profile_views table
-- ============================================================================

-- Policies will be created only if they don't exist




-- Anyone can insert profile views (for tracking)
-- Create policy "Anyone can insert profile views" if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'profile_views' 
    AND policyname = 'Anyone can insert profile views'
  ) THEN
    CREATE POLICY "Anyone can insert profile views" ON profile_views FOR INSERT WITH CHECK (true);
  END IF;
END $$;

-- Users can view analytics for their own profile
-- Create policy "Users can view own profile analytics" if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'profile_views' 
    AND policyname = 'Users can view own profile analytics'
  ) THEN
    CREATE POLICY "Users can view own profile analytics" ON profile_views FOR SELECT USING (profile_user_id = auth.uid());
  END IF;
END $$;

-- Admins have full access
-- Create policy "Admins have full access to profile_views" if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'profile_views' 
    AND policyname = 'Admins have full access to profile_views'
  ) THEN
    CREATE POLICY "Admins have full access to profile_views" ON profile_views FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );
  END IF;
END $$;

-- ============================================================================
-- 9. Create RLS Policies for admin_notes table
-- ============================================================================

-- Policies will be created only if they don't exist


-- Only admins can access admin notes
-- Create policy "Admins can manage admin notes" if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'admin_notes' 
    AND policyname = 'Admins can manage admin notes'
  ) THEN
    CREATE POLICY "Admins can manage admin notes" ON admin_notes FOR ALL USING (
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
  END IF;
END $$;

-- ============================================================================
-- 10. Create RLS Policies for audit_log table
-- ============================================================================

-- Policies will be created only if they don't exist



-- Admins can view audit log
-- Create policy "Admins can view audit log" if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'audit_log' 
    AND policyname = 'Admins can view audit log'
  ) THEN
    CREATE POLICY "Admins can view audit log" ON audit_log FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );
  END IF;
END $$;

-- System can insert audit log (via service role or admin)
-- Create policy "System can insert audit log" if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'audit_log' 
    AND policyname = 'System can insert audit log'
  ) THEN
    CREATE POLICY "System can insert audit log" ON audit_log FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );
  END IF;
END $$;

-- ============================================================================
-- Migration Complete
-- ============================================================================



-- ============================================================================
-- Migration: 005_feature_03_products.sql
-- ============================================================================

-- Migration: 005_feature_03_products.sql
-- Feature: Product Listings & Management (Feature 03)
-- Description: Create products, product_updates, and product_views tables with RLS policies and indexes

-- ============================================================================
-- 1. Create Products Table
-- ============================================================================

CREATE TABLE IF NOT EXISTS products (
  -- Primary Key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Basic Info
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  slug VARCHAR(255) UNIQUE, -- SEO-friendly URL
  price DECIMAL(10,2) NOT NULL CHECK (price >= 50),

  -- Categorization (Feature 02.5)
  grade_id UUID NOT NULL REFERENCES grades(id),
  subject_id UUID NOT NULL REFERENCES subjects(id),
  quarter INTEGER CHECK (quarter IN (1, 2, 3, 4)),
  weeks INTEGER[], -- Multi-select: [1, 2, 3, 4, 5, 6, 7, 8]

  -- Product Types (Feature 03)
  product_type VARCHAR(50) NOT NULL, -- Exams, Lesson Plans, RPMS, Posters, Tarpaulins
  specific_type VARCHAR(50), -- DLL, DLP, Periodical Exam, Summative Test, etc.

  -- Type-specific metadata
  theme VARCHAR(100), -- For RPMS/Posters: Safari, Abstract, Floral
  size VARCHAR(50), -- For Posters/Tarpaulins: A4, 8x10, 3x5 feet
  season VARCHAR(50), -- For Tarpaulins: Christmas, Summer
  occasion VARCHAR(50), -- For Tarpaulins: Birthday, Graduation
  language VARCHAR(20) DEFAULT 'english', -- english, filipino, bilingual

  -- Files & Media
  file_urls TEXT[] NOT NULL, -- Main product files (private)
  cover_image_url TEXT, -- Cover image (public)
  preview_images TEXT[], -- First 3 pages as images (public)
  watermark_enabled BOOLEAN DEFAULT true,

  -- Version Management (Feature 03)
  current_version INTEGER DEFAULT 1,
  changelog TEXT, -- Latest version description
  original_created_at TIMESTAMP DEFAULT NOW(),

  -- Status & Moderation (Feature 03)
  status VARCHAR(20) CHECK (status IN ('draft', 'pending_review', 'published', 'rejected', 'suspended', 'deleted')) DEFAULT 'draft',
  rejection_reason TEXT,
  suspension_reason TEXT,
  review_count INTEGER DEFAULT 0, -- Track how many times submitted
  deleted_at TIMESTAMP, -- For 30-day soft delete

  -- Analytics (Feature 03)
  views_count INTEGER DEFAULT 0,
  unique_views_count INTEGER DEFAULT 0,
  sales_count INTEGER DEFAULT 0,
  conversion_rate DECIMAL(5,2), -- Calculated: sales / views

  -- Rating & Reviews
  avg_rating DECIMAL(3,2),
  reviews_count INTEGER DEFAULT 0,

  -- SEO & Discovery (Feature 03 + Feature 08)
  badges TEXT[], -- ["new", "featured", "trending", "bestseller"]
  search_score INTEGER DEFAULT 0, -- For Pro/Pioneer search analytics

  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  published_at TIMESTAMP,

  -- Constraints
  CHECK (current_version >= 1),
  CHECK (review_count >= 0),
  CHECK (views_count >= 0),
  CHECK (unique_views_count >= 0),
  CHECK (sales_count >= 0)
);

-- ============================================================================
-- 2. Create Product Updates Table
-- ============================================================================

CREATE TABLE IF NOT EXISTS product_updates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL,
  changelog TEXT NOT NULL, -- Required: "What's new in this version?" (min 20 chars)
  file_urls TEXT[], -- Files for this version
  cover_image_url TEXT,
  previous_version INTEGER,
  is_major_update BOOLEAN DEFAULT false, -- v1.0 → v2.0 vs v1.0 → v1.1
  created_at TIMESTAMP DEFAULT NOW(),
  created_by UUID NOT NULL REFERENCES users(id), -- Seller who created this version

  -- Constraints
  CHECK (version_number >= 1),
  CHECK (LENGTH(changelog) >= 20)
);

-- ============================================================================
-- 3. Create Product Views Table
-- ============================================================================

CREATE TABLE IF NOT EXISTS product_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL, -- Nullable for anonymous views
  viewed_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================================
-- 4. Create Indexes for Products Table
-- ============================================================================

-- Basic indexes
CREATE INDEX IF NOT EXISTS idx_products_seller ON products(seller_id);
CREATE INDEX IF NOT EXISTS idx_products_grade ON products(grade_id);
CREATE INDEX IF NOT EXISTS idx_products_subject ON products(subject_id);
CREATE INDEX IF NOT EXISTS idx_products_status ON products(status);
CREATE INDEX IF NOT EXISTS idx_products_type ON products(product_type);
CREATE INDEX IF NOT EXISTS idx_products_slug ON products(slug);

-- Indexes for sorting and filtering
CREATE INDEX IF NOT EXISTS idx_products_published ON products(published_at DESC) WHERE status = 'published';
CREATE INDEX IF NOT EXISTS idx_products_sales ON products(sales_count DESC) WHERE status = 'published';
CREATE INDEX IF NOT EXISTS idx_products_rating ON products(avg_rating DESC) WHERE status = 'published';
CREATE INDEX IF NOT EXISTS idx_products_views ON products(views_count DESC) WHERE status = 'published';
CREATE INDEX IF NOT EXISTS idx_products_price ON products(price) WHERE status = 'published';

-- Full-text search index (Feature 08)
CREATE INDEX IF NOT EXISTS idx_products_fts ON products USING GIN (to_tsvector('english', title || ' ' || description));

-- Composite indexes for common queries
CREATE INDEX IF NOT EXISTS idx_products_grade_subject ON products(grade_id, subject_id) WHERE status = 'published';
CREATE INDEX IF NOT EXISTS idx_products_sort_sales ON products(sales_count DESC, avg_rating DESC) WHERE status = 'published';

-- Index for deleted products cleanup
CREATE INDEX IF NOT EXISTS idx_products_deleted ON products(deleted_at) WHERE status = 'deleted';

-- ============================================================================
-- 5. Create Indexes for Product Updates Table
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_product_updates_product ON product_updates(product_id);
CREATE INDEX IF NOT EXISTS idx_product_updates_version ON product_updates(product_id, version_number);
CREATE INDEX IF NOT EXISTS idx_product_updates_created ON product_updates(created_at DESC);

-- ============================================================================
-- 6. Create Indexes for Product Views Table
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_product_views_product ON product_views(product_id, viewed_at DESC);
CREATE INDEX IF NOT EXISTS idx_product_views_user ON product_views(user_id);
CREATE INDEX IF NOT EXISTS idx_product_views_date ON product_views(viewed_at DESC);

-- ============================================================================
-- Create trigger "update_products_updated_at" if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'update_products_updated_at' 
    AND tgrelid = 'products'::regclass::oid
  ) THEN
    EXECUTE format('CREATE TRIGGER %I %s EXECUTE FUNCTION %I()',
      'update_products_updated_at',
      'BEFORE UPDATE ON products FOR EACH ROW',
      'update_updated_at_column'
    );
  END IF;
END $$;


-- ============================================================================
-- 8. Enable Row Level Security (RLS)
-- ============================================================================

ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_updates ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_views ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 9. Create RLS Policies for products table
-- ============================================================================

-- Policies will be created only if they don't exist






-- Anyone can view published products
-- Create policy "Anyone can view published products" if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'products' 
    AND policyname = 'Anyone can view published products'
  ) THEN
    CREATE POLICY "Anyone can view published products" ON products FOR SELECT USING (status = 'published');
  END IF;
END $$;

-- Sellers can view their own products (any status)
-- Create policy "Sellers can view own products" if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'products' 
    AND policyname = 'Sellers can view own products'
  ) THEN
    CREATE POLICY "Sellers can view own products" ON products FOR SELECT USING (seller_id = auth.uid());
  END IF;
END $$;

-- Sellers can insert products (if they have can_sell permission)
-- Create policy "Sellers can insert products" if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'products' 
    AND policyname = 'Sellers can insert products'
  ) THEN
    CREATE POLICY "Sellers can insert products" ON products FOR INSERT WITH CHECK (
    seller_id = auth.uid() 
    AND EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND can_sell = true
    )
  );
  END IF;
END $$;

-- Sellers can update their own products
-- Create policy "Sellers can update own products" if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'products' 
    AND policyname = 'Sellers can update own products'
  ) THEN
    CREATE POLICY "Sellers can update own products" ON products FOR UPDATE USING (seller_id = auth.uid())
  WITH CHECK (seller_id = auth.uid());
  END IF;
END $$;

-- Admins have full access to products
-- Create policy "Admins have full access to products" if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'products' 
    AND policyname = 'Admins have full access to products'
  ) THEN
    CREATE POLICY "Admins have full access to products" ON products FOR ALL USING (
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
  END IF;
END $$;

-- ============================================================================
-- 10. Create RLS Policies for product_updates table
-- ============================================================================

-- Policies will be created only if they don't exist





-- Anyone can view updates for published products
-- Create policy "Anyone can view product updates for published products" if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'product_updates' 
    AND policyname = 'Anyone can view product updates for published products'
  ) THEN
    CREATE POLICY "Anyone can view product updates for published products" ON product_updates FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM products
      WHERE products.id = product_updates.product_id
      AND products.status = 'published'
    )
  );
  END IF;
END $$;

-- Sellers can view updates for their own products
-- Create policy "Sellers can view own product updates" if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'product_updates' 
    AND policyname = 'Sellers can view own product updates'
  ) THEN
    CREATE POLICY "Sellers can view own product updates" ON product_updates FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM products
      WHERE products.id = product_updates.product_id
      AND products.seller_id = auth.uid()
    )
  );
  END IF;
END $$;

-- Sellers can insert updates for their own products
-- Create policy "Sellers can insert product updates" if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'product_updates' 
    AND policyname = 'Sellers can insert product updates'
  ) THEN
    CREATE POLICY "Sellers can insert product updates" ON product_updates FOR INSERT WITH CHECK (
    created_by = auth.uid()
    AND EXISTS (
      SELECT 1 FROM products
      WHERE products.id = product_updates.product_id
      AND products.seller_id = auth.uid()
    )
  );
  END IF;
END $$;

-- Admins have full access to product updates
-- Create policy "Admins have full access to product updates" if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'product_updates' 
    AND policyname = 'Admins have full access to product updates'
  ) THEN
    CREATE POLICY "Admins have full access to product updates" ON product_updates FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );
  END IF;
END $$;

-- ============================================================================
-- 11. Create RLS Policies for product_views table
-- ============================================================================

-- Policies will be created only if they don't exist




-- Anyone can insert product views (for tracking)
-- Create policy "Anyone can insert product views" if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'product_views' 
    AND policyname = 'Anyone can insert product views'
  ) THEN
    CREATE POLICY "Anyone can insert product views" ON product_views FOR INSERT WITH CHECK (true);
  END IF;
END $$;

-- Sellers can view analytics for their own products
-- Create policy "Sellers can view own product analytics" if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'product_views' 
    AND policyname = 'Sellers can view own product analytics'
  ) THEN
    CREATE POLICY "Sellers can view own product analytics" ON product_views FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM products
      WHERE products.id = product_views.product_id
      AND products.seller_id = auth.uid()
    )
  );
  END IF;
END $$;

-- Admins have full access to product views
-- Create policy "Admins have full access to product views" if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'product_views' 
    AND policyname = 'Admins have full access to product views'
  ) THEN
    CREATE POLICY "Admins have full access to product views" ON product_views FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );
  END IF;
END $$;

-- ============================================================================
-- Migration Complete
-- ============================================================================



-- ============================================================================
-- Migration: 006_storage_buckets_and_policies.sql
-- ============================================================================

-- Migration: 006_storage_buckets_and_policies.sql
-- Feature: Storage Buckets and RLS Policies
-- Description: Create storage buckets and RLS policies for file uploads

-- ============================================================================
-- 1. Create Storage Buckets
-- ============================================================================

-- Create user-avatars bucket (if it doesn't exist)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'user-avatars',
  'user-avatars',
  true, -- Public bucket (avatars are public)
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Create user-banners bucket (if it doesn't exist) - for Pro/Pioneer users
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'user-banners',
  'user-banners',
  true, -- Public bucket
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Create product-files bucket (private - for purchased products only)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'product-files',
  'product-files',
  false, -- Private bucket - requires purchase
  52428800, -- 50MB limit
  ARRAY[
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  ]
)
ON CONFLICT (id) DO NOTHING;

-- Create product-images bucket (public - for covers and previews)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'product-images',
  'product-images',
  true, -- Public bucket
  10485760, -- 10MB limit
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- 2. Storage RLS Policies for user-avatars bucket
-- ============================================================================

-- Allow authenticated users to upload to their own folder
-- Path format: {user_id}/avatar.{ext}
CREATE POLICY "Users can upload own avatar"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'user-avatars' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Allow public to read avatars (avatars are public)
CREATE POLICY "Public can read avatars"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'user-avatars');

-- Allow users to update their own avatars
CREATE POLICY "Users can update own avatar"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'user-avatars' AND
    (storage.foldername(name))[1] = auth.uid()::text
  )
  WITH CHECK (
    bucket_id = 'user-avatars' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Allow users to delete their own avatars
CREATE POLICY "Users can delete own avatar"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'user-avatars' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- ============================================================================
-- 3. Storage RLS Policies for user-banners bucket
-- ============================================================================

-- Allow Pro/Pioneer users to upload banners to their own folder
CREATE POLICY "Pro/Pioneer users can upload own banner"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'user-banners' AND
    (storage.foldername(name))[1] = auth.uid()::text AND
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND subscription_tier IN ('pro', 'pioneer')
    )
  );

-- Allow public to read banners (banners are public)
CREATE POLICY "Public can read banners"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'user-banners');

-- Allow Pro/Pioneer users to update their own banners
CREATE POLICY "Pro/Pioneer users can update own banner"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'user-banners' AND
    (storage.foldername(name))[1] = auth.uid()::text AND
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND subscription_tier IN ('pro', 'pioneer')
    )
  )
  WITH CHECK (
    bucket_id = 'user-banners' AND
    (storage.foldername(name))[1] = auth.uid()::text AND
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND subscription_tier IN ('pro', 'pioneer')
    )
  );

-- Allow Pro/Pioneer users to delete their own banners
CREATE POLICY "Pro/Pioneer users can delete own banner"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'user-banners' AND
    (storage.foldername(name))[1] = auth.uid()::text AND
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND subscription_tier IN ('pro', 'pioneer')
    )
  );

-- ============================================================================
-- 4. Storage RLS Policies for product-files bucket (PRIVATE)
-- ============================================================================

-- Allow sellers to upload product files to their own folder
-- Path format: {user_id}/{product_id}/file.{ext}
CREATE POLICY "Sellers can upload own product files"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'product-files' AND
    (storage.foldername(name))[1] = auth.uid()::text AND
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND can_sell = true
    )
  );

-- Allow sellers to read their own product files
CREATE POLICY "Sellers can read own product files"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'product-files' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Allow buyers who purchased the product to download files (TODO: Implement after Orders feature)
-- For now, only sellers and admins can access
CREATE POLICY "Admins can read all product files"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'product-files' AND
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Allow sellers to update their own product files
CREATE POLICY "Sellers can update own product files"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'product-files' AND
    (storage.foldername(name))[1] = auth.uid()::text
  )
  WITH CHECK (
    bucket_id = 'product-files' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Allow sellers to delete their own product files
CREATE POLICY "Sellers can delete own product files"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'product-files' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- ============================================================================
-- 5. Storage RLS Policies for product-images bucket (PUBLIC)
-- ============================================================================

-- Allow sellers to upload product images to their own folder
-- Path format: {user_id}/{product_id}/image.{ext}
CREATE POLICY "Sellers can upload own product images"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'product-images' AND
    (storage.foldername(name))[1] = auth.uid()::text AND
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND can_sell = true
    )
  );

-- Allow public to read product images (covers and previews are public)
CREATE POLICY "Public can read product images"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'product-images');

-- Allow sellers to update their own product images
CREATE POLICY "Sellers can update own product images"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'product-images' AND
    (storage.foldername(name))[1] = auth.uid()::text
  )
  WITH CHECK (
    bucket_id = 'product-images' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Allow sellers to delete their own product images
CREATE POLICY "Sellers can delete own product images"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'product-images' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- ============================================================================
-- Migration Complete
-- ============================================================================



-- ============================================================================
-- Migration: 007_feature_04_cart_and_checkout.sql
-- ============================================================================

-- Migration: 007_feature_04_cart_and_checkout.sql
-- Feature: Shopping Cart & Checkout Flow (Feature 04)
-- Description: Create cart_items, wishlist, orders, order_items, user_library, and withdrawal_requests tables with RLS policies and indexes

-- ============================================================================
-- 1. Add Column to Users Table
-- ============================================================================

-- Add column for cart abandonment email tracking
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS last_cart_abandonment_email_sent_at TIMESTAMP;

-- ============================================================================
-- 2. Create Cart Items Table
-- ============================================================================

CREATE TABLE IF NOT EXISTS cart_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW(),

  -- Constraints
  UNIQUE(user_id, product_id) -- One of each product per user (no quantity field)
);

-- Indexes for cart_items
CREATE INDEX IF NOT EXISTS idx_cart_items_user ON cart_items(user_id);
CREATE INDEX IF NOT EXISTS idx_cart_items_created ON cart_items(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_cart_items_product ON cart_items(product_id);

-- ============================================================================
-- 3. Create Wishlist Table
-- ============================================================================

CREATE TABLE IF NOT EXISTS wishlist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW(),

  UNIQUE(user_id, product_id)
);

-- Indexes for wishlist
CREATE INDEX IF NOT EXISTS idx_wishlist_user ON wishlist(user_id);
CREATE INDEX IF NOT EXISTS idx_wishlist_created ON wishlist(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_wishlist_product ON wishlist(product_id);

-- ============================================================================
-- 4. Create Orders Table
-- ============================================================================

CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_id UUID NOT NULL REFERENCES users(id),

  -- Order details
  total_amount DECIMAL(10,2) NOT NULL,
  total_commission DECIMAL(10,2) NOT NULL,
  item_count INTEGER NOT NULL,

  -- Payment
  payment_method VARCHAR(20) NOT NULL CHECK (payment_method IN ('gcash', 'maya')),
  payment_status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending', 'completed', 'failed')),
  payment_reference VARCHAR(100), -- Transaction ID from GCash/Maya
  payment_expires_at TIMESTAMP, -- 15-minute timeout (Feature 04)

  -- Buyer info (for refund requests)
  buyer_mobile_number VARCHAR(20), -- GCash/Maya number

  -- Refund
  refund_status VARCHAR(20) DEFAULT 'none' CHECK (refund_status IN ('none', 'requested', 'approved', 'rejected')),
  refund_reason TEXT,
  refund_requested_at TIMESTAMP,
  refund_processed_at TIMESTAMP,
  refund_reference VARCHAR(100), -- Refund transaction ID

  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP
);

-- Indexes for orders
CREATE INDEX IF NOT EXISTS idx_orders_buyer ON orders(buyer_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(payment_status);
CREATE INDEX IF NOT EXISTS idx_orders_created ON orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_refund ON orders(refund_status) WHERE refund_status != 'none';
CREATE INDEX IF NOT EXISTS idx_orders_payment_expires ON orders(payment_expires_at) WHERE payment_status = 'pending';

-- ============================================================================
-- 5. Create Order Items Table
-- ============================================================================

CREATE TABLE IF NOT EXISTS order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id),
  seller_id UUID NOT NULL REFERENCES users(id),

  -- Product snapshot (at time of purchase)
  product_title VARCHAR(255) NOT NULL,
  product_cover_image_url TEXT,

  -- Pricing
  price_at_purchase DECIMAL(10,2) NOT NULL,
  commission_rate DECIMAL(5,2) NOT NULL, -- 20.00 or 15.00
  commission_amount DECIMAL(10,2) NOT NULL,
  net_earnings DECIMAL(10,2) NOT NULL, -- For seller dashboard

  -- Version tracking
  product_version_at_purchase INTEGER NOT NULL DEFAULT 1,

  -- Download tracking
  download_count INTEGER DEFAULT 0,
  last_downloaded_at TIMESTAMP,

  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for order_items
CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_seller ON order_items(seller_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product ON order_items(product_id);

-- ============================================================================
-- 6. Create User Library Table
-- ============================================================================

CREATE TABLE IF NOT EXISTS user_library (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  order_item_id UUID REFERENCES order_items(id) ON DELETE SET NULL, -- Link to purchase
  purchased_at TIMESTAMP DEFAULT NOW(),
  download_count INTEGER DEFAULT 0,
  last_downloaded_at TIMESTAMP,

  UNIQUE(user_id, product_id)
);

-- Indexes for user_library
CREATE INDEX IF NOT EXISTS idx_user_library_user ON user_library(user_id);
CREATE INDEX IF NOT EXISTS idx_user_library_product ON user_library(product_id);
CREATE INDEX IF NOT EXISTS idx_user_library_purchased ON user_library(purchased_at DESC);

-- ============================================================================
-- 7. Create Withdrawal Requests Table
-- ============================================================================

CREATE TABLE IF NOT EXISTS withdrawal_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL CHECK (amount >= 500), -- Minimum ₱500
  payment_method VARCHAR(20) NOT NULL CHECK (payment_method IN ('gcash', 'maya')),
  payment_number VARCHAR(20) NOT NULL, -- GCash/Maya number to send to
  status VARCHAR(20) DEFAULT 'processing' CHECK (status IN ('processing', 'completed', 'failed')),
  processed_at TIMESTAMP,
  failure_reason TEXT,
  transaction_reference VARCHAR(100), -- Disbursement transaction ID
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for withdrawal_requests
CREATE INDEX IF NOT EXISTS idx_withdrawal_requests_seller ON withdrawal_requests(seller_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_withdrawal_requests_status ON withdrawal_requests(status);

-- ============================================================================
-- 8. Enable Row Level Security (RLS)
-- ============================================================================

ALTER TABLE cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE wishlist ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_library ENABLE ROW LEVEL SECURITY;
ALTER TABLE withdrawal_requests ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 9. RLS Policies for Cart Items
-- ============================================================================

-- Users can view their own cart items
CREATE POLICY "Users can view their own cart items"
  ON cart_items FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Users can insert their own cart items
CREATE POLICY "Users can add to their own cart"
  ON cart_items FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own cart items
CREATE POLICY "Users can remove their own cart items"
  ON cart_items FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- ============================================================================
-- 10. RLS Policies for Wishlist
-- ============================================================================

-- Users can view their own wishlist
CREATE POLICY "Users can view their own wishlist"
  ON wishlist FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Users can add to their own wishlist
CREATE POLICY "Users can add to their own wishlist"
  ON wishlist FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Users can remove from their own wishlist
CREATE POLICY "Users can remove from their own wishlist"
  ON wishlist FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- ============================================================================
-- 11. RLS Policies for Orders
-- ============================================================================

-- Buyers can view their own orders
CREATE POLICY "Buyers can view their own orders"
  ON orders FOR SELECT
  TO authenticated
  USING (auth.uid() = buyer_id);

-- Buyers can create their own orders
CREATE POLICY "Buyers can create their own orders"
  ON orders FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = buyer_id);

-- Buyers can update their own pending orders
CREATE POLICY "Buyers can update their own pending orders"
  ON orders FOR UPDATE
  TO authenticated
  USING (auth.uid() = buyer_id AND payment_status = 'pending')
  WITH CHECK (auth.uid() = buyer_id);

-- Sellers can view orders for their products (via order_items join)
-- This is handled through order_items policies

-- ============================================================================
-- 12. RLS Policies for Order Items
-- ============================================================================

-- Buyers can view order items for their orders
CREATE POLICY "Buyers can view their order items"
  ON order_items FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = order_items.order_id
      AND orders.buyer_id = auth.uid()
    )
  );

-- System can create order items (via service role)
-- Note: Order items are created server-side, not by users directly

-- Sellers can view order items for their products
CREATE POLICY "Sellers can view their order items"
  ON order_items FOR SELECT
  TO authenticated
  USING (auth.uid() = seller_id);

-- ============================================================================
-- 13. RLS Policies for User Library
-- ============================================================================

-- Users can view their own library
CREATE POLICY "Users can view their own library"
  ON user_library FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- System can add to user library (via service role)
-- Note: Library items are created server-side after payment completion

-- Users can update download count (via API)
CREATE POLICY "Users can update their own library download count"
  ON user_library FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ============================================================================
-- 14. RLS Policies for Withdrawal Requests
-- ============================================================================

-- Sellers can view their own withdrawal requests
CREATE POLICY "Sellers can view their own withdrawal requests"
  ON withdrawal_requests FOR SELECT
  TO authenticated
  USING (auth.uid() = seller_id);

-- Sellers can create their own withdrawal requests
CREATE POLICY "Sellers can create their own withdrawal requests"
  ON withdrawal_requests FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = seller_id);

-- System can update withdrawal status (via service role)
-- Note: Status updates are handled server-side

-- ============================================================================
-- 15. Create Function to Update Updated At Timestamp
-- ============================================================================

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for orders table
-- Create trigger "update_orders_updated_at" if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'update_orders_updated_at' 
    AND tgrelid = 'orders'::regclass::oid
  ) THEN
    EXECUTE format('CREATE TRIGGER %I %s EXECUTE FUNCTION %I()',
      'update_orders_updated_at',
      'BEFORE UPDATE ON orders FOR EACH ROW',
      'update_updated_at_column'
    );
  END IF;
END $$;


-- ============================================================================
-- 16. Create Function to Handle Payment Timeout
-- ============================================================================

-- Function to mark expired payments as failed
-- This should be called by a scheduled job (cron, pg_cron, or external scheduler)
CREATE OR REPLACE FUNCTION handle_payment_timeout()
RETURNS INTEGER AS $$
DECLARE
  updated_count INTEGER;
BEGIN
  UPDATE orders
  SET 
    payment_status = 'failed',
    updated_at = NOW()
  WHERE 
    payment_status = 'pending'
    AND payment_expires_at IS NOT NULL
    AND payment_expires_at < NOW();
  
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RETURN updated_count;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 17. Create Function to Increment Product Sales
-- ============================================================================

-- Function to increment product sales count
CREATE OR REPLACE FUNCTION increment_product_sales(product_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE products
  SET 
    sales_count = COALESCE(sales_count, 0) + 1,
    updated_at = NOW()
  WHERE id = product_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- Migration Complete
-- ============================================================================

-- Summary:
-- ✅ Created cart_items table (one product per user, no quantity)
-- ✅ Created wishlist table
-- ✅ Created orders table (with payment timeout and refund fields)
-- ✅ Created order_items table (with product snapshots and earnings)
-- ✅ Created user_library table (purchased products access)
-- ✅ Created withdrawal_requests table (seller payouts)
-- ✅ Added last_cart_abandonment_email_sent_at to users table
-- ✅ Enabled RLS on all tables
-- ✅ Created RLS policies for all tables
-- ✅ Created indexes for performance
-- ✅ Created trigger for updated_at timestamp
-- ✅ Created function for payment timeout handling



-- ============================================================================
-- Migration: 008_feature_05_reviews.sql
-- ============================================================================

-- Migration: 008_feature_05_reviews.sql
-- Feature: Reviews & Ratings (Feature 05)
-- Description: Create reviews and review_flags tables with RLS policies, indexes, and trigger functions

-- ============================================================================
-- 1. Ensure users table has review-related columns
-- ============================================================================

ALTER TABLE users 
ADD COLUMN IF NOT EXISTS avg_rating DECIMAL(3,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS reviews_count INTEGER DEFAULT 0;

-- ============================================================================
-- 2. Create Reviews Table
-- ============================================================================

CREATE TABLE IF NOT EXISTS reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  buyer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  verified_purchase BOOLEAN NOT NULL DEFAULT true,
  seller_response TEXT,
  is_edited BOOLEAN DEFAULT false,
  is_flagged BOOLEAN DEFAULT false,
  flag_reason TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),

  -- Constraints
  UNIQUE(product_id, buyer_id) -- One review per product per buyer
);

-- Indexes for reviews
CREATE INDEX IF NOT EXISTS idx_reviews_product ON reviews(product_id);
CREATE INDEX IF NOT EXISTS idx_reviews_buyer ON reviews(buyer_id);
CREATE INDEX IF NOT EXISTS idx_reviews_created ON reviews(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reviews_flagged ON reviews(is_flagged) WHERE is_flagged = true;
CREATE INDEX IF NOT EXISTS idx_reviews_rating ON reviews(rating);

-- ============================================================================
-- 3. Create Review Flags Table
-- ============================================================================

CREATE TABLE IF NOT EXISTS review_flags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id UUID NOT NULL REFERENCES reviews(id) ON DELETE CASCADE,
  flag_type VARCHAR(50) NOT NULL, -- 'profanity', 'spam', 'excessive_caps', 'excessive_punctuation', 'manual_report'
  flag_source VARCHAR(20) NOT NULL CHECK (flag_source IN ('automatic', 'manual')),
  reporter_id UUID REFERENCES users(id), -- If manual flag
  reason TEXT,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'dismissed')),
  reviewed_by UUID REFERENCES users(id), -- Admin who reviewed
  reviewed_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Indexes for review_flags
CREATE INDEX IF NOT EXISTS idx_review_flags_status ON review_flags(status);
CREATE INDEX IF NOT EXISTS idx_review_flags_review ON review_flags(review_id);
CREATE INDEX IF NOT EXISTS idx_review_flags_reviewed ON review_flags(reviewed_by);
CREATE INDEX IF NOT EXISTS idx_review_flags_created ON review_flags(created_at DESC);

-- ============================================================================
-- 4. Enable Row Level Security
-- ============================================================================

ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE review_flags ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 5. RLS Policies for Reviews
-- ============================================================================

-- Anyone can view non-flagged reviews for published products
CREATE POLICY "Public can view non-flagged reviews"
  ON reviews FOR SELECT
  TO public
  USING (
    is_flagged = false AND
    EXISTS (
      SELECT 1 FROM products 
      WHERE products.id = reviews.product_id 
      AND products.status = 'published'
    )
  );

-- Buyers can view their own reviews (even if flagged)
CREATE POLICY "Buyers can view own reviews"
  ON reviews FOR SELECT
  TO authenticated
  USING (auth.uid() = buyer_id);

-- Buyers can create reviews (eligibility checked in API)
CREATE POLICY "Buyers can create reviews"
  ON reviews FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = buyer_id);

-- Buyers can update their own reviews within 7 days
CREATE POLICY "Buyers can edit own reviews within 7 days"
  ON reviews FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = buyer_id AND
    created_at > NOW() - INTERVAL '7 days'
  )
  WITH CHECK (auth.uid() = buyer_id);

-- Sellers can view reviews for their products
CREATE POLICY "Sellers can view reviews for their products"
  ON reviews FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM products
      WHERE products.id = reviews.product_id
      AND products.seller_id = auth.uid()
    )
  );

-- Sellers can respond to reviews on their products
CREATE POLICY "Sellers can respond to reviews"
  ON reviews FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM products
      WHERE products.id = reviews.product_id
      AND products.seller_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM products
      WHERE products.id = reviews.product_id
      AND products.seller_id = auth.uid()
    )
  );

-- Admins can view all reviews
CREATE POLICY "Admins can view all reviews"
  ON reviews FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- Admins can update all reviews (for moderation)
CREATE POLICY "Admins can update all reviews"
  ON reviews FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- Admins can delete reviews
CREATE POLICY "Admins can delete reviews"
  ON reviews FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- ============================================================================
-- 6. RLS Policies for Review Flags
-- ============================================================================

-- Admins can view all flags
CREATE POLICY "Admins can view all review flags"
  ON review_flags FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- Anyone can create flags (automatic or manual)
CREATE POLICY "Anyone can flag reviews"
  ON review_flags FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Admins can update flags (for moderation decisions)
CREATE POLICY "Admins can update review flags"
  ON review_flags FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- ============================================================================
-- 7. Function to Update Product Review Statistics
-- ============================================================================

CREATE OR REPLACE FUNCTION update_product_review_stats()
RETURNS TRIGGER AS $$
BEGIN
  -- Update product's avg_rating and reviews_count
  UPDATE products
  SET 
    avg_rating = (
      SELECT COALESCE(AVG(rating), 0)
      FROM reviews
      WHERE reviews.product_id = COALESCE(NEW.product_id, OLD.product_id)
      AND reviews.is_flagged = false
    ),
    reviews_count = (
      SELECT COUNT(*)
      FROM reviews
      WHERE reviews.product_id = COALESCE(NEW.product_id, OLD.product_id)
      AND reviews.is_flagged = false
    )
  WHERE id = COALESCE(NEW.product_id, OLD.product_id);

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Trigger: Update product stats after review insert/update/delete
-- Create trigger "trigger_update_product_review_stats" if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'trigger_update_product_review_stats' 
    AND tgrelid = 'reviews'::regclass::oid
  ) THEN
    EXECUTE format('CREATE TRIGGER %I %s EXECUTE FUNCTION %I()',
      'trigger_update_product_review_stats',
      'AFTER INSERT OR UPDATE OR DELETE ON reviews FOR EACH ROW',
      'update_product_review_stats'
    );
  END IF;
END $$;


-- ============================================================================
-- 8. Function to Update Seller Review Statistics
-- ============================================================================

CREATE OR REPLACE FUNCTION update_seller_review_stats()
RETURNS TRIGGER AS $$
DECLARE
  seller_id_val UUID;
BEGIN
  -- Get seller_id from product
  SELECT seller_id INTO seller_id_val
  FROM products
  WHERE id = COALESCE(NEW.product_id, OLD.product_id);

  IF seller_id_val IS NOT NULL THEN
    -- Update seller's avg_rating and reviews_count
    UPDATE users
    SET 
      avg_rating = (
        SELECT COALESCE(AVG(r.rating), 0)
        FROM reviews r
        JOIN products p ON r.product_id = p.id
        WHERE p.seller_id = seller_id_val
        AND r.is_flagged = false
      ),
      reviews_count = (
        SELECT COUNT(*)
        FROM reviews r
        JOIN products p ON r.product_id = p.id
        WHERE p.seller_id = seller_id_val
        AND r.is_flagged = false
      )
    WHERE id = seller_id_val;
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Trigger: Update seller stats after review insert/update/delete
-- Create trigger "trigger_update_seller_review_stats" if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'trigger_update_seller_review_stats' 
    AND tgrelid = 'reviews'::regclass::oid
  ) THEN
    EXECUTE format('CREATE TRIGGER %I %s EXECUTE FUNCTION %I()',
      'trigger_update_seller_review_stats',
      'AFTER INSERT OR UPDATE OR DELETE ON reviews FOR EACH ROW',
      'update_seller_review_stats'
    );
  END IF;
END $$;


-- ============================================================================
-- 9. Function to Check Review Eligibility
-- ============================================================================

CREATE OR REPLACE FUNCTION check_review_eligibility(
  p_user_id UUID,
  p_product_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
  has_purchased BOOLEAN;
  has_downloaded BOOLEAN;
BEGIN
  -- Check if user has purchased the product
  SELECT EXISTS (
    SELECT 1
    FROM order_items oi
    JOIN orders o ON oi.order_id = o.id
    WHERE oi.product_id = p_product_id
    AND o.user_id = p_user_id
    AND o.status = 'completed'
  ) INTO has_purchased;

  -- Check if user has downloaded the product
  SELECT EXISTS (
    SELECT 1
    FROM order_items oi
    JOIN orders o ON oi.order_id = o.id
    WHERE oi.product_id = p_product_id
    AND o.user_id = p_user_id
    AND o.status = 'completed'
    AND oi.download_count > 0
  ) INTO has_downloaded;

  -- User must have both purchased AND downloaded
  RETURN has_purchased AND has_downloaded;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 10. Function to Auto-flag Review
-- ============================================================================

CREATE OR REPLACE FUNCTION auto_flag_review(
  p_review_id UUID,
  p_flag_type VARCHAR(50),
  p_reason TEXT
)
RETURNS VOID AS $$
BEGIN
  -- Mark review as flagged
  UPDATE reviews
  SET 
    is_flagged = true,
    flag_reason = p_reason
  WHERE id = p_review_id;

  -- Create flag record
  INSERT INTO review_flags (review_id, flag_type, flag_source, reason, status)
  VALUES (p_review_id, p_flag_type, 'automatic', p_reason, 'pending');
END;
$$ LANGUAGE plpgsql;



-- ============================================================================
-- Migration: 009_feature_06_social_features.sql
-- ============================================================================

-- Migration: 009_feature_06_social_features.sql
-- Feature: Social Features (Feature 06)
-- Description: Create notifications, recently_viewed, and product_shares tables with RLS policies, indexes, and trigger functions

-- ============================================================================
-- 1. Create Notifications Table
-- ============================================================================

CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL CHECK (type IN (
    'new_sale',
    'new_review',
    'new_follower',
    'product_approved',
    'product_rejected',
    'price_drop',
    'new_product',
    'system_announcement'
  )),
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  action_url TEXT, -- Link to relevant page
  is_read BOOLEAN DEFAULT false,
  email_sent BOOLEAN DEFAULT false, -- Feature 06 enhancement
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for notifications
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON notifications(user_id) WHERE is_read = false;
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);
CREATE INDEX IF NOT EXISTS idx_notifications_created ON notifications(created_at DESC);

-- ============================================================================
-- 2. Create Recently Viewed Table
-- ============================================================================

CREATE TABLE IF NOT EXISTS recently_viewed (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  viewed_at TIMESTAMP DEFAULT NOW(),

  -- Constraints
  UNIQUE(user_id, product_id) -- One entry per user per product (updates viewed_at on duplicate)
);

-- Indexes for recently_viewed
CREATE INDEX IF NOT EXISTS idx_recently_viewed_user ON recently_viewed(user_id, viewed_at DESC);
CREATE INDEX IF NOT EXISTS idx_recently_viewed_product ON recently_viewed(product_id);
CREATE INDEX IF NOT EXISTS idx_recently_viewed_viewed_at ON recently_viewed(viewed_at DESC);

-- ============================================================================
-- 3. Create Product Shares Table
-- ============================================================================

CREATE TABLE IF NOT EXISTS product_shares (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  platform VARCHAR NOT NULL CHECK (platform IN ('facebook', 'messenger', 'copy_link')),
  shared_by UUID REFERENCES users(id) ON DELETE SET NULL, -- Nullable for anonymous shares
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for product_shares
CREATE INDEX IF NOT EXISTS idx_product_shares_product ON product_shares(product_id, created_at);
CREATE INDEX IF NOT EXISTS idx_product_shares_user ON product_shares(shared_by, created_at);
CREATE INDEX IF NOT EXISTS idx_product_shares_platform ON product_shares(platform);

-- ============================================================================
-- 4. Enable Row Level Security (RLS)
-- ============================================================================

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE recently_viewed ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_shares ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 5. Create RLS Policies for notifications
-- ============================================================================

-- Users can view their own notifications
-- Create policy "Users can view own notifications" if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'notifications' 
    AND policyname = 'Users can view own notifications'
  ) THEN
    CREATE POLICY "Users can view own notifications" ON notifications FOR SELECT USING (user_id = auth.uid());
  END IF;
END $$;

-- Users can update their own notifications (mark as read)
-- Create policy "Users can update own notifications" if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'notifications' 
    AND policyname = 'Users can update own notifications'
  ) THEN
    CREATE POLICY "Users can update own notifications" ON notifications FOR UPDATE USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
  END IF;
END $$;

-- Users can delete their own notifications
-- Create policy "Users can delete own notifications" if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'notifications' 
    AND policyname = 'Users can delete own notifications'
  ) THEN
    CREATE POLICY "Users can delete own notifications" ON notifications FOR DELETE USING (user_id = auth.uid());
  END IF;
END $$;

-- System can insert notifications for any user (via service role)
-- This will be handled by server-side code with service role client
-- No policy needed for INSERT as it will use service role

-- Admins can view all notifications (for moderation/debugging)
-- Create policy "Admins can view all notifications" if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'notifications' 
    AND policyname = 'Admins can view all notifications'
  ) THEN
    CREATE POLICY "Admins can view all notifications" ON notifications FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );
  END IF;
END $$;

-- ============================================================================
-- 6. Create RLS Policies for recently_viewed
-- ============================================================================

-- Users can view their own recently viewed items
-- Create policy "Users can view own recently viewed" if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'recently_viewed' 
    AND policyname = 'Users can view own recently viewed'
  ) THEN
    CREATE POLICY "Users can view own recently viewed" ON recently_viewed FOR SELECT USING (user_id = auth.uid());
  END IF;
END $$;

-- Users can insert their own recently viewed items
-- Create policy "Users can insert own recently viewed" if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'recently_viewed' 
    AND policyname = 'Users can insert own recently viewed'
  ) THEN
    CREATE POLICY "Users can insert own recently viewed" ON recently_viewed FOR INSERT WITH CHECK (user_id = auth.uid());
  END IF;
END $$;

-- Users can update their own recently viewed items (update viewed_at)
-- Create policy "Users can update own recently viewed" if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'recently_viewed' 
    AND policyname = 'Users can update own recently viewed'
  ) THEN
    CREATE POLICY "Users can update own recently viewed" ON recently_viewed FOR UPDATE USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
  END IF;
END $$;

-- Users can delete their own recently viewed items
-- Create policy "Users can delete own recently viewed" if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'recently_viewed' 
    AND policyname = 'Users can delete own recently viewed'
  ) THEN
    CREATE POLICY "Users can delete own recently viewed" ON recently_viewed FOR DELETE USING (user_id = auth.uid());
  END IF;
END $$;

-- ============================================================================
-- 7. Create RLS Policies for product_shares
-- ============================================================================

-- Anyone can insert product shares (for tracking, even anonymous users)
-- Create policy "Anyone can insert product shares" if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'product_shares' 
    AND policyname = 'Anyone can insert product shares'
  ) THEN
    CREATE POLICY "Anyone can insert product shares" ON product_shares FOR INSERT WITH CHECK (true);
  END IF;
END $$;

-- Users can view their own shares
-- Create policy "Users can view own shares" if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'product_shares' 
    AND policyname = 'Users can view own shares'
  ) THEN
    CREATE POLICY "Users can view own shares" ON product_shares FOR SELECT USING (shared_by = auth.uid() OR shared_by IS NULL);
  END IF;
END $$;

-- Sellers can view share stats for their products
-- Create policy "Sellers can view share stats for their products" if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'product_shares' 
    AND policyname = 'Sellers can view share stats for their products'
  ) THEN
    CREATE POLICY "Sellers can view share stats for their products" ON product_shares FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM products
      WHERE products.id = product_shares.product_id
      AND products.seller_id = auth.uid()
    )
  );
  END IF;
END $$;

-- Admins can view all shares
-- Create policy "Admins can view all shares" if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'product_shares' 
    AND policyname = 'Admins can view all shares'
  ) THEN
    CREATE POLICY "Admins can view all shares" ON product_shares FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );
  END IF;
END $$;

-- ============================================================================
-- 8. Create Function to Clean Old Recently Viewed Items
-- ============================================================================

-- Function to automatically delete recently viewed items older than 30 days
CREATE OR REPLACE FUNCTION cleanup_old_recently_viewed()
RETURNS void AS $$
BEGIN
  DELETE FROM recently_viewed
  WHERE viewed_at < NOW() - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 9. Create Function to Limit Recently Viewed to 20 Items Per User
-- ============================================================================

-- Function to keep only the 20 most recent items per user
CREATE OR REPLACE FUNCTION limit_recently_viewed_per_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Delete oldest items if user has more than 20
  DELETE FROM recently_viewed
  WHERE user_id = NEW.user_id
  AND id NOT IN (
    SELECT id FROM recently_viewed
    WHERE user_id = NEW.user_id
    ORDER BY viewed_at DESC
    LIMIT 20
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger "trigger_limit_recently_viewed" if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'trigger_limit_recently_viewed' 
    AND tgrelid = 'recently_viewed'::regclass::oid
  ) THEN
    EXECUTE format('CREATE TRIGGER %I %s EXECUTE FUNCTION %I()',
      'trigger_limit_recently_viewed',
      'AFTER INSERT OR UPDATE ON recently_viewed FOR EACH ROW',
      'limit_recently_viewed_per_user'
    );
  END IF;
END $$;


-- ============================================================================
-- Migration Complete
-- ============================================================================



-- ============================================================================
-- Migration: 010_feature_07_seller_dashboard.sql
-- ============================================================================

-- Migration: 010_feature_07_seller_dashboard.sql
-- Feature: Seller Dashboard & Analytics (Feature 07)
-- Description: Create seller_metrics_cache, export_jobs, scheduled_reports tables and add region column to users table

-- ============================================================================
-- 1. Add Index for Region Queries (users.location_region already exists)
-- ============================================================================

-- Note: users.location_region column already exists from Feature 02
-- Add index for efficient region-based queries in order history
CREATE INDEX IF NOT EXISTS idx_users_location_region ON users(location_region) WHERE location_region IS NOT NULL;

-- ============================================================================
-- 2. Create Seller Metrics Cache Table
-- ============================================================================

CREATE TABLE IF NOT EXISTS seller_metrics_cache (
  seller_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  metric_type VARCHAR(50) NOT NULL, -- 'revenue', 'sales', 'views', 'rating', etc.
  time_period VARCHAR(20) NOT NULL, -- 'today', 'week', 'month', 'all'
  value DECIMAL(15,2) NOT NULL,
  previous_value DECIMAL(15,2), -- For trend calculation
  last_calculated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMP NOT NULL DEFAULT (NOW() + INTERVAL '15 minutes'),
  
  -- Composite primary key
  PRIMARY KEY (seller_id, metric_type, time_period)
);

-- Indexes for seller_metrics_cache
CREATE INDEX IF NOT EXISTS idx_metrics_cache_seller ON seller_metrics_cache(seller_id);
CREATE INDEX IF NOT EXISTS idx_metrics_cache_expires ON seller_metrics_cache(expires_at);
CREATE INDEX IF NOT EXISTS idx_metrics_cache_type ON seller_metrics_cache(metric_type, time_period);

-- ============================================================================
-- 3. Create Export Jobs Table
-- ============================================================================

CREATE TABLE IF NOT EXISTS export_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  export_type VARCHAR(50) NOT NULL, -- 'orders', 'products', 'earnings', 'analytics_report'
  format VARCHAR(10) NOT NULL CHECK (format IN ('csv', 'xlsx', 'pdf')),
  date_from DATE,
  date_to DATE,
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  file_url TEXT, -- Download link when completed (Supabase Storage path)
  error_message TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMP
);

-- Indexes for export_jobs
CREATE INDEX IF NOT EXISTS idx_export_jobs_user ON export_jobs(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_export_jobs_status ON export_jobs(status);
CREATE INDEX IF NOT EXISTS idx_export_jobs_type ON export_jobs(export_type);

-- ============================================================================
-- 4. Create Scheduled Reports Table (Pro/Pioneer Only)
-- ============================================================================

CREATE TABLE IF NOT EXISTS scheduled_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  report_type VARCHAR(50) NOT NULL, -- 'weekly_performance', 'monthly_summary'
  frequency VARCHAR(20) NOT NULL CHECK (frequency IN ('weekly', 'monthly')),
  format VARCHAR(10) NOT NULL DEFAULT 'pdf' CHECK (format IN ('pdf', 'xlsx')),
  is_active BOOLEAN DEFAULT true,
  next_send_at TIMESTAMP NOT NULL,
  last_sent_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Indexes for scheduled_reports
CREATE INDEX IF NOT EXISTS idx_scheduled_reports_user ON scheduled_reports(user_id);
CREATE INDEX IF NOT EXISTS idx_scheduled_reports_next ON scheduled_reports(next_send_at) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_scheduled_reports_active ON scheduled_reports(is_active, next_send_at);

-- ============================================================================
-- 5. RLS Policies
-- ============================================================================

-- Enable RLS on new tables
ALTER TABLE seller_metrics_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE export_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE scheduled_reports ENABLE ROW LEVEL SECURITY;

-- Seller Metrics Cache Policies
CREATE POLICY "Sellers can view their own metrics cache"
  ON seller_metrics_cache FOR SELECT
  TO authenticated
  USING (auth.uid() = seller_id);

CREATE POLICY "Sellers can insert their own metrics cache"
  ON seller_metrics_cache FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = seller_id);

CREATE POLICY "Sellers can update their own metrics cache"
  ON seller_metrics_cache FOR UPDATE
  TO authenticated
  USING (auth.uid() = seller_id)
  WITH CHECK (auth.uid() = seller_id);

CREATE POLICY "Sellers can delete their own metrics cache"
  ON seller_metrics_cache FOR DELETE
  TO authenticated
  USING (auth.uid() = seller_id);

-- Export Jobs Policies
CREATE POLICY "Users can view their own export jobs"
  ON export_jobs FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own export jobs"
  ON export_jobs FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own export jobs"
  ON export_jobs FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Scheduled Reports Policies
CREATE POLICY "Users can view their own scheduled reports"
  ON scheduled_reports FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own scheduled reports"
  ON scheduled_reports FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own scheduled reports"
  ON scheduled_reports FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own scheduled reports"
  ON scheduled_reports FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- ============================================================================
-- 6. Helper Function: Clean Expired Metrics Cache
-- ============================================================================

CREATE OR REPLACE FUNCTION clean_expired_metrics_cache()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM seller_metrics_cache
  WHERE expires_at < NOW();
END;
$$;

-- ============================================================================
-- 7. Comments for Documentation
-- ============================================================================

COMMENT ON TABLE seller_metrics_cache IS 'Caches dashboard metrics for 15 minutes to improve performance';
COMMENT ON TABLE export_jobs IS 'Tracks async export generation jobs (CSV, Excel, PDF)';
COMMENT ON TABLE scheduled_reports IS 'Pro/Pioneer scheduled report configuration for email automation';



-- ============================================================================
-- Migration: 011_feature_08_advanced_search.sql
-- ============================================================================

-- Migration: 011_feature_08_advanced_search.sql
-- Feature: Advanced Search & Discovery (Feature 08)
-- Description: Create search analytics tables, user search history, and full-text search indexes

-- ============================================================================
-- 1. Verify pg_trgm Extension (should already be enabled in 001_foundation.sql)
-- ============================================================================

-- pg_trgm is already enabled in 001_foundation.sql, but verify it exists
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- ============================================================================
-- 2. Create Search Analytics Table
-- ============================================================================

CREATE TABLE IF NOT EXISTS search_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  search_term VARCHAR(255) NOT NULL,
  impressions INTEGER DEFAULT 0,
  clicks INTEGER DEFAULT 0,
  avg_position DECIMAL(4,2),
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  -- Unique constraint: one record per product per search term per day
  UNIQUE(product_id, search_term, date)
);

-- Indexes for search_analytics
CREATE INDEX IF NOT EXISTS idx_search_product_date ON search_analytics(product_id, date);
CREATE INDEX IF NOT EXISTS idx_search_term_date ON search_analytics(search_term, date);
CREATE INDEX IF NOT EXISTS idx_search_analytics_date ON search_analytics(date DESC);

-- ============================================================================
-- 3. Create Search Queries Table (for popular searches tracking)
-- ============================================================================

CREATE TABLE IF NOT EXISTS search_queries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  query_text VARCHAR(255) NOT NULL UNIQUE,
  search_count INTEGER DEFAULT 1,
  last_searched_at TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for search_queries
CREATE INDEX IF NOT EXISTS idx_search_queries_count ON search_queries(search_count DESC);
CREATE INDEX IF NOT EXISTS idx_search_queries_last_searched ON search_queries(last_searched_at DESC);

-- ============================================================================
-- 4. Create User Search History Table
-- ============================================================================

CREATE TABLE IF NOT EXISTS user_search_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  query_text VARCHAR(255) NOT NULL,
  searched_at TIMESTAMP DEFAULT NOW(),
  
  -- Unique constraint: one record per user per query (update timestamp on duplicate)
  UNIQUE(user_id, query_text)
);

-- Indexes for user_search_history
CREATE INDEX IF NOT EXISTS idx_user_search_user ON user_search_history(user_id, searched_at DESC);

-- ============================================================================
-- 5. Create Full-Text Search Indexes on Products Table
-- ============================================================================

-- Full-text search index (GIN index for fast text search)
CREATE INDEX IF NOT EXISTS idx_products_fts ON products 
  USING GIN(to_tsvector('english', COALESCE(title, '') || ' ' || COALESCE(description, '')))
  WHERE status = 'published';

-- Fuzzy search indexes using pg_trgm (for typo handling)
CREATE INDEX IF NOT EXISTS idx_products_title_trgm ON products 
  USING GIN(title gin_trgm_ops)
  WHERE status = 'published';

CREATE INDEX IF NOT EXISTS idx_products_description_trgm ON products 
  USING GIN(description gin_trgm_ops)
  WHERE status = 'published';

-- ============================================================================
-- 6. Create Composite Indexes for Common Filter Combinations
-- ============================================================================

-- Grade + Subject + Status (most common filter combination)
CREATE INDEX IF NOT EXISTS idx_products_grade_subject_status ON products(grade_id, subject_id, status) 
  WHERE status = 'published';

-- Product Type + Status
CREATE INDEX IF NOT EXISTS idx_products_type_status ON products(product_type, status) 
  WHERE status = 'published';

-- Seller + Verified Status (for verified seller filter)
-- Note: We need to join with users table for is_verified_teacher, so this index helps
CREATE INDEX IF NOT EXISTS idx_products_seller_status ON products(seller_id, status) 
  WHERE status = 'published';

-- Price range index (already exists, but ensure it's optimized)
CREATE INDEX IF NOT EXISTS idx_products_price_status ON products(price, status) 
  WHERE status = 'published';

-- Date-based indexes for date_added filter
CREATE INDEX IF NOT EXISTS idx_products_created_status ON products(created_at DESC, status) 
  WHERE status = 'published';

CREATE INDEX IF NOT EXISTS idx_products_published_status ON products(published_at DESC, status) 
  WHERE status = 'published' AND published_at IS NOT NULL;

-- ============================================================================
-- 7. Create RLS Policies for search_analytics
-- ============================================================================

ALTER TABLE search_analytics ENABLE ROW LEVEL SECURITY;

-- Policies will be created only if they don't exist




-- Sellers can view analytics for their own products
-- Create policy "Sellers can view own product search analytics" if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'search_analytics' 
    AND policyname = 'Sellers can view own product search analytics'
  ) THEN
    CREATE POLICY "Sellers can view own product search analytics" ON search_analytics FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM products
      WHERE products.id = search_analytics.product_id
      AND products.seller_id = auth.uid()
    )
  );
  END IF;
END $$;

-- System/service role can insert search analytics (for tracking)
-- Note: This will be called from API routes with service role
-- Create policy "System can insert search analytics" if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'search_analytics' 
    AND policyname = 'System can insert search analytics'
  ) THEN
    CREATE POLICY "System can insert search analytics" ON search_analytics FOR INSERT WITH CHECK (true);
  END IF;
END $$;

-- System/service role can update search analytics
-- Create policy "System can update search analytics" if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'search_analytics' 
    AND policyname = 'System can update search analytics'
  ) THEN
    CREATE POLICY "System can update search analytics" ON search_analytics FOR UPDATE USING (true)
  WITH CHECK (true);
  END IF;
END $$;

-- Admins can view all search analytics
-- Create policy "Admins can view all search analytics" if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'search_analytics' 
    AND policyname = 'Admins can view all search analytics'
  ) THEN
    CREATE POLICY "Admins can view all search analytics" ON search_analytics FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );
  END IF;
END $$;

-- ============================================================================
-- 8. Create RLS Policies for search_queries
-- ============================================================================

ALTER TABLE search_queries ENABLE ROW LEVEL SECURITY;

-- Policies will be created only if they don't exist




-- Anyone can read popular searches (public data)
-- Create policy "Anyone can read popular searches" if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'search_queries' 
    AND policyname = 'Anyone can read popular searches'
  ) THEN
    CREATE POLICY "Anyone can read popular searches" ON search_queries FOR SELECT USING (true);
  END IF;
END $$;

-- Authenticated users can update search count (when they search)
-- Create policy "Authenticated users can update search queries" if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'search_queries' 
    AND policyname = 'Authenticated users can update search queries'
  ) THEN
    CREATE POLICY "Authenticated users can update search queries" ON search_queries FOR UPDATE USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');
  END IF;
END $$;

-- System/service role can insert search queries
-- Create policy "System can insert search queries" if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'search_queries' 
    AND policyname = 'System can insert search queries'
  ) THEN
    CREATE POLICY "System can insert search queries" ON search_queries FOR INSERT WITH CHECK (true);
  END IF;
END $$;

-- ============================================================================
-- 9. Create RLS Policies for user_search_history
-- ============================================================================

ALTER TABLE user_search_history ENABLE ROW LEVEL SECURITY;

-- Policies will be created only if they don't exist




-- Users can view their own search history
-- Create policy "Users can view own search history" if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'user_search_history' 
    AND policyname = 'Users can view own search history'
  ) THEN
    CREATE POLICY "Users can view own search history" ON user_search_history FOR SELECT USING (user_id = auth.uid());
  END IF;
END $$;

-- Users can insert their own search history
-- Create policy "Users can insert own search history" if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'user_search_history' 
    AND policyname = 'Users can insert own search history'
  ) THEN
    CREATE POLICY "Users can insert own search history" ON user_search_history FOR INSERT WITH CHECK (user_id = auth.uid());
  END IF;
END $$;

-- Users can delete their own search history
-- Create policy "Users can delete own search history" if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'user_search_history' 
    AND policyname = 'Users can delete own search history'
  ) THEN
    CREATE POLICY "Users can delete own search history" ON user_search_history FOR DELETE USING (user_id = auth.uid());
  END IF;
END $$;

-- ============================================================================
-- 10. Create Function to Update search_analytics Timestamp
-- ============================================================================

CREATE OR REPLACE FUNCTION update_search_analytics_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger "trigger_update_search_analytics_updated_at" if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'trigger_update_search_analytics_updated_at' 
    AND tgrelid = 'search_analytics'::regclass::oid
  ) THEN
    EXECUTE format('CREATE TRIGGER %I %s EXECUTE FUNCTION %I()',
      'trigger_update_search_analytics_updated_at',
      'BEFORE UPDATE ON search_analytics FOR EACH ROW',
      'update_search_analytics_updated_at'
    );
  END IF;
END $$;


-- ============================================================================
-- 11. Create Function to Update search_queries Timestamp
-- ============================================================================

CREATE OR REPLACE FUNCTION update_search_queries_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger "trigger_update_search_queries_updated_at" if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'trigger_update_search_queries_updated_at' 
    AND tgrelid = 'search_queries'::regclass::oid
  ) THEN
    EXECUTE format('CREATE TRIGGER %I %s EXECUTE FUNCTION %I()',
      'trigger_update_search_queries_updated_at',
      'BEFORE UPDATE ON search_queries FOR EACH ROW',
      'update_search_queries_updated_at'
    );
  END IF;
END $$;


-- ============================================================================
-- 12. Create Function to Upsert User Search History
-- ============================================================================

-- Function to insert or update user search history
-- If query already exists for user, update the searched_at timestamp
CREATE OR REPLACE FUNCTION upsert_user_search_history(
  p_user_id UUID,
  p_query_text VARCHAR(255)
)
RETURNS VOID AS $$
BEGIN
  INSERT INTO user_search_history (user_id, query_text, searched_at)
  VALUES (p_user_id, p_query_text, NOW())
  ON CONFLICT (user_id, query_text)
  DO UPDATE SET searched_at = NOW();
  
  -- Keep only last 10 searches per user (delete oldest)
  DELETE FROM user_search_history
  WHERE user_id = p_user_id
  AND id NOT IN (
    SELECT id FROM user_search_history
    WHERE user_id = p_user_id
    ORDER BY searched_at DESC
    LIMIT 10
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 13. Create Function to Upsert Search Query
-- ============================================================================

-- Function to increment search count for a query
CREATE OR REPLACE FUNCTION upsert_search_query(
  p_query_text VARCHAR(255)
)
RETURNS VOID AS $$
BEGIN
  INSERT INTO search_queries (query_text, search_count, last_searched_at)
  VALUES (p_query_text, 1, NOW())
  ON CONFLICT (query_text)
  DO UPDATE SET 
    search_count = search_queries.search_count + 1,
    last_searched_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- Migration Complete
-- ============================================================================

-- Verify all tables were created
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'search_analytics') THEN
    RAISE EXCEPTION 'search_analytics table was not created';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'search_queries') THEN
    RAISE EXCEPTION 'search_queries table was not created';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_search_history') THEN
    RAISE EXCEPTION 'user_search_history table was not created';
  END IF;
  
  RAISE NOTICE 'Feature 08 migration completed successfully';
END $$;



-- ============================================================================
-- Migration: 012_feature_09_admin_panel.sql
-- ============================================================================

-- Migration: 012_feature_09_admin_panel.sql
-- Feature: Admin Panel & Content Moderation (Feature 09)
-- Description: Create admin_role ENUM, add admin_role to users, and create admin-related tables (announcements, announcement_stats, categories, support_tickets, ticket_messages, disputes) with RLS policies and indexes

-- ============================================================================
-- 1. Create Admin Role ENUM
-- ============================================================================

DO $$ BEGIN
  CREATE TYPE admin_role AS ENUM ('super_admin', 'moderator', 'content_manager');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- ============================================================================
-- 2. Add admin_role Column to Users Table
-- ============================================================================

ALTER TABLE users 
ADD COLUMN IF NOT EXISTS admin_role admin_role;

-- Update existing admin users to have super_admin role
UPDATE users 
SET admin_role = 'super_admin' 
WHERE role = 'admin' AND admin_role IS NULL;

-- ============================================================================
-- 3. Create Announcements Table
-- ============================================================================

CREATE TABLE IF NOT EXISTS announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Content
  type VARCHAR(50) NOT NULL CHECK (type IN ('system_maintenance', 'new_feature', 'platform_update', 'promotion', 'urgent_notice', 'educational', 'other')),
  title VARCHAR(100) NOT NULL,
  message TEXT NOT NULL, -- 500 chars for in-app, 2000 for email
  link_url TEXT,
  priority VARCHAR(20) NOT NULL DEFAULT 'normal' CHECK (priority IN ('normal', 'important', 'urgent')),
  
  -- Audience
  target_audience JSONB NOT NULL, -- Advanced segmentation: {basic: 'all'|'buyers'|'sellers'|..., advanced: {...}}
  
  -- Delivery
  delivery_in_app BOOLEAN DEFAULT true,
  delivery_email BOOLEAN DEFAULT true,
  override_email_preferences BOOLEAN DEFAULT false, -- For urgent announcements
  
  -- Scheduling
  scheduled_for TIMESTAMP, -- NULL = send immediately
  display_duration_days INTEGER, -- 1, 3, 7, 14, 30, or NULL (never expire)
  is_dismissible BOOLEAN DEFAULT true,
  
  -- Status
  status VARCHAR(20) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'active', 'expired', 'cancelled')),
  
  -- Template
  template_name VARCHAR(100), -- If saved as template
  template_variables JSONB, -- Variables used in template
  
  -- Creator
  created_by UUID NOT NULL REFERENCES users(id),
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  sent_at TIMESTAMP,
  expires_at TIMESTAMP
);

-- Indexes for announcements
CREATE INDEX IF NOT EXISTS idx_announcements_status ON announcements(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_announcements_scheduled ON announcements(scheduled_for) WHERE scheduled_for IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_announcements_created_by ON announcements(created_by);
CREATE INDEX IF NOT EXISTS idx_announcements_active ON announcements(status, expires_at) WHERE status = 'active';

-- ============================================================================
-- 4. Create Announcement Stats Table
-- ============================================================================

CREATE TABLE IF NOT EXISTS announcement_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  announcement_id UUID NOT NULL REFERENCES announcements(id) ON DELETE CASCADE,
  
  -- Recipients
  recipients_count INTEGER DEFAULT 0,
  
  -- In-App Stats
  in_app_views INTEGER DEFAULT 0,
  in_app_view_rate DECIMAL(5,2), -- Percentage
  
  -- Email Stats
  email_sent INTEGER DEFAULT 0,
  email_opens INTEGER DEFAULT 0,
  email_open_rate DECIMAL(5,2), -- Percentage
  email_bounced INTEGER DEFAULT 0,
  
  -- Engagement
  link_clicks INTEGER DEFAULT 0,
  link_click_rate DECIMAL(5,2), -- Percentage
  engagement_rate DECIMAL(5,2), -- Overall engagement percentage
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for announcement_stats
CREATE INDEX IF NOT EXISTS idx_announcement_stats_announcement ON announcement_stats(announcement_id);
CREATE INDEX IF NOT EXISTS idx_announcement_stats_updated ON announcement_stats(updated_at DESC);

-- ============================================================================
-- 5. Create Categories Table
-- ============================================================================

CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Basic Info
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) NOT NULL UNIQUE,
  description TEXT,
  parent_id UUID REFERENCES categories(id) ON DELETE SET NULL, -- For nested categories
  
  -- SEO
  meta_title VARCHAR(60),
  meta_description VARCHAR(160),
  hero_image_url TEXT,
  
  -- Display
  show_on_homepage BOOLEAN DEFAULT false,
  sort_by VARCHAR(50) DEFAULT 'relevance' CHECK (sort_by IN ('relevance', 'newest', 'best_selling', 'price_low', 'price_high', 'rating')),
  
  -- Filters
  filters TEXT[], -- Which filters to show: ['product_type', 'quarter', 'weeks', 'grade', 'subject', 'price', 'rating']
  
  -- Featured Products
  featured_products UUID[], -- Array of product IDs (up to 8)
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for categories
CREATE INDEX IF NOT EXISTS idx_categories_slug ON categories(slug);
CREATE INDEX IF NOT EXISTS idx_categories_parent ON categories(parent_id) WHERE parent_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_categories_homepage ON categories(show_on_homepage) WHERE show_on_homepage = true;

-- ============================================================================
-- 6. Create Support Tickets Table
-- ============================================================================

CREATE TABLE IF NOT EXISTS support_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- User & Assignment
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE SET NULL,
  assigned_to UUID REFERENCES users(id), -- Admin assigned to ticket
  
  -- Ticket Details
  subject VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  category VARCHAR(100) NOT NULL CHECK (category IN ('technical', 'billing', 'content', 'account')),
  
  -- Status & Priority
  status VARCHAR(50) NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
  priority VARCHAR(20) NOT NULL DEFAULT 'medium' CHECK (priority IN ('high', 'medium', 'low')),
  
  -- Attachments (stored as JSONB array of file URLs)
  attachments JSONB,
  
  -- Response Tracking
  response_count INTEGER DEFAULT 0,
  first_response_at TIMESTAMP,
  last_response_at TIMESTAMP,
  avg_response_time_hours DECIMAL(5,2),
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  resolved_at TIMESTAMP
);

-- Indexes for support_tickets
CREATE INDEX IF NOT EXISTS idx_support_tickets_user ON support_tickets(user_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_assigned ON support_tickets(assigned_to) WHERE assigned_to IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_support_tickets_status ON support_tickets(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_support_tickets_priority ON support_tickets(priority, created_at DESC) WHERE status != 'closed';
CREATE INDEX IF NOT EXISTS idx_support_tickets_category ON support_tickets(category);

-- ============================================================================
-- 7. Create Ticket Messages Table
-- ============================================================================

CREATE TABLE IF NOT EXISTS ticket_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- References
  ticket_id UUID NOT NULL REFERENCES support_tickets(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES users(id) ON DELETE SET NULL,
  
  -- Message
  message TEXT NOT NULL,
  is_internal BOOLEAN DEFAULT false, -- Internal admin notes (not visible to user)
  
  -- Attachments
  attachments JSONB, -- Array of file URLs
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for ticket_messages
CREATE INDEX IF NOT EXISTS idx_ticket_messages_ticket ON ticket_messages(ticket_id, created_at ASC);
CREATE INDEX IF NOT EXISTS idx_ticket_messages_sender ON ticket_messages(sender_id);

-- ============================================================================
-- 8. Create Reports Table
-- ============================================================================

CREATE TABLE IF NOT EXISTS reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id UUID NOT NULL REFERENCES users(id) ON DELETE SET NULL,
  report_type VARCHAR(20) NOT NULL CHECK (report_type IN ('product', 'user', 'review', 'message')),
  reported_item_id UUID NOT NULL, -- ID of product/user/review/message
  reason VARCHAR(50) NOT NULL, -- inappropriate_content, copyright_violation, harassment, spam, etc.
  description TEXT,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'under_review', 'resolved', 'dismissed')),
  severity VARCHAR(20) DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'urgent')),
  escalation_level INTEGER DEFAULT 0, -- Increments on appeal
  assigned_to UUID REFERENCES users(id), -- Admin assigned to this report
  resolution_notes TEXT,
  resolved_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for reports
CREATE INDEX IF NOT EXISTS idx_reports_status ON reports(status);
CREATE INDEX IF NOT EXISTS idx_reports_severity ON reports(severity, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reports_assigned ON reports(assigned_to);
CREATE INDEX IF NOT EXISTS idx_reports_type ON reports(report_type);

-- ============================================================================
-- 9. Create Disputes Table
-- ============================================================================

CREATE TABLE IF NOT EXISTS disputes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Parties
  buyer_id UUID NOT NULL REFERENCES users(id),
  seller_id UUID NOT NULL REFERENCES users(id),
  
  -- Context
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
  
  -- Dispute Details
  type VARCHAR(100) NOT NULL CHECK (type IN ('quality', 'payment', 'copyright', 'harassment')),
  severity VARCHAR(20) NOT NULL DEFAULT 'medium' CHECK (severity IN ('high', 'medium', 'low')),
  status VARCHAR(50) NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'mediation', 'resolved', 'closed')),
  
  -- Description & Evidence
  description TEXT NOT NULL,
  evidence JSONB, -- Buyer's evidence, seller's response, platform investigation, attachments
  
  -- Resolution
  resolution TEXT,
  resolution_type VARCHAR(50) CHECK (resolution_type IN ('full_refund', 'partial_refund', 'product_replacement', 'seller_fix', 'take_down', 'ban_user', 'other')),
  resolved_by UUID REFERENCES users(id), -- Admin who resolved
  resolved_at TIMESTAMP,
  
  -- Mediation
  proposed_resolution TEXT,
  proposed_resolution_at TIMESTAMP,
  buyer_accepted BOOLEAN,
  seller_accepted BOOLEAN,
  acceptance_deadline TIMESTAMP, -- 48 hours from proposal
  
  -- Appeals
  appeal_requested BOOLEAN DEFAULT false,
  appeal_requested_at TIMESTAMP,
  appeal_reviewed_by UUID REFERENCES users(id), -- Different admin reviews appeal
  appeal_decision VARCHAR(20) CHECK (appeal_decision IN ('upheld', 'modified', 'overturned')),
  appeal_decision_at TIMESTAMP,
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for disputes
CREATE INDEX IF NOT EXISTS idx_disputes_buyer ON disputes(buyer_id);
CREATE INDEX IF NOT EXISTS idx_disputes_seller ON disputes(seller_id);
CREATE INDEX IF NOT EXISTS idx_disputes_status ON disputes(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_disputes_severity ON disputes(severity, created_at DESC) WHERE status != 'closed';
CREATE INDEX IF NOT EXISTS idx_disputes_order ON disputes(order_id) WHERE order_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_disputes_product ON disputes(product_id) WHERE product_id IS NOT NULL;

-- ============================================================================
-- 10. Enable Row Level Security (RLS)
-- ============================================================================

ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcement_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE ticket_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE disputes ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 11. Create RLS Policies for Announcements
-- ============================================================================

-- Policies will be created only if they don't exist

-- Admins can manage all announcements
-- Create policy "Admins can manage announcements" if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'announcements' 
    AND policyname = 'Admins can manage announcements'
  ) THEN
    CREATE POLICY "Admins can manage announcements" ON announcements FOR ALL USING (
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
  END IF;
END $$;

-- Users can view active announcements (for in-app display)
-- Create policy "Users can view active announcements" if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'announcements' 
    AND policyname = 'Users can view active announcements'
  ) THEN
    CREATE POLICY "Users can view active announcements" ON announcements FOR SELECT USING (status = 'active' AND (expires_at IS NULL OR expires_at > NOW()));
  END IF;
END $$;

-- ============================================================================
-- 12. Create RLS Policies for Announcement Stats
-- ============================================================================

-- Only admins can view announcement stats
-- Create policy "Admins can view announcement stats" if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'announcement_stats' 
    AND policyname = 'Admins can view announcement stats'
  ) THEN
    CREATE POLICY "Admins can view announcement stats" ON announcement_stats FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );
  END IF;
END $$;

-- System can insert/update stats (via service role or admin)
-- Create policy "Admins can manage announcement stats" if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'announcement_stats' 
    AND policyname = 'Admins can manage announcement stats'
  ) THEN
    CREATE POLICY "Admins can manage announcement stats" ON announcement_stats FOR ALL USING (
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
  END IF;
END $$;

-- ============================================================================
-- 13. Create RLS Policies for Categories
-- ============================================================================

-- Anyone can view categories (for public category pages)
-- Create policy "Anyone can view categories" if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'categories' 
    AND policyname = 'Anyone can view categories'
  ) THEN
    CREATE POLICY "Anyone can view categories" ON categories FOR SELECT USING (true);
  END IF;
END $$;

-- Only admins can manage categories
-- Create policy "Admins can manage categories" if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'categories' 
    AND policyname = 'Admins can manage categories'
  ) THEN
    CREATE POLICY "Admins can manage categories" ON categories FOR ALL USING (
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
  END IF;
END $$;

-- ============================================================================
-- 14. Create RLS Policies for Support Tickets
-- ============================================================================

-- Users can view their own tickets
-- Create policy "Users can view own tickets" if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'support_tickets' 
    AND policyname = 'Users can view own tickets'
  ) THEN
    CREATE POLICY "Users can view own tickets" ON support_tickets FOR SELECT USING (user_id = auth.uid());
  END IF;
END $$;

-- Users can create tickets
-- Create policy "Users can create tickets" if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'support_tickets' 
    AND policyname = 'Users can create tickets'
  ) THEN
    CREATE POLICY "Users can create tickets" ON support_tickets FOR INSERT WITH CHECK (user_id = auth.uid());
  END IF;
END $$;

-- Admins can view and manage all tickets
-- Create policy "Admins can manage all tickets" if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'support_tickets' 
    AND policyname = 'Admins can manage all tickets'
  ) THEN
    CREATE POLICY "Admins can manage all tickets" ON support_tickets FOR ALL USING (
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
  END IF;
END $$;

-- ============================================================================
-- 15. Create RLS Policies for Ticket Messages
-- ============================================================================

-- Users can view non-internal messages in their own tickets
-- Create policy "Users can view messages in own tickets" if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'ticket_messages' 
    AND policyname = 'Users can view messages in own tickets'
  ) THEN
    CREATE POLICY "Users can view messages in own tickets" ON ticket_messages FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM support_tickets
      WHERE id = ticket_messages.ticket_id 
        AND user_id = auth.uid()
        AND (ticket_messages.is_internal = false OR EXISTS (
          SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
        ))
    )
  );
  END IF;
END $$;

-- Users can send messages to their own tickets
-- Create policy "Users can send messages to own tickets" if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'ticket_messages' 
    AND policyname = 'Users can send messages to own tickets'
  ) THEN
    CREATE POLICY "Users can send messages to own tickets" ON ticket_messages FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM support_tickets
      WHERE id = ticket_messages.ticket_id AND user_id = auth.uid()
    )
    AND sender_id = auth.uid()
    AND is_internal = false
  );
  END IF;
END $$;

-- Admins can manage all ticket messages (including internal notes)
-- Create policy "Admins can manage all ticket messages" if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'ticket_messages' 
    AND policyname = 'Admins can manage all ticket messages'
  ) THEN
    CREATE POLICY "Admins can manage all ticket messages" ON ticket_messages FOR ALL USING (
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
  END IF;
END $$;

-- ============================================================================
-- 16. Create RLS Policies for Reports
-- ============================================================================

-- Users can view their own reports
-- Create policy "Users can view own reports" if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'reports' 
    AND policyname = 'Users can view own reports'
  ) THEN
    CREATE POLICY "Users can view own reports" ON reports FOR SELECT USING (reporter_id = auth.uid());
  END IF;
END $$;

-- Users can create reports
-- Create policy "Users can create reports" if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'reports' 
    AND policyname = 'Users can create reports'
  ) THEN
    CREATE POLICY "Users can create reports" ON reports FOR INSERT WITH CHECK (reporter_id = auth.uid());
  END IF;
END $$;

-- Admins can view and manage all reports
-- Create policy "Admins can manage all reports" if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'reports' 
    AND policyname = 'Admins can manage all reports'
  ) THEN
    CREATE POLICY "Admins can manage all reports" ON reports FOR ALL USING (
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
  END IF;
END $$;

-- ============================================================================
-- 17. Create RLS Policies for Disputes
-- ============================================================================

-- Users can view disputes they're involved in (buyer or seller)
-- Create policy "Users can view own disputes" if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'disputes' 
    AND policyname = 'Users can view own disputes'
  ) THEN
    CREATE POLICY "Users can view own disputes" ON disputes FOR SELECT USING (buyer_id = auth.uid() OR seller_id = auth.uid());
  END IF;
END $$;

-- Users can create disputes (as buyer)
-- Create policy "Users can create disputes" if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'disputes' 
    AND policyname = 'Users can create disputes'
  ) THEN
    CREATE POLICY "Users can create disputes" ON disputes FOR INSERT WITH CHECK (buyer_id = auth.uid());
  END IF;
END $$;

-- Admins can manage all disputes
-- Create policy "Admins can manage all disputes" if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'disputes' 
    AND policyname = 'Admins can manage all disputes'
  ) THEN
    CREATE POLICY "Admins can manage all disputes" ON disputes FOR ALL USING (
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
  END IF;
END $$;

-- ============================================================================
-- Create trigger "trigger_update_announcements_updated_at" if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'trigger_update_announcements_updated_at' 
    AND tgrelid = 'announcements'::regclass::oid
  ) THEN
    EXECUTE format('CREATE TRIGGER %I %s EXECUTE FUNCTION %I()',
      'trigger_update_announcements_updated_at',
      'BEFORE UPDATE ON announcements FOR EACH ROW',
      'update_updated_at_column'
    );
  END IF;
END $$;


-- Create trigger "trigger_update_announcement_stats_updated_at" if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'trigger_update_announcement_stats_updated_at' 
    AND tgrelid = 'announcement_stats'::regclass::oid
  ) THEN
    EXECUTE format('CREATE TRIGGER %I %s EXECUTE FUNCTION %I()',
      'trigger_update_announcement_stats_updated_at',
      'BEFORE UPDATE ON announcement_stats FOR EACH ROW',
      'update_updated_at_column'
    );
  END IF;
END $$;


-- Create trigger "trigger_update_categories_updated_at" if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'trigger_update_categories_updated_at' 
    AND tgrelid = 'categories'::regclass::oid
  ) THEN
    EXECUTE format('CREATE TRIGGER %I %s EXECUTE FUNCTION %I()',
      'trigger_update_categories_updated_at',
      'BEFORE UPDATE ON categories FOR EACH ROW',
      'update_updated_at_column'
    );
  END IF;
END $$;


-- Create trigger "trigger_update_support_tickets_updated_at" if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'trigger_update_support_tickets_updated_at' 
    AND tgrelid = 'support_tickets'::regclass::oid
  ) THEN
    EXECUTE format('CREATE TRIGGER %I %s EXECUTE FUNCTION %I()',
      'trigger_update_support_tickets_updated_at',
      'BEFORE UPDATE ON support_tickets FOR EACH ROW',
      'update_updated_at_column'
    );
  END IF;
END $$;


-- Create trigger "trigger_update_disputes_updated_at" if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'trigger_update_disputes_updated_at' 
    AND tgrelid = 'disputes'::regclass::oid
  ) THEN
    EXECUTE format('CREATE TRIGGER %I %s EXECUTE FUNCTION %I()',
      'trigger_update_disputes_updated_at',
      'BEFORE UPDATE ON disputes FOR EACH ROW',
      'update_updated_at_column'
    );
  END IF;
END $$;


-- ============================================================================
-- Migration Complete
-- ============================================================================



-- ============================================================================
-- Migration: 013_feature_10_email_system.sql
-- ============================================================================

-- Migration: 013_feature_10_email_system.sql
-- Feature: Email System (Feature 10)
-- Description: Create email system tables (email_queue, email_templates, email_template_versions, email_configuration, user_email_preferences, email_analytics, email_daily_stats, email_suppression_list) with RLS policies and indexes

-- ============================================================================
-- 1. Create Email Templates Table (must be created before email_queue)
-- ============================================================================

CREATE TABLE IF NOT EXISTS email_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email_type VARCHAR(100) UNIQUE NOT NULL,
  template_name VARCHAR(255) NOT NULL,

  -- Template content
  subject_line TEXT NOT NULL,
  preheader TEXT,
  body_html TEXT NOT NULL,
  body_text TEXT,

  -- CTA
  cta_enabled BOOLEAN DEFAULT false,
  cta_text VARCHAR(255),
  cta_link_template TEXT,

  -- Variables
  required_variables TEXT[] DEFAULT '{}',
  optional_variables TEXT[] DEFAULT '{}',

  -- Version control
  version INTEGER DEFAULT 1,
  is_active BOOLEAN DEFAULT true,

  -- Metadata
  description TEXT,
  category VARCHAR(50),

  -- Audit
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  updated_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for email_templates
CREATE INDEX IF NOT EXISTS idx_email_templates_type ON email_templates(email_type);
CREATE INDEX IF NOT EXISTS idx_email_templates_category ON email_templates(category);
CREATE INDEX IF NOT EXISTS idx_email_templates_active ON email_templates(is_active) WHERE is_active = true;

-- ============================================================================
-- 2. Create Email Queue Table (after email_templates for FK reference)
-- ============================================================================

CREATE TABLE IF NOT EXISTS email_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email_type VARCHAR(100) NOT NULL,
  recipient_email VARCHAR(255) NOT NULL,
  recipient_user_id UUID REFERENCES users(id) ON DELETE SET NULL,

  -- Template data
  template_id UUID REFERENCES email_templates(id) ON DELETE SET NULL,
  template_data JSONB NOT NULL DEFAULT '{}',

  -- Priority & Timing
  priority INTEGER DEFAULT 5 CHECK (priority BETWEEN 1 AND 10), -- 1=highest, 10=lowest
  send_after TIMESTAMP DEFAULT NOW(),
  attempts INTEGER DEFAULT 0,
  max_attempts INTEGER DEFAULT 3,

  -- Status
  status VARCHAR(20) CHECK (status IN ('pending', 'processing', 'sent', 'failed', 'cancelled')) DEFAULT 'pending',

  -- Error tracking
  last_error TEXT,
  error_details JSONB,

  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  processed_at TIMESTAMP,
  sent_at TIMESTAMP,
  failed_at TIMESTAMP
);

-- Indexes for email_queue
CREATE INDEX IF NOT EXISTS idx_email_queue_status ON email_queue(status, send_after) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_email_queue_priority ON email_queue(priority ASC, send_after ASC) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_email_queue_type ON email_queue(email_type);
CREATE INDEX IF NOT EXISTS idx_email_queue_recipient ON email_queue(recipient_user_id) WHERE recipient_user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_email_queue_created ON email_queue(created_at DESC);

-- ============================================================================
-- 3. Create Email Template Versions Table
-- ============================================================================

CREATE TABLE IF NOT EXISTS email_template_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID NOT NULL REFERENCES email_templates(id) ON DELETE CASCADE,
  version INTEGER NOT NULL,
  subject_line TEXT NOT NULL,
  body_html TEXT NOT NULL,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(template_id, version)
);

-- Indexes for email_template_versions
CREATE INDEX IF NOT EXISTS idx_email_template_versions_template ON email_template_versions(template_id, version DESC);

-- ============================================================================
-- 4. Create Email Configuration Table
-- ============================================================================

CREATE TABLE IF NOT EXISTS email_configuration (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email_type VARCHAR(100) UNIQUE NOT NULL,
  is_enabled BOOLEAN DEFAULT true,
  template_id UUID REFERENCES email_templates(id) ON DELETE SET NULL,
  updated_by UUID REFERENCES users(id) ON DELETE SET NULL,
  updated_at TIMESTAMP DEFAULT NOW(),
  notes TEXT
);

-- Indexes for email_configuration
CREATE INDEX IF NOT EXISTS idx_email_config_type ON email_configuration(email_type);
CREATE INDEX IF NOT EXISTS idx_email_config_enabled ON email_configuration(is_enabled) WHERE is_enabled = true;

-- ============================================================================
-- 5. Create User Email Preferences Table
-- ============================================================================

CREATE TABLE IF NOT EXISTS user_email_preferences (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  selling_notifications BOOLEAN DEFAULT true,
  buying_notifications BOOLEAN DEFAULT true,
  social_notifications BOOLEAN DEFAULT true,
  announcements BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Index for user_email_preferences
CREATE INDEX IF NOT EXISTS idx_user_email_preferences_user ON user_email_preferences(user_id);

-- ============================================================================
-- 6. Create Email Analytics Table
-- ============================================================================

CREATE TABLE IF NOT EXISTS email_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email_queue_id UUID REFERENCES email_queue(id) ON DELETE CASCADE,
  resend_email_id VARCHAR(255),
  recipient_email VARCHAR(255) NOT NULL,
  email_type VARCHAR(100),

  -- Delivery metrics
  sent_at TIMESTAMP,
  delivered_at TIMESTAMP,
  delivery_error TEXT,

  -- Engagement metrics
  opened_at TIMESTAMP,
  clicked_at TIMESTAMP,
  open_count INTEGER DEFAULT 0,
  click_count INTEGER DEFAULT 0,

  -- Final status
  bounced BOOLEAN DEFAULT false,
  bounce_reason TEXT,
  spam_complained BOOLEAN DEFAULT false,
  unsubscribed BOOLEAN DEFAULT false,

  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for email_analytics
CREATE INDEX IF NOT EXISTS idx_email_analytics_queue ON email_analytics(email_queue_id);
CREATE INDEX IF NOT EXISTS idx_email_analytics_type ON email_analytics(email_type, sent_at DESC);
CREATE INDEX IF NOT EXISTS idx_email_analytics_recipient ON email_analytics(recipient_email);
CREATE INDEX IF NOT EXISTS idx_email_analytics_resend_id ON email_analytics(resend_email_id) WHERE resend_email_id IS NOT NULL;

-- ============================================================================
-- 7. Create Email Daily Stats Table
-- ============================================================================

CREATE TABLE IF NOT EXISTS email_daily_stats (
  date DATE PRIMARY KEY,
  emails_sent INTEGER DEFAULT 0,
  emails_delivered INTEGER DEFAULT 0,
  emails_opened INTEGER DEFAULT 0,
  emails_clicked INTEGER DEFAULT 0,
  emails_bounced INTEGER DEFAULT 0,
  emails_failed INTEGER DEFAULT 0,
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Index for email_daily_stats
CREATE INDEX IF NOT EXISTS idx_email_daily_stats_date ON email_daily_stats(date DESC);

-- ============================================================================
-- 8. Create Email Suppression List Table
-- ============================================================================

CREATE TABLE IF NOT EXISTS email_suppression_list (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  reason VARCHAR(50) CHECK (reason IN ('hard_bounce', 'spam_complaint', 'manual_suppression')),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Index for email_suppression_list
CREATE INDEX IF NOT EXISTS idx_suppression_email ON email_suppression_list(email);

-- ============================================================================
-- 9. Enable Row Level Security (RLS)
-- ============================================================================

ALTER TABLE email_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_template_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_configuration ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_email_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_daily_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_suppression_list ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 10. RLS Policies for email_queue
-- ============================================================================

-- Admins can view all email queue items
CREATE POLICY "Admins can view all email queue items"
  ON email_queue FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- Service role can do everything (for queue processor)
CREATE POLICY "Service role can manage email queue"
  ON email_queue FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ============================================================================
-- 11. RLS Policies for email_templates
-- ============================================================================

-- Anyone authenticated can view active templates
CREATE POLICY "Anyone can view active email templates"
  ON email_templates FOR SELECT
  TO authenticated
  USING (is_active = true);

-- Admins can view all templates
CREATE POLICY "Admins can view all email templates"
  ON email_templates FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- Admins can insert/update templates
CREATE POLICY "Admins can manage email templates"
  ON email_templates FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- Service role can do everything
CREATE POLICY "Service role can manage email templates"
  ON email_templates FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ============================================================================
-- 12. RLS Policies for email_template_versions
-- ============================================================================

-- Admins can view all versions
CREATE POLICY "Admins can view email template versions"
  ON email_template_versions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- Service role can do everything
CREATE POLICY "Service role can manage email template versions"
  ON email_template_versions FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ============================================================================
-- 13. RLS Policies for email_configuration
-- ============================================================================

-- Admins can view and manage configuration
CREATE POLICY "Admins can manage email configuration"
  ON email_configuration FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- Service role can do everything
CREATE POLICY "Service role can manage email configuration"
  ON email_configuration FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ============================================================================
-- 14. RLS Policies for user_email_preferences
-- ============================================================================

-- Users can view and update their own preferences
CREATE POLICY "Users can view their own email preferences"
  ON user_email_preferences FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own email preferences"
  ON user_email_preferences FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can insert their own email preferences"
  ON user_email_preferences FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Service role can do everything
CREATE POLICY "Service role can manage user email preferences"
  ON user_email_preferences FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ============================================================================
-- 15. RLS Policies for email_analytics
-- ============================================================================

-- Admins can view all analytics
CREATE POLICY "Admins can view email analytics"
  ON email_analytics FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- Service role can do everything
CREATE POLICY "Service role can manage email analytics"
  ON email_analytics FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ============================================================================
-- 16. RLS Policies for email_daily_stats
-- ============================================================================

-- Admins can view daily stats
CREATE POLICY "Admins can view email daily stats"
  ON email_daily_stats FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- Service role can do everything
CREATE POLICY "Service role can manage email daily stats"
  ON email_daily_stats FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ============================================================================
-- 17. RLS Policies for email_suppression_list
-- ============================================================================

-- Admins can view and manage suppression list
CREATE POLICY "Admins can manage email suppression list"
  ON email_suppression_list FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- Service role can do everything
CREATE POLICY "Service role can manage email suppression list"
  ON email_suppression_list FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ============================================================================
-- 18. Seed Initial Email Configuration (26 Email Types)
-- ============================================================================

-- Transactional Emails (10) - Always enabled, cannot be disabled by users
INSERT INTO email_configuration (email_type, is_enabled, notes) VALUES
  ('auth_welcome', true, 'Welcome email - Transactional'),
  ('auth_email_verification', true, 'Email verification - Transactional'),
  ('auth_password_reset', true, 'Password reset request - Transactional'),
  ('auth_password_reset_confirmation', true, 'Password reset confirmation - Transactional'),
  ('order_confirmation', true, 'Order confirmation - Transactional'),
  ('payment_successful', true, 'Payment successful - Transactional'),
  ('payment_failed', true, 'Payment failed - Transactional'),
  ('download_ready', true, 'Download ready - Transactional'),
  ('refund_processed', true, 'Refund processed - Transactional'),
  ('review_flagged', true, 'Review flagged - Transactional')
ON CONFLICT (email_type) DO NOTHING;

-- Selling Notifications (8)
INSERT INTO email_configuration (email_type, is_enabled, notes) VALUES
  ('product_submitted', true, 'Product submitted for review - Selling'),
  ('product_approved', true, 'Product approved - Selling'),
  ('product_rejected', true, 'Product rejected - Selling'),
  ('product_suspended', true, 'Product suspended - Selling'),
  ('product_version_update', true, 'Product version update - Selling'),
  ('new_sale', true, 'New sale notification - Selling'),
  ('new_review', true, 'New review notification - Selling'),
  ('verification_approved', true, 'Teacher verification approved - Selling'),
  ('verification_rejected', true, 'Teacher verification rejected - Selling')
ON CONFLICT (email_type) DO NOTHING;

-- Buying Notifications (6)
INSERT INTO email_configuration (email_type, is_enabled, notes) VALUES
  ('cart_abandonment', true, 'Cart abandonment reminder - Buying'),
  ('review_reminder', true, 'Review reminder - Buying'),
  ('price_drop', true, 'Price drop notification - Buying'),
  ('review_response', true, 'Review response notification - Buying'),
  ('product_version_update_buyer', true, 'Product version update (buyer) - Buying')
ON CONFLICT (email_type) DO NOTHING;

-- Social Notifications (3)
INSERT INTO email_configuration (email_type, is_enabled, notes) VALUES
  ('new_follower', true, 'New follower notification - Social'),
  ('new_product_followed_seller', true, 'New product from followed seller - Social')
ON CONFLICT (email_type) DO NOTHING;

-- Platform Announcements (2)
INSERT INTO email_configuration (email_type, is_enabled, notes) VALUES
  ('system_announcement', true, 'System announcement - Platform'),
  ('account_banned', true, 'Account ban notification - Platform')
ON CONFLICT (email_type) DO NOTHING;

-- ============================================================================
-- 19. Create Function to Update Updated At Timestamp
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to email_templates
-- Create trigger "update_email_templates_updated_at" if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'update_email_templates_updated_at' 
    AND tgrelid = 'email_templates'::regclass::oid
  ) THEN
    EXECUTE format('CREATE TRIGGER %I %s EXECUTE FUNCTION %I()',
      'update_email_templates_updated_at',
      'BEFORE UPDATE ON email_templates FOR EACH ROW',
      'update_updated_at_column'
    );
  END IF;
END $$;


-- Apply trigger to email_configuration
-- Create trigger "update_email_configuration_updated_at" if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'update_email_configuration_updated_at' 
    AND tgrelid = 'email_configuration'::regclass::oid
  ) THEN
    EXECUTE format('CREATE TRIGGER %I %s EXECUTE FUNCTION %I()',
      'update_email_configuration_updated_at',
      'BEFORE UPDATE ON email_configuration FOR EACH ROW',
      'update_updated_at_column'
    );
  END IF;
END $$;


-- Apply trigger to user_email_preferences
-- Create trigger "update_user_email_preferences_updated_at" if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'update_user_email_preferences_updated_at' 
    AND tgrelid = 'user_email_preferences'::regclass::oid
  ) THEN
    EXECUTE format('CREATE TRIGGER %I %s EXECUTE FUNCTION %I()',
      'update_user_email_preferences_updated_at',
      'BEFORE UPDATE ON user_email_preferences FOR EACH ROW',
      'update_updated_at_column'
    );
  END IF;
END $$;


-- ============================================================================
-- Migration Complete
-- ============================================================================



-- ============================================================================
-- Migration: 014_feature_11_messaging_system.sql
-- ============================================================================

-- Migration: 014_feature_11_messaging_system.sql
-- Feature: Messaging System (Feature 11)
-- Description: Create messaging system tables (conversations, messages, message_templates, message_reports, user_blocks, seller_response_times), storage bucket (message-images), RLS policies, and indexes

-- ============================================================================
-- 1. Create Conversations Table
-- ============================================================================

CREATE TABLE IF NOT EXISTS conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Participants
  buyer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  seller_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Context
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  order_id UUID REFERENCES orders(id) ON DELETE SET NULL,

  -- Status
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'archived', 'blocked')),
  archived_by UUID REFERENCES users(id), -- Who archived (null if both)
  blocked_by UUID REFERENCES users(id), -- Who blocked (null if not blocked)

  -- Timestamps
  last_message_at TIMESTAMP DEFAULT NOW(), -- Updated on each new message
  created_at TIMESTAMP DEFAULT NOW(),

  -- Constraints
  UNIQUE(buyer_id, seller_id, product_id), -- One conversation per buyer-seller-product
  CHECK (buyer_id != seller_id) -- Can't message yourself
);

-- Indexes for conversations
CREATE INDEX IF NOT EXISTS idx_conversations_buyer ON conversations(buyer_id, last_message_at DESC);
CREATE INDEX IF NOT EXISTS idx_conversations_seller ON conversations(seller_id, last_message_at DESC);
CREATE INDEX IF NOT EXISTS idx_conversations_product ON conversations(product_id) WHERE product_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_conversations_status ON conversations(status);
CREATE INDEX IF NOT EXISTS idx_conversations_last_message ON conversations(last_message_at DESC);

-- ============================================================================
-- 2. Create Messages Table
-- ============================================================================

CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Conversation
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,

  -- Sender
  sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Content
  content TEXT NOT NULL CHECK (LENGTH(content) >= 1 AND LENGTH(content) <= 1000),
  message_type VARCHAR(20) DEFAULT 'user' CHECK (message_type IN ('user', 'system', 'admin')),

  -- Attachments (images only)
  attachments TEXT[], -- Array of image URLs (Supabase Storage)

  -- Read Status
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMP,

  -- Moderation
  is_flagged BOOLEAN DEFAULT false,
  flag_reason VARCHAR(255), -- 'external_link', 'profanity', 'spam', 'user_report'
  is_deleted BOOLEAN DEFAULT false, -- Soft delete
  deleted_by UUID REFERENCES users(id),
  deleted_at TIMESTAMP,

  -- Admin Intervention
  admin_joined BOOLEAN DEFAULT false, -- Admin joined conversation
  admin_id UUID REFERENCES users(id), -- Which admin

  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for messages
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_sender ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_unread ON messages(conversation_id, is_read) WHERE is_read = false;
CREATE INDEX IF NOT EXISTS idx_messages_flagged ON messages(is_flagged) WHERE is_flagged = true;
CREATE INDEX IF NOT EXISTS idx_messages_created ON messages(created_at DESC);

-- ============================================================================
-- 3. Create Message Templates Table
-- ============================================================================

CREATE TABLE IF NOT EXISTS message_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Owner (NULL for system templates)
  seller_id UUID REFERENCES users(id) ON DELETE CASCADE,

  -- Template Content
  name VARCHAR(255) NOT NULL,
  content TEXT NOT NULL CHECK (LENGTH(content) >= 1 AND LENGTH(content) <= 500),

  -- Type
  template_type VARCHAR(20) DEFAULT 'custom' CHECK (template_type IN ('system', 'custom')),
  is_active BOOLEAN DEFAULT true,

  -- Usage
  usage_count INTEGER DEFAULT 0, -- Track how often used

  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for message_templates
CREATE INDEX IF NOT EXISTS idx_templates_seller ON message_templates(seller_id) WHERE seller_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_templates_type ON message_templates(template_type);
CREATE INDEX IF NOT EXISTS idx_templates_active ON message_templates(is_active) WHERE is_active = true;

-- ============================================================================
-- 4. Create Message Reports Table
-- ============================================================================

CREATE TABLE IF NOT EXISTS message_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Who Reported
  reporter_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reported_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Context
  conversation_id UUID REFERENCES conversations(id) ON DELETE SET NULL,
  message_id UUID REFERENCES messages(id) ON DELETE SET NULL,

  -- Report Details
  report_type VARCHAR(50) NOT NULL CHECK (report_type IN ('harassment', 'fraud', 'inappropriate', 'spam', 'other')),
  description TEXT,

  -- Status
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'under_review', 'resolved', 'dismissed')),

  -- Resolution
  reviewed_by UUID REFERENCES users(id), -- Admin who reviewed
  resolution TEXT, -- Admin notes
  resolved_at TIMESTAMP,

  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for message_reports
CREATE INDEX IF NOT EXISTS idx_reports_status ON message_reports(status);
CREATE INDEX IF NOT EXISTS idx_reports_reported_user ON message_reports(reported_user_id);
CREATE INDEX IF NOT EXISTS idx_reports_reporter ON message_reports(reporter_id);
CREATE INDEX IF NOT EXISTS idx_reports_type ON message_reports(report_type);
CREATE INDEX IF NOT EXISTS idx_reports_created ON message_reports(created_at DESC);

-- ============================================================================
-- 5. Create User Blocks Table
-- ============================================================================

CREATE TABLE IF NOT EXISTS user_blocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Who Blocked Whom
  blocker_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  blocked_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Conversation Context
  conversation_id UUID REFERENCES conversations(id) ON DELETE SET NULL,

  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),

  -- Constraints
  UNIQUE(blocker_id, blocked_id),
  CHECK (blocker_id != blocked_id) -- Can't block yourself
);

-- Indexes for user_blocks
CREATE INDEX IF NOT EXISTS idx_blocks_blocker ON user_blocks(blocker_id);
CREATE INDEX IF NOT EXISTS idx_blocks_blocked ON user_blocks(blocked_id);

-- ============================================================================
-- 6. Create Seller Response Times Table
-- ============================================================================

CREATE TABLE IF NOT EXISTS seller_response_times (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Seller
  seller_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Response Metrics
  conversation_id UUID REFERENCES conversations(id) ON DELETE SET NULL,
  first_message_at TIMESTAMP NOT NULL, -- Buyer sent message
  first_response_at TIMESTAMP NOT NULL, -- Seller responded
  response_seconds INTEGER NOT NULL, -- Time difference

  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for seller_response_times
CREATE INDEX IF NOT EXISTS idx_response_times_seller ON seller_response_times(seller_id);
CREATE INDEX IF NOT EXISTS idx_response_times_created ON seller_response_times(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_response_times_conversation ON seller_response_times(conversation_id);

-- ============================================================================
-- 7. Create Storage Bucket for Message Images
-- ============================================================================

-- Create message-images bucket (if it doesn't exist)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'message-images',
  'message-images',
  true, -- Public bucket (images are viewable by participants)
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- 8. Storage RLS Policies for message-images bucket
-- ============================================================================

-- Allow authenticated users to upload images to their own folder
-- Path format: {conversation_id}/{user_id}/{timestamp}-{filename}
CREATE POLICY "Users can upload message images"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'message-images'
  );

-- Allow public to read message images (participants can view)
CREATE POLICY "Public can read message images"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'message-images');

-- Allow users to delete their own uploaded images
CREATE POLICY "Users can delete own message images"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'message-images' AND
    (storage.foldername(name))[2] = auth.uid()::text
  );

-- ============================================================================
-- 9. Enable RLS on All Tables
-- ============================================================================

ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE seller_response_times ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 10. RLS Policies for Conversations
-- ============================================================================

-- Users can view conversations they're participants in
CREATE POLICY "Users can view own conversations"
  ON conversations FOR SELECT
  TO authenticated
  USING (
    buyer_id = auth.uid() OR
    seller_id = auth.uid()
  );

-- Buyers can create conversations with sellers
CREATE POLICY "Buyers can create conversations"
  ON conversations FOR INSERT
  TO authenticated
  WITH CHECK (
    buyer_id = auth.uid() AND
    seller_id != auth.uid()
  );

-- Participants can update their own conversations (archive/unarchive)
CREATE POLICY "Participants can update conversations"
  ON conversations FOR UPDATE
  TO authenticated
  USING (
    buyer_id = auth.uid() OR
    seller_id = auth.uid()
  );

-- Participants can delete (soft delete) their own conversations
CREATE POLICY "Participants can delete conversations"
  ON conversations FOR DELETE
  TO authenticated
  USING (
    buyer_id = auth.uid() OR
    seller_id = auth.uid()
  );

-- Admins can view all conversations
CREATE POLICY "Admins can view all conversations"
  ON conversations FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND role = 'admin'
    )
  );

-- ============================================================================
-- 11. RLS Policies for Messages
-- ============================================================================

-- Users can view messages in conversations they're participants in
CREATE POLICY "Users can view messages in own conversations"
  ON messages FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM conversations
      WHERE id = messages.conversation_id
      AND (buyer_id = auth.uid() OR seller_id = auth.uid())
    )
  );

-- Participants can send messages in their conversations
CREATE POLICY "Participants can send messages"
  ON messages FOR INSERT
  TO authenticated
  WITH CHECK (
    sender_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM conversations
      WHERE id = messages.conversation_id
      AND (buyer_id = auth.uid() OR seller_id = auth.uid())
      AND status != 'blocked'
    )
  );

-- Recipients can mark messages as read
CREATE POLICY "Recipients can mark messages as read"
  ON messages FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM conversations
      WHERE id = messages.conversation_id
      AND (buyer_id = auth.uid() OR seller_id = auth.uid())
      AND sender_id != auth.uid()
    )
  );

-- Senders can delete their own messages (soft delete)
CREATE POLICY "Senders can delete own messages"
  ON messages FOR UPDATE
  TO authenticated
  USING (
    sender_id = auth.uid()
  )
  WITH CHECK (
    sender_id = auth.uid()
  );

-- Admins can view all messages
CREATE POLICY "Admins can view all messages"
  ON messages FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND role = 'admin'
    )
  );

-- Admins can delete any message
CREATE POLICY "Admins can delete any message"
  ON messages FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND role = 'admin'
    )
  );

-- ============================================================================
-- 12. RLS Policies for Message Templates
-- ============================================================================

-- All users can view system templates
CREATE POLICY "Users can view system templates"
  ON message_templates FOR SELECT
  TO authenticated
  USING (template_type = 'system' AND is_active = true);

-- Sellers can view their own custom templates
CREATE POLICY "Sellers can view own templates"
  ON message_templates FOR SELECT
  TO authenticated
  USING (
    seller_id = auth.uid() OR
    template_type = 'system'
  );

-- Pro/Pioneer sellers can create custom templates
CREATE POLICY "Pro/Pioneer sellers can create templates"
  ON message_templates FOR INSERT
  TO authenticated
  WITH CHECK (
    seller_id = auth.uid() AND
    template_type = 'custom' AND
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND subscription_tier IN ('pro', 'pioneer')
    )
  );

-- Sellers can update their own templates
CREATE POLICY "Sellers can update own templates"
  ON message_templates FOR UPDATE
  TO authenticated
  USING (seller_id = auth.uid())
  WITH CHECK (seller_id = auth.uid());

-- Sellers can delete their own templates
CREATE POLICY "Sellers can delete own templates"
  ON message_templates FOR DELETE
  TO authenticated
  USING (
    seller_id = auth.uid() AND
    template_type = 'custom'
  );

-- ============================================================================
-- 13. RLS Policies for Message Reports
-- ============================================================================

-- Users can create reports
CREATE POLICY "Users can create reports"
  ON message_reports FOR INSERT
  TO authenticated
  WITH CHECK (reporter_id = auth.uid());

-- Users can view their own reports
CREATE POLICY "Users can view own reports"
  ON message_reports FOR SELECT
  TO authenticated
  USING (reporter_id = auth.uid());

-- Admins can view all reports
CREATE POLICY "Admins can view all reports"
  ON message_reports FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND role = 'admin'
    )
  );

-- Admins can update reports (resolve/dismiss)
CREATE POLICY "Admins can update reports"
  ON message_reports FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND role = 'admin'
    )
  );

-- ============================================================================
-- 14. RLS Policies for User Blocks
-- ============================================================================

-- Users can view their own blocks
CREATE POLICY "Users can view own blocks"
  ON user_blocks FOR SELECT
  TO authenticated
  USING (blocker_id = auth.uid());

-- Users can create blocks
CREATE POLICY "Users can create blocks"
  ON user_blocks FOR INSERT
  TO authenticated
  WITH CHECK (blocker_id = auth.uid());

-- Users can delete their own blocks (unblock)
CREATE POLICY "Users can delete own blocks"
  ON user_blocks FOR DELETE
  TO authenticated
  USING (blocker_id = auth.uid());

-- ============================================================================
-- 15. RLS Policies for Seller Response Times
-- ============================================================================

-- Sellers can view their own response times
CREATE POLICY "Sellers can view own response times"
  ON seller_response_times FOR SELECT
  TO authenticated
  USING (seller_id = auth.uid());

-- System can insert response times (via service role or function)
-- No INSERT policy needed - will be done via service role or function

-- Admins can view all response times
CREATE POLICY "Admins can view all response times"
  ON seller_response_times FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND role = 'admin'
    )
  );

-- ============================================================================
-- 16. Insert System Templates (5 default quick replies)
-- ============================================================================

INSERT INTO message_templates (seller_id, name, content, template_type, is_active)
VALUES
  (NULL, 'Yes, available!', 'Yes, this product is available! 💚', 'system', true),
  (NULL, 'Includes answer keys', 'Yes, this includes answer keys.', 'system', true),
  (NULL, 'Can customize', 'I can customize this for you. What changes do you need?', 'system', true),
  (NULL, 'Check library', 'Please check your library for downloads.', 'system', true),
  (NULL, 'Thank you', 'Thank you for your purchase! Let me know if you need help.', 'system', true)
ON CONFLICT DO NOTHING;

-- ============================================================================
-- 17. Create Function to Update Conversation Last Message Timestamp
-- ============================================================================

CREATE OR REPLACE FUNCTION update_conversation_last_message()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE conversations
  SET last_message_at = NEW.created_at
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger "trigger_update_conversation_last_message" if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'trigger_update_conversation_last_message' 
    AND tgrelid = 'messages'::regclass::oid
  ) THEN
    EXECUTE format('CREATE TRIGGER %I %s EXECUTE FUNCTION %I()',
      'trigger_update_conversation_last_message',
      'AFTER INSERT ON messages FOR EACH ROW',
      'update_conversation_last_message'
    );
  END IF;
END $$;


-- ============================================================================
-- 18. Create Function to Track Response Times
-- ============================================================================

CREATE OR REPLACE FUNCTION track_seller_response_time()
RETURNS TRIGGER AS $$
DECLARE
  v_conversation_id UUID;
  v_seller_id UUID;
  v_first_message_at TIMESTAMP;
  v_response_seconds INTEGER;
  v_avg_hours NUMERIC;
BEGIN
  -- Only track if this is a seller's first response in a conversation
  -- Check if seller has already responded in this conversation
  IF EXISTS (
    SELECT 1 FROM messages
    WHERE conversation_id = NEW.conversation_id
      AND sender_id = (SELECT seller_id FROM conversations WHERE id = NEW.conversation_id)
      AND id != NEW.id
      AND message_type = 'user'
  ) THEN
    -- Seller has already responded, don't track again
    RETURN NEW;
  END IF;

  -- Get conversation and seller info
  SELECT 
    c.id,
    c.seller_id,
    MIN(m.created_at)
  INTO v_conversation_id, v_seller_id, v_first_message_at
  FROM conversations c
  JOIN messages m ON m.conversation_id = c.id
  WHERE c.id = NEW.conversation_id
    AND c.seller_id = NEW.sender_id
    AND m.sender_id != c.seller_id
    AND m.message_type = 'user'
  GROUP BY c.id, c.seller_id;

  -- If this is seller's first response
  IF v_first_message_at IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM seller_response_times
    WHERE conversation_id = NEW.conversation_id
  ) THEN
    v_response_seconds := EXTRACT(EPOCH FROM (NEW.created_at - v_first_message_at))::INTEGER;
    
    INSERT INTO seller_response_times (
      seller_id,
      conversation_id,
      first_message_at,
      first_response_at,
      response_seconds
    ) VALUES (
      v_seller_id,
      v_conversation_id,
      v_first_message_at,
      NEW.created_at,
      v_response_seconds
    );

    -- Update seller's response_time_hours in users table
    -- Calculate average of last 50 responses (rolling 30-day window)
    SELECT COALESCE(
      ROUND(AVG(response_seconds) / 3600.0, 1),
      NULL
    ) INTO v_avg_hours
    FROM seller_response_times
    WHERE seller_id = v_seller_id
      AND created_at >= NOW() - INTERVAL '30 days'
    ORDER BY created_at DESC
    LIMIT 50;

    -- Update users table
    IF v_avg_hours IS NOT NULL THEN
      UPDATE users
      SET response_time_hours = v_avg_hours
      WHERE id = v_seller_id;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger "trigger_track_seller_response_time" if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'trigger_track_seller_response_time' 
    AND tgrelid = 'messages'::regclass::oid
  ) THEN
    EXECUTE format('CREATE TRIGGER %I %s EXECUTE FUNCTION %I()',
      'trigger_track_seller_response_time',
      'AFTER INSERT ON messages FOR EACH ROW WHEN (NEW.message_type = 'user')',
      'track_seller_response_time'
    );
  END IF;
END $$;




-- ============================================================================
-- Migration: 015_add_reports_table.sql
-- ============================================================================

-- Migration: 015_add_reports_table.sql
-- Description: Add missing reports table for content moderation (product, user, review, message reports)

-- ============================================================================
-- 1. Create Reports Table
-- ============================================================================

CREATE TABLE IF NOT EXISTS reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id UUID NOT NULL REFERENCES users(id) ON DELETE SET NULL,
  report_type VARCHAR(20) NOT NULL CHECK (report_type IN ('product', 'user', 'review', 'message')),
  reported_item_id UUID NOT NULL, -- ID of product/user/review/message
  reason VARCHAR(50) NOT NULL, -- inappropriate_content, copyright_violation, harassment, spam, etc.
  description TEXT,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'under_review', 'resolved', 'dismissed')),
  severity VARCHAR(20) DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'urgent')),
  escalation_level INTEGER DEFAULT 0, -- Increments on appeal
  assigned_to UUID REFERENCES users(id), -- Admin assigned to this report
  resolution_notes TEXT,
  resolved_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for reports
CREATE INDEX IF NOT EXISTS idx_reports_status ON reports(status);
CREATE INDEX IF NOT EXISTS idx_reports_severity ON reports(severity, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reports_assigned ON reports(assigned_to);
CREATE INDEX IF NOT EXISTS idx_reports_type ON reports(report_type);

-- ============================================================================
-- 2. Enable Row Level Security (RLS)
-- ============================================================================

ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 3. Create RLS Policies for Reports
-- ============================================================================





-- Users can view their own reports
-- Create policy "Users can view own reports" if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'reports' 
    AND policyname = 'Users can view own reports'
  ) THEN
    CREATE POLICY "Users can view own reports" ON reports FOR SELECT USING (reporter_id = auth.uid());
  END IF;
END $$;

-- Users can create reports
-- Create policy "Users can create reports" if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'reports' 
    AND policyname = 'Users can create reports'
  ) THEN
    CREATE POLICY "Users can create reports" ON reports FOR INSERT WITH CHECK (reporter_id = auth.uid());
  END IF;
END $$;

-- Admins can view and manage all reports
-- Create policy "Admins can manage all reports" if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'reports' 
    AND policyname = 'Admins can manage all reports'
  ) THEN
    CREATE POLICY "Admins can manage all reports" ON reports FOR ALL USING (
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
  END IF;
END $$;

-- ============================================================================
-- Migration Complete
-- ============================================================================



-- ============================================================================
-- Migration: 016_teacher_verification_storage.sql
-- ============================================================================

-- Migration: 016_teacher_verification_storage.sql
-- Feature: Teacher Verification Storage Bucket
-- Description: Create storage bucket for teacher verification documents and ensure teacher_id_verifications table exists

-- ============================================================================
-- 1. Create teacher_id_verifications Table (if it doesn't exist)
-- ============================================================================

CREATE TABLE IF NOT EXISTS teacher_id_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- PRC License Info
  document_url TEXT NOT NULL, -- Supabase Storage URL
  prc_license_number VARCHAR(50) NOT NULL,
  prc_license_expiry DATE NOT NULL,
  verification_grace_period_ends DATE,

  -- Status
  status VARCHAR(20) CHECK (status IN ('pending', 'approved', 'rejected')) DEFAULT 'pending',
  rejection_reason TEXT,

  -- Admin Review
  reviewed_by UUID REFERENCES users(id),
  reviewed_at TIMESTAMP,

  created_at TIMESTAMP DEFAULT NOW(),

  -- Constraints
  CHECK (prc_license_expiry > created_at)
);

-- Indexes for teacher_id_verifications
CREATE INDEX IF NOT EXISTS idx_verifications_user ON teacher_id_verifications(user_id);
CREATE INDEX IF NOT EXISTS idx_verifications_status ON teacher_id_verifications(status);
CREATE INDEX IF NOT EXISTS idx_verifications_reviewed ON teacher_id_verifications(reviewed_by);

-- ============================================================================
-- 2. Create Storage Bucket for Teacher Verifications
-- ============================================================================

-- Create teacher-verifications bucket (private - only admins and users can access)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'teacher-verifications',
  'teacher-verifications',
  false, -- Private bucket - sensitive documents
  5242880, -- 5MB limit
  ARRAY['application/pdf', 'image/jpeg', 'image/png']
)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- 3. Storage RLS Policies for teacher-verifications bucket
-- ============================================================================

-- Allow authenticated users to upload to their own folder
-- Path format: {user_id}/{timestamp}-prc-license.{ext}

CREATE POLICY "Users can upload own verification document"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'teacher-verifications' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Allow users to read their own documents

CREATE POLICY "Users can read own verification document"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'teacher-verifications' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Allow admins to read all verification documents

CREATE POLICY "Admins can read all verification documents"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'teacher-verifications' AND
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Allow users to delete their own documents (before verification)

CREATE POLICY "Users can delete own verification document"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'teacher-verifications' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- ============================================================================
-- 4. RLS Policies for teacher_id_verifications table
-- ============================================================================

ALTER TABLE teacher_id_verifications ENABLE ROW LEVEL SECURITY;

-- Users can view their own verification records

-- Create policy "Users can view own verification" if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'teacher_id_verifications' 
    AND policyname = 'Users can view own verification'
  ) THEN
    CREATE POLICY "Users can view own verification" ON teacher_id_verifications FOR SELECT USING (user_id = auth.uid());
  END IF;
END $$;

-- Users can insert their own verification records

-- Create policy "Users can insert own verification" if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'teacher_id_verifications' 
    AND policyname = 'Users can insert own verification'
  ) THEN
    CREATE POLICY "Users can insert own verification" ON teacher_id_verifications FOR INSERT WITH CHECK (user_id = auth.uid());
  END IF;
END $$;

-- Admins can view all verification records

-- Create policy "Admins can view all verifications" if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'teacher_id_verifications' 
    AND policyname = 'Admins can view all verifications'
  ) THEN
    CREATE POLICY "Admins can view all verifications" ON teacher_id_verifications FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );
  END IF;
END $$;

-- Admins can update verification records

-- Create policy "Admins can update verifications" if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'teacher_id_verifications' 
    AND policyname = 'Admins can update verifications'
  ) THEN
    CREATE POLICY "Admins can update verifications" ON teacher_id_verifications FOR UPDATE USING (
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
  END IF;
END $$;



-- ============================================================================
-- Migration: 017_seller_settings_fields.sql
-- ============================================================================

-- Migration: 017_seller_settings_fields.sql
-- Feature: Seller Settings (My Shop Settings Page)
-- Description: Add seller-specific settings fields to users table and create seller_messaging_settings table

-- ============================================================================
-- 1. Add Shop Settings Fields to Users Table
-- ============================================================================

ALTER TABLE users
ADD COLUMN IF NOT EXISTS shop_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS shop_description TEXT,
ADD COLUMN IF NOT EXISTS auto_publish BOOLEAN DEFAULT false;

-- ============================================================================
-- 2. Create Seller Messaging Settings Table
-- ============================================================================

CREATE TABLE IF NOT EXISTS seller_messaging_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Seller
  seller_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  
  -- Away Message Settings
  away_message_enabled BOOLEAN DEFAULT false,
  away_message_return_date TIMESTAMP,
  away_message_text TEXT,
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  -- Constraints
  CHECK (seller_id IN (SELECT id FROM users WHERE can_sell = true))
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_seller_messaging_settings_seller ON seller_messaging_settings(seller_id);
CREATE INDEX IF NOT EXISTS idx_seller_messaging_settings_away_enabled ON seller_messaging_settings(away_message_enabled) WHERE away_message_enabled = true;

-- ============================================================================
-- 3. Enable RLS on seller_messaging_settings
-- ============================================================================

ALTER TABLE seller_messaging_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Sellers can view own messaging settings"
  ON seller_messaging_settings FOR SELECT
  TO authenticated
  USING (seller_id = auth.uid());

CREATE POLICY "Sellers can insert own messaging settings"
  ON seller_messaging_settings FOR INSERT
  TO authenticated
  WITH CHECK (seller_id = auth.uid());

CREATE POLICY "Sellers can update own messaging settings"
  ON seller_messaging_settings FOR UPDATE
  TO authenticated
  USING (seller_id = auth.uid())
  WITH CHECK (seller_id = auth.uid());

-- ============================================================================
-- 4. Create Function to Update updated_at Timestamp
-- ============================================================================

CREATE OR REPLACE FUNCTION update_seller_messaging_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
-- Create trigger "trigger_update_seller_messaging_settings_updated_at" if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'trigger_update_seller_messaging_settings_updated_at' 
    AND tgrelid = 'seller_messaging_settings'::regclass::oid
  ) THEN
    EXECUTE format('CREATE TRIGGER %I %s EXECUTE FUNCTION %I()',
      'trigger_update_seller_messaging_settings_updated_at',
      'BEFORE UPDATE ON seller_messaging_settings FOR EACH ROW',
      'update_seller_messaging_settings_updated_at'
    );
  END IF;
END $$;




-- ============================================================================
-- Migration: 018_replace_name_with_first_last_name.sql
-- ============================================================================

-- Migration: Replace name field with first_name and last_name
-- Date: 2025-01-XX
-- Description: Splits the single 'name' field into 'first_name' and 'last_name' fields
--              Migrates existing data by splitting on first space

-- Step 1: Add new columns (nullable initially to allow migration)
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS first_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS last_name VARCHAR(255);

-- Step 2: Migrate existing data
-- Split name on first space:
-- - If name has space: first_name = first part, last_name = rest
-- - If no space: first_name = name, last_name = ''
-- - If name is NULL: first_name = 'User', last_name = ''
UPDATE users
SET 
  first_name = CASE 
    WHEN name IS NULL OR name = '' THEN 
      'User'
    WHEN position(' ' in name) > 0 THEN 
      substring(name from 1 for position(' ' in name) - 1)
    ELSE 
      name
  END,
  last_name = CASE 
    WHEN name IS NULL OR name = '' THEN 
      ''
    WHEN position(' ' in name) > 0 THEN 
      substring(name from position(' ' in name) + 1)
    ELSE 
      ''
  END
WHERE first_name IS NULL OR last_name IS NULL;

-- Step 3: Make first_name NOT NULL (last_name can be empty string)
ALTER TABLE users 
ALTER COLUMN first_name SET NOT NULL;

-- Step 4: Set default empty string for last_name if NULL
UPDATE users SET last_name = '' WHERE last_name IS NULL;
ALTER TABLE users 
ALTER COLUMN last_name SET DEFAULT '';

-- Step 5: Drop the old name column
ALTER TABLE users DROP COLUMN IF EXISTS name;

-- Note: No indexes or constraints specifically on the name column to update
-- The name field was not indexed separately




-- ============================================================================
-- Schema Application Complete
-- ============================================================================
-- Next steps:
-- 1. Verify all tables were created
-- 2. Run: npx tsx scripts/compare-schemas-simple.ts
-- 3. Verify Dev schema matches Prod 100%
-- ============================================================================