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
CREATE POLICY "Users can view own notifications"
  ON notifications FOR SELECT
  USING (user_id = auth.uid());

-- Users can update their own notifications (mark as read)
CREATE POLICY "Users can update own notifications"
  ON notifications FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Users can delete their own notifications
CREATE POLICY "Users can delete own notifications"
  ON notifications FOR DELETE
  USING (user_id = auth.uid());

-- System can insert notifications for any user (via service role)
-- This will be handled by server-side code with service role client
-- No policy needed for INSERT as it will use service role

-- Admins can view all notifications (for moderation/debugging)
CREATE POLICY "Admins can view all notifications"
  ON notifications FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================================================
-- 6. Create RLS Policies for recently_viewed
-- ============================================================================

-- Users can view their own recently viewed items
CREATE POLICY "Users can view own recently viewed"
  ON recently_viewed FOR SELECT
  USING (user_id = auth.uid());

-- Users can insert their own recently viewed items
CREATE POLICY "Users can insert own recently viewed"
  ON recently_viewed FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Users can update their own recently viewed items (update viewed_at)
CREATE POLICY "Users can update own recently viewed"
  ON recently_viewed FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Users can delete their own recently viewed items
CREATE POLICY "Users can delete own recently viewed"
  ON recently_viewed FOR DELETE
  USING (user_id = auth.uid());

-- ============================================================================
-- 7. Create RLS Policies for product_shares
-- ============================================================================

-- Anyone can insert product shares (for tracking, even anonymous users)
CREATE POLICY "Anyone can insert product shares"
  ON product_shares FOR INSERT
  WITH CHECK (true);

-- Users can view their own shares
CREATE POLICY "Users can view own shares"
  ON product_shares FOR SELECT
  USING (shared_by = auth.uid() OR shared_by IS NULL);

-- Sellers can view share stats for their products
CREATE POLICY "Sellers can view share stats for their products"
  ON product_shares FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM products
      WHERE products.id = product_shares.product_id
      AND products.seller_id = auth.uid()
    )
  );

-- Admins can view all shares
CREATE POLICY "Admins can view all shares"
  ON product_shares FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

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

-- Create trigger to run after insert/update
DROP TRIGGER IF EXISTS trigger_limit_recently_viewed ON recently_viewed;
CREATE TRIGGER trigger_limit_recently_viewed
  AFTER INSERT OR UPDATE ON recently_viewed
  FOR EACH ROW
  EXECUTE FUNCTION limit_recently_viewed_per_user();

-- ============================================================================
-- Migration Complete
-- ============================================================================
