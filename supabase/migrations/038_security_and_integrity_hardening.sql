-- Security and integrity hardening for privileged server workflows.

-- Authenticated buyers must not be able to update arbitrary order columns
-- directly. Approved order mutations are performed by authenticated API routes
-- through the service-role client after ownership and state validation.
DROP POLICY IF EXISTS "Buyers can update their own pending orders" ON orders;
DROP POLICY IF EXISTS "Buyers can create their own orders" ON orders;

-- Admin mutations are authorized in server routes and executed with the
-- service role. Leaving the legacy authenticated-admin policies in place would
-- let a browser client bypass role-specific application permissions.
DROP POLICY IF EXISTS "Admins can select users" ON public.users;
DROP POLICY IF EXISTS "Admins can update users" ON public.users;
DROP POLICY IF EXISTS "Admins can delete users" ON public.users;

-- Admin RLS checks must require an assigned admin role as well as the broad
-- user role. This keeps partially migrated or malformed records fail-closed.
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.users
    WHERE id = auth.uid()
      AND role = 'admin'
      AND admin_role IN ('super_admin', 'moderator', 'content_manager')
  );
$$;

-- RLS controls rows, not columns. The legacy public-profile policy therefore
-- exposed every column on readable rows, including email and payout details.
-- Keep marketplace profile discovery working while limiting API roles to the
-- explicit public projection below. Server endpoints use the service role only
-- after authenticating/authorizing requests when private fields are required.
REVOKE SELECT ON TABLE public.users FROM anon, authenticated;
GRANT SELECT (
  id,
  username,
  avatar_url,
  role,
  is_verified_teacher,
  can_sell,
  bio,
  subjects_taught,
  grade_levels_taught,
  location_city,
  location_region,
  social_links,
  banner_url,
  custom_accent_color,
  profile_completion_percent,
  followers_count,
  response_time_hours,
  subscription_tier,
  is_pioneer,
  created_at,
  updated_at,
  avg_rating,
  reviews_count,
  shop_name,
  shop_description,
  first_name,
  last_name,
  teaching_class_types,
  teaching_strand_ids,
  display_name
) ON public.users TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.current_admin_role()
RETURNS TEXT
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT admin_role::TEXT
  FROM public.users
  WHERE id = auth.uid()
    AND role = 'admin'
    AND admin_role IN ('super_admin', 'moderator', 'content_manager');
$$;

REVOKE ALL ON FUNCTION public.current_admin_role() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.current_admin_role() FROM anon;
GRANT EXECUTE ON FUNCTION public.current_admin_role() TO authenticated, service_role;

-- Legacy helper functions were SECURITY DEFINER and therefore executable by
-- PUBLIC unless explicitly revoked. Bind personal search-history writes to the
-- authenticated user and keep global maintenance/analytics mutations on the
-- service-role boundary.
CREATE OR REPLACE FUNCTION public.upsert_user_search_history(
  p_user_id UUID,
  p_query_text VARCHAR(255)
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF p_user_id IS NULL
     OR p_query_text IS NULL
     OR length(trim(p_query_text)) = 0
     OR length(p_query_text) > 100 THEN
    RAISE EXCEPTION 'invalid_search_history_input' USING ERRCODE = '22023';
  END IF;

  IF auth.role() <> 'service_role' AND auth.uid() IS DISTINCT FROM p_user_id THEN
    RAISE EXCEPTION 'search_history_forbidden' USING ERRCODE = '42501';
  END IF;

  INSERT INTO public.user_search_history (user_id, query_text, searched_at)
  VALUES (p_user_id, trim(p_query_text), NOW())
  ON CONFLICT (user_id, query_text)
  DO UPDATE SET searched_at = NOW();

  DELETE FROM public.user_search_history
  WHERE user_id = p_user_id
    AND id NOT IN (
      SELECT id
      FROM public.user_search_history
      WHERE user_id = p_user_id
      ORDER BY searched_at DESC
      LIMIT 10
    );
END;
$$;

REVOKE ALL ON FUNCTION public.upsert_user_search_history(UUID, VARCHAR) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.upsert_user_search_history(UUID, VARCHAR) FROM anon;
GRANT EXECUTE ON FUNCTION public.upsert_user_search_history(UUID, VARCHAR)
  TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.upsert_search_query(
  p_query_text VARCHAR(255)
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF p_query_text IS NULL
     OR length(trim(p_query_text)) = 0
     OR length(p_query_text) > 100 THEN
    RAISE EXCEPTION 'invalid_search_query' USING ERRCODE = '22023';
  END IF;

  INSERT INTO public.search_queries (query_text, search_count, last_searched_at)
  VALUES (trim(p_query_text), 1, NOW())
  ON CONFLICT (query_text)
  DO UPDATE SET
    search_count = public.search_queries.search_count + 1,
    last_searched_at = NOW();
END;
$$;

REVOKE ALL ON FUNCTION public.upsert_search_query(VARCHAR) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.upsert_search_query(VARCHAR) FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION public.upsert_search_query(VARCHAR) TO service_role;

REVOKE ALL ON FUNCTION public.clean_expired_metrics_cache() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.clean_expired_metrics_cache() FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION public.clean_expired_metrics_cache() TO service_role;

REVOKE ALL ON FUNCTION public.refresh_product_social_proof() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.refresh_product_social_proof() FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION public.refresh_product_social_proof() TO service_role;

REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.handle_new_user() FROM anon, authenticated, service_role;

-- Serialize the one-time bootstrap so two concurrent requests cannot both pass
-- an application-level "no super admin yet" check.
CREATE OR REPLACE FUNCTION public.promote_initial_super_admin(
  p_user_id UUID,
  p_username TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF p_user_id IS NULL
     OR p_username IS NULL
     OR length(trim(p_username)) = 0
     OR length(p_username) > 20 THEN
    RAISE EXCEPTION 'invalid_initial_admin' USING ERRCODE = '22023';
  END IF;

  PERFORM pg_advisory_xact_lock(hashtextextended('initial-super-admin', 0));

  IF EXISTS (
    SELECT 1 FROM public.users
    WHERE role = 'admin' AND admin_role = 'super_admin'
  ) THEN
    RETURN FALSE;
  END IF;

  UPDATE public.users
  SET username = trim(p_username),
      role = 'admin',
      admin_role = 'super_admin',
      is_verified_teacher = FALSE,
      can_sell = FALSE,
      email_verified = TRUE,
      email_verified_at = NOW(),
      updated_at = NOW()
  WHERE id = p_user_id;

  RETURN FOUND;
END;
$$;

REVOKE ALL ON FUNCTION public.promote_initial_super_admin(UUID, TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.promote_initial_super_admin(UUID, TEXT) FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION public.promote_initial_super_admin(UUID, TEXT) TO service_role;

-- The original self-update RLS policy only checked the row ID, which allowed
-- callers to promote themselves or grant themselves paid/seller privileges.
-- Preserve user-editable profile fields while freezing authorization, billing,
-- verification, moderation, and computed fields for non-admin requests.
CREATE OR REPLACE FUNCTION public.protect_user_privileged_fields()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.role() = 'service_role' OR auth.uid() IS NULL THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'INSERT' THEN
    NEW.password_hash := NULL;
    NEW.email_verified := false;
    NEW.email_verified_at := NULL;
    NEW.role := 'buyer';
    NEW.admin_role := NULL;
    NEW.is_verified_teacher := false;
    NEW.can_sell := false;
    NEW.profile_completion_percent := 0;
    NEW.followers_count := 0;
    NEW.response_time_hours := NULL;
    NEW.avg_rating := 0;
    NEW.reviews_count := 0;
    NEW.subscription_tier := 'free';
    NEW.custom_commission_rate := NULL;
    NEW.is_pioneer := false;
    NEW.last_cart_abandonment_email_sent_at := NULL;
    NEW.is_banned := false;
    NEW.ban_reason := NULL;
    NEW.created_at := NOW();
  ELSE
    -- Review-stat triggers are the only nested writes to computed user fields.
    IF pg_trigger_depth() > 1 THEN
      RETURN NEW;
    END IF;

    NEW.id := OLD.id;
    NEW.email := OLD.email;
    NEW.password_hash := OLD.password_hash;
    NEW.email_verified := OLD.email_verified;
    NEW.email_verified_at := OLD.email_verified_at;
    NEW.role := OLD.role;
    NEW.admin_role := OLD.admin_role;
    NEW.is_verified_teacher := OLD.is_verified_teacher;
    NEW.can_sell := OLD.can_sell;
    NEW.profile_completion_percent := OLD.profile_completion_percent;
    NEW.followers_count := OLD.followers_count;
    NEW.response_time_hours := OLD.response_time_hours;
    NEW.avg_rating := OLD.avg_rating;
    NEW.reviews_count := OLD.reviews_count;
    NEW.subscription_tier := OLD.subscription_tier;
    NEW.custom_commission_rate := OLD.custom_commission_rate;
    NEW.is_pioneer := OLD.is_pioneer;
    NEW.last_cart_abandonment_email_sent_at := OLD.last_cart_abandonment_email_sent_at;
    NEW.is_banned := OLD.is_banned;
    NEW.ban_reason := OLD.ban_reason;
    NEW.created_at := OLD.created_at;

    -- Premium profile presentation may only be changed while the account is
    -- entitled to it. The subscription itself is frozen above.
    IF OLD.subscription_tier NOT IN ('pro', 'pioneer') THEN
      NEW.banner_url := OLD.banner_url;
      NEW.custom_accent_color := OLD.custom_accent_color;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS protect_user_privileged_fields_trigger ON public.users;
CREATE TRIGGER protect_user_privileged_fields_trigger
  BEFORE INSERT OR UPDATE ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_user_privileged_fields();

-- Product moderation state and marketplace metrics were previously writable
-- through the broad "seller owns row" update policy. Keep catalog editing
-- available while making workflow transitions and computed values authoritative.
CREATE OR REPLACE FUNCTION public.protect_product_privileged_fields()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  published_count INTEGER;
BEGIN
  IF auth.role() = 'service_role' OR auth.uid() IS NULL THEN
    RETURN NEW;
  END IF;

  -- Aggregate-review triggers are trusted nested writes. Their values are
  -- calculated from review rows rather than supplied by the caller.
  IF pg_trigger_depth() > 1 THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'INSERT' THEN
    NEW.seller_id := auth.uid();
    NEW.current_version := 1;
    NEW.review_count := 0;
    NEW.views_count := 0;
    NEW.unique_views_count := 0;
    NEW.sales_count := 0;
    NEW.conversion_rate := NULL;
    NEW.avg_rating := NULL;
    NEW.reviews_count := 0;
    NEW.badges := NULL;
    NEW.search_score := 0;
    NEW.wishlist_count := 0;
    NEW.computed_badge := NULL;
    NEW.rejection_reason := NULL;
    NEW.suspension_reason := NULL;
    NEW.deleted_at := NULL;
    NEW.created_at := NOW();
    NEW.original_created_at := NOW();

    IF NEW.status = 'draft' THEN
      NEW.published_at := NULL;
    ELSE
      SELECT COUNT(*) INTO published_count
      FROM public.products
      WHERE seller_id = auth.uid() AND status = 'published';

      IF published_count >= 3 THEN
        NEW.status := 'published';
        NEW.published_at := NOW();
      ELSE
        NEW.status := 'pending_review';
        NEW.published_at := NULL;
      END IF;
    END IF;

    RETURN NEW;
  END IF;

  NEW.id := OLD.id;
  NEW.seller_id := OLD.seller_id;
  NEW.review_count := OLD.review_count;
  NEW.views_count := OLD.views_count;
  NEW.unique_views_count := OLD.unique_views_count;
  NEW.sales_count := OLD.sales_count;
  NEW.conversion_rate := OLD.conversion_rate;
  NEW.avg_rating := OLD.avg_rating;
  NEW.reviews_count := OLD.reviews_count;
  NEW.badges := OLD.badges;
  NEW.search_score := OLD.search_score;
  NEW.wishlist_count := OLD.wishlist_count;
  NEW.computed_badge := OLD.computed_badge;
  NEW.created_at := OLD.created_at;
  NEW.original_created_at := OLD.original_created_at;

  IF NEW.current_version IS NULL
     OR NEW.current_version < OLD.current_version
     OR NEW.current_version > OLD.current_version + 1 THEN
    NEW.current_version := OLD.current_version;
  END IF;

  -- Suspended and deleted products cannot be restored by their seller.
  IF OLD.status IN ('suspended', 'deleted') THEN
    IF NEW.status <> 'deleted' THEN
      NEW.status := OLD.status;
    END IF;
  -- Pending products still require the original moderation decision.
  ELSIF OLD.status = 'pending_review' AND NEW.status = 'published' THEN
    NEW.status := 'pending_review';
  -- A rejected product may be edited and resubmitted, never self-approved.
  ELSIF OLD.status = 'rejected' AND NEW.status = 'published' THEN
    NEW.status := 'pending_review';
  ELSIF NEW.status = 'published' AND OLD.status <> 'published' THEN
    SELECT COUNT(*) INTO published_count
    FROM public.products
    WHERE seller_id = auth.uid() AND status = 'published';

    IF published_count < 3 THEN
      NEW.status := 'pending_review';
    END IF;
  ELSIF NEW.status IN ('rejected', 'suspended') AND NEW.status <> OLD.status THEN
    NEW.status := OLD.status;
  END IF;

  IF NEW.status = 'published' THEN
    NEW.published_at := COALESCE(OLD.published_at, NOW());
  ELSIF NEW.status = 'deleted' THEN
    NEW.deleted_at := COALESCE(OLD.deleted_at, NOW());
    NEW.published_at := OLD.published_at;
  ELSE
    NEW.published_at := NULL;
    NEW.deleted_at := NULL;
  END IF;

  IF OLD.status = 'rejected' AND NEW.status IN ('draft', 'pending_review') THEN
    NEW.rejection_reason := NULL;
  ELSE
    NEW.rejection_reason := OLD.rejection_reason;
  END IF;
  NEW.suspension_reason := OLD.suspension_reason;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS protect_product_privileged_fields_trigger ON public.products;
CREATE TRIGGER protect_product_privileged_fields_trigger
  BEFORE INSERT OR UPDATE ON public.products
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_product_privileged_fields();

DROP POLICY IF EXISTS "Admins have full access to products" ON public.products;

-- Record at most one counted view per signed-in user/product/hour and update
-- the cached counter in the same transaction. Direct analytics inserts are
-- disabled so callers cannot forge another user ID or arbitrary traffic.
DROP POLICY IF EXISTS "Anyone can insert product views" ON public.product_views;

CREATE OR REPLACE FUNCTION public.record_product_view(
  p_product_id UUID,
  p_user_id UUID,
  p_source TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF p_product_id IS NULL OR p_user_id IS NULL THEN
    RETURN FALSE;
  END IF;

  PERFORM pg_advisory_xact_lock(
    hashtextextended(p_product_id::TEXT || ':' || p_user_id::TEXT, 0)
  );

  IF NOT EXISTS (
    SELECT 1 FROM public.products
    WHERE id = p_product_id AND status = 'published'
  ) THEN
    RETURN FALSE;
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.product_views
    WHERE product_id = p_product_id
      AND user_id = p_user_id
      AND viewed_at >= NOW() - INTERVAL '1 hour'
  ) THEN
    RETURN FALSE;
  END IF;

  INSERT INTO public.product_views (product_id, user_id, source)
  VALUES (
    p_product_id,
    p_user_id,
    CASE
      WHEN p_source IN ('search', 'marketplace', 'direct', 'profile', 'category', 'other')
        THEN p_source
      ELSE 'other'
    END
  );

  UPDATE public.products
  SET views_count = COALESCE(views_count, 0) + 1
  WHERE id = p_product_id;

  RETURN TRUE;
END;
$$;

REVOKE ALL ON FUNCTION public.record_product_view(UUID, UUID, TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.record_product_view(UUID, UUID, TEXT) FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION public.record_product_view(UUID, UUID, TEXT) TO service_role;

-- Payment state, library grants, and sales counters must succeed or roll back
-- together. The provider route has already authenticated and validated the
-- callback before invoking this service-role-only function.
CREATE UNIQUE INDEX IF NOT EXISTS idx_orders_unique_payment_reference
  ON public.orders(payment_method, payment_reference)
  WHERE payment_reference IS NOT NULL;

CREATE OR REPLACE FUNCTION public.complete_order_payment(
  p_order_id UUID,
  p_payment_reference TEXT,
  p_payment_method TEXT,
  p_total_amount NUMERIC
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  buyer UUID;
BEGIN
  IF p_payment_reference IS NULL
     OR length(trim(p_payment_reference)) = 0
     OR length(p_payment_reference) > 100 THEN
    RAISE EXCEPTION 'invalid_payment_reference' USING ERRCODE = '22023';
  END IF;

  UPDATE public.orders AS target
  SET payment_status = 'completed',
      payment_reference = trim(p_payment_reference),
      completed_at = NOW(),
      updated_at = NOW()
  WHERE target.id = p_order_id
    AND target.payment_status = 'pending'
    AND target.payment_method = p_payment_method
    AND target.total_amount = p_total_amount
    AND EXISTS (
      SELECT 1 FROM public.order_items AS required_item
      WHERE required_item.order_id = target.id
    )
  RETURNING target.buyer_id INTO buyer;

  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;

  INSERT INTO public.user_library (user_id, product_id, order_item_id)
  SELECT buyer, item.product_id, item.id
  FROM public.order_items AS item
  WHERE item.order_id = p_order_id
  ON CONFLICT (user_id, product_id) DO NOTHING;

  UPDATE public.products AS product
  SET sales_count = COALESCE(product.sales_count, 0) + sales.quantity,
      updated_at = NOW()
  FROM (
    SELECT item.product_id, COUNT(*)::INTEGER AS quantity
    FROM public.order_items AS item
    WHERE item.order_id = p_order_id
    GROUP BY item.product_id
  ) AS sales
  WHERE product.id = sales.product_id;

  RETURN TRUE;
END;
$$;

REVOKE ALL ON FUNCTION public.complete_order_payment(UUID, TEXT, TEXT, NUMERIC) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.complete_order_payment(UUID, TEXT, TEXT, NUMERIC) FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION public.complete_order_payment(UUID, TEXT, TEXT, NUMERIC) TO service_role;

-- Library row identity is an entitlement, not user-editable profile data.
-- Download counters are updated by a service-only transactional function.
DROP POLICY IF EXISTS "Users can update their own library download count" ON public.user_library;

CREATE OR REPLACE FUNCTION public.record_library_download(
  p_user_id UUID,
  p_product_id UUID
)
RETURNS TABLE(order_item_id UUID, new_download_count INTEGER)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  selected_order_item_id UUID;
  selected_download_count INTEGER;
BEGIN
  UPDATE public.user_library AS library
  SET download_count = COALESCE(library.download_count, 0) + 1,
      last_downloaded_at = NOW()
  WHERE library.user_id = p_user_id
    AND library.product_id = p_product_id
  RETURNING library.order_item_id, library.download_count
  INTO selected_order_item_id, selected_download_count;

  IF NOT FOUND THEN
    RETURN;
  END IF;

  IF selected_order_item_id IS NOT NULL THEN
    UPDATE public.order_items AS item
    SET download_count = COALESCE(item.download_count, 0) + 1,
        last_downloaded_at = NOW()
    WHERE item.id = selected_order_item_id
      AND item.product_id = p_product_id;
  END IF;

  RETURN QUERY SELECT selected_order_item_id, selected_download_count;
END;
$$;

REVOKE ALL ON FUNCTION public.record_library_download(UUID, UUID) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.record_library_download(UUID, UUID) FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION public.record_library_download(UUID, UUID) TO service_role;

-- Payout requests reserve available earnings transactionally. This closes
-- both direct-RLS bypass and concurrent double-withdrawal races.
ALTER TABLE public.withdrawal_requests
  DROP CONSTRAINT IF EXISTS withdrawal_requests_status_check;
ALTER TABLE public.withdrawal_requests
  ADD CONSTRAINT withdrawal_requests_status_check
  CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'rejected'));
ALTER TABLE public.withdrawal_requests ALTER COLUMN status SET DEFAULT 'pending';

DROP POLICY IF EXISTS "Sellers can create their own withdrawal requests"
  ON public.withdrawal_requests;

CREATE OR REPLACE FUNCTION public.request_withdrawal(
  p_seller_id UUID,
  p_amount NUMERIC,
  p_payment_method TEXT,
  p_payment_number TEXT
)
RETURNS TABLE(withdrawal_id UUID, remaining_balance NUMERIC)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  eligible_earnings NUMERIC(12, 2);
  reserved_earnings NUMERIC(12, 2);
  available_earnings NUMERIC(12, 2);
  created_withdrawal_id UUID;
BEGIN
  PERFORM pg_advisory_xact_lock(hashtextextended(p_seller_id::TEXT, 0));

  IF p_amount IS NULL OR p_amount < 500 OR p_amount <> round(p_amount, 2) THEN
    RAISE EXCEPTION 'invalid_withdrawal_amount' USING ERRCODE = '22023';
  END IF;

  IF p_payment_method NOT IN ('gcash', 'maya') THEN
    RAISE EXCEPTION 'invalid_payment_method' USING ERRCODE = '22023';
  END IF;

  IF p_payment_number IS NULL OR p_payment_number !~ '^09[0-9]{9}$' THEN
    RAISE EXCEPTION 'invalid_payment_number' USING ERRCODE = '22023';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.users
    WHERE id = p_seller_id AND role = 'seller' AND can_sell = TRUE
  ) THEN
    RAISE EXCEPTION 'seller_not_eligible' USING ERRCODE = '42501';
  END IF;

  SELECT COALESCE(SUM(item.net_earnings), 0)
  INTO eligible_earnings
  FROM public.order_items AS item
  JOIN public.orders AS purchase ON purchase.id = item.order_id
  WHERE item.seller_id = p_seller_id
    AND purchase.payment_status = 'completed'
    AND purchase.refund_status <> 'approved'
    AND COALESCE(purchase.completed_at, item.created_at) <= NOW() - INTERVAL '3 days';

  SELECT COALESCE(SUM(request.amount), 0)
  INTO reserved_earnings
  FROM public.withdrawal_requests AS request
  WHERE request.seller_id = p_seller_id
    AND request.status IN ('pending', 'processing', 'completed');

  available_earnings := GREATEST(eligible_earnings - reserved_earnings, 0);
  IF p_amount > available_earnings THEN
    RAISE EXCEPTION 'insufficient_funds' USING ERRCODE = 'P0001';
  END IF;

  INSERT INTO public.withdrawal_requests (
    seller_id,
    amount,
    payment_method,
    payment_number,
    status
  ) VALUES (
    p_seller_id,
    p_amount,
    p_payment_method,
    p_payment_number,
    'pending'
  )
  RETURNING id INTO created_withdrawal_id;

  RETURN QUERY
  SELECT created_withdrawal_id, available_earnings - p_amount;
END;
$$;

REVOKE ALL ON FUNCTION public.request_withdrawal(UUID, NUMERIC, TEXT, TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.request_withdrawal(UUID, NUMERIC, TEXT, TEXT) FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION public.request_withdrawal(UUID, NUMERIC, TEXT, TEXT) TO service_role;

-- Review eligibility in the original migration referenced columns that do not
-- exist on orders. Use the granted library entitlement and require a recorded
-- download. Callers may only check their own eligibility.
CREATE OR REPLACE FUNCTION public.check_review_eligibility(
  p_user_id UUID,
  p_product_id UUID
)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT
    (auth.role() = 'service_role' OR auth.uid() = p_user_id)
    AND EXISTS (
      SELECT 1
      FROM public.user_library AS library
      WHERE library.user_id = p_user_id
        AND library.product_id = p_product_id
        AND library.download_count > 0
    );
$$;

REVOKE ALL ON FUNCTION public.check_review_eligibility(UUID, UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.check_review_eligibility(UUID, UUID) TO authenticated, service_role;

-- A row-owner UPDATE policy does not restrict which columns are changed.
-- Normalize buyer edits and seller responses at the database boundary so
-- neither party can alter ownership, verified-purchase, moderation, or rating
-- fields outside its intended workflow.
CREATE OR REPLACE FUNCTION public.protect_review_fields()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  requested_response TEXT;
BEGIN
  IF auth.role() = 'service_role' OR auth.uid() IS NULL THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'INSERT' THEN
    IF NEW.buyer_id <> auth.uid() OR NOT EXISTS (
      SELECT 1
      FROM public.user_library AS library
      WHERE library.user_id = auth.uid()
        AND library.product_id = NEW.product_id
        AND library.download_count > 0
    ) THEN
      RAISE EXCEPTION 'review_not_eligible' USING ERRCODE = '42501';
    END IF;

    IF length(COALESCE(NEW.comment, '')) > 500 THEN
      RAISE EXCEPTION 'review_comment_too_long' USING ERRCODE = '22023';
    END IF;

    NEW.verified_purchase := TRUE;
    NEW.seller_response := NULL;
    NEW.is_edited := FALSE;
    NEW.is_flagged := FALSE;
    NEW.flag_reason := NULL;
    NEW.created_at := NOW();
    NEW.updated_at := NOW();
    RETURN NEW;
  END IF;

  IF OLD.buyer_id = auth.uid() THEN
    IF length(COALESCE(NEW.comment, '')) > 500 THEN
      RAISE EXCEPTION 'review_comment_too_long' USING ERRCODE = '22023';
    END IF;

    NEW.id := OLD.id;
    NEW.product_id := OLD.product_id;
    NEW.buyer_id := OLD.buyer_id;
    NEW.verified_purchase := OLD.verified_purchase;
    NEW.seller_response := OLD.seller_response;
    NEW.is_flagged := OLD.is_flagged;
    NEW.flag_reason := OLD.flag_reason;
    NEW.created_at := OLD.created_at;
    NEW.is_edited := TRUE;
    NEW.updated_at := NOW();
    RETURN NEW;
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.products
    WHERE id = OLD.product_id AND seller_id = auth.uid()
  ) THEN
    requested_response := NEW.seller_response;
    IF length(COALESCE(requested_response, '')) > 500 THEN
      RAISE EXCEPTION 'seller_response_too_long' USING ERRCODE = '22023';
    END IF;

    NEW := OLD;
    NEW.seller_response := NULLIF(trim(requested_response), '');
    NEW.updated_at := NOW();
    RETURN NEW;
  END IF;

  RAISE EXCEPTION 'review_update_forbidden' USING ERRCODE = '42501';
END;
$$;

DROP TRIGGER IF EXISTS protect_review_fields_trigger ON public.reviews;
CREATE TRIGGER protect_review_fields_trigger
  BEFORE INSERT OR UPDATE ON public.reviews
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_review_fields();

-- Automatic moderation is server-side. Manual flags also pass through an API
-- so unauthenticated/direct clients cannot forge moderation state.
DROP POLICY IF EXISTS "Anyone can flag reviews" ON public.review_flags;
REVOKE ALL ON FUNCTION public.auto_flag_review(UUID, VARCHAR, TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.auto_flag_review(UUID, VARCHAR, TEXT) FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION public.auto_flag_review(UUID, VARCHAR, TEXT) TO service_role;

CREATE OR REPLACE FUNCTION public.report_review(
  p_review_id UUID,
  p_reporter_id UUID,
  p_reason TEXT
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  existing_flag_id UUID;
  created_flag_id UUID;
BEGIN
  IF p_reason IS NULL OR length(trim(p_reason)) = 0 OR length(p_reason) > 1000 THEN
    RAISE EXCEPTION 'invalid_flag_reason' USING ERRCODE = '22023';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.users WHERE id = p_reporter_id)
     OR NOT EXISTS (SELECT 1 FROM public.reviews WHERE id = p_review_id) THEN
    RAISE EXCEPTION 'review_or_reporter_not_found' USING ERRCODE = 'P0002';
  END IF;

  SELECT flag.id INTO existing_flag_id
  FROM public.review_flags AS flag
  WHERE flag.review_id = p_review_id
    AND flag.reporter_id = p_reporter_id
    AND flag.status = 'pending'
  ORDER BY flag.created_at DESC
  LIMIT 1;

  IF existing_flag_id IS NOT NULL THEN
    RETURN existing_flag_id;
  END IF;

  INSERT INTO public.review_flags (
    review_id,
    flag_type,
    flag_source,
    reporter_id,
    reason,
    status
  ) VALUES (
    p_review_id,
    'manual_report',
    'manual',
    p_reporter_id,
    trim(p_reason),
    'pending'
  )
  RETURNING id INTO created_flag_id;

  UPDATE public.reviews
  SET is_flagged = TRUE,
      flag_reason = trim(p_reason)
  WHERE id = p_review_id;

  RETURN created_flag_id;
END;
$$;

REVOKE ALL ON FUNCTION public.report_review(UUID, UUID, TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.report_review(UUID, UUID, TEXT) FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION public.report_review(UUID, UUID, TEXT) TO service_role;

DROP POLICY IF EXISTS "Admins can view all reviews" ON public.reviews;
DROP POLICY IF EXISTS "Admins can update all reviews" ON public.reviews;
DROP POLICY IF EXISTS "Admins can delete reviews" ON public.reviews;

DROP POLICY IF EXISTS "Admins can view all review flags" ON public.review_flags;
DROP POLICY IF EXISTS "Admins can update review flags" ON public.review_flags;

-- Webhook providers deliver events at least once. Claiming each provider event
-- ID prevents retries from incrementing analytics counters more than once.
CREATE TABLE IF NOT EXISTS webhook_events (
  provider TEXT NOT NULL,
  event_id TEXT NOT NULL,
  received_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (provider, event_id)
);

ALTER TABLE webhook_events ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE webhook_events IS
  'Server-only idempotency claims for verified third-party webhook deliveries.';

-- The email webhook records this timestamp, but the original email migration
-- omitted the corresponding column.
ALTER TABLE email_analytics
  ADD COLUMN IF NOT EXISTS bounced_at TIMESTAMPTZ;

-- Distinct open/click events can arrive concurrently. Increment counters in
-- SQL so one delivery cannot overwrite another event's count.
CREATE OR REPLACE FUNCTION public.record_email_engagement(
  p_analytics_id UUID,
  p_event_type TEXT,
  p_event_at TIMESTAMPTZ
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF p_event_type = 'opened' THEN
    UPDATE public.email_analytics
    SET opened_at = COALESCE(opened_at, p_event_at),
        open_count = COALESCE(open_count, 0) + 1
    WHERE id = p_analytics_id;
  ELSIF p_event_type = 'clicked' THEN
    UPDATE public.email_analytics
    SET clicked_at = COALESCE(clicked_at, p_event_at),
        click_count = COALESCE(click_count, 0) + 1
    WHERE id = p_analytics_id;
  ELSE
    RAISE EXCEPTION 'invalid_engagement_event' USING ERRCODE = '22023';
  END IF;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'email_analytics_not_found' USING ERRCODE = 'P0002';
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.record_email_engagement(UUID, TEXT, TIMESTAMPTZ) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.record_email_engagement(UUID, TEXT, TIMESTAMPTZ) FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION public.record_email_engagement(UUID, TEXT, TIMESTAMPTZ) TO service_role;

-- Facebook and other provider deletion callbacks must return a durable status
-- URL. Store only a hash of the opaque confirmation code so a database read
-- does not reveal usable status tokens.
CREATE TABLE IF NOT EXISTS public.data_deletion_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider TEXT NOT NULL CHECK (provider IN ('facebook')),
  confirmation_code_hash TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'processing'
    CHECK (status IN ('processing', 'completed', 'failed')),
  failure_reason TEXT,
  requested_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.data_deletion_requests ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.data_deletion_requests FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON TABLE public.data_deletion_requests TO service_role;

COMMENT ON TABLE public.data_deletion_requests IS
  'Server-only status ledger for signed third-party data deletion callbacks.';
