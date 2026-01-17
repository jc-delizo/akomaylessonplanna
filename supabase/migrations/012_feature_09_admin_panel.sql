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
