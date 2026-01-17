-- Migration: 008_feature_05_reviews.sql
-- Feature: Reviews & Ratings (Feature 05)
-- Description: Create reviews and review_flags tables with RLS policies, indexes, and trigger functions

-- ============================================================================
-- 1. Ensure users table has review-related columns
-- ============================================================================

ALTER TABLE users 
ADD COLUMN IF NOT EXISTS avg_rating DECIMAL(3,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS reviews_count INTEGER DEFAULT 0;

-- ============================================================================
-- 2. Create Reviews Table
-- ============================================================================

CREATE TABLE IF NOT EXISTS reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  buyer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  verified_purchase BOOLEAN NOT NULL DEFAULT true,
  seller_response TEXT,
  is_edited BOOLEAN DEFAULT false,
  is_flagged BOOLEAN DEFAULT false,
  flag_reason TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),

  -- Constraints
  UNIQUE(product_id, buyer_id) -- One review per product per buyer
);

-- Indexes for reviews
CREATE INDEX IF NOT EXISTS idx_reviews_product ON reviews(product_id);
CREATE INDEX IF NOT EXISTS idx_reviews_buyer ON reviews(buyer_id);
CREATE INDEX IF NOT EXISTS idx_reviews_created ON reviews(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reviews_flagged ON reviews(is_flagged) WHERE is_flagged = true;
CREATE INDEX IF NOT EXISTS idx_reviews_rating ON reviews(rating);

-- ============================================================================
-- 3. Create Review Flags Table
-- ============================================================================

CREATE TABLE IF NOT EXISTS review_flags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id UUID NOT NULL REFERENCES reviews(id) ON DELETE CASCADE,
  flag_type VARCHAR(50) NOT NULL, -- 'profanity', 'spam', 'excessive_caps', 'excessive_punctuation', 'manual_report'
  flag_source VARCHAR(20) NOT NULL CHECK (flag_source IN ('automatic', 'manual')),
  reporter_id UUID REFERENCES users(id), -- If manual flag
  reason TEXT,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'dismissed')),
  reviewed_by UUID REFERENCES users(id), -- Admin who reviewed
  reviewed_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Indexes for review_flags
CREATE INDEX IF NOT EXISTS idx_review_flags_status ON review_flags(status);
CREATE INDEX IF NOT EXISTS idx_review_flags_review ON review_flags(review_id);
CREATE INDEX IF NOT EXISTS idx_review_flags_reviewed ON review_flags(reviewed_by);
CREATE INDEX IF NOT EXISTS idx_review_flags_created ON review_flags(created_at DESC);

-- ============================================================================
-- 4. Enable Row Level Security
-- ============================================================================

ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE review_flags ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 5. RLS Policies for Reviews
-- ============================================================================

-- Anyone can view non-flagged reviews for published products
CREATE POLICY "Public can view non-flagged reviews"
  ON reviews FOR SELECT
  TO public
  USING (
    is_flagged = false AND
    EXISTS (
      SELECT 1 FROM products 
      WHERE products.id = reviews.product_id 
      AND products.status = 'published'
    )
  );

-- Buyers can view their own reviews (even if flagged)
CREATE POLICY "Buyers can view own reviews"
  ON reviews FOR SELECT
  TO authenticated
  USING (auth.uid() = buyer_id);

-- Buyers can create reviews (eligibility checked in API)
CREATE POLICY "Buyers can create reviews"
  ON reviews FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = buyer_id);

-- Buyers can update their own reviews within 7 days
CREATE POLICY "Buyers can edit own reviews within 7 days"
  ON reviews FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = buyer_id AND
    created_at > NOW() - INTERVAL '7 days'
  )
  WITH CHECK (auth.uid() = buyer_id);

-- Sellers can view reviews for their products
CREATE POLICY "Sellers can view reviews for their products"
  ON reviews FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM products
      WHERE products.id = reviews.product_id
      AND products.seller_id = auth.uid()
    )
  );

-- Sellers can respond to reviews on their products
CREATE POLICY "Sellers can respond to reviews"
  ON reviews FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM products
      WHERE products.id = reviews.product_id
      AND products.seller_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM products
      WHERE products.id = reviews.product_id
      AND products.seller_id = auth.uid()
    )
  );

-- Admins can view all reviews
CREATE POLICY "Admins can view all reviews"
  ON reviews FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- Admins can update all reviews (for moderation)
CREATE POLICY "Admins can update all reviews"
  ON reviews FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- Admins can delete reviews
CREATE POLICY "Admins can delete reviews"
  ON reviews FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- ============================================================================
-- 6. RLS Policies for Review Flags
-- ============================================================================

-- Admins can view all flags
CREATE POLICY "Admins can view all review flags"
  ON review_flags FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- Anyone can create flags (automatic or manual)
CREATE POLICY "Anyone can flag reviews"
  ON review_flags FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Admins can update flags (for moderation decisions)
CREATE POLICY "Admins can update review flags"
  ON review_flags FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- ============================================================================
-- 7. Function to Update Product Review Statistics
-- ============================================================================

CREATE OR REPLACE FUNCTION update_product_review_stats()
RETURNS TRIGGER AS $$
BEGIN
  -- Update product's avg_rating and reviews_count
  UPDATE products
  SET 
    avg_rating = (
      SELECT COALESCE(AVG(rating), 0)
      FROM reviews
      WHERE reviews.product_id = COALESCE(NEW.product_id, OLD.product_id)
      AND reviews.is_flagged = false
    ),
    reviews_count = (
      SELECT COUNT(*)
      FROM reviews
      WHERE reviews.product_id = COALESCE(NEW.product_id, OLD.product_id)
      AND reviews.is_flagged = false
    )
  WHERE id = COALESCE(NEW.product_id, OLD.product_id);

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Trigger: Update product stats after review insert/update/delete
CREATE TRIGGER trigger_update_product_review_stats
AFTER INSERT OR UPDATE OR DELETE ON reviews
FOR EACH ROW
EXECUTE FUNCTION update_product_review_stats();

-- ============================================================================
-- 8. Function to Update Seller Review Statistics
-- ============================================================================

CREATE OR REPLACE FUNCTION update_seller_review_stats()
RETURNS TRIGGER AS $$
DECLARE
  seller_id_val UUID;
BEGIN
  -- Get seller_id from product
  SELECT seller_id INTO seller_id_val
  FROM products
  WHERE id = COALESCE(NEW.product_id, OLD.product_id);

  IF seller_id_val IS NOT NULL THEN
    -- Update seller's avg_rating and reviews_count
    UPDATE users
    SET 
      avg_rating = (
        SELECT COALESCE(AVG(r.rating), 0)
        FROM reviews r
        JOIN products p ON r.product_id = p.id
        WHERE p.seller_id = seller_id_val
        AND r.is_flagged = false
      ),
      reviews_count = (
        SELECT COUNT(*)
        FROM reviews r
        JOIN products p ON r.product_id = p.id
        WHERE p.seller_id = seller_id_val
        AND r.is_flagged = false
      )
    WHERE id = seller_id_val;
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Trigger: Update seller stats after review insert/update/delete
CREATE TRIGGER trigger_update_seller_review_stats
AFTER INSERT OR UPDATE OR DELETE ON reviews
FOR EACH ROW
EXECUTE FUNCTION update_seller_review_stats();

-- ============================================================================
-- 9. Function to Check Review Eligibility
-- ============================================================================

CREATE OR REPLACE FUNCTION check_review_eligibility(
  p_user_id UUID,
  p_product_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
  has_purchased BOOLEAN;
  has_downloaded BOOLEAN;
BEGIN
  -- Check if user has purchased the product
  SELECT EXISTS (
    SELECT 1
    FROM order_items oi
    JOIN orders o ON oi.order_id = o.id
    WHERE oi.product_id = p_product_id
    AND o.user_id = p_user_id
    AND o.status = 'completed'
  ) INTO has_purchased;

  -- Check if user has downloaded the product
  SELECT EXISTS (
    SELECT 1
    FROM order_items oi
    JOIN orders o ON oi.order_id = o.id
    WHERE oi.product_id = p_product_id
    AND o.user_id = p_user_id
    AND o.status = 'completed'
    AND oi.download_count > 0
  ) INTO has_downloaded;

  -- User must have both purchased AND downloaded
  RETURN has_purchased AND has_downloaded;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 10. Function to Auto-flag Review
-- ============================================================================

CREATE OR REPLACE FUNCTION auto_flag_review(
  p_review_id UUID,
  p_flag_type VARCHAR(50),
  p_reason TEXT
)
RETURNS VOID AS $$
BEGIN
  -- Mark review as flagged
  UPDATE reviews
  SET 
    is_flagged = true,
    flag_reason = p_reason
  WHERE id = p_review_id;

  -- Create flag record
  INSERT INTO review_flags (review_id, flag_type, flag_source, reason, status)
  VALUES (p_review_id, p_flag_type, 'automatic', p_reason, 'pending');
END;
$$ LANGUAGE plpgsql;
