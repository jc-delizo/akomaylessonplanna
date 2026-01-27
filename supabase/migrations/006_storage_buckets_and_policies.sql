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
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'Users can upload own avatar'
  ) THEN
    CREATE POLICY "Users can upload own avatar"
      ON storage.objects FOR INSERT
      TO authenticated
      WITH CHECK (
        bucket_id = 'user-avatars' AND
        (storage.foldername(name))[1] = auth.uid()::text
      );
  END IF;
END $$;

-- Allow public to read avatars (avatars are public)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'Public can read avatars'
  ) THEN
    CREATE POLICY "Public can read avatars"
      ON storage.objects FOR SELECT
      TO public
      USING (bucket_id = 'user-avatars');
  END IF;
END $$;

-- Allow users to update their own avatars
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'Users can update own avatar'
  ) THEN
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
  END IF;
END $$;

-- Allow users to delete their own avatars
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'Users can delete own avatar'
  ) THEN
    CREATE POLICY "Users can delete own avatar"
      ON storage.objects FOR DELETE
      TO authenticated
      USING (
        bucket_id = 'user-avatars' AND
        (storage.foldername(name))[1] = auth.uid()::text
      );
  END IF;
END $$;

-- ============================================================================
-- 3. Storage RLS Policies for user-banners bucket
-- ============================================================================

-- Allow Pro/Pioneer users to upload banners to their own folder
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'Pro/Pioneer users can upload own banner'
  ) THEN
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
  END IF;
END $$;

-- Allow public to read banners (banners are public)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'Public can read banners'
  ) THEN
    CREATE POLICY "Public can read banners"
      ON storage.objects FOR SELECT
      TO public
      USING (bucket_id = 'user-banners');
  END IF;
END $$;

-- Allow Pro/Pioneer users to update their own banners
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'Pro/Pioneer users can update own banner'
  ) THEN
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
  END IF;
END $$;

-- Allow Pro/Pioneer users to delete their own banners
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'Pro/Pioneer users can delete own banner'
  ) THEN
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
  END IF;
END $$;

-- ============================================================================
-- 4. Storage RLS Policies for product-files bucket (PRIVATE)
-- ============================================================================

-- Allow sellers to upload product files to their own folder
-- Path format: {user_id}/{product_id}/file.{ext}
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'Sellers can upload own product files'
  ) THEN
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
  END IF;
END $$;

-- Allow sellers to read their own product files
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'Sellers can read own product files'
  ) THEN
    CREATE POLICY "Sellers can read own product files"
      ON storage.objects FOR SELECT
      TO authenticated
      USING (
        bucket_id = 'product-files' AND
        (storage.foldername(name))[1] = auth.uid()::text
      );
  END IF;
END $$;

-- Allow buyers who purchased the product to download files (TODO: Implement after Orders feature)
-- For now, only sellers and admins can access
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'Admins can read all product files'
  ) THEN
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
  END IF;
END $$;

-- Allow sellers to update their own product files
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'Sellers can update own product files'
  ) THEN
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
  END IF;
END $$;

-- Allow sellers to delete their own product files
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'Sellers can delete own product files'
  ) THEN
    CREATE POLICY "Sellers can delete own product files"
      ON storage.objects FOR DELETE
      TO authenticated
      USING (
        bucket_id = 'product-files' AND
        (storage.foldername(name))[1] = auth.uid()::text
      );
  END IF;
END $$;

-- ============================================================================
-- 5. Storage RLS Policies for product-images bucket (PUBLIC)
-- ============================================================================

-- Allow sellers to upload product images to their own folder
-- Path format: {user_id}/{product_id}/image.{ext}
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'Sellers can upload own product images'
  ) THEN
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
  END IF;
END $$;

-- Allow public to read product images (covers and previews are public)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'Public can read product images'
  ) THEN
    CREATE POLICY "Public can read product images"
      ON storage.objects FOR SELECT
      TO public
      USING (bucket_id = 'product-images');
  END IF;
END $$;

-- Allow sellers to update their own product images
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'Sellers can update own product images'
  ) THEN
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
  END IF;
END $$;

-- Allow sellers to delete their own product images
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'Sellers can delete own product images'
  ) THEN
    CREATE POLICY "Sellers can delete own product images"
      ON storage.objects FOR DELETE
      TO authenticated
      USING (
        bucket_id = 'product-images' AND
        (storage.foldername(name))[1] = auth.uid()::text
      );
  END IF;
END $$;

-- ============================================================================
-- Migration Complete
-- ============================================================================
