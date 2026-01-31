-- Migration: 029_notifications_admin_warning.sql
-- Description: Add admin_warning and new_message to notifications type CHECK constraint
-- Feature: Admin User Management (Feature 09 extension)

-- Drop existing check and add new one with admin_warning and new_message
ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_type_check;
ALTER TABLE notifications ADD CONSTRAINT notifications_type_check CHECK (type IN (
  'new_sale',
  'new_review',
  'new_follower',
  'product_approved',
  'product_rejected',
  'price_drop',
  'new_product',
  'system_announcement',
  'new_message',
  'admin_warning'
));
