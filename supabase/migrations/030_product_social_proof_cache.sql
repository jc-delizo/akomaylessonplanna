-- Migration: 030_product_social_proof_cache.sql
-- Description: Add wishlist_count and computed_badge to products for cron-based social proof
-- Feature: Feature 06 (Social Features) - cron implementation

-- Add cached wishlist count (refreshed by cron)
ALTER TABLE products ADD COLUMN IF NOT EXISTS wishlist_count INTEGER DEFAULT 0;

-- Add computed badge: 'new' | 'trending' | 'bestseller' | 'popular' (nullable)
ALTER TABLE products ADD COLUMN IF NOT EXISTS computed_badge VARCHAR(20);

-- Index for listing/filtering by badge (published only)
CREATE INDEX IF NOT EXISTS idx_products_computed_badge ON products(computed_badge) WHERE status = 'published';

-- Optional: index on viewed_at for product_views to speed up "last 7 days" cron query
CREATE INDEX IF NOT EXISTS idx_product_views_viewed_at ON product_views(viewed_at DESC);

-- Function: refresh wishlist_count and computed_badge for all published products
-- Called by cron /api/cron/update-social-proof
-- Priority: New > Trending > Bestseller > Popular
CREATE OR REPLACE FUNCTION refresh_product_social_proof()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- 1. Refresh wishlist_count: set 0 first, then set from aggregate
  UPDATE products SET wishlist_count = 0 WHERE 1=1;
  UPDATE products p
  SET wishlist_count = w.cnt
  FROM (SELECT product_id, COUNT(*)::int AS cnt FROM wishlist GROUP BY product_id) w
  WHERE p.id = w.product_id;

  -- 2. Update computed_badge in one pass using CTEs
  WITH
  views_7d AS (
    SELECT product_id, COUNT(*)::int AS v7
    FROM product_views
    WHERE viewed_at > NOW() - INTERVAL '7 days'
    GROUP BY product_id
  ),
  sales_7d AS (
    SELECT oi.product_id, COUNT(*)::int AS s7
    FROM order_items oi
    JOIN orders o ON o.id = oi.order_id
    WHERE o.payment_status = 'completed'
      AND o.completed_at IS NOT NULL
      AND o.completed_at > NOW() - INTERVAL '7 days'
    GROUP BY oi.product_id
  ),
  combined_7d AS (
    SELECT
      COALESCE(v.product_id, s.product_id) AS product_id,
      COALESCE(v.v7, 0) + COALESCE(s.s7, 0) AS activity
    FROM views_7d v
    FULL OUTER JOIN sales_7d s ON v.product_id = s.product_id
  ),
  top_trending AS (
    SELECT product_id FROM combined_7d ORDER BY activity DESC NULLS LAST LIMIT 20
  ),
  bestseller_ids AS (
    SELECT id
    FROM (
      SELECT id, grade_id, subject_id, sales_count,
             NTILE(10) OVER (PARTITION BY grade_id, subject_id ORDER BY sales_count DESC NULLS LAST) AS tile
      FROM products
      WHERE status = 'published' AND grade_id IS NOT NULL AND subject_id IS NOT NULL
    ) ranked
    WHERE tile = 1 AND (sales_count IS NOT NULL AND sales_count >= 10)
  ),
  new_ids AS (
    SELECT id FROM products
    WHERE status = 'published'
      AND (COALESCE(published_at, created_at) > NOW() - INTERVAL '30 days')
  )
  UPDATE products p
  SET computed_badge = CASE
    WHEN p.id IN (SELECT id FROM new_ids) THEN 'new'
    WHEN p.id IN (SELECT product_id FROM top_trending) THEN 'trending'
    WHEN p.id IN (SELECT id FROM bestseller_ids) THEN 'bestseller'
    WHEN p.status = 'published' AND (p.wishlist_count >= 50 OR (p.views_count IS NOT NULL AND p.views_count >= 100)) THEN 'popular'
    ELSE NULL
  END
  WHERE p.status = 'published';
END;
$$;
