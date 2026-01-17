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
