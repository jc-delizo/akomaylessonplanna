-- Migration: 031_seller_analytics_cart_events.sql
-- Feature: Seller Analytics - Conversion Funnel (add-to-cart events)
-- Description: Create cart_add_events table for funnel stage "Add to Cart" (sellers cannot read cart_items of other users).

-- ============================================================================
-- 1. Create cart_add_events table
-- ============================================================================

CREATE TABLE IF NOT EXISTS cart_add_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  seller_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for funnel queries: count by seller, optional time range
CREATE INDEX IF NOT EXISTS idx_cart_add_events_seller_created
  ON cart_add_events(seller_id, created_at DESC);

-- ============================================================================
-- 2. RLS
-- ============================================================================

ALTER TABLE cart_add_events ENABLE ROW LEVEL SECURITY;

-- Sellers can SELECT their own events (for analytics)
CREATE POLICY "Sellers can view own cart add events"
  ON cart_add_events FOR SELECT
  USING (seller_id = auth.uid());

-- Authenticated users can INSERT (server sets seller_id from product; used when adding to cart)
CREATE POLICY "Authenticated can insert cart add events"
  ON cart_add_events FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- No UPDATE/DELETE for analytics events (append-only)
