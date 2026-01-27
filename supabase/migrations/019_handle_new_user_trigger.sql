-- Migration: 019_handle_new_user_trigger.sql
-- Purpose: Create/replace trigger on auth.users to insert into public.users when a new auth user
--          is created (OAuth or email signup). Uses first_name/last_name to match migration 018.
--          Fixes "Database error saving new user" when an existing trigger used the old "name" column.
-- Docs: https://supabase.com/docs/guides/auth/managing-user-data

-- Drop existing trigger(s) that may use old schema (name column)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS handle_new_user_trigger ON auth.users;

-- Drop existing function so we can replace with first_name/last_name version
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Function inserts into public.users with columns matching migration 018 (first_name, last_name).
-- Derives first_name/last_name from raw_user_meta_data (OAuth: name, given_name, family_name, etc.)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  fn text;
  ln text;
  full_name text;
  uname text;
BEGIN
  full_name := COALESCE(
    NEW.raw_user_meta_data->>'name',
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'display_name',
    split_part(COALESCE(NEW.email, ''), '@', 1)
  );
  fn := COALESCE(NULLIF(trim(NEW.raw_user_meta_data->>'first_name'), ''), split_part(trim(COALESCE(full_name, '')) || ' ', ' ', 1));
  ln := COALESCE(NULLIF(trim(NEW.raw_user_meta_data->>'last_name'), ''), trim(substring(trim(COALESCE(full_name, '')) from position(' ' in trim(COALESCE(full_name, '')) || ' ') + 1)));
  IF fn = '' THEN fn := 'User'; END IF;
  IF ln IS NULL THEN ln := ''; END IF;
  uname := split_part(COALESCE(NEW.email, NEW.id::text), '@', 1);
  IF char_length(uname) > 20 THEN uname := left(uname, 20); END IF;

  INSERT INTO public.users (
    id,
    email,
    first_name,
    last_name,
    username,
    role,
    is_verified_teacher,
    can_sell,
    email_verified
  ) VALUES (
    NEW.id,
    COALESCE(NEW.email, ''),
    fn,
    ln,
    uname,
    'buyer',
    false,
    false,
    (NEW.email_confirmed_at IS NOT NULL)
  );
  RETURN NEW;
EXCEPTION
  WHEN unique_violation THEN
    -- Profile already exists (e.g. race with app callback), ignore
    RETURN NEW;
END;
$$;

-- Trigger runs after Auth inserts a row into auth.users (OAuth or signUp)
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
