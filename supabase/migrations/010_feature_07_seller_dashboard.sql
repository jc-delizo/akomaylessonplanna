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
