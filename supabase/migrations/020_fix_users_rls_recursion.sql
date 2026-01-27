-- Migration: 020_fix_users_rls_recursion.sql
-- Purpose: Fix "infinite recursion detected in policy for relation users" (42P17).
--          Admin policies used EXISTS (SELECT 1 FROM users WHERE ...), which re-triggers RLS.
--          Use a SECURITY DEFINER function so the check bypasses RLS and does not recurse.

-- Helper: returns true iff the current request's user has role 'admin' in public.users.
-- SECURITY DEFINER lets this read users with owner privileges, avoiding RLS recursion.
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND role = 'admin'
  );
$$;

-- Drop admin policies that caused recursion (they queried users inside policies on users)
DROP POLICY IF EXISTS "Admins can select users" ON users;
DROP POLICY IF EXISTS "Admins can update users" ON users;
DROP POLICY IF EXISTS "Admins can delete users" ON users;

-- Recreate using is_admin() so the check does not trigger RLS on users
CREATE POLICY "Admins can select users"
  ON users FOR SELECT
  USING (public.is_admin());

CREATE POLICY "Admins can update users"
  ON users FOR UPDATE
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "Admins can delete users"
  ON users FOR DELETE
  USING (public.is_admin());
