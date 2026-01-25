-- Migration: 017_seller_settings_fields.sql
-- Feature: Seller Settings (My Shop Settings Page)
-- Description: Add seller-specific settings fields to users table and create seller_messaging_settings table

-- ============================================================================
-- 1. Add Shop Settings Fields to Users Table
-- ============================================================================

ALTER TABLE users
ADD COLUMN IF NOT EXISTS shop_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS shop_description TEXT,
ADD COLUMN IF NOT EXISTS auto_publish BOOLEAN DEFAULT false;

-- ============================================================================
-- 2. Create Seller Messaging Settings Table
-- ============================================================================

CREATE TABLE IF NOT EXISTS seller_messaging_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Seller
  seller_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  
  -- Away Message Settings
  away_message_enabled BOOLEAN DEFAULT false,
  away_message_return_date TIMESTAMP,
  away_message_text TEXT,
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  -- Constraints
  CHECK (seller_id IN (SELECT id FROM users WHERE can_sell = true))
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_seller_messaging_settings_seller ON seller_messaging_settings(seller_id);
CREATE INDEX IF NOT EXISTS idx_seller_messaging_settings_away_enabled ON seller_messaging_settings(away_message_enabled) WHERE away_message_enabled = true;

-- ============================================================================
-- 3. Enable RLS on seller_messaging_settings
-- ============================================================================

ALTER TABLE seller_messaging_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Sellers can view own messaging settings"
  ON seller_messaging_settings FOR SELECT
  TO authenticated
  USING (seller_id = auth.uid());

CREATE POLICY "Sellers can insert own messaging settings"
  ON seller_messaging_settings FOR INSERT
  TO authenticated
  WITH CHECK (seller_id = auth.uid());

CREATE POLICY "Sellers can update own messaging settings"
  ON seller_messaging_settings FOR UPDATE
  TO authenticated
  USING (seller_id = auth.uid())
  WITH CHECK (seller_id = auth.uid());

-- ============================================================================
-- 4. Create Function to Update updated_at Timestamp
-- ============================================================================

CREATE OR REPLACE FUNCTION update_seller_messaging_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
CREATE TRIGGER trigger_update_seller_messaging_settings_updated_at
  BEFORE UPDATE ON seller_messaging_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_seller_messaging_settings_updated_at();
