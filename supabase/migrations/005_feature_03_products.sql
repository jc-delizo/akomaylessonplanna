-- Migration: 005_feature_03_products.sql
-- Feature: Product Listings & Management (Feature 03)
-- Description: Create products, product_updates, and product_views tables with RLS policies and indexes

-- ============================================================================
-- 1. Create Products Table
-- ============================================================================

CREATE TABLE IF NOT EXISTS products (
  -- Primary Key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Basic Info
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  slug VARCHAR(255) UNIQUE, -- SEO-friendly URL
  price DECIMAL(10,2) NOT NULL CHECK (price >= 50),

  -- Categorization (Feature 02.5)
  grade_id UUID NOT NULL REFERENCES grades(id),
  subject_id UUID NOT NULL REFERENCES subjects(id),
  quarter INTEGER CHECK (quarter IN (1, 2, 3, 4)),
  weeks INTEGER[], -- Multi-select: [1, 2, 3, 4, 5, 6, 7, 8]

  -- Product Types (Feature 03)
  product_type VARCHAR(50) NOT NULL, -- Exams, Lesson Plans, RPMS, Posters, Tarpaulins
  specific_type VARCHAR(50), -- DLL, DLP, Periodical Exam, Summative Test, etc.

  -- Type-specific metadata
  theme VARCHAR(100), -- For RPMS/Posters: Safari, Abstract, Floral
  size VARCHAR(50), -- For Posters/Tarpaulins: A4, 8x10, 3x5 feet
  season VARCHAR(50), -- For Tarpaulins: Christmas, Summer
  occasion VARCHAR(50), -- For Tarpaulins: Birthday, Graduation
  language VARCHAR(20) DEFAULT 'english', -- english, filipino, bilingual

  -- Files & Media
  file_urls TEXT[] NOT NULL, -- Main product files (private)
  cover_image_url TEXT, -- Cover image (public)
  preview_images TEXT[], -- First 3 pages as images (public)
  watermark_enabled BOOLEAN DEFAULT true,

  -- Version Management (Feature 03)
  current_version INTEGER DEFAULT 1,
  changelog TEXT, -- Latest version description
  original_created_at TIMESTAMP DEFAULT NOW(),

  -- Status & Moderation (Feature 03)
  status VARCHAR(20) CHECK (status IN ('draft', 'pending_review', 'published', 'rejected', 'suspended', 'deleted')) DEFAULT 'draft',
  rejection_reason TEXT,
  suspension_reason TEXT,
  review_count INTEGER DEFAULT 0, -- Track how many times submitted
  deleted_at TIMESTAMP, -- For 30-day soft delete

  -- Analytics (Feature 03)
  views_count INTEGER DEFAULT 0,
  unique_views_count INTEGER DEFAULT 0,
  sales_count INTEGER DEFAULT 0,
  conversion_rate DECIMAL(5,2), -- Calculated: sales / views

  -- Rating & Reviews
  avg_rating DECIMAL(3,2),
  reviews_count INTEGER DEFAULT 0,

  -- SEO & Discovery (Feature 03 + Feature 08)
  badges TEXT[], -- ["new", "featured", "trending", "bestseller"]
  search_score INTEGER DEFAULT 0, -- For Pro/Pioneer search analytics

  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  published_at TIMESTAMP,

  -- Constraints
  CHECK (current_version >= 1),
  CHECK (review_count >= 0),
  CHECK (views_count >= 0),
  CHECK (unique_views_count >= 0),
  CHECK (sales_count >= 0)
);

-- ============================================================================
-- 2. Create Product Updates Table
-- ============================================================================

CREATE TABLE IF NOT EXISTS product_updates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL,
  changelog TEXT NOT NULL, -- Required: "What's new in this version?" (min 20 chars)
  file_urls TEXT[], -- Files for this version
  cover_image_url TEXT,
  previous_version INTEGER,
  is_major_update BOOLEAN DEFAULT false, -- v1.0 → v2.0 vs v1.0 → v1.1
  created_at TIMESTAMP DEFAULT NOW(),
  created_by UUID NOT NULL REFERENCES users(id), -- Seller who created this version

  -- Constraints
  CHECK (version_number >= 1),
  CHECK (LENGTH(changelog) >= 20)
);

-- ============================================================================
-- 3. Create Product Views Table
-- ============================================================================

CREATE TABLE IF NOT EXISTS product_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL, -- Nullable for anonymous views
  viewed_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================================
-- 4. Create Indexes for Products Table
-- ============================================================================

-- Basic indexes
CREATE INDEX IF NOT EXISTS idx_products_seller ON products(seller_id);
CREATE INDEX IF NOT EXISTS idx_products_grade ON products(grade_id);
CREATE INDEX IF NOT EXISTS idx_products_subject ON products(subject_id);
CREATE INDEX IF NOT EXISTS idx_products_status ON products(status);
CREATE INDEX IF NOT EXISTS idx_products_type ON products(product_type);
CREATE INDEX IF NOT EXISTS idx_products_slug ON products(slug);

-- Indexes for sorting and filtering
CREATE INDEX IF NOT EXISTS idx_products_published ON products(published_at DESC) WHERE status = 'published';
CREATE INDEX IF NOT EXISTS idx_products_sales ON products(sales_count DESC) WHERE status = 'published';
CREATE INDEX IF NOT EXISTS idx_products_rating ON products(avg_rating DESC) WHERE status = 'published';
CREATE INDEX IF NOT EXISTS idx_products_views ON products(views_count DESC) WHERE status = 'published';
CREATE INDEX IF NOT EXISTS idx_products_price ON products(price) WHERE status = 'published';

-- Full-text search index (Feature 08)
CREATE INDEX IF NOT EXISTS idx_products_fts ON products USING GIN (to_tsvector('english', title || ' ' || description));

-- Composite indexes for common queries
CREATE INDEX IF NOT EXISTS idx_products_grade_subject ON products(grade_id, subject_id) WHERE status = 'published';
CREATE INDEX IF NOT EXISTS idx_products_sort_sales ON products(sales_count DESC, avg_rating DESC) WHERE status = 'published';

-- Index for deleted products cleanup
CREATE INDEX IF NOT EXISTS idx_products_deleted ON products(deleted_at) WHERE status = 'deleted';

-- ============================================================================
-- 5. Create Indexes for Product Updates Table
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_product_updates_product ON product_updates(product_id);
CREATE INDEX IF NOT EXISTS idx_product_updates_version ON product_updates(product_id, version_number);
CREATE INDEX IF NOT EXISTS idx_product_updates_created ON product_updates(created_at DESC);

-- ============================================================================
-- 6. Create Indexes for Product Views Table
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_product_views_product ON product_views(product_id, viewed_at DESC);
CREATE INDEX IF NOT EXISTS idx_product_views_user ON product_views(user_id);
CREATE INDEX IF NOT EXISTS idx_product_views_date ON product_views(viewed_at DESC);

-- ============================================================================
-- 7. Create Trigger Function for Updated At
-- ============================================================================

-- Apply trigger to products table (use existing function from foundation)
DROP TRIGGER IF EXISTS update_products_updated_at ON products;
CREATE TRIGGER update_products_updated_at 
  BEFORE UPDATE ON products
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 8. Enable Row Level Security (RLS)
-- ============================================================================

ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_updates ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_views ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 9. Create RLS Policies for products table
-- ============================================================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Anyone can view published products" ON products;
DROP POLICY IF EXISTS "Sellers can view own products" ON products;
DROP POLICY IF EXISTS "Sellers can insert products" ON products;
DROP POLICY IF EXISTS "Sellers can update own products" ON products;
DROP POLICY IF EXISTS "Admins have full access to products" ON products;

-- Anyone can view published products
CREATE POLICY "Anyone can view published products"
  ON products FOR SELECT
  USING (status = 'published');

-- Sellers can view their own products (any status)
CREATE POLICY "Sellers can view own products"
  ON products FOR SELECT
  USING (seller_id = auth.uid());

-- Sellers can insert products (if they have can_sell permission)
CREATE POLICY "Sellers can insert products"
  ON products FOR INSERT
  WITH CHECK (
    seller_id = auth.uid() 
    AND EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND can_sell = true
    )
  );

-- Sellers can update their own products
CREATE POLICY "Sellers can update own products"
  ON products FOR UPDATE
  USING (seller_id = auth.uid())
  WITH CHECK (seller_id = auth.uid());

-- Admins have full access to products
CREATE POLICY "Admins have full access to products"
  ON products FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================================================
-- 10. Create RLS Policies for product_updates table
-- ============================================================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Anyone can view product updates for published products" ON product_updates;
DROP POLICY IF EXISTS "Sellers can view own product updates" ON product_updates;
DROP POLICY IF EXISTS "Sellers can insert product updates" ON product_updates;
DROP POLICY IF EXISTS "Admins have full access to product updates" ON product_updates;

-- Anyone can view updates for published products
CREATE POLICY "Anyone can view product updates for published products"
  ON product_updates FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM products
      WHERE products.id = product_updates.product_id
      AND products.status = 'published'
    )
  );

-- Sellers can view updates for their own products
CREATE POLICY "Sellers can view own product updates"
  ON product_updates FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM products
      WHERE products.id = product_updates.product_id
      AND products.seller_id = auth.uid()
    )
  );

-- Sellers can insert updates for their own products
CREATE POLICY "Sellers can insert product updates"
  ON product_updates FOR INSERT
  WITH CHECK (
    created_by = auth.uid()
    AND EXISTS (
      SELECT 1 FROM products
      WHERE products.id = product_updates.product_id
      AND products.seller_id = auth.uid()
    )
  );

-- Admins have full access to product updates
CREATE POLICY "Admins have full access to product updates"
  ON product_updates FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================================================
-- 11. Create RLS Policies for product_views table
-- ============================================================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Anyone can insert product views" ON product_views;
DROP POLICY IF EXISTS "Sellers can view own product analytics" ON product_views;
DROP POLICY IF EXISTS "Admins have full access to product views" ON product_views;

-- Anyone can insert product views (for tracking)
CREATE POLICY "Anyone can insert product views"
  ON product_views FOR INSERT
  WITH CHECK (true);

-- Sellers can view analytics for their own products
CREATE POLICY "Sellers can view own product analytics"
  ON product_views FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM products
      WHERE products.id = product_views.product_id
      AND products.seller_id = auth.uid()
    )
  );

-- Admins have full access to product views
CREATE POLICY "Admins have full access to product views"
  ON product_views FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================================================
-- Migration Complete
-- ============================================================================
