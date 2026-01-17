-- Migration: 007_feature_04_cart_and_checkout.sql
-- Feature: Shopping Cart & Checkout Flow (Feature 04)
-- Description: Create cart_items, wishlist, orders, order_items, user_library, and withdrawal_requests tables with RLS policies and indexes

-- ============================================================================
-- 1. Add Column to Users Table
-- ============================================================================

-- Add column for cart abandonment email tracking
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS last_cart_abandonment_email_sent_at TIMESTAMP;

-- ============================================================================
-- 2. Create Cart Items Table
-- ============================================================================

CREATE TABLE IF NOT EXISTS cart_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW(),

  -- Constraints
  UNIQUE(user_id, product_id) -- One of each product per user (no quantity field)
);

-- Indexes for cart_items
CREATE INDEX IF NOT EXISTS idx_cart_items_user ON cart_items(user_id);
CREATE INDEX IF NOT EXISTS idx_cart_items_created ON cart_items(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_cart_items_product ON cart_items(product_id);

-- ============================================================================
-- 3. Create Wishlist Table
-- ============================================================================

CREATE TABLE IF NOT EXISTS wishlist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW(),

  UNIQUE(user_id, product_id)
);

-- Indexes for wishlist
CREATE INDEX IF NOT EXISTS idx_wishlist_user ON wishlist(user_id);
CREATE INDEX IF NOT EXISTS idx_wishlist_created ON wishlist(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_wishlist_product ON wishlist(product_id);

-- ============================================================================
-- 4. Create Orders Table
-- ============================================================================

CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_id UUID NOT NULL REFERENCES users(id),

  -- Order details
  total_amount DECIMAL(10,2) NOT NULL,
  total_commission DECIMAL(10,2) NOT NULL,
  item_count INTEGER NOT NULL,

  -- Payment
  payment_method VARCHAR(20) NOT NULL CHECK (payment_method IN ('gcash', 'maya')),
  payment_status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending', 'completed', 'failed')),
  payment_reference VARCHAR(100), -- Transaction ID from GCash/Maya
  payment_expires_at TIMESTAMP, -- 15-minute timeout (Feature 04)

  -- Buyer info (for refund requests)
  buyer_mobile_number VARCHAR(20), -- GCash/Maya number

  -- Refund
  refund_status VARCHAR(20) DEFAULT 'none' CHECK (refund_status IN ('none', 'requested', 'approved', 'rejected')),
  refund_reason TEXT,
  refund_requested_at TIMESTAMP,
  refund_processed_at TIMESTAMP,
  refund_reference VARCHAR(100), -- Refund transaction ID

  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP
);

-- Indexes for orders
CREATE INDEX IF NOT EXISTS idx_orders_buyer ON orders(buyer_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(payment_status);
CREATE INDEX IF NOT EXISTS idx_orders_created ON orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_refund ON orders(refund_status) WHERE refund_status != 'none';
CREATE INDEX IF NOT EXISTS idx_orders_payment_expires ON orders(payment_expires_at) WHERE payment_status = 'pending';

-- ============================================================================
-- 5. Create Order Items Table
-- ============================================================================

CREATE TABLE IF NOT EXISTS order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id),
  seller_id UUID NOT NULL REFERENCES users(id),

  -- Product snapshot (at time of purchase)
  product_title VARCHAR(255) NOT NULL,
  product_cover_image_url TEXT,

  -- Pricing
  price_at_purchase DECIMAL(10,2) NOT NULL,
  commission_rate DECIMAL(5,2) NOT NULL, -- 20.00 or 15.00
  commission_amount DECIMAL(10,2) NOT NULL,
  net_earnings DECIMAL(10,2) NOT NULL, -- For seller dashboard

  -- Version tracking
  product_version_at_purchase INTEGER NOT NULL DEFAULT 1,

  -- Download tracking
  download_count INTEGER DEFAULT 0,
  last_downloaded_at TIMESTAMP,

  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for order_items
CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_seller ON order_items(seller_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product ON order_items(product_id);

-- ============================================================================
-- 6. Create User Library Table
-- ============================================================================

CREATE TABLE IF NOT EXISTS user_library (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  order_item_id UUID REFERENCES order_items(id) ON DELETE SET NULL, -- Link to purchase
  purchased_at TIMESTAMP DEFAULT NOW(),
  download_count INTEGER DEFAULT 0,
  last_downloaded_at TIMESTAMP,

  UNIQUE(user_id, product_id)
);

-- Indexes for user_library
CREATE INDEX IF NOT EXISTS idx_user_library_user ON user_library(user_id);
CREATE INDEX IF NOT EXISTS idx_user_library_product ON user_library(product_id);
CREATE INDEX IF NOT EXISTS idx_user_library_purchased ON user_library(purchased_at DESC);

-- ============================================================================
-- 7. Create Withdrawal Requests Table
-- ============================================================================

CREATE TABLE IF NOT EXISTS withdrawal_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL CHECK (amount >= 500), -- Minimum ₱500
  payment_method VARCHAR(20) NOT NULL CHECK (payment_method IN ('gcash', 'maya')),
  payment_number VARCHAR(20) NOT NULL, -- GCash/Maya number to send to
  status VARCHAR(20) DEFAULT 'processing' CHECK (status IN ('processing', 'completed', 'failed')),
  processed_at TIMESTAMP,
  failure_reason TEXT,
  transaction_reference VARCHAR(100), -- Disbursement transaction ID
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for withdrawal_requests
CREATE INDEX IF NOT EXISTS idx_withdrawal_requests_seller ON withdrawal_requests(seller_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_withdrawal_requests_status ON withdrawal_requests(status);

-- ============================================================================
-- 8. Enable Row Level Security (RLS)
-- ============================================================================

ALTER TABLE cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE wishlist ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_library ENABLE ROW LEVEL SECURITY;
ALTER TABLE withdrawal_requests ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 9. RLS Policies for Cart Items
-- ============================================================================

-- Users can view their own cart items
CREATE POLICY "Users can view their own cart items"
  ON cart_items FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Users can insert their own cart items
CREATE POLICY "Users can add to their own cart"
  ON cart_items FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own cart items
CREATE POLICY "Users can remove their own cart items"
  ON cart_items FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- ============================================================================
-- 10. RLS Policies for Wishlist
-- ============================================================================

-- Users can view their own wishlist
CREATE POLICY "Users can view their own wishlist"
  ON wishlist FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Users can add to their own wishlist
CREATE POLICY "Users can add to their own wishlist"
  ON wishlist FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Users can remove from their own wishlist
CREATE POLICY "Users can remove from their own wishlist"
  ON wishlist FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- ============================================================================
-- 11. RLS Policies for Orders
-- ============================================================================

-- Buyers can view their own orders
CREATE POLICY "Buyers can view their own orders"
  ON orders FOR SELECT
  TO authenticated
  USING (auth.uid() = buyer_id);

-- Buyers can create their own orders
CREATE POLICY "Buyers can create their own orders"
  ON orders FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = buyer_id);

-- Buyers can update their own pending orders
CREATE POLICY "Buyers can update their own pending orders"
  ON orders FOR UPDATE
  TO authenticated
  USING (auth.uid() = buyer_id AND payment_status = 'pending')
  WITH CHECK (auth.uid() = buyer_id);

-- Sellers can view orders for their products (via order_items join)
-- This is handled through order_items policies

-- ============================================================================
-- 12. RLS Policies for Order Items
-- ============================================================================

-- Buyers can view order items for their orders
CREATE POLICY "Buyers can view their order items"
  ON order_items FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = order_items.order_id
      AND orders.buyer_id = auth.uid()
    )
  );

-- System can create order items (via service role)
-- Note: Order items are created server-side, not by users directly

-- Sellers can view order items for their products
CREATE POLICY "Sellers can view their order items"
  ON order_items FOR SELECT
  TO authenticated
  USING (auth.uid() = seller_id);

-- ============================================================================
-- 13. RLS Policies for User Library
-- ============================================================================

-- Users can view their own library
CREATE POLICY "Users can view their own library"
  ON user_library FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- System can add to user library (via service role)
-- Note: Library items are created server-side after payment completion

-- Users can update download count (via API)
CREATE POLICY "Users can update their own library download count"
  ON user_library FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ============================================================================
-- 14. RLS Policies for Withdrawal Requests
-- ============================================================================

-- Sellers can view their own withdrawal requests
CREATE POLICY "Sellers can view their own withdrawal requests"
  ON withdrawal_requests FOR SELECT
  TO authenticated
  USING (auth.uid() = seller_id);

-- Sellers can create their own withdrawal requests
CREATE POLICY "Sellers can create their own withdrawal requests"
  ON withdrawal_requests FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = seller_id);

-- System can update withdrawal status (via service role)
-- Note: Status updates are handled server-side

-- ============================================================================
-- 15. Create Function to Update Updated At Timestamp
-- ============================================================================

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for orders table
CREATE TRIGGER update_orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 16. Create Function to Handle Payment Timeout
-- ============================================================================

-- Function to mark expired payments as failed
-- This should be called by a scheduled job (cron, pg_cron, or external scheduler)
CREATE OR REPLACE FUNCTION handle_payment_timeout()
RETURNS INTEGER AS $$
DECLARE
  updated_count INTEGER;
BEGIN
  UPDATE orders
  SET 
    payment_status = 'failed',
    updated_at = NOW()
  WHERE 
    payment_status = 'pending'
    AND payment_expires_at IS NOT NULL
    AND payment_expires_at < NOW();
  
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RETURN updated_count;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 17. Create Function to Increment Product Sales
-- ============================================================================

-- Function to increment product sales count
CREATE OR REPLACE FUNCTION increment_product_sales(product_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE products
  SET 
    sales_count = COALESCE(sales_count, 0) + 1,
    updated_at = NOW()
  WHERE id = product_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- Migration Complete
-- ============================================================================

-- Summary:
-- ✅ Created cart_items table (one product per user, no quantity)
-- ✅ Created wishlist table
-- ✅ Created orders table (with payment timeout and refund fields)
-- ✅ Created order_items table (with product snapshots and earnings)
-- ✅ Created user_library table (purchased products access)
-- ✅ Created withdrawal_requests table (seller payouts)
-- ✅ Added last_cart_abandonment_email_sent_at to users table
-- ✅ Enabled RLS on all tables
-- ✅ Created RLS policies for all tables
-- ✅ Created indexes for performance
-- ✅ Created trigger for updated_at timestamp
-- ✅ Created function for payment timeout handling
