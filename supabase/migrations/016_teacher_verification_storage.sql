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
DROP POLICY IF EXISTS "Users can upload own verification document" ON storage.objects;
CREATE POLICY "Users can upload own verification document"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'teacher-verifications' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Allow users to read their own documents
DROP POLICY IF EXISTS "Users can read own verification document" ON storage.objects;
CREATE POLICY "Users can read own verification document"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'teacher-verifications' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Allow admins to read all verification documents
DROP POLICY IF EXISTS "Admins can read all verification documents" ON storage.objects;
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
DROP POLICY IF EXISTS "Users can delete own verification document" ON storage.objects;
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
DROP POLICY IF EXISTS "Users can view own verification" ON teacher_id_verifications;
CREATE POLICY "Users can view own verification"
  ON teacher_id_verifications FOR SELECT
  USING (user_id = auth.uid());

-- Users can insert their own verification records
DROP POLICY IF EXISTS "Users can insert own verification" ON teacher_id_verifications;
CREATE POLICY "Users can insert own verification"
  ON teacher_id_verifications FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Admins can view all verification records
DROP POLICY IF EXISTS "Admins can view all verifications" ON teacher_id_verifications;
CREATE POLICY "Admins can view all verifications"
  ON teacher_id_verifications FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Admins can update verification records
DROP POLICY IF EXISTS "Admins can update verifications" ON teacher_id_verifications;
CREATE POLICY "Admins can update verifications"
  ON teacher_id_verifications FOR UPDATE
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
