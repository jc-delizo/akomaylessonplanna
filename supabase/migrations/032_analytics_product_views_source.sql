-- Migration: 032_analytics_product_views_source.sql
-- Feature: Seller Analytics - Traffic Sources
-- Description: Add source column to product_views for traffic source aggregation.

ALTER TABLE product_views
  ADD COLUMN IF NOT EXISTS source VARCHAR(100) NULL;

CREATE INDEX IF NOT EXISTS idx_product_views_source
  ON product_views(source)
  WHERE source IS NOT NULL;
