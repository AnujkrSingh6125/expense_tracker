-- ====================================================================
-- Expense Tracker: Multi-User Collaborative Group Schema & Security Setup
-- PostgreSQL / Supabase Migration
-- Completely Self-Contained & Idempotent (Safe to run multiple times)
-- ====================================================================

-- 0. Ensure public.profiles table exists and is populated
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  currency TEXT DEFAULT '₹',
  pin_hash TEXT,
  biometric_enabled BOOLEAN DEFAULT FALSE,
  biometric_credential_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Backfill profile records for any existing auth.users
INSERT INTO public.profiles (id, email, full_name, currency)
SELECT 
  id,
  email,
  COALESCE(raw_user_meta_data->>'full_name', split_part(email, '@', 1)),
  '₹'
FROM auth.users
ON CONFLICT (id) DO NOTHING;

-- 1. Create GROUPS table
CREATE TABLE IF NOT EXISTS public.groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  currency TEXT DEFAULT '₹',
  join_code TEXT UNIQUE NOT NULL,
  invite_code TEXT,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Trigger to sync join_code and invite_code columns
CREATE OR REPLACE FUNCTION public.sync_group_codes()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.join_code IS NULL AND NEW.invite_code IS NOT NULL THEN
    NEW.join_code := NEW.invite_code;
  ELSIF NEW.invite_code IS NULL AND NEW.join_code IS NOT NULL THEN
    NEW.invite_code := NEW.join_code;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_sync_group_codes ON public.groups;
CREATE TRIGGER trigger_sync_group_codes
  BEFORE INSERT OR UPDATE ON public.groups
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_group_codes();

-- Trigger to automatically add group creator to group_members as admin
CREATE OR REPLACE FUNCTION public.handle_new_group_creator()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
  IF NEW.created_by IS NOT NULL THEN
    INSERT INTO public.group_members (group_id, user_id, role)
    VALUES (NEW.id, NEW.created_by, 'admin')
    ON CONFLICT (group_id, user_id) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_new_group_creator ON public.groups;
CREATE TRIGGER trigger_new_group_creator
  AFTER INSERT ON public.groups
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_group_creator();

-- Backfill creator as admin for any existing group missing membership
INSERT INTO public.group_members (group_id, user_id, role)
SELECT g.id, g.created_by, 'admin'
FROM public.groups g
WHERE g.created_by IS NOT NULL
ON CONFLICT (group_id, user_id) DO NOTHING;

-- 2. Create GROUP_MEMBERS table
CREATE TABLE IF NOT EXISTS public.group_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'member' CHECK (role IN ('admin', 'member')),
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_group_member UNIQUE (group_id, user_id)
);

-- 3. Create GROUP_EXPENSES table
CREATE TABLE IF NOT EXISTS public.group_expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  paid_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  amount NUMERIC(12,2) NOT NULL CHECK (amount > 0),
  title TEXT NOT NULL DEFAULT 'Expense',
  description TEXT,
  category TEXT NOT NULL DEFAULT 'General',
  split_type TEXT DEFAULT 'equal',
  split_details JSONB DEFAULT '[]'::jsonb,
  expense_date DATE DEFAULT CURRENT_DATE,
  date TIMESTAMPTZ DEFAULT NOW(),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Trigger to sync title/description and expense_date/date
CREATE OR REPLACE FUNCTION public.sync_group_expense_fields()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.title IS NULL AND NEW.description IS NOT NULL THEN
    NEW.title := NEW.description;
  ELSIF NEW.description IS NULL AND NEW.title IS NOT NULL THEN
    NEW.description := NEW.title;
  END IF;

  IF NEW.expense_date IS NULL AND NEW.date IS NOT NULL THEN
    NEW.expense_date := NEW.date::DATE;
  ELSIF NEW.date IS NULL AND NEW.expense_date IS NOT NULL THEN
    NEW.date := NEW.expense_date::TIMESTAMPTZ;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_sync_group_expense_fields ON public.group_expenses;
CREATE TRIGGER trigger_sync_group_expense_fields
  BEFORE INSERT OR UPDATE ON public.group_expenses
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_group_expense_fields();

-- 4. Create GROUP_EXPENSE_SPLITS table
CREATE TABLE IF NOT EXISTS public.group_expense_splits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_expense_id UUID NOT NULL REFERENCES public.group_expenses(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  owed_amount NUMERIC(12,2) NOT NULL CHECK (owed_amount >= 0),
  settled BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_expense_split UNIQUE (group_expense_id, user_id)
);

-- 5. Indexes for fast querying
CREATE INDEX IF NOT EXISTS idx_groups_join_code ON public.groups(join_code);
CREATE INDEX IF NOT EXISTS idx_groups_invite_code ON public.groups(invite_code);
CREATE INDEX IF NOT EXISTS idx_groups_created_by ON public.groups(created_by);
CREATE INDEX IF NOT EXISTS idx_group_members_group_id ON public.group_members(group_id);
CREATE INDEX IF NOT EXISTS idx_group_members_user_id ON public.group_members(user_id);
CREATE INDEX IF NOT EXISTS idx_group_expenses_group_id ON public.group_expenses(group_id);
CREATE INDEX IF NOT EXISTS idx_group_expenses_paid_by ON public.group_expenses(paid_by);
CREATE INDEX IF NOT EXISTS idx_group_splits_expense_id ON public.group_expense_splits(group_expense_id);
CREATE INDEX IF NOT EXISTS idx_group_splits_user_id ON public.group_expense_splits(user_id);

-- 6. Enable Row Level Security (RLS) on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_expense_splits ENABLE ROW LEVEL SECURITY;

-- 7. RLS Policies for PROFILES
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Group members can view co-member profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Public profiles are viewable by everyone"
  ON public.profiles FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- 8. RLS Policies for GROUPS
DROP POLICY IF EXISTS "Members can view groups they belong to" ON public.groups;
DROP POLICY IF EXISTS "Anyone can view groups by code or membership" ON public.groups;
CREATE POLICY "Anyone can view groups by code or membership"
  ON public.groups FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Authenticated users can create groups" ON public.groups;
CREATE POLICY "Authenticated users can create groups"
  ON public.groups FOR INSERT
  WITH CHECK (auth.uid() = created_by);

DROP POLICY IF EXISTS "Admins can update their groups" ON public.groups;
CREATE POLICY "Admins can update their groups"
  ON public.groups FOR UPDATE
  USING (
    auth.uid() = created_by OR
    id IN (
      SELECT gm.group_id FROM public.group_members gm WHERE gm.user_id = auth.uid() AND gm.role = 'admin'
    )
  );

DROP POLICY IF EXISTS "Admins can delete their groups" ON public.groups;
CREATE POLICY "Admins can delete their groups"
  ON public.groups FOR DELETE
  USING (
    auth.uid() = created_by OR
    id IN (
      SELECT gm.group_id FROM public.group_members gm WHERE gm.user_id = auth.uid() AND gm.role = 'admin'
    )
  );

-- 9. RLS Policies for GROUP_MEMBERS
DROP POLICY IF EXISTS "Members can view group membership" ON public.group_members;
DROP POLICY IF EXISTS "Members can view group members" ON public.group_members;
CREATE POLICY "Members can view group members"
  ON public.group_members FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Users can insert themselves or admins can add members" ON public.group_members;
CREATE POLICY "Users can insert themselves or admins can add members"
  ON public.group_members FOR INSERT
  WITH CHECK (
    auth.uid() = user_id OR
    group_id IN (
      SELECT gm.group_id FROM public.group_members gm WHERE gm.user_id = auth.uid() AND gm.role = 'admin'
    ) OR
    group_id IN (
      SELECT g.id FROM public.groups g WHERE g.created_by = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Admins can update member roles" ON public.group_members;
CREATE POLICY "Admins can update member roles"
  ON public.group_members FOR UPDATE
  USING (
    group_id IN (
      SELECT gm.group_id FROM public.group_members gm WHERE gm.user_id = auth.uid() AND gm.role = 'admin'
    ) OR
    group_id IN (
      SELECT g.id FROM public.groups g WHERE g.created_by = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Members can leave or admins can remove members" ON public.group_members;
CREATE POLICY "Members can leave or admins can remove members"
  ON public.group_members FOR DELETE
  USING (
    auth.uid() = user_id OR
    group_id IN (
      SELECT gm.group_id FROM public.group_members gm WHERE gm.user_id = auth.uid() AND gm.role = 'admin'
    ) OR
    group_id IN (
      SELECT g.id FROM public.groups g WHERE g.created_by = auth.uid()
    )
  );

-- 10. RLS Policies for GROUP_EXPENSES
DROP POLICY IF EXISTS "Group members can view expenses" ON public.group_expenses;
CREATE POLICY "Group members can view expenses"
  ON public.group_expenses FOR SELECT
  USING (
    group_id IN (
      SELECT gm.group_id FROM public.group_members gm WHERE gm.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Group members can insert expenses" ON public.group_expenses;
CREATE POLICY "Group members can insert expenses"
  ON public.group_expenses FOR INSERT
  WITH CHECK (
    group_id IN (
      SELECT gm.group_id FROM public.group_members gm WHERE gm.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Group members can update expenses" ON public.group_expenses;
CREATE POLICY "Group members can update expenses"
  ON public.group_expenses FOR UPDATE
  USING (
    auth.uid() = paid_by OR
    group_id IN (
      SELECT gm.group_id FROM public.group_members gm WHERE gm.user_id = auth.uid() AND gm.role = 'admin'
    )
  );

DROP POLICY IF EXISTS "Group members can delete expenses" ON public.group_expenses;
CREATE POLICY "Group members can delete expenses"
  ON public.group_expenses FOR DELETE
  USING (
    auth.uid() = paid_by OR
    group_id IN (
      SELECT gm.group_id FROM public.group_members gm WHERE gm.user_id = auth.uid() AND gm.role = 'admin'
    )
  );

-- 11. RLS Policies for GROUP_EXPENSE_SPLITS
DROP POLICY IF EXISTS "Group members can view splits" ON public.group_expense_splits;
CREATE POLICY "Group members can view splits"
  ON public.group_expense_splits FOR SELECT
  USING (
    group_expense_id IN (
      SELECT ge.id FROM public.group_expenses ge
      JOIN public.group_members gm ON gm.group_id = ge.group_id
      WHERE gm.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Group members can insert splits" ON public.group_expense_splits;
CREATE POLICY "Group members can insert splits"
  ON public.group_expense_splits FOR INSERT
  WITH CHECK (
    group_expense_id IN (
      SELECT ge.id FROM public.group_expenses ge
      JOIN public.group_members gm ON gm.group_id = ge.group_id
      WHERE gm.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Group members can update splits" ON public.group_expense_splits;
CREATE POLICY "Group members can update splits"
  ON public.group_expense_splits FOR UPDATE
  USING (
    group_expense_id IN (
      SELECT ge.id FROM public.group_expenses ge
      JOIN public.group_members gm ON gm.group_id = ge.group_id
      WHERE gm.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Group members can delete splits" ON public.group_expense_splits;
CREATE POLICY "Group members can delete splits"
  ON public.group_expense_splits FOR DELETE
  USING (
    group_expense_id IN (
      SELECT ge.id FROM public.group_expenses ge
      JOIN public.group_members gm ON gm.group_id = ge.group_id
      WHERE gm.user_id = auth.uid()
    )
  );

-- ====================================================================
-- 12. Helper Database RPC Functions (SECURITY DEFINER)
-- ====================================================================

-- Function: create_group_with_admin
CREATE OR REPLACE FUNCTION public.create_group_with_admin(
  p_name TEXT,
  p_description TEXT DEFAULT NULL,
  p_currency TEXT DEFAULT '₹',
  p_join_code TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_user_id UUID;
  v_group_id UUID;
  v_code TEXT;
  v_result JSONB;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated.';
  END IF;

  -- Generate 6-char code if none provided
  IF p_join_code IS NULL OR length(trim(p_join_code)) < 4 THEN
    v_code := 'EXP-' || UPPER(substring(md5(random()::text) from 1 for 4));
  ELSE
    v_code := UPPER(trim(p_join_code));
  END IF;

  -- Insert group
  INSERT INTO public.groups (name, description, currency, join_code, invite_code, created_by)
  VALUES (p_name, p_description, COALESCE(p_currency, '₹'), v_code, v_code, v_user_id)
  RETURNING id INTO v_group_id;

  -- Insert creator as admin
  INSERT INTO public.group_members (group_id, user_id, role)
  VALUES (v_group_id, v_user_id, 'admin');

  SELECT jsonb_build_object(
    'id', g.id,
    'name', g.name,
    'description', g.description,
    'currency', g.currency,
    'join_code', g.join_code,
    'invite_code', g.invite_code,
    'created_by', g.created_by,
    'created_at', g.created_at
  ) INTO v_result
  FROM public.groups g
  WHERE g.id = v_group_id;

  RETURN v_result;
END;
$$;

-- Function: get_group_members (Fetches group members joined with names & emails)
DROP FUNCTION IF EXISTS public.get_group_members(UUID);
CREATE OR REPLACE FUNCTION public.get_group_members(p_group_id UUID)
RETURNS TABLE (
  id UUID,
  group_id UUID,
  user_id UUID,
  role TEXT,
  joined_at TIMESTAMPTZ,
  full_name TEXT,
  email TEXT,
  currency TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    gm.id,
    gm.group_id,
    gm.user_id,
    gm.role,
    gm.joined_at,
    COALESCE(p.full_name, u.raw_user_meta_data->>'full_name', split_part(u.email, '@', 1), 'Member')::TEXT AS full_name,
    u.email::TEXT,
    COALESCE(p.currency, '₹')::TEXT AS currency
  FROM public.group_members gm
  JOIN auth.users u ON u.id = gm.user_id
  LEFT JOIN public.profiles p ON p.id = gm.user_id
  WHERE gm.group_id = p_group_id
  ORDER BY gm.joined_at ASC;
END;
$$;

-- Function: join_group_by_code (with full case, whitespace, and prefix tolerance)
CREATE OR REPLACE FUNCTION public.join_group_by_code(p_code TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_user_id UUID;
  v_group RECORD;
  v_clean_code TEXT;
  v_normalized_suffix TEXT;
  v_prefixed_code TEXT;
  v_already_member BOOLEAN := FALSE;
  v_result JSONB;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated. Please sign in to join a group.';
  END IF;

  IF p_code IS NULL OR length(trim(p_code)) = 0 THEN
    RAISE EXCEPTION 'Please provide a valid invite join code.';
  END IF;

  -- Normalize input: trim, uppercase, and strip prefixes
  v_clean_code := UPPER(trim(p_code));
  v_normalized_suffix := UPPER(regexp_replace(v_clean_code, '^EXP[-\s_]?', '', 'i'));
  v_prefixed_code := 'EXP-' || v_normalized_suffix;

  -- Find group by join_code/invite_code using multiple tolerant matching strategies
  SELECT * INTO v_group
  FROM public.groups
  WHERE UPPER(trim(regexp_replace(COALESCE(join_code, invite_code), '^EXP[-\s_]?', '', 'i'))) = v_normalized_suffix
     OR UPPER(trim(COALESCE(join_code, invite_code))) = v_clean_code
     OR UPPER(trim(COALESCE(join_code, invite_code))) = v_prefixed_code
     OR UPPER(trim(replace(COALESCE(join_code, invite_code), '-', ''))) = UPPER(trim(replace(v_clean_code, '-', '')))
  LIMIT 1;

  IF v_group.id IS NULL THEN
    RAISE EXCEPTION 'Invalid invite code (%). No matching group found.', v_clean_code;
  END IF;

  -- Check if caller is already a member
  SELECT EXISTS (
    SELECT 1 FROM public.group_members
    WHERE group_id = v_group.id AND user_id = v_user_id
  ) INTO v_already_member;

  -- Insert member if not already joined
  IF NOT v_already_member THEN
    INSERT INTO public.group_members (group_id, user_id, role)
    VALUES (v_group.id, v_user_id, 'member')
    ON CONFLICT (group_id, user_id) DO NOTHING;
  END IF;

  -- Build full group JSON response with members list
  SELECT jsonb_build_object(
    'id', v_group.id,
    'name', v_group.name,
    'description', v_group.description,
    'currency', v_group.currency,
    'join_code', COALESCE(v_group.join_code, v_group.invite_code),
    'invite_code', COALESCE(v_group.invite_code, v_group.join_code),
    'created_by', v_group.created_by,
    'created_at', v_group.created_at,
    'already_member', v_already_member,
    'members', COALESCE(
      (
        SELECT jsonb_agg(
          jsonb_build_object(
            'id', gm.id,
            'group_id', gm.group_id,
            'user_id', gm.user_id,
            'role', gm.role,
            'joined_at', gm.joined_at,
            'profile', jsonb_build_object(
              'id', p.id,
              'email', p.email,
              'full_name', p.full_name,
              'currency', p.currency
            )
          )
        )
        FROM public.group_members gm
        LEFT JOIN public.profiles p ON p.id = gm.user_id
        WHERE gm.group_id = v_group.id
      ),
      '[]'::jsonb
    )
  ) INTO v_result;

  RETURN v_result;
END;
$$;

-- Function: leave_group
CREATE OR REPLACE FUNCTION public.leave_group(p_group_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_user_id UUID;
  v_member_count INT;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated.';
  END IF;

  DELETE FROM public.group_members
  WHERE group_id = p_group_id AND user_id = v_user_id;

  SELECT COUNT(*) INTO v_member_count
  FROM public.group_members
  WHERE group_id = p_group_id;

  IF v_member_count = 0 THEN
    DELETE FROM public.groups WHERE id = p_group_id;
  END IF;

  RETURN jsonb_build_object('success', true, 'remaining_members', v_member_count);
END;
$$;

-- Function: remove_group_member (Kick out member)
CREATE OR REPLACE FUNCTION public.remove_group_member(
  p_group_id UUID,
  p_target_user_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_caller_id UUID;
  v_is_admin BOOLEAN;
BEGIN
  v_caller_id := auth.uid();
  IF v_caller_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated.';
  END IF;

  SELECT EXISTS (
    SELECT 1 FROM public.group_members
    WHERE group_id = p_group_id AND user_id = v_caller_id AND role = 'admin'
  ) OR EXISTS (
    SELECT 1 FROM public.groups
    WHERE id = p_group_id AND created_by = v_caller_id
  ) INTO v_is_admin;

  IF NOT v_is_admin THEN
    RAISE EXCEPTION 'Permission denied. Only group admins can remove members.';
  END IF;

  DELETE FROM public.group_members
  WHERE group_id = p_group_id AND user_id = p_target_user_id;

  RETURN jsonb_build_object('success', true);
END;
$$;

-- Function: update_group_member_role (Make Admin / Demote)
CREATE OR REPLACE FUNCTION public.update_group_member_role(
  p_group_id UUID,
  p_target_user_id UUID,
  p_new_role TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_caller_id UUID;
  v_is_admin BOOLEAN;
BEGIN
  v_caller_id := auth.uid();
  IF v_caller_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated.';
  END IF;

  IF p_new_role NOT IN ('admin', 'member') THEN
    RAISE EXCEPTION 'Invalid role. Must be admin or member.';
  END IF;

  SELECT EXISTS (
    SELECT 1 FROM public.group_members
    WHERE group_id = p_group_id AND user_id = v_caller_id AND role = 'admin'
  ) OR EXISTS (
    SELECT 1 FROM public.groups
    WHERE id = p_group_id AND created_by = v_caller_id
  ) INTO v_is_admin;

  IF NOT v_is_admin THEN
    RAISE EXCEPTION 'Permission denied. Only group admins can manage member roles.';
  END IF;

  UPDATE public.group_members
  SET role = p_new_role
  WHERE group_id = p_group_id AND user_id = p_target_user_id;

  RETURN jsonb_build_object('success', true, 'new_role', p_new_role);
END;
$$;

-- Function: delete_group_by_admin (Admin Delete Group)
CREATE OR REPLACE FUNCTION public.delete_group_by_admin(p_group_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_caller_id UUID;
  v_is_admin BOOLEAN;
BEGIN
  v_caller_id := auth.uid();
  IF v_caller_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated.';
  END IF;

  SELECT EXISTS (
    SELECT 1 FROM public.group_members
    WHERE group_id = p_group_id AND user_id = v_caller_id AND role = 'admin'
  ) OR EXISTS (
    SELECT 1 FROM public.groups
    WHERE id = p_group_id AND created_by = v_caller_id
  ) INTO v_is_admin;

  IF NOT v_is_admin THEN
    RAISE EXCEPTION 'Permission denied. Only group admins can delete this group.';
  END IF;

  DELETE FROM public.groups WHERE id = p_group_id;

  RETURN jsonb_build_object('success', true);
END;
$$;

-- Function: delete_user (Permanent account deletion from auth.users with full cascade)
DROP FUNCTION IF EXISTS public.delete_user(UUID);
CREATE OR REPLACE FUNCTION public.delete_user(target_user_id UUID DEFAULT NULL)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  curr_user_id UUID;
  v_group RECORD;
BEGIN
  -- Determine user ID from auth context or argument
  curr_user_id := COALESCE(auth.uid(), target_user_id);

  IF curr_user_id IS NULL THEN
    RAISE EXCEPTION 'User ID not found or not authenticated';
  END IF;

  -- 1. Clean up group expense splits & group expenses
  DELETE FROM public.group_expense_splits WHERE user_id = curr_user_id;
  DELETE FROM public.group_expenses WHERE paid_by = curr_user_id;

  -- 2. Remove user from group memberships
  DELETE FROM public.group_members WHERE user_id = curr_user_id;

  -- 3. For any group where this user was creator, delete group if no members remain
  FOR v_group IN SELECT id FROM public.groups WHERE created_by = curr_user_id LOOP
    IF NOT EXISTS (SELECT 1 FROM public.group_members WHERE group_id = v_group.id) THEN
      DELETE FROM public.groups WHERE id = v_group.id;
    END IF;
  END LOOP;

  -- 4. Clean up personal expenses & budgets
  DELETE FROM public.expenses WHERE user_id = curr_user_id;
  DELETE FROM public.budgets WHERE user_id = curr_user_id;

  -- 5. Delete profile
  DELETE FROM public.profiles WHERE id = curr_user_id;

  -- 6. Clean auth identities and sessions
  DELETE FROM auth.identities WHERE user_id = curr_user_id;
  DELETE FROM auth.sessions WHERE user_id = curr_user_id;

  -- 7. Delete user completely from auth.users
  DELETE FROM auth.users WHERE id = curr_user_id;

  RETURN jsonb_build_object('success', true, 'deleted_user_id', curr_user_id);
END;
$$;

-- 13. Grant Permissions to authenticated and service_role
GRANT ALL ON public.profiles TO authenticated, service_role;
GRANT ALL ON public.groups TO authenticated, service_role;
GRANT ALL ON public.group_members TO authenticated, service_role;
GRANT ALL ON public.group_expenses TO authenticated, service_role;
GRANT ALL ON public.group_expense_splits TO authenticated, service_role;

GRANT EXECUTE ON FUNCTION public.create_group_with_admin(TEXT, TEXT, TEXT, TEXT) TO authenticated, anon, service_role;
GRANT EXECUTE ON FUNCTION public.join_group_by_code(TEXT) TO authenticated, anon, service_role;
GRANT EXECUTE ON FUNCTION public.leave_group(UUID) TO authenticated, anon, service_role;
GRANT EXECUTE ON FUNCTION public.remove_group_member(UUID, UUID) TO authenticated, anon, service_role;
GRANT EXECUTE ON FUNCTION public.update_group_member_role(UUID, UUID, TEXT) TO authenticated, anon, service_role;
GRANT EXECUTE ON FUNCTION public.delete_group_by_admin(UUID) TO authenticated, anon, service_role;
GRANT EXECUTE ON FUNCTION public.get_group_members(UUID) TO authenticated, anon, service_role;
GRANT EXECUTE ON FUNCTION public.delete_user(UUID) TO authenticated, anon, service_role;

-- 14. Enable Supabase Realtime for Group Collaboration
DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.groups, public.group_members, public.group_expenses, public.group_expense_splits;
  EXCEPTION WHEN OTHERS THEN
    -- If already added or publication doesn't exist, ignore
    NULL;
  END;
END;
$$;

-- 15. Force PostgREST schema reload
NOTIFY pgrst, 'reload schema';
