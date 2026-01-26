-- ============================================================================
-- DEV DATABASE MIGRATIONS
-- Apply these migrations to Dev database via Supabase Dashboard SQL Editor
-- Database: enxtvupbiezvwrnuzwsl
-- ============================================================================

-- Migration: 009_feature_06_social_features.sql
-- ======================================================================
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



-- Migration: 011_feature_08_advanced_search.sql
-- ======================================================================
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

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Sellers can view own product search analytics" ON search_analytics;
DROP POLICY IF EXISTS "System can insert search analytics" ON search_analytics;
DROP POLICY IF EXISTS "Admins can view all search analytics" ON search_analytics;

-- Sellers can view analytics for their own products
CREATE POLICY "Sellers can view own product search analytics"
  ON search_analytics FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM products
      WHERE products.id = search_analytics.product_id
      AND products.seller_id = auth.uid()
    )
  );

-- System/service role can insert search analytics (for tracking)
-- Note: This will be called from API routes with service role
CREATE POLICY "System can insert search analytics"
  ON search_analytics FOR INSERT
  WITH CHECK (true);

-- System/service role can update search analytics
CREATE POLICY "System can update search analytics"
  ON search_analytics FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- Admins can view all search analytics
CREATE POLICY "Admins can view all search analytics"
  ON search_analytics FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================================================
-- 8. Create RLS Policies for search_queries
-- ============================================================================

ALTER TABLE search_queries ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Anyone can read popular searches" ON search_queries;
DROP POLICY IF EXISTS "Authenticated users can update search queries" ON search_queries;
DROP POLICY IF EXISTS "System can insert search queries" ON search_queries;

-- Anyone can read popular searches (public data)
CREATE POLICY "Anyone can read popular searches"
  ON search_queries FOR SELECT
  USING (true);

-- Authenticated users can update search count (when they search)
CREATE POLICY "Authenticated users can update search queries"
  ON search_queries FOR UPDATE
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- System/service role can insert search queries
CREATE POLICY "System can insert search queries"
  ON search_queries FOR INSERT
  WITH CHECK (true);

-- ============================================================================
-- 9. Create RLS Policies for user_search_history
-- ============================================================================

ALTER TABLE user_search_history ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own search history" ON user_search_history;
DROP POLICY IF EXISTS "Users can insert own search history" ON user_search_history;
DROP POLICY IF EXISTS "Users can delete own search history" ON user_search_history;

-- Users can view their own search history
CREATE POLICY "Users can view own search history"
  ON user_search_history FOR SELECT
  USING (user_id = auth.uid());

-- Users can insert their own search history
CREATE POLICY "Users can insert own search history"
  ON user_search_history FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Users can delete their own search history
CREATE POLICY "Users can delete own search history"
  ON user_search_history FOR DELETE
  USING (user_id = auth.uid());

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

-- Create trigger for search_analytics
DROP TRIGGER IF EXISTS trigger_update_search_analytics_updated_at ON search_analytics;
CREATE TRIGGER trigger_update_search_analytics_updated_at
  BEFORE UPDATE ON search_analytics
  FOR EACH ROW
  EXECUTE FUNCTION update_search_analytics_updated_at();

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

-- Create trigger for search_queries
DROP TRIGGER IF EXISTS trigger_update_search_queries_updated_at ON search_queries;
CREATE TRIGGER trigger_update_search_queries_updated_at
  BEFORE UPDATE ON search_queries
  FOR EACH ROW
  EXECUTE FUNCTION update_search_queries_updated_at();

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



-- Migration: 012_feature_09_admin_panel.sql
-- ======================================================================
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

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Admins can manage announcements" ON announcements;
DROP POLICY IF EXISTS "Users can view active announcements" ON announcements;

-- Admins can manage all announcements
CREATE POLICY "Admins can manage announcements"
  ON announcements FOR ALL
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

-- Users can view active announcements (for in-app display)
CREATE POLICY "Users can view active announcements"
  ON announcements FOR SELECT
  USING (status = 'active' AND (expires_at IS NULL OR expires_at > NOW()));

-- ============================================================================
-- 12. Create RLS Policies for Announcement Stats
-- ============================================================================

DROP POLICY IF EXISTS "Admins can view announcement stats" ON announcement_stats;

-- Only admins can view announcement stats
CREATE POLICY "Admins can view announcement stats"
  ON announcement_stats FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- System can insert/update stats (via service role or admin)
CREATE POLICY "Admins can manage announcement stats"
  ON announcement_stats FOR ALL
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
-- 13. Create RLS Policies for Categories
-- ============================================================================

DROP POLICY IF EXISTS "Anyone can view categories" ON categories;
DROP POLICY IF EXISTS "Admins can manage categories" ON categories;

-- Anyone can view categories (for public category pages)
CREATE POLICY "Anyone can view categories"
  ON categories FOR SELECT
  USING (true);

-- Only admins can manage categories
CREATE POLICY "Admins can manage categories"
  ON categories FOR ALL
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
-- 14. Create RLS Policies for Support Tickets
-- ============================================================================

DROP POLICY IF EXISTS "Users can view own tickets" ON support_tickets;
DROP POLICY IF EXISTS "Users can create tickets" ON support_tickets;
DROP POLICY IF EXISTS "Admins can manage all tickets" ON support_tickets;

-- Users can view their own tickets
CREATE POLICY "Users can view own tickets"
  ON support_tickets FOR SELECT
  USING (user_id = auth.uid());

-- Users can create tickets
CREATE POLICY "Users can create tickets"
  ON support_tickets FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Admins can view and manage all tickets
CREATE POLICY "Admins can manage all tickets"
  ON support_tickets FOR ALL
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
-- 15. Create RLS Policies for Ticket Messages
-- ============================================================================

DROP POLICY IF EXISTS "Users can view messages in own tickets" ON ticket_messages;
DROP POLICY IF EXISTS "Users can send messages to own tickets" ON ticket_messages;
DROP POLICY IF EXISTS "Admins can manage all ticket messages" ON ticket_messages;

-- Users can view non-internal messages in their own tickets
CREATE POLICY "Users can view messages in own tickets"
  ON ticket_messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM support_tickets
      WHERE id = ticket_messages.ticket_id 
        AND user_id = auth.uid()
        AND (ticket_messages.is_internal = false OR EXISTS (
          SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
        ))
    )
  );

-- Users can send messages to their own tickets
CREATE POLICY "Users can send messages to own tickets"
  ON ticket_messages FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM support_tickets
      WHERE id = ticket_messages.ticket_id AND user_id = auth.uid()
    )
    AND sender_id = auth.uid()
    AND is_internal = false
  );

-- Admins can manage all ticket messages (including internal notes)
CREATE POLICY "Admins can manage all ticket messages"
  ON ticket_messages FOR ALL
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
-- 16. Create RLS Policies for Reports
-- ============================================================================

DROP POLICY IF EXISTS "Users can view own reports" ON reports;
DROP POLICY IF EXISTS "Users can create reports" ON reports;
DROP POLICY IF EXISTS "Admins can manage all reports" ON reports;

-- Users can view their own reports
CREATE POLICY "Users can view own reports"
  ON reports FOR SELECT
  USING (reporter_id = auth.uid());

-- Users can create reports
CREATE POLICY "Users can create reports"
  ON reports FOR INSERT
  WITH CHECK (reporter_id = auth.uid());

-- Admins can view and manage all reports
CREATE POLICY "Admins can manage all reports"
  ON reports FOR ALL
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
-- 17. Create RLS Policies for Disputes
-- ============================================================================

DROP POLICY IF EXISTS "Users can view own disputes" ON disputes;
DROP POLICY IF EXISTS "Users can create disputes" ON disputes;
DROP POLICY IF EXISTS "Admins can manage all disputes" ON disputes;

-- Users can view disputes they're involved in (buyer or seller)
CREATE POLICY "Users can view own disputes"
  ON disputes FOR SELECT
  USING (buyer_id = auth.uid() OR seller_id = auth.uid());

-- Users can create disputes (as buyer)
CREATE POLICY "Users can create disputes"
  ON disputes FOR INSERT
  WITH CHECK (buyer_id = auth.uid());

-- Admins can manage all disputes
CREATE POLICY "Admins can manage all disputes"
  ON disputes FOR ALL
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
-- 18. Create Trigger Function to Update Updated At
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
DROP TRIGGER IF EXISTS trigger_update_announcements_updated_at ON announcements;
CREATE TRIGGER trigger_update_announcements_updated_at
  BEFORE UPDATE ON announcements
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_update_announcement_stats_updated_at ON announcement_stats;
CREATE TRIGGER trigger_update_announcement_stats_updated_at
  BEFORE UPDATE ON announcement_stats
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_update_categories_updated_at ON categories;
CREATE TRIGGER trigger_update_categories_updated_at
  BEFORE UPDATE ON categories
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_update_support_tickets_updated_at ON support_tickets;
CREATE TRIGGER trigger_update_support_tickets_updated_at
  BEFORE UPDATE ON support_tickets
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_update_disputes_updated_at ON disputes;
CREATE TRIGGER trigger_update_disputes_updated_at
  BEFORE UPDATE ON disputes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- Migration Complete
-- ============================================================================



-- Migration: 013_feature_10_email_system.sql
-- ======================================================================
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
CREATE TRIGGER update_email_templates_updated_at
  BEFORE UPDATE ON email_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Apply trigger to email_configuration
CREATE TRIGGER update_email_configuration_updated_at
  BEFORE UPDATE ON email_configuration
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Apply trigger to user_email_preferences
CREATE TRIGGER update_user_email_preferences_updated_at
  BEFORE UPDATE ON user_email_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- Migration Complete
-- ============================================================================


