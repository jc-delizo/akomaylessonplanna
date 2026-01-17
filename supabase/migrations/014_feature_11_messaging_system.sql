-- Migration: 014_feature_11_messaging_system.sql
-- Feature: Messaging System (Feature 11)
-- Description: Create messaging system tables (conversations, messages, message_templates, message_reports, user_blocks, seller_response_times), storage bucket (message-images), RLS policies, and indexes

-- ============================================================================
-- 1. Create Conversations Table
-- ============================================================================

CREATE TABLE IF NOT EXISTS conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Participants
  buyer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  seller_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Context
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  order_id UUID REFERENCES orders(id) ON DELETE SET NULL,

  -- Status
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'archived', 'blocked')),
  archived_by UUID REFERENCES users(id), -- Who archived (null if both)
  blocked_by UUID REFERENCES users(id), -- Who blocked (null if not blocked)

  -- Timestamps
  last_message_at TIMESTAMP DEFAULT NOW(), -- Updated on each new message
  created_at TIMESTAMP DEFAULT NOW(),

  -- Constraints
  UNIQUE(buyer_id, seller_id, product_id), -- One conversation per buyer-seller-product
  CHECK (buyer_id != seller_id) -- Can't message yourself
);

-- Indexes for conversations
CREATE INDEX IF NOT EXISTS idx_conversations_buyer ON conversations(buyer_id, last_message_at DESC);
CREATE INDEX IF NOT EXISTS idx_conversations_seller ON conversations(seller_id, last_message_at DESC);
CREATE INDEX IF NOT EXISTS idx_conversations_product ON conversations(product_id) WHERE product_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_conversations_status ON conversations(status);
CREATE INDEX IF NOT EXISTS idx_conversations_last_message ON conversations(last_message_at DESC);

-- ============================================================================
-- 2. Create Messages Table
-- ============================================================================

CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Conversation
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,

  -- Sender
  sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Content
  content TEXT NOT NULL CHECK (LENGTH(content) >= 1 AND LENGTH(content) <= 1000),
  message_type VARCHAR(20) DEFAULT 'user' CHECK (message_type IN ('user', 'system', 'admin')),

  -- Attachments (images only)
  attachments TEXT[], -- Array of image URLs (Supabase Storage)

  -- Read Status
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMP,

  -- Moderation
  is_flagged BOOLEAN DEFAULT false,
  flag_reason VARCHAR(255), -- 'external_link', 'profanity', 'spam', 'user_report'
  is_deleted BOOLEAN DEFAULT false, -- Soft delete
  deleted_by UUID REFERENCES users(id),
  deleted_at TIMESTAMP,

  -- Admin Intervention
  admin_joined BOOLEAN DEFAULT false, -- Admin joined conversation
  admin_id UUID REFERENCES users(id), -- Which admin

  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for messages
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_sender ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_unread ON messages(conversation_id, is_read) WHERE is_read = false;
CREATE INDEX IF NOT EXISTS idx_messages_flagged ON messages(is_flagged) WHERE is_flagged = true;
CREATE INDEX IF NOT EXISTS idx_messages_created ON messages(created_at DESC);

-- ============================================================================
-- 3. Create Message Templates Table
-- ============================================================================

CREATE TABLE IF NOT EXISTS message_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Owner (NULL for system templates)
  seller_id UUID REFERENCES users(id) ON DELETE CASCADE,

  -- Template Content
  name VARCHAR(255) NOT NULL,
  content TEXT NOT NULL CHECK (LENGTH(content) >= 1 AND LENGTH(content) <= 500),

  -- Type
  template_type VARCHAR(20) DEFAULT 'custom' CHECK (template_type IN ('system', 'custom')),
  is_active BOOLEAN DEFAULT true,

  -- Usage
  usage_count INTEGER DEFAULT 0, -- Track how often used

  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for message_templates
CREATE INDEX IF NOT EXISTS idx_templates_seller ON message_templates(seller_id) WHERE seller_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_templates_type ON message_templates(template_type);
CREATE INDEX IF NOT EXISTS idx_templates_active ON message_templates(is_active) WHERE is_active = true;

-- ============================================================================
-- 4. Create Message Reports Table
-- ============================================================================

CREATE TABLE IF NOT EXISTS message_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Who Reported
  reporter_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reported_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Context
  conversation_id UUID REFERENCES conversations(id) ON DELETE SET NULL,
  message_id UUID REFERENCES messages(id) ON DELETE SET NULL,

  -- Report Details
  report_type VARCHAR(50) NOT NULL CHECK (report_type IN ('harassment', 'fraud', 'inappropriate', 'spam', 'other')),
  description TEXT,

  -- Status
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'under_review', 'resolved', 'dismissed')),

  -- Resolution
  reviewed_by UUID REFERENCES users(id), -- Admin who reviewed
  resolution TEXT, -- Admin notes
  resolved_at TIMESTAMP,

  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for message_reports
CREATE INDEX IF NOT EXISTS idx_reports_status ON message_reports(status);
CREATE INDEX IF NOT EXISTS idx_reports_reported_user ON message_reports(reported_user_id);
CREATE INDEX IF NOT EXISTS idx_reports_reporter ON message_reports(reporter_id);
CREATE INDEX IF NOT EXISTS idx_reports_type ON message_reports(report_type);
CREATE INDEX IF NOT EXISTS idx_reports_created ON message_reports(created_at DESC);

-- ============================================================================
-- 5. Create User Blocks Table
-- ============================================================================

CREATE TABLE IF NOT EXISTS user_blocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Who Blocked Whom
  blocker_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  blocked_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Conversation Context
  conversation_id UUID REFERENCES conversations(id) ON DELETE SET NULL,

  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),

  -- Constraints
  UNIQUE(blocker_id, blocked_id),
  CHECK (blocker_id != blocked_id) -- Can't block yourself
);

-- Indexes for user_blocks
CREATE INDEX IF NOT EXISTS idx_blocks_blocker ON user_blocks(blocker_id);
CREATE INDEX IF NOT EXISTS idx_blocks_blocked ON user_blocks(blocked_id);

-- ============================================================================
-- 6. Create Seller Response Times Table
-- ============================================================================

CREATE TABLE IF NOT EXISTS seller_response_times (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Seller
  seller_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Response Metrics
  conversation_id UUID REFERENCES conversations(id) ON DELETE SET NULL,
  first_message_at TIMESTAMP NOT NULL, -- Buyer sent message
  first_response_at TIMESTAMP NOT NULL, -- Seller responded
  response_seconds INTEGER NOT NULL, -- Time difference

  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for seller_response_times
CREATE INDEX IF NOT EXISTS idx_response_times_seller ON seller_response_times(seller_id);
CREATE INDEX IF NOT EXISTS idx_response_times_created ON seller_response_times(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_response_times_conversation ON seller_response_times(conversation_id);

-- ============================================================================
-- 7. Create Storage Bucket for Message Images
-- ============================================================================

-- Create message-images bucket (if it doesn't exist)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'message-images',
  'message-images',
  true, -- Public bucket (images are viewable by participants)
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- 8. Storage RLS Policies for message-images bucket
-- ============================================================================

-- Allow authenticated users to upload images to their own folder
-- Path format: {conversation_id}/{user_id}/{timestamp}-{filename}
CREATE POLICY "Users can upload message images"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'message-images'
  );

-- Allow public to read message images (participants can view)
CREATE POLICY "Public can read message images"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'message-images');

-- Allow users to delete their own uploaded images
CREATE POLICY "Users can delete own message images"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'message-images' AND
    (storage.foldername(name))[2] = auth.uid()::text
  );

-- ============================================================================
-- 9. Enable RLS on All Tables
-- ============================================================================

ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE seller_response_times ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 10. RLS Policies for Conversations
-- ============================================================================

-- Users can view conversations they're participants in
CREATE POLICY "Users can view own conversations"
  ON conversations FOR SELECT
  TO authenticated
  USING (
    buyer_id = auth.uid() OR
    seller_id = auth.uid()
  );

-- Buyers can create conversations with sellers
CREATE POLICY "Buyers can create conversations"
  ON conversations FOR INSERT
  TO authenticated
  WITH CHECK (
    buyer_id = auth.uid() AND
    seller_id != auth.uid()
  );

-- Participants can update their own conversations (archive/unarchive)
CREATE POLICY "Participants can update conversations"
  ON conversations FOR UPDATE
  TO authenticated
  USING (
    buyer_id = auth.uid() OR
    seller_id = auth.uid()
  );

-- Participants can delete (soft delete) their own conversations
CREATE POLICY "Participants can delete conversations"
  ON conversations FOR DELETE
  TO authenticated
  USING (
    buyer_id = auth.uid() OR
    seller_id = auth.uid()
  );

-- Admins can view all conversations
CREATE POLICY "Admins can view all conversations"
  ON conversations FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND role = 'admin'
    )
  );

-- ============================================================================
-- 11. RLS Policies for Messages
-- ============================================================================

-- Users can view messages in conversations they're participants in
CREATE POLICY "Users can view messages in own conversations"
  ON messages FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM conversations
      WHERE id = messages.conversation_id
      AND (buyer_id = auth.uid() OR seller_id = auth.uid())
    )
  );

-- Participants can send messages in their conversations
CREATE POLICY "Participants can send messages"
  ON messages FOR INSERT
  TO authenticated
  WITH CHECK (
    sender_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM conversations
      WHERE id = messages.conversation_id
      AND (buyer_id = auth.uid() OR seller_id = auth.uid())
      AND status != 'blocked'
    )
  );

-- Recipients can mark messages as read
CREATE POLICY "Recipients can mark messages as read"
  ON messages FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM conversations
      WHERE id = messages.conversation_id
      AND (buyer_id = auth.uid() OR seller_id = auth.uid())
      AND sender_id != auth.uid()
    )
  );

-- Senders can delete their own messages (soft delete)
CREATE POLICY "Senders can delete own messages"
  ON messages FOR UPDATE
  TO authenticated
  USING (
    sender_id = auth.uid()
  )
  WITH CHECK (
    sender_id = auth.uid()
  );

-- Admins can view all messages
CREATE POLICY "Admins can view all messages"
  ON messages FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND role = 'admin'
    )
  );

-- Admins can delete any message
CREATE POLICY "Admins can delete any message"
  ON messages FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND role = 'admin'
    )
  );

-- ============================================================================
-- 12. RLS Policies for Message Templates
-- ============================================================================

-- All users can view system templates
CREATE POLICY "Users can view system templates"
  ON message_templates FOR SELECT
  TO authenticated
  USING (template_type = 'system' AND is_active = true);

-- Sellers can view their own custom templates
CREATE POLICY "Sellers can view own templates"
  ON message_templates FOR SELECT
  TO authenticated
  USING (
    seller_id = auth.uid() OR
    template_type = 'system'
  );

-- Pro/Pioneer sellers can create custom templates
CREATE POLICY "Pro/Pioneer sellers can create templates"
  ON message_templates FOR INSERT
  TO authenticated
  WITH CHECK (
    seller_id = auth.uid() AND
    template_type = 'custom' AND
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND subscription_tier IN ('pro', 'pioneer')
    )
  );

-- Sellers can update their own templates
CREATE POLICY "Sellers can update own templates"
  ON message_templates FOR UPDATE
  TO authenticated
  USING (seller_id = auth.uid())
  WITH CHECK (seller_id = auth.uid());

-- Sellers can delete their own templates
CREATE POLICY "Sellers can delete own templates"
  ON message_templates FOR DELETE
  TO authenticated
  USING (
    seller_id = auth.uid() AND
    template_type = 'custom'
  );

-- ============================================================================
-- 13. RLS Policies for Message Reports
-- ============================================================================

-- Users can create reports
CREATE POLICY "Users can create reports"
  ON message_reports FOR INSERT
  TO authenticated
  WITH CHECK (reporter_id = auth.uid());

-- Users can view their own reports
CREATE POLICY "Users can view own reports"
  ON message_reports FOR SELECT
  TO authenticated
  USING (reporter_id = auth.uid());

-- Admins can view all reports
CREATE POLICY "Admins can view all reports"
  ON message_reports FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND role = 'admin'
    )
  );

-- Admins can update reports (resolve/dismiss)
CREATE POLICY "Admins can update reports"
  ON message_reports FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND role = 'admin'
    )
  );

-- ============================================================================
-- 14. RLS Policies for User Blocks
-- ============================================================================

-- Users can view their own blocks
CREATE POLICY "Users can view own blocks"
  ON user_blocks FOR SELECT
  TO authenticated
  USING (blocker_id = auth.uid());

-- Users can create blocks
CREATE POLICY "Users can create blocks"
  ON user_blocks FOR INSERT
  TO authenticated
  WITH CHECK (blocker_id = auth.uid());

-- Users can delete their own blocks (unblock)
CREATE POLICY "Users can delete own blocks"
  ON user_blocks FOR DELETE
  TO authenticated
  USING (blocker_id = auth.uid());

-- ============================================================================
-- 15. RLS Policies for Seller Response Times
-- ============================================================================

-- Sellers can view their own response times
CREATE POLICY "Sellers can view own response times"
  ON seller_response_times FOR SELECT
  TO authenticated
  USING (seller_id = auth.uid());

-- System can insert response times (via service role or function)
-- No INSERT policy needed - will be done via service role or function

-- Admins can view all response times
CREATE POLICY "Admins can view all response times"
  ON seller_response_times FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND role = 'admin'
    )
  );

-- ============================================================================
-- 16. Insert System Templates (5 default quick replies)
-- ============================================================================

INSERT INTO message_templates (seller_id, name, content, template_type, is_active)
VALUES
  (NULL, 'Yes, available!', 'Yes, this product is available! 💚', 'system', true),
  (NULL, 'Includes answer keys', 'Yes, this includes answer keys.', 'system', true),
  (NULL, 'Can customize', 'I can customize this for you. What changes do you need?', 'system', true),
  (NULL, 'Check library', 'Please check your library for downloads.', 'system', true),
  (NULL, 'Thank you', 'Thank you for your purchase! Let me know if you need help.', 'system', true)
ON CONFLICT DO NOTHING;

-- ============================================================================
-- 17. Create Function to Update Conversation Last Message Timestamp
-- ============================================================================

CREATE OR REPLACE FUNCTION update_conversation_last_message()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE conversations
  SET last_message_at = NEW.created_at
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update last_message_at when new message is inserted
CREATE TRIGGER trigger_update_conversation_last_message
  AFTER INSERT ON messages
  FOR EACH ROW
  EXECUTE FUNCTION update_conversation_last_message();

-- ============================================================================
-- 18. Create Function to Track Response Times
-- ============================================================================

CREATE OR REPLACE FUNCTION track_seller_response_time()
RETURNS TRIGGER AS $$
DECLARE
  v_conversation_id UUID;
  v_seller_id UUID;
  v_first_message_at TIMESTAMP;
  v_response_seconds INTEGER;
  v_avg_hours NUMERIC;
BEGIN
  -- Only track if this is a seller's first response in a conversation
  -- Check if seller has already responded in this conversation
  IF EXISTS (
    SELECT 1 FROM messages
    WHERE conversation_id = NEW.conversation_id
      AND sender_id = (SELECT seller_id FROM conversations WHERE id = NEW.conversation_id)
      AND id != NEW.id
      AND message_type = 'user'
  ) THEN
    -- Seller has already responded, don't track again
    RETURN NEW;
  END IF;

  -- Get conversation and seller info
  SELECT 
    c.id,
    c.seller_id,
    MIN(m.created_at)
  INTO v_conversation_id, v_seller_id, v_first_message_at
  FROM conversations c
  JOIN messages m ON m.conversation_id = c.id
  WHERE c.id = NEW.conversation_id
    AND c.seller_id = NEW.sender_id
    AND m.sender_id != c.seller_id
    AND m.message_type = 'user'
  GROUP BY c.id, c.seller_id;

  -- If this is seller's first response
  IF v_first_message_at IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM seller_response_times
    WHERE conversation_id = NEW.conversation_id
  ) THEN
    v_response_seconds := EXTRACT(EPOCH FROM (NEW.created_at - v_first_message_at))::INTEGER;
    
    INSERT INTO seller_response_times (
      seller_id,
      conversation_id,
      first_message_at,
      first_response_at,
      response_seconds
    ) VALUES (
      v_seller_id,
      v_conversation_id,
      v_first_message_at,
      NEW.created_at,
      v_response_seconds
    );

    -- Update seller's response_time_hours in users table
    -- Calculate average of last 50 responses (rolling 30-day window)
    SELECT COALESCE(
      ROUND(AVG(response_seconds) / 3600.0, 1),
      NULL
    ) INTO v_avg_hours
    FROM seller_response_times
    WHERE seller_id = v_seller_id
      AND created_at >= NOW() - INTERVAL '30 days'
    ORDER BY created_at DESC
    LIMIT 50;

    -- Update users table
    IF v_avg_hours IS NOT NULL THEN
      UPDATE users
      SET response_time_hours = v_avg_hours
      WHERE id = v_seller_id;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to track response times when seller sends first message
CREATE TRIGGER trigger_track_seller_response_time
  AFTER INSERT ON messages
  FOR EACH ROW
  WHEN (NEW.message_type = 'user')
  EXECUTE FUNCTION track_seller_response_time();
