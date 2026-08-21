-- ==========================================================
-- Expense Tracker Multi-User Collaborative Group Schema
-- PostgreSQL / Supabase
-- ==========================================================

-- 0. Ensure profiles exist for all existing Supabase Auth users
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
  join_code TEXT NOT NULL UNIQUE,
  created_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

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
  paid_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  amount NUMERIC NOT NULL CHECK (amount > 0),
  title TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'General',
  split_type TEXT DEFAULT 'equal' CHECK (split_type IN ('equal', 'custom', 'percentage')),
  expense_date DATE NOT NULL DEFAULT CURRENT_DATE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Create GROUP_EXPENSE_SPLITS table
CREATE TABLE IF NOT EXISTS public.group_expense_splits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_expense_id UUID NOT NULL REFERENCES public.group_expenses(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  owed_amount NUMERIC NOT NULL CHECK (owed_amount >= 0),
  settled BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_expense_split UNIQUE (group_expense_id, user_id)
);

-- Create Fast Query Indexes
CREATE INDEX IF NOT EXISTS idx_group_members_group_id ON public.group_members(group_id);
CREATE INDEX IF NOT EXISTS idx_group_members_user_id ON public.group_members(user_id);
CREATE INDEX IF NOT EXISTS idx_group_expenses_group_id ON public.group_expenses(group_id);
CREATE INDEX IF NOT EXISTS idx_group_expenses_paid_by ON public.group_expenses(paid_by);
CREATE INDEX IF NOT EXISTS idx_group_splits_expense_id ON public.group_expense_splits(group_expense_id);
CREATE INDEX IF NOT EXISTS idx_group_splits_user_id ON public.group_expense_splits(user_id);
CREATE INDEX IF NOT EXISTS idx_groups_join_code ON public.groups(join_code);

-- Enable Row-Level Security (RLS)
ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_expense_splits ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies for GROUPS
DROP POLICY IF EXISTS "Members can view groups they belong to" ON public.groups;
CREATE POLICY "Members can view groups they belong to"
  ON public.groups FOR SELECT
  USING (
    auth.uid() = created_by OR
    EXISTS (
      SELECT 1 FROM public.group_members
      WHERE group_members.group_id = groups.id
      AND group_members.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Authenticated users can create groups" ON public.groups;
CREATE POLICY "Authenticated users can create groups"
  ON public.groups FOR INSERT
  WITH CHECK (auth.uid() = created_by);

DROP POLICY IF EXISTS "Admins can update their groups" ON public.groups;
CREATE POLICY "Admins can update their groups"
  ON public.groups FOR UPDATE
  USING (
    auth.uid() = created_by OR
    EXISTS (
      SELECT 1 FROM public.group_members
      WHERE group_members.group_id = groups.id
      AND group_members.user_id = auth.uid()
      AND group_members.role = 'admin'
    )
  );

DROP POLICY IF EXISTS "Admins can delete their groups" ON public.groups;
CREATE POLICY "Admins can delete their groups"
  ON public.groups FOR DELETE
  USING (
    auth.uid() = created_by OR
    EXISTS (
      SELECT 1 FROM public.group_members
      WHERE group_members.group_id = groups.id
      AND group_members.user_id = auth.uid()
      AND group_members.role = 'admin'
    )
  );

-- 6. RLS Policies for GROUP_MEMBERS
DROP POLICY IF EXISTS "Members can view group membership" ON public.group_members;
CREATE POLICY "Members can view group membership"
  ON public.group_members FOR SELECT
  USING (
    auth.uid() = user_id OR
    EXISTS (
      SELECT 1 FROM public.group_members AS gm
      WHERE gm.group_id = group_members.group_id
      AND gm.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can insert themselves or admins can add members" ON public.group_members;
CREATE POLICY "Users can insert themselves or admins can add members"
  ON public.group_members FOR INSERT
  WITH CHECK (
    auth.uid() = user_id OR
    EXISTS (
      SELECT 1 FROM public.group_members AS gm
      WHERE gm.group_id = group_members.group_id
      AND gm.user_id = auth.uid()
      AND gm.role = 'admin'
    ) OR
    EXISTS (
      SELECT 1 FROM public.groups
      WHERE groups.id = group_members.group_id
      AND groups.created_by = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Admins can update member roles" ON public.group_members;
CREATE POLICY "Admins can update member roles"
  ON public.group_members FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.group_members AS gm
      WHERE gm.group_id = group_members.group_id
      AND gm.user_id = auth.uid()
      AND gm.role = 'admin'
    ) OR
    EXISTS (
      SELECT 1 FROM public.groups
      WHERE groups.id = group_members.group_id
      AND groups.created_by = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Members can leave or admins can remove members" ON public.group_members;
CREATE POLICY "Members can leave or admins can remove members"
  ON public.group_members FOR DELETE
  USING (
    auth.uid() = user_id OR
    EXISTS (
      SELECT 1 FROM public.group_members AS gm
      WHERE gm.group_id = group_members.group_id
      AND gm.user_id = auth.uid()
      AND gm.role = 'admin'
    ) OR
    EXISTS (
      SELECT 1 FROM public.groups
      WHERE groups.id = group_members.group_id
      AND groups.created_by = auth.uid()
    )
  );

-- 7. RLS Policies for GROUP_EXPENSES
DROP POLICY IF EXISTS "Group members can view expenses" ON public.group_expenses;
CREATE POLICY "Group members can view expenses"
  ON public.group_expenses FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.group_members
      WHERE group_members.group_id = group_expenses.group_id
      AND group_members.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Group members can insert expenses" ON public.group_expenses;
CREATE POLICY "Group members can insert expenses"
  ON public.group_expenses FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.group_members
      WHERE group_members.group_id = group_expenses.group_id
      AND group_members.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Payer or admin can update expense" ON public.group_expenses;
CREATE POLICY "Payer or admin can update expense"
  ON public.group_expenses FOR UPDATE
  USING (
    auth.uid() = paid_by OR
    EXISTS (
      SELECT 1 FROM public.group_members
      WHERE group_members.group_id = group_expenses.group_id
      AND group_members.user_id = auth.uid()
      AND group_members.role = 'admin'
    )
  );

DROP POLICY IF EXISTS "Payer or admin can delete expense" ON public.group_expenses;
CREATE POLICY "Payer or admin can delete expense"
  ON public.group_expenses FOR DELETE
  USING (
    auth.uid() = paid_by OR
    EXISTS (
      SELECT 1 FROM public.group_members
      WHERE group_members.group_id = group_expenses.group_id
      AND group_members.user_id = auth.uid()
      AND group_members.role = 'admin'
    )
  );

-- 8. RLS Policies for GROUP_EXPENSE_SPLITS
DROP POLICY IF EXISTS "Group members can view splits" ON public.group_expense_splits;
CREATE POLICY "Group members can view splits"
  ON public.group_expense_splits FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.group_expenses ge
      JOIN public.group_members gm ON gm.group_id = ge.group_id
      WHERE ge.id = group_expense_splits.group_expense_id
      AND gm.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Group members can insert splits" ON public.group_expense_splits;
CREATE POLICY "Group members can insert splits"
  ON public.group_expense_splits FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.group_expenses ge
      JOIN public.group_members gm ON gm.group_id = ge.group_id
      WHERE ge.id = group_expense_splits.group_expense_id
      AND gm.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Members or payer can update split settlement" ON public.group_expense_splits;
CREATE POLICY "Members or payer can update split settlement"
  ON public.group_expense_splits FOR UPDATE
  USING (
    auth.uid() = user_id OR
    EXISTS (
      SELECT 1 FROM public.group_expenses ge
      WHERE ge.id = group_expense_splits.group_expense_id
      AND ge.paid_by = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Payer or admin can delete splits" ON public.group_expense_splits;
CREATE POLICY "Payer or admin can delete splits"
  ON public.group_expense_splits FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.group_expenses ge
      WHERE ge.id = group_expense_splits.group_expense_id
      AND (ge.paid_by = auth.uid() OR EXISTS (
        SELECT 1 FROM public.group_members gm
        WHERE gm.group_id = ge.group_id AND gm.user_id = auth.uid() AND gm.role = 'admin'
      ))
    )
  );

-- 9. Helper Database RPC Functions

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
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Generate 6-char alphanumeric code if not provided
  IF p_join_code IS NULL OR length(trim(p_join_code)) < 4 THEN
    v_code := 'EXP-' || UPPER(substring(md5(random()::text) from 1 for 4));
  ELSE
    v_code := UPPER(trim(p_join_code));
  END IF;

  -- Insert group
  INSERT INTO public.groups (name, description, currency, join_code, created_by)
  VALUES (p_name, p_description, COALESCE(p_currency, '₹'), v_code, v_user_id)
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
    'created_by', g.created_by,
    'created_at', g.created_at
  ) INTO v_result
  FROM public.groups g
  WHERE g.id = v_group_id;

  RETURN v_result;
END;
$$;

-- Function: join_group_by_code (with case, whitespace, and prefix tolerance)
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
  v_raw_code TEXT;
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

  v_clean_code := UPPER(trim(p_code));
  v_raw_code := regexp_replace(v_clean_code, '^EXP[-_ ]?', '', 'i');
  v_prefixed_code := 'EXP-' || v_raw_code;

  -- Find group by join_code with prefix, case, and format tolerance
  SELECT * INTO v_group
  FROM public.groups
  WHERE UPPER(trim(join_code)) = v_clean_code
     OR UPPER(trim(join_code)) = v_prefixed_code
     OR UPPER(trim(regexp_replace(join_code, '^EXP[-_ ]?', '', 'i'))) = v_raw_code
     OR UPPER(trim(replace(join_code, '-', ''))) = UPPER(trim(replace(v_clean_code, '-', '')))
  LIMIT 1;

  IF v_group.id IS NULL THEN
    RAISE EXCEPTION 'Invalid invite code (%). No matching group found.', v_clean_code;
  END IF;

  -- Check if already a member
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

  SELECT jsonb_build_object(
    'id', v_group.id,
    'name', v_group.name,
    'description', v_group.description,
    'currency', v_group.currency,
    'join_code', v_group.join_code,
    'created_by', v_group.created_by,
    'created_at', v_group.created_at,
    'already_member', v_already_member
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

  -- Delete member entry
  DELETE FROM public.group_members
  WHERE group_id = p_group_id AND user_id = v_user_id;

  -- Check remaining members; if zero, delete group
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

  -- Verify caller is admin or group creator
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
    RAISE EXCEPTION 'Invalid role. Role must be admin or member.';
  END IF;

  -- Verify caller is admin or group creator
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

  -- Verify caller is admin or group creator
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

-- Grant execution permissions
GRANT EXECUTE ON FUNCTION public.create_group_with_admin(TEXT, TEXT, TEXT, TEXT) TO authenticated, anon, service_role;
GRANT EXECUTE ON FUNCTION public.join_group_by_code(TEXT) TO authenticated, anon, service_role;
GRANT EXECUTE ON FUNCTION public.leave_group(UUID) TO authenticated, anon, service_role;
GRANT EXECUTE ON FUNCTION public.remove_group_member(UUID, UUID) TO authenticated, anon, service_role;
GRANT EXECUTE ON FUNCTION public.update_group_member_role(UUID, UUID, TEXT) TO authenticated, anon, service_role;
GRANT EXECUTE ON FUNCTION public.delete_group_by_admin(UUID) TO authenticated, anon, service_role;

-- Force PostgREST schema cache reload immediately
NOTIFY pgrst, 'reload schema';


