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
-- 5. Create Trigger Function to Update Followers Count
-- ============================================================================

-- Function to update followers_count on users table
CREATE OR REPLACE FUNCTION update_followers_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE users
    SET followers_count = followers_count + 1
    WHERE id = NEW.following_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE users
    SET followers_count = GREATEST(followers_count - 1, 0)
    WHERE id = OLD.following_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS trigger_update_followers_count ON followers;
CREATE TRIGGER trigger_update_followers_count
  AFTER INSERT OR DELETE ON followers
  FOR EACH ROW
  EXECUTE FUNCTION update_followers_count();

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

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Anyone can view followers" ON followers;
DROP POLICY IF EXISTS "Users can manage own follows" ON followers;
DROP POLICY IF EXISTS "Admins have full access to followers" ON followers;

-- Anyone can view followers (for follower count, but not full list)
CREATE POLICY "Anyone can view followers"
  ON followers FOR SELECT
  USING (true);

-- Users can follow/unfollow (manage their own follows)
CREATE POLICY "Users can manage own follows"
  ON followers FOR ALL
  USING (follower_id = auth.uid())
  WITH CHECK (follower_id = auth.uid());

-- Admins have full access
CREATE POLICY "Admins have full access to followers"
  ON followers FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================================================
-- 8. Create RLS Policies for profile_views table
-- ============================================================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Anyone can insert profile views" ON profile_views;
DROP POLICY IF EXISTS "Users can view own profile analytics" ON profile_views;
DROP POLICY IF EXISTS "Admins have full access to profile_views" ON profile_views;

-- Anyone can insert profile views (for tracking)
CREATE POLICY "Anyone can insert profile views"
  ON profile_views FOR INSERT
  WITH CHECK (true);

-- Users can view analytics for their own profile
CREATE POLICY "Users can view own profile analytics"
  ON profile_views FOR SELECT
  USING (profile_user_id = auth.uid());

-- Admins have full access
CREATE POLICY "Admins have full access to profile_views"
  ON profile_views FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================================================
-- 9. Create RLS Policies for admin_notes table
-- ============================================================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Admins can manage admin notes" ON admin_notes;

-- Only admins can access admin notes
CREATE POLICY "Admins can manage admin notes"
  ON admin_notes FOR ALL
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

-- ============================================================================
-- 10. Create RLS Policies for audit_log table
-- ============================================================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Admins can view audit log" ON audit_log;
DROP POLICY IF EXISTS "System can insert audit log" ON audit_log;

-- Admins can view audit log
CREATE POLICY "Admins can view audit log"
  ON audit_log FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- System can insert audit log (via service role or admin)
CREATE POLICY "System can insert audit log"
  ON audit_log FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================================================
-- Migration Complete
-- ============================================================================
