-- ============================================================
-- OCEANIC SPLIT - BULLETPROOF DATABASE SETUP PATCH V3
-- Run this entire script in the Supabase SQL Editor
-- ============================================================

-- 1. Create profiles table if it does not exist at all
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  full_name TEXT
);

-- 2. Ensure columns exist (in case table was created manually without them)
ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS full_name TEXT,
  ADD COLUMN IF NOT EXISTS email TEXT;

-- 3. Recreate the trigger function safely without ON CONFLICT to avoid primary key issues
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  -- Simple insert without ON CONFLICT, works even if Primary Key is missing
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1))
  );
  RETURN NEW;
EXCEPTION WHEN unique_violation THEN
  -- If row somehow exists, just ignore it and allow user creation to succeed
  RETURN NEW;
END;
$$;

-- Drop all possible old triggers to ensure we don't have conflicting ones
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS create_profile_on_signup ON auth.users;
DROP TRIGGER IF EXISTS create_profile ON auth.users;
DROP TRIGGER IF EXISTS handle_new_user ON auth.users;

-- Create our new clean trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 4. Create other necessary tables (they won't overwrite if they exist)
CREATE TABLE IF NOT EXISTS public.personal_expenses (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title       TEXT NOT NULL,
  amount      NUMERIC(12,2) NOT NULL CHECK (amount > 0),
  category    TEXT NOT NULL DEFAULT 'Other',
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.groups (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  created_by  UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.group_members (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id    UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  joined_at   TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(group_id, user_id)
);

CREATE TABLE IF NOT EXISTS public.group_expenses (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id      UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  created_by    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title         TEXT NOT NULL,
  amount        NUMERIC(12,2) NOT NULL CHECK (amount > 0),
  expense_date  DATE DEFAULT CURRENT_DATE,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Clean up old broken policies to prevent infinite recursion
DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN SELECT schemaname, tablename, policyname FROM pg_policies WHERE tablename IN ('groups', 'group_members', 'group_expenses', 'personal_expenses', 'profiles') LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', r.policyname, r.schemaname, r.tablename);
  END LOOP;
END $$;

-- 6. Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.personal_expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_expenses ENABLE ROW LEVEL SECURITY;

-- 7. Apply exact policies without recursion
CREATE POLICY "profiles_select_own" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "profiles_select_by_email" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "profiles_insert_own" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "expenses_all_own" ON public.personal_expenses FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "groups_select_member" ON public.groups FOR SELECT USING (created_by = auth.uid() OR EXISTS (SELECT 1 FROM public.group_members gm WHERE gm.group_id = id AND gm.user_id = auth.uid()));
CREATE POLICY "groups_insert_own" ON public.groups FOR INSERT WITH CHECK (auth.uid() = created_by);
CREATE POLICY "groups_update_own" ON public.groups FOR UPDATE USING (auth.uid() = created_by);
CREATE POLICY "groups_delete_own" ON public.groups FOR DELETE USING (auth.uid() = created_by);
CREATE POLICY "group_members_select" ON public.group_members FOR SELECT USING (user_id = auth.uid() OR group_id IN (SELECT id FROM public.groups WHERE created_by = auth.uid()));
CREATE POLICY "group_members_insert" ON public.group_members FOR INSERT WITH CHECK (group_id IN (SELECT id FROM public.groups WHERE created_by = auth.uid()) OR user_id = auth.uid());
CREATE POLICY "group_members_delete" ON public.group_members FOR DELETE USING (user_id = auth.uid() OR group_id IN (SELECT id FROM public.groups WHERE created_by = auth.uid()));
CREATE POLICY "group_expenses_select" ON public.group_expenses FOR SELECT USING (EXISTS (SELECT 1 FROM public.group_members gm WHERE gm.group_id = group_expenses.group_id AND gm.user_id = auth.uid()) OR group_id IN (SELECT id FROM public.groups WHERE created_by = auth.uid()));
CREATE POLICY "group_expenses_insert" ON public.group_expenses FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM public.group_members gm WHERE gm.group_id = group_expenses.group_id AND gm.user_id = auth.uid()) OR group_id IN (SELECT id FROM public.groups WHERE created_by = auth.uid()));
CREATE POLICY "group_expenses_delete" ON public.group_expenses FOR DELETE USING (created_by = auth.uid() OR group_id IN (SELECT id FROM public.groups WHERE created_by = auth.uid()));
