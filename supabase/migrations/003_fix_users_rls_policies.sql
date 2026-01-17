-- Migration: 003_fix_users_rls_policies.sql
-- Feature: Fix RLS policies for users table
-- Description: Add missing INSERT policy and fix infinite recursion in admin policy

-- ============================================================================
-- Fix RLS Policies for users table
-- ============================================================================

-- Drop existing problematic policies
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
-- CRITICAL: This was missing and caused signup to fail
CREATE POLICY "Users can insert own profile"
  ON users FOR INSERT
  WITH CHECK (id = auth.uid());

-- Anyone can view public profile information (simplified for foundation)
-- This allows public access to seller profiles for browsing
CREATE POLICY "Anyone can view public profiles"
  ON users FOR SELECT
  USING (true);

-- Admins can select any user (separate policy to avoid recursion during INSERT)
-- FIXED: Split from ALL to avoid infinite recursion when inserting
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
