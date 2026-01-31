-- Migration: 033_conversations_seller_create_policy.sql
-- Feature: Messaging (Feature 11) - Allow sellers to create conversations when contacting a buyer
-- Description: Add RLS policy so seller_id = auth.uid() can INSERT conversations (buyer_id from body).

-- Sellers can create conversations (e.g. "Contact Buyer" from order)
CREATE POLICY "Sellers can create conversations"
  ON conversations FOR INSERT
  TO authenticated
  WITH CHECK (
    seller_id = auth.uid() AND
    buyer_id != auth.uid()
  );
