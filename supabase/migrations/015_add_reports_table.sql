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
-- Migration Complete
-- ============================================================================
