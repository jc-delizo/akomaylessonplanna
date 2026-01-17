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
